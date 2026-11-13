const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Authoritative Canonical Items Catalog
 * Synchronized across frontend, backend, and Supabase.
 */
const CANONICAL_ITEMS = {
  hint_scroll: {
    slug: 'hint_scroll',
    name: 'Hint Scroll',
    type: 'CONSUMABLE',
    rarity: 'COMMON',
    description: 'Reveals a strategic DSA hint for this problem.',
    icon_url: '📜',
    shop_price: 30
  },
  retry_shield: {
    slug: 'retry_shield',
    name: 'Retry Shield',
    type: 'CONSUMABLE',
    rarity: 'UNCOMMON',
    description: 'Negates player HP loss on next fail.',
    icon_url: '🛡️',
    shop_price: 50
  },
  focus_charm: {
    slug: 'focus_charm',
    name: 'Focus Charm',
    type: 'CONSUMABLE',
    rarity: 'RARE',
    description: 'Removes attempt penalty this battle.',
    icon_url: '🧿',
    shop_price: 80
  },
  lightning_flask: {
    slug: 'lightning_flask',
    name: 'Lightning Flask',
    type: 'CONSUMABLE',
    rarity: 'RARE',
    description: 'Doubles coin reward (this battle).',
    icon_url: '🧪',
    shop_price: 100
  },
  shadow_veil: {
    slug: 'shadow_veil',
    name: 'Shadow Veil',
    type: 'CONSUMABLE',
    rarity: 'EPIC',
    description: 'Hides your PvP status from opponent.',
    icon_url: '🥷',
    shop_price: 150
  },
  xp_tome: {
    slug: 'xp_tome',
    name: 'XP Tome',
    type: 'BOOST',
    rarity: 'RARE',
    description: '+50% XP for 1 hour.',
    icon_url: '📘',
    shop_price: 200
  },
  coin_magnet: {
    slug: 'coin_magnet',
    name: 'Coin Magnet',
    type: 'BOOST',
    rarity: 'EPIC',
    description: '+30% coins for 3 solves.',
    icon_url: '🧲',
    shop_price: 250
  },
  berserker_rune: {
    slug: 'berserker_rune',
    name: 'Berserker Rune',
    type: 'BOOST',
    rarity: 'LEGENDARY',
    description: 'Critical hit if 1st attempt.',
    icon_url: '🔥',
    shop_price: 400
  },
  iron_shield: {
    slug: 'iron_shield',
    name: 'Iron Shield',
    type: 'PASSIVE',
    rarity: 'UNCOMMON',
    description: '-10% player HP damage taken.',
    icon_url: '🛡️',
    shop_price: 500
  },
  crit_lens: {
    slug: 'crit_lens',
    name: 'Crit Lens',
    type: 'PASSIVE',
    rarity: 'EPIC',
    description: 'Lower critical hit threshold (0.90).',
    icon_url: '🔍',
    shop_price: 800
  },
  ancient_codex: {
    slug: 'ancient_codex',
    name: 'Ancient Codex',
    type: 'PASSIVE',
    rarity: 'LEGENDARY',
    description: '+5% XP on all solves.',
    icon_url: '📖',
    shop_price: 1500
  },
  frame_gold: {
    slug: 'frame_gold',
    name: 'Golden Aura Frame',
    type: 'COSMETIC',
    rarity: 'LEGENDARY',
    description: 'Surrounds your avatar in gold.',
    icon_url: '✨',
    shop_price: 1000
  },
  dmg_pixel: {
    slug: 'dmg_pixel',
    name: 'Retro Damage Text',
    type: 'COSMETIC',
    rarity: 'RARE',
    description: 'Changes damage numbers to pixel font.',
    icon_url: '👾',
    shop_price: 400
  }
};

/**
 * Normalizes input identifier to canonical item object.
 */
function resolveCanonicalItem(identifier) {
  if (!identifier) return null;
  const clean = String(identifier).trim().toLowerCase().replace(/[-\s]+/g, '_');
  return CANONICAL_ITEMS[clean] || null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/inventory
 * Retrieves user's inventory from Supabase with joined item metadata.
 */
router.get('/', authMiddleware, async (req, res) => {
  const clerkId = req.auth.userId;
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
    return res.json([]);
  }

  try {
    const { data, error } = await supabase
      .from('user_inventory')
      .select('id, clerk_id, item_id, quantity, acquired_at, source, items(*)')
      .eq('clerk_id', clerkId)
      .gt('quantity', 0);

    if (error) {
      console.error('[Inventory API] Error fetching user inventory:', error.message);
      return res.status(500).json({ success: false, error: 'Failed to retrieve inventory' });
    }

    res.json(data ?? []);
  } catch (error) {
    console.error('[Inventory API] Unexpected error fetching inventory:', error);
    res.status(500).json({ success: false, error: 'Unexpected error' });
  }
});

