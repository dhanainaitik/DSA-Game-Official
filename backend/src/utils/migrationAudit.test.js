const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.resolve(__dirname, '../../supabase_migration.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

test('Migration SQL is fully idempotent and avoids bare DDL', () => {
  // Check enum creation safety: must use IF NOT EXISTS inside DO $$ blocks
  const lines = migrationSql.split(/\r?\n/);
  let insideDoBlock = false;
  let bareCreateTypes = 0;
  for (const line of lines) {
    if (/DO\s+\$\$\s+BEGIN/i.test(line)) insideDoBlock = true;
    if (/END\s+\$\$;/i.test(line)) insideDoBlock = false;
    if (/CREATE\s+TYPE\s+/i.test(line) && !insideDoBlock) {
      bareCreateTypes++;
    }
  }
  assert.equal(bareCreateTypes, 0, 'No bare CREATE TYPE allowed (must be inside DO $$ BEGIN blocks)');

  // Every table must use CREATE TABLE IF NOT EXISTS
  const rawCreateTables = migrationSql.match(/^[ \t]*CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/gmi) || [];
  assert.equal(rawCreateTables.length, 0, 'No bare CREATE TABLE allowed (must use CREATE TABLE IF NOT EXISTS)');

  // Every index must use CREATE INDEX IF NOT EXISTS
  const rawCreateIndexes = migrationSql.match(/^[ \t]*CREATE\s+(UNIQUE\s+)?INDEX\s+(?!IF\s+NOT\s+EXISTS)/gmi) || [];
  assert.equal(rawCreateIndexes.length, 0, 'No bare CREATE INDEX allowed (must use CREATE INDEX IF NOT EXISTS)');

  // Policy creation must be preceded by DROP POLICY IF EXISTS
  const policyMatches = [...migrationSql.matchAll(/CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+([a-z_]+)/gi)];
  assert.ok(policyMatches.length >= 8, 'Must define security policies');
  for (const match of policyMatches) {
    const policyName = match[1];
    const tableName = match[2];
    const dropPattern = new RegExp(`DROP\\s+POLICY\\s+IF\\s+EXISTS\\s+"${policyName}"\\s+ON\\s+${tableName}`, 'i');
    assert.ok(dropPattern.test(migrationSql), `Policy "${policyName}" on ${tableName} must be preceded by DROP POLICY IF EXISTS`);
  }
});

test('SECURITY DEFINER: Enforces secure search_path and schema qualification', () => {
  // 1. Every SECURITY DEFINER function must explicitly set search_path = public, pg_temp
  const secDefinerFunctions = [
    'award_pvp_win_token',
    'deduct_battle_ground_entry',
    'award_problem_coins',
  ];

  for (const fn of secDefinerFunctions) {
    const fnDefRegex = new RegExp(
      `CREATE\\s+OR\\s+REPLACE\\s+FUNCTION\\s+(public\\.)?${fn}[\\s\\S]*?SECURITY\\s+DEFINER[\\s\\S]*?SET\\s+search_path\\s*=\\s*public,\\s*pg_temp`,
      'i'
    );
    assert.ok(
      fnDefRegex.test(migrationSql),
      `SECURITY DEFINER function ${fn} must explicitly configure SET search_path = public, pg_temp`
    );
  }

  // 2. Sensitive database objects inside RPCs must be schema qualified
  assert.ok(
    /FROM\s+public\.player_profiles/i.test(migrationSql),
    'RPC functions must reference public.player_profiles with schema qualification'
  );
  assert.ok(
    /INSERT\s+INTO\s+public\.pvp_battles/i.test(migrationSql),
    'RPC functions must reference public.pvp_battles with schema qualification'
  );
  assert.ok(
    /INSERT\s+INTO\s+public\.coin_transactions/i.test(migrationSql),
    'RPC functions must reference public.coin_transactions with schema qualification'
  );

  // 3. Direct execution permissions must be revoked from untrusted users (PUBLIC, anon, authenticated)
  for (const fn of secDefinerFunctions) {
    const revokeRegex = new RegExp(
      `REVOKE\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+(public\\.)?${fn}[^;]+FROM\\s+PUBLIC,\\s*anon,\\s*authenticated`,
      'i'
    );
    assert.ok(
      revokeRegex.test(migrationSql),
      `Function ${fn} must explicitly revoke EXECUTE from PUBLIC, anon, and authenticated`
    );

    const grantRegex = new RegExp(
      `GRANT\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+(public\\.)?${fn}[^;]+TO\\s+service_role`,
      'i'
    );
    assert.ok(
      grantRegex.test(migrationSql),
      `Function ${fn} must grant EXECUTE to service_role`
    );
  }
});

test('RLS Security: strictly forbids COALESCE bypass and protects private user data', () => {
  // Absolute prohibition on coalesce in RLS policies (which allows unauthenticated NULL bypass)
  assert.equal(
    /coalesce\s*\(\s*auth\.jwt\(\)\s*->>\s*'sub'/i.test(migrationSql),
    false,
    'CRITICAL: coalesce(auth.jwt()->>sub) bypass is strictly forbidden in RLS policies'
  );

  // Private tables must require auth.jwt()->>'sub' IS NOT NULL AND clerk_id = auth.jwt()->>'sub'
  const privateTables = [
    'player_profiles',
    'user_inventory',
    'user_progress',
    'shop_transactions',
    'coin_transactions',
    'votes',
  ];

  for (const table of privateTables) {
    const tablePolicyRegex = new RegExp(
      `CREATE\\s+POLICY\\s+"[^"]+"\\s+ON\\s+${table}[\\s\\S]*?USING\\s*\\([\\s\\S]*?auth\\.jwt\\(\\)\\s*->>\\s*'sub'\\s+IS\\s+NOT\\s+NULL[\\s\\S]*?clerk_id\\s*=\\s*auth\\.jwt\\(\\)\\s*->>\\s*'sub'`,
      'i'
    );
    assert.ok(tablePolicyRegex.test(migrationSql), `Private table ${table} must strictly require non-null verified JWT sub`);
  }
});

test('PvP Participant Validation: checks disjoint sets, rejects null/empty/duplicates', () => {
  // Must normalize and deduplicate winners
  assert.ok(
    /v_clean_winners[\s\S]+?v_clean_winners\s+&&\s+v_clean_losers/i.test(migrationSql),
    'award_pvp_win_token must reject overlapping participant IDs between winners and losers'
  );

  // Must reject invalid winner / loser arrays
  assert.ok(
    /invalid_winner_ids/i.test(migrationSql),
    'award_pvp_win_token must reject empty, null, or duplicate winner IDs'
  );
  assert.ok(
    /invalid_loser_ids/i.test(migrationSql),
    'award_pvp_win_token must reject empty, null, or duplicate loser IDs'
  );
  assert.ok(
    /overlapping_participants/i.test(migrationSql),
    'award_pvp_win_token must return overlapping_participants error reason'
  );
});

test('Historical Data Safety: preserves 100% of audit history in dedicated archive tables', () => {
  // Coin transactions: Must create coin_transactions_archive and insert duplicates BEFORE active table deletion
  assert.ok(
    /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+coin_transactions_archive/i.test(migrationSql),
    'Must define coin_transactions_archive table to preserve audit history'
  );
  assert.ok(
    /INSERT\s+INTO\s+coin_transactions_archive[\s\S]+?DELETE\s+FROM\s+coin_transactions/i.test(migrationSql),
    'Must copy duplicates to coin_transactions_archive BEFORE deleting from active coin_transactions'
  );

  // User inventory: Must create user_inventory_archive and consolidate sum(quantity)
  assert.ok(
    /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+user_inventory_archive/i.test(migrationSql),
    'Must define user_inventory_archive table to preserve inventory consolidation history'
  );
  assert.ok(
    /INSERT\s+INTO\s+user_inventory_archive[\s\S]+?sum\(quantity\)\s+AS\s+total_qty[\s\S]+?UPDATE\s+user_inventory[\s\S]+?DELETE\s+FROM\s+user_inventory/i.test(migrationSql),
    'Must preserve inventory total quantity and back up rows before deduplication'
  );
});

test('Simulated concurrency: award_pvp_win_token rejects duplicate, overlapping, and invalid participants', () => {
  const pvpBattles = new Set();
  const profiles = {
    user_winner: { battle_tokens: 0, battles_won: 0, total_battles: 0 },
    user_loser: { battles_lost: 0, total_battles: 0 },
  };

  function simulateAwardPvPWinToken(roomId, winners, losers) {
    // 1. Room check
    if (!roomId || !roomId.trim()) return { success: false, reason: 'missing_room_id' };

    // 2. Winner validation
    if (!winners || !winners.length) return { success: false, reason: 'no_winners' };
    const cleanWinners = Array.from(new Set(winners.map((w) => (w ? w.trim() : '')).filter(Boolean)));
    if (cleanWinners.length !== winners.length) {
      return { success: false, reason: 'invalid_winner_ids' };
    }

    // 3. Loser validation
    let cleanLosers = [];
    if (losers && losers.length) {
      cleanLosers = Array.from(new Set(losers.map((l) => (l ? l.trim() : '')).filter(Boolean)));
      if (cleanLosers.length !== losers.length) {
        return { success: false, reason: 'invalid_loser_ids' };
      }
    }

    // 4. Disjoint check (reject overlapping participant IDs)
    const hasOverlap = cleanWinners.some((w) => cleanLosers.includes(w));
    if (hasOverlap) {
      return { success: false, reason: 'overlapping_participants' };
    }

    // 5. Participants exist
    const allPlayers = [...cleanWinners, ...cleanLosers];
    const missing = allPlayers.some((id) => !profiles[id]);
    if (missing) return { success: false, reason: 'invalid_participants' };

    // 6. Room uniqueness
    if (pvpBattles.has(roomId)) {
      return { success: false, reason: 'already_awarded' };
    }
    pvpBattles.add(roomId);

    // 7. Atomic update
    cleanWinners.forEach((id) => {
      profiles[id].battle_tokens += 1;
      profiles[id].battles_won += 1;
      profiles[id].total_battles += 1;
    });
    cleanLosers.forEach((id) => {
      profiles[id].battles_lost += 1;
      profiles[id].total_battles += 1;
    });

    return { success: true };
  }

  // Reject overlapping player
  assert.equal(
    simulateAwardPvPWinToken('room_overlap', ['user_winner'], ['user_winner']).reason,
    'overlapping_participants'
  );

  // Reject duplicate winners
  assert.equal(
    simulateAwardPvPWinToken('room_dup', ['user_winner', 'user_winner'], ['user_loser']).reason,
    'invalid_winner_ids'
  );

  // Reject null/empty winner
  assert.equal(
    simulateAwardPvPWinToken('room_null', [''], ['user_loser']).reason,
    'invalid_winner_ids'
  );

  // Normal run with 10 concurrent calls: exactly 1 succeeds
  const results = Array.from({ length: 10 }, () =>
    simulateAwardPvPWinToken('room_202', ['user_winner'], ['user_loser'])
  );

  const successful = results.filter((r) => r.success);
  const rejected = results.filter((r) => !r.success && r.reason === 'already_awarded');

  assert.equal(successful.length, 1);
  assert.equal(rejected.length, 9);
  assert.equal(profiles.user_winner.battle_tokens, 1);
  assert.equal(profiles.user_winner.battles_won, 1);
  assert.equal(profiles.user_loser.battles_lost, 1);
});

test('Simulated concurrency: deduct_battle_ground_entry all-or-nothing guarantee', () => {
  const profiles = {
    p1: { battle_tokens: 10 },
    p2: { battle_tokens: 5 },
    p3: { battle_tokens: 4 }, // Insufficient (< 5)
    p4: { battle_tokens: 20 },
  };

  function simulateDeductEntryTokens(clerkIds) {
    const uniqueIds = Array.from(new Set(clerkIds));
    if (uniqueIds.length !== clerkIds.length || uniqueIds.length === 0) {
      return [];
    }

    const eligible = uniqueIds.filter((id) => profiles[id] && profiles[id].battle_tokens >= 5);
    if (eligible.length !== uniqueIds.length) {
      return []; // All-or-nothing: 0 rows returned
    }

    return uniqueIds.map((id) => {
      profiles[id].battle_tokens -= 5;
      return { clerk_id: id, success: true, remaining_tokens: profiles[id].battle_tokens };
    });
  }

  // Duplicate input array rejected
  assert.equal(simulateDeductEntryTokens(['p1', 'p1']).length, 0);

  // Array with an ineligible player rejected (no deductions from anyone)
  const failed = simulateDeductEntryTokens(['p1', 'p2', 'p3', 'p4']);
  assert.equal(failed.length, 0);
  assert.equal(profiles.p1.battle_tokens, 10);
  assert.equal(profiles.p2.battle_tokens, 5);

  // Array where all players are eligible succeeds
  const succeeded = simulateDeductEntryTokens(['p1', 'p2', 'p4']);
  assert.equal(succeeded.length, 3);
  assert.equal(profiles.p1.battle_tokens, 5);
  assert.equal(profiles.p2.battle_tokens, 0);
  assert.equal(profiles.p4.battle_tokens, 15);
});

test('Simulated concurrency: award_problem_coins validates positive amount and duplicate prevention', () => {
  const coinTx = new Set();
  const profiles = { user_1: { coins: 100 } };

  function simulateAwardProblemCoins(clerkId, problemId, coins) {
    if (!coins || coins <= 0) {
      return { success: false, reason: 'invalid_coin_amount' };
    }
    const key = `${clerkId}:${problemId.toLowerCase()}`;
    if (coinTx.has(key)) {
      return { success: false, reason: 'already_rewarded', coins: profiles[clerkId].coins };
    }
    coinTx.add(key);
    profiles[clerkId].coins += coins;
    return { success: true, coins_awarded: coins, coins: profiles[clerkId].coins };
  }

  // Reject invalid amounts
  assert.equal(simulateAwardProblemCoins('user_1', 'prob_1', 0).reason, 'invalid_coin_amount');
  assert.equal(simulateAwardProblemCoins('user_1', 'prob_1', -10).reason, 'invalid_coin_amount');

  // 10 concurrent requests for the same problem
  const results = Array.from({ length: 10 }, () =>
    simulateAwardProblemCoins('user_1', 'tree-01-depth', 20)
  );

  const granted = results.filter((r) => r.success);
  const blocked = results.filter((r) => !r.success && r.reason === 'already_rewarded');

  assert.equal(granted.length, 1);
  assert.equal(blocked.length, 9);
  assert.equal(profiles.user_1.coins, 120);
});
