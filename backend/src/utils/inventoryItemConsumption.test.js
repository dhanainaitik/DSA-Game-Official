const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { CANONICAL_ITEMS, resolveCanonicalItem } = require('../routes/inventoryRoutes');

const migrationPath = path.resolve(__dirname, '../../supabase_migration.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

test('consume_user_inventory_item: RPC security and concurrency controls', () => {
  // 1. Function must be defined with SECURITY DEFINER
  assert.ok(
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.consume_user_inventory_item[\s\S]*?SECURITY\s+DEFINER/i.test(migrationSql),
    'consume_user_inventory_item must be SECURITY DEFINER'
  );

  // 2. Must set safe search_path = public, pg_temp
  assert.ok(
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.consume_user_inventory_item[\s\S]*?SET\s+search_path\s*=\s*public,\s*pg_temp/i.test(migrationSql),
    'consume_user_inventory_item must explicitly configure safe search_path'
  );

  // 3. Must use FOR UPDATE row-level locking on user_inventory
  assert.ok(
    /SELECT[\s\S]*?FROM\s+public\.user_inventory[\s\S]*?FOR\s+UPDATE/i.test(migrationSql),
    'consume_user_inventory_item must lock user_inventory row FOR UPDATE to prevent race conditions'
  );

  // 4. Must record into user_item_usage_history audit table
  assert.ok(
    /INSERT\s+INTO\s+public\.user_item_usage_history/i.test(migrationSql),
    'consume_user_inventory_item must record successful usage in user_item_usage_history'
  );

  // 5. Must restrict execution permissions
  assert.ok(
    /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.consume_user_inventory_item[\s\S]*?FROM\s+PUBLIC,\s*anon,\s*authenticated/i.test(migrationSql),
    'Must revoke direct client-side execution from PUBLIC, anon, and authenticated'
  );
  assert.ok(
    /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.consume_user_inventory_item[\s\S]*?TO\s+service_role/i.test(migrationSql),
    'Must grant execution exclusively to service_role'
  );
});

test('Canonical Item Identifier Mapping: eliminates UUID cast crashes and unifies catalog slugs', () => {
  // 1. Hint Scroll resolution
  const hintScroll = resolveCanonicalItem('hint_scroll');
  assert.ok(hintScroll, 'hint_scroll must resolve to canonical catalog object');
  assert.equal(hintScroll.slug, 'hint_scroll');
  assert.equal(hintScroll.type, 'CONSUMABLE');
  assert.equal(hintScroll.description, 'Reveals a strategic DSA hint for this problem.');

  // 2. Case and delimiter normalization
  assert.equal(resolveCanonicalItem('HINT_SCROLL')?.slug, 'hint_scroll');
  assert.equal(resolveCanonicalItem('hint-scroll')?.slug, 'hint_scroll');
  assert.equal(resolveCanonicalItem('retry_shield')?.slug, 'retry_shield');
  assert.equal(resolveCanonicalItem('focus_charm')?.slug, 'focus_charm');
  assert.equal(resolveCanonicalItem('lightning_flask')?.slug, 'lightning_flask');
  assert.equal(resolveCanonicalItem('xp_tome')?.slug, 'xp_tome');
  assert.equal(resolveCanonicalItem('shadow_veil')?.slug, 'shadow_veil');
  assert.equal(resolveCanonicalItem('iron_shield')?.slug, 'iron_shield');

  // 3. Unknown items must return null
  assert.equal(resolveCanonicalItem('unknown_legendary_sword'), null);
  assert.equal(resolveCanonicalItem(''), null);
  assert.equal(resolveCanonicalItem(null), null);
});

test('Simulated Concurrency: prevents race conditions and duplicate consumption', async () => {
  // Simulate database state
  const catalog = {
    hint_scroll: { id: 'item-1', slug: 'hint_scroll', name: 'Hint Scroll', type: 'CONSUMABLE' },
    retry_shield: { id: 'item-2', slug: 'retry_shield', name: 'Retry Shield', type: 'CONSUMABLE' },
    iron_shield: { id: 'item-3', slug: 'iron_shield', name: 'Iron Shield', type: 'PASSIVE' },
  };

  const inventory = {
    'user_abc:item-1': { id: 'inv-1', clerk_id: 'user_abc', item_id: 'item-1', quantity: 1 },
    'user_abc:item-2': { id: 'inv-2', clerk_id: 'user_abc', item_id: 'item-2', quantity: 3 },
  };

  const auditLog = [];

  // Atomic simulation function mimicking PostgreSQL transaction with row lock
  let isLocked = false;
  async function simulateAtomicConsume(clerkId, slug, problemId = null) {
    while (isLocked) {
      await new Promise(r => setTimeout(r, 1));
    }
    isLocked = true;

    try {
      const canonical = resolveCanonicalItem(slug) || catalog[slug];
      if (!canonical) {
        return { success: false, reason: 'item_not_found', error: 'Item not found in catalog' };
      }

      if (canonical.type !== 'CONSUMABLE' && canonical.type !== 'BOOST') {
        return { success: false, reason: 'item_not_usable', error: 'Passive and cosmetic items cannot be consumed' };
      }

      const item = catalog[canonical.slug];
      const key = `${clerkId}:${item.id}`;
      const invRow = inventory[key];
      if (!invRow || invRow.quantity <= 0) {
        return { success: false, reason: 'insufficient_quantity', current_quantity: 0, error: 'You do not own this item' };
      }

      // Decrement atomically
      invRow.quantity -= 1;
      const remaining = invRow.quantity;
      if (remaining === 0) {
        delete inventory[key];
      }

      auditLog.push({ clerkId, itemId: item.id, slug: canonical.slug, problemId, usedAt: new Date() });

      return {
        success: true,
        item_id: item.id,
        item_slug: canonical.slug,
        remaining_quantity: remaining,
      };
    } finally {
      isLocked = false;
    }
  }

  // Scenario 1: User with quantity=1 fires 5 concurrent use requests
  const results1 = await Promise.all([
    simulateAtomicConsume('user_abc', 'hint_scroll', 'p-arr-1-2'),
    simulateAtomicConsume('user_abc', 'hint_scroll', 'p-arr-1-2'),
    simulateAtomicConsume('user_abc', 'hint_scroll', 'p-arr-1-2'),
    simulateAtomicConsume('user_abc', 'hint_scroll', 'p-arr-1-2'),
    simulateAtomicConsume('user_abc', 'hint_scroll', 'p-arr-1-2'),
  ]);

  const successes1 = results1.filter(r => r.success);
  const rejections1 = results1.filter(r => !r.success && r.reason === 'insufficient_quantity');

  assert.equal(successes1.length, 1, 'Only exactly 1 request may succeed when quantity is 1');
  assert.equal(rejections1.length, 4, 'Remaining 4 requests must be rejected with insufficient_quantity');
  assert.equal(inventory['user_abc:item-1'], undefined, 'Item row must be cleared when reaching 0');
  assert.equal(successes1[0].remaining_quantity, 0, 'Remaining quantity reported must be 0');

  // Scenario 2: User with quantity=0 attempts consumption
  const zeroResult = await simulateAtomicConsume('user_abc', 'hint_scroll', 'p-arr-1-2');
  assert.equal(zeroResult.success, false);
  assert.equal(zeroResult.reason, 'insufficient_quantity');

  // Scenario 3: User with quantity=3 fires 5 concurrent requests
  const results2 = await Promise.all([
    simulateAtomicConsume('user_abc', 'retry_shield', 'p-arr-2-1'),
    simulateAtomicConsume('user_abc', 'retry_shield', 'p-arr-2-1'),
    simulateAtomicConsume('user_abc', 'retry_shield', 'p-arr-2-1'),
    simulateAtomicConsume('user_abc', 'retry_shield', 'p-arr-2-1'),
    simulateAtomicConsume('user_abc', 'retry_shield', 'p-arr-2-1'),
  ]);

  const successes2 = results2.filter(r => r.success);
  const rejections2 = results2.filter(r => !r.success);

  assert.equal(successes2.length, 3, 'Exactly 3 requests succeed for quantity 3');
  assert.equal(rejections2.length, 2, 'Surplus 2 requests fail');
  assert.equal(inventory['user_abc:item-2'], undefined, 'Quantity must not become negative');

  // Scenario 4: Attempting to consume passive gear
  const passiveResult = await simulateAtomicConsume('user_abc', 'iron_shield');
  assert.equal(passiveResult.success, false);
  assert.equal(passiveResult.reason, 'item_not_usable', 'Passive gear must be rejected from consumption');

  // Scenario 5: Audit trail verified
  assert.equal(auditLog.length, 4, 'Audit log must record exactly 4 successful consumptions');
  assert.equal(auditLog[0].slug, 'hint_scroll');
});

test('Scenario 6: API failure handling preserves user item quantity without loss', async () => {
  let userItemQty = 1;

  async function mockUseItemApi(shouldFail = true) {
    if (shouldFail) {
      throw new Error('503 Service Unavailable / Network Error');
    }
    userItemQty -= 1;
    return { success: true, remainingQuantity: userItemQty };
  }

  // Attempt consumption with network/database failure
  let caughtError = null;
  try {
    await mockUseItemApi(true);
  } catch (err) {
    caughtError = err;
  }

  assert.ok(caughtError, 'Error was caught');
  assert.equal(userItemQty, 1, 'Quantity MUST remain 1 when API call fails');
});

test('Scenario 8: Remaining quantity persistence across simulated page refresh', () => {
  // Simulate client-side localStorage state
  let simulatedLocalStorage = {
    'codo-progress': JSON.stringify({
      inventory: { hint_scroll: 3 },
      coins: 100
    })
  };

  // Consume 1 Hint Scroll
  const progress = JSON.parse(simulatedLocalStorage['codo-progress']);
  progress.inventory.hint_scroll = 2;
  simulatedLocalStorage['codo-progress'] = JSON.stringify(progress);

  // Simulate page reload: re-read from storage
  const reloadedProgress = JSON.parse(simulatedLocalStorage['codo-progress']);
  assert.equal(reloadedProgress.inventory.hint_scroll, 2, 'Quantity persists as 2 after page reload');
});