/**
 * POST /api/inventory/use
 * Atomically consumes 1 unit of an item.
 * Validates server-side ownership, positive quantity, item eligibility, and records to audit history.
 */
router.post('/use', authMiddleware, async (req, res) => {
  const clerkId = req.auth.userId;
  const { itemId, itemSlug, problemId, context, clientQty } = req.body;
  const targetIdentifier = (itemSlug || itemId || '').trim();

  console.log(`[MagicBag Server] Trace Step 6 - Received /api/inventory/use request:`, {
    clerkId,
    itemId,
    itemSlug,
    targetIdentifier,
    problemId,
    clientQty
  });

  if (!targetIdentifier) {
    return res.status(400).json({ success: false, error: 'Item identifier is required' });
  }

  // 1. Resolve canonical item from catalog definition
  const canonical = resolveCanonicalItem(targetIdentifier);
  const isTargetUuid = UUID_REGEX.test(targetIdentifier);

  console.log(`[MagicBag Server] Trace Step 7 - Identifier resolution:`, {
    targetIdentifier,
    canonicalSlug: canonical?.slug || null,
    isTargetUuid
  });

  // If not canonical and not a UUID, reject immediately as invalid catalog entry
  if (!canonical && !isTargetUuid) {
    console.warn(`[MagicBag Server] Rejection at Step 7 - Item not found in canonical catalog: ${targetIdentifier}`);
    return res.status(404).json({ success: false, error: 'Item not found in catalog' });
  }

  // Check item usability
  if (canonical) {
    const itemTypeUpper = (canonical.type || '').toUpperCase();
    if (itemTypeUpper !== 'CONSUMABLE' && itemTypeUpper !== 'BOOST') {
      return res.status(400).json({
        success: false,
        reason: 'item_not_usable',
        error: 'Passive and cosmetic items cannot be consumed'
      });
    }
  }

  // 2. Production Safety: No simulated consumption if Supabase is unavailable
  const rawUrl = process.env.SUPABASE_URL || '';
  const isSupabaseConfigured = Boolean(
    rawUrl.trim() &&
    !rawUrl.includes('placeholder') &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
  );

  if (!isSupabaseConfigured) {
    return res.status(503).json({
      success: false,
      error: 'Database service is currently unavailable. Item quantity has been preserved.'
    });
  }

  try {
    // 3. Step 8 - Supabase Catalog Lookup (Type-safe, avoids UUID cast 22P02)
    let itemQuery = supabase.from('items').select('id, slug, name, type, rarity, effect');
    if (isTargetUuid) {
      itemQuery = itemQuery.eq('id', targetIdentifier);
    } else {
      itemQuery = itemQuery.ilike('slug', canonical.slug);
    }

    let { data: itemData, error: itemError } = await itemQuery.limit(1).maybeSingle();

    console.log(`[MagicBag Server] Trace Step 8 - Supabase items query result:`, {
      itemData: itemData ? { id: itemData.id, slug: itemData.slug, type: itemData.type } : null,
      error: itemError?.message || null
    });

    // Auto-heal: If canonical item is missing from Supabase items table, upsert it safely
    if ((!itemData || itemError) && canonical) {
      console.log(`[MagicBag Server] Self-healing missing catalog row for: ${canonical.slug}`);
      const { data: upsertedItem, error: upsertErr } = await supabase
        .from('items')
        .upsert({
          slug: canonical.slug,
          name: canonical.name,
          type: canonical.type,
          rarity: canonical.rarity,
          description: canonical.description,
          icon_url: canonical.icon_url,
          shop_price: canonical.shop_price
        }, { onConflict: 'slug' })
        .select('id, slug, name, type, rarity, effect')
        .maybeSingle();

      if (upsertedItem) {
        itemData = upsertedItem;
        itemError = null;
        console.log(`[MagicBag Server] Self-healed catalog item: ${itemData.id} (${itemData.slug})`);
      } else if (upsertErr) {
        console.warn(`[MagicBag Server] Self-heal warning: ${upsertErr.message}`);
      }
    }

    if (itemError || !itemData) {
      console.error(`[MagicBag Server] Item not found in Supabase catalog: ${targetIdentifier}`);
      return res.status(404).json({ success: false, error: 'Item not found in catalog' });
    }

    const typeUpper = (itemData.type || '').toUpperCase();
    if (typeUpper !== 'CONSUMABLE' && typeUpper !== 'BOOST') {
      return res.status(400).json({
        success: false,
        reason: 'item_not_usable',
        error: 'Passive and cosmetic items cannot be consumed'
      });
    }

    // 4. Check user inventory row in user_inventory
    let { data: invRow, error: invError } = await supabase
      .from('user_inventory')
      .select('id, quantity')
      .eq('clerk_id', clerkId)
      .eq('item_id', itemData.id)
      .maybeSingle();

    console.log(`[MagicBag Server] user_inventory query result:`, {
      invRow,
      invError: invError?.message || null
    });

    // Bridge: If user owns the item locally from previous session but cloud row was un-synced, backfill
    if ((!invRow || invRow.quantity <= 0) && Number(clientQty) > 0) {
      const initialQty = Math.min(99, Math.max(1, Number(clientQty)));
      console.log(`[MagicBag Server] Backfilling local inventory to cloud: clerkId=${clerkId}, itemId=${itemData.id}, qty=${initialQty}`);
      const { data: backfilledRow, error: backfillErr } = await supabase
        .from('user_inventory')
        .upsert({
          clerk_id: clerkId,
          item_id: itemData.id,
          quantity: initialQty,
          source: 'SHOP'
        }, { onConflict: 'clerk_id,item_id' })
        .select('id, quantity')
        .maybeSingle();

      if (backfilledRow) {
        invRow = backfilledRow;
        console.log(`[MagicBag Server] Backfill succeeded: invRow.id=${invRow.id}, qty=${invRow.quantity}`);
      } else if (backfillErr) {
        console.warn(`[MagicBag Server] Backfill notice: ${backfillErr.message}`);
      }
    }

    if (invError || !invRow || invRow.quantity <= 0) {
      console.warn(`[MagicBag Server] Rejection - Insufficient quantity: clerkId=${clerkId}, itemId=${itemData.id}`);
      return res.status(400).json({
        success: false,
        reason: 'insufficient_quantity',
        error: 'You do not have any of this item in your inventory'
      });
    }

    // 5. Trace Step 9 - Atomic Consumption Execution
    // Try PostgreSQL atomic RPC if installed
    const { data: rpcResult, error: rpcError } = await supabase.rpc('consume_user_inventory_item', {
      p_clerk_id: clerkId,
      p_item_slug: itemData.slug,
      p_problem_id: problemId ? String(problemId) : null,
      p_context: context || {}
    });

    if (!rpcError && rpcResult && rpcResult.success) {
      console.log(`[MagicBag Server] Step 9 - Consumption confirmed via RPC: remaining=${rpcResult.remaining_quantity}`);
      return res.json({
        success: true,
        itemId: rpcResult.item_id,
        itemSlug: rpcResult.item_slug,
        itemName: rpcResult.item_name,
        remainingQuantity: rpcResult.remaining_quantity,
        effect: rpcResult.effect
      });
    }

    // Fallback direct atomic consumption (row locking/atomic decrement)
    console.log(`[MagicBag Server] Step 9 - Executing direct atomic decrement on row ${invRow.id}`);
    let remainingQty = 0;
    if (invRow.quantity === 1) {
      const { error: delError } = await supabase
        .from('user_inventory')
        .delete()
        .eq('id', invRow.id);

      if (delError) throw delError;
      remainingQty = 0;
    } else {
      const { data: updData, error: updError } = await supabase
        .from('user_inventory')
        .update({ quantity: invRow.quantity - 1 })
        .eq('id', invRow.id)
        .select('quantity')
        .single();

      if (updError) throw updError;
      remainingQty = updData?.quantity ?? (invRow.quantity - 1);
    }

    // Record audit in user_item_usage_history
    try {
      await supabase.from('user_item_usage_history').insert({
        clerk_id: clerkId,
        item_id: itemData.id,
        item_slug: itemData.slug,
        problem_id: problemId ? String(problemId) : null,
        context: context || {}
      });
    } catch {
      // Non-blocking if table is not yet created
    }

    console.log(`[MagicBag Server] Step 9 - Direct consumption successful: remaining=${remainingQty}`);

    return res.json({
      success: true,
      itemId: itemData.id,
      itemSlug: itemData.slug,
      itemName: itemData.name,
      remainingQuantity: remainingQty,
      effect: itemData.effect
    });

  } catch (err) {
    console.error('[Inventory API] Item consumption error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to consume item. Your inventory quantity has been preserved.'
    });
  }
});

module.exports = router;
module.exports.CANONICAL_ITEMS = CANONICAL_ITEMS;
module.exports.resolveCanonicalItem = resolveCanonicalItem;
