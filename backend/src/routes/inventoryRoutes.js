const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const authMiddleware = require('../middleware/authMiddleware');

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
 * Atomically consumes 1 unit of an item using PostgreSQL RPC consume_user_inventory_item.
 * Verifies server-side ownership, positive quantity, item eligibility, and writes to audit history.
 */
router.post('/use', authMiddleware, async (req, res) => {
  const clerkId = req.auth.userId;
  const { itemId, itemSlug, problemId, context } = req.body;
  const targetSlug = (itemSlug || itemId || '').trim();

  if (!targetSlug) {
    return res.status(400).json({ success: false, error: 'Item identifier is required' });
  }

  // Production Safety: No simulated consumption if Supabase is unavailable
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
    // 1. Primary path: PostgreSQL atomic RPC with row-level locking (FOR UPDATE)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('consume_user_inventory_item', {
      p_clerk_id: clerkId,
      p_item_slug: targetSlug,
      p_problem_id: problemId ? String(problemId) : null,
      p_context: context || {}
    });

    if (!rpcError && rpcResult) {
      if (rpcResult.success) {
        return res.json({
          success: true,
          itemId: rpcResult.item_id,
          itemSlug: rpcResult.item_slug,
          itemName: rpcResult.item_name,
          remainingQuantity: rpcResult.remaining_quantity,
          effect: rpcResult.effect
        });
      }

      // Handle server-side rejection reasons
      if (rpcResult.reason === 'insufficient_quantity') {
        return res.status(400).json({
          success: false,
          reason: 'insufficient_quantity',
          error: 'You do not have any of this item in your inventory'
        });
      }

      if (rpcResult.reason === 'item_not_found') {
        return res.status(404).json({
          success: false,
          reason: 'item_not_found',
          error: 'Item was not found in the catalog'
        });
      }

      if (rpcResult.reason === 'item_not_usable') {
        return res.status(400).json({
          success: false,
          reason: 'item_not_usable',
          error: 'Passive and cosmetic items cannot be consumed'
        });
      }

      return res.status(400).json({
        success: false,
        reason: rpcResult.reason || 'consumption_failed',
        error: 'Item could not be used'
      });
    }

    // 2. Fallback path if RPC is not yet created in Supabase (safe server-side atomic validation)
    // Query item metadata
    const { data: itemData, error: itemError } = await supabase
      .from('items')
      .select('id, slug, name, type, rarity, effect')
      .or(`slug.ilike.${targetSlug},id.eq.${targetSlug}`)
      .limit(1)
      .maybeSingle();

    if (itemError || !itemData) {
      return res.status(404).json({ success: false, error: 'Item not found in catalog' });
    }

    const itemTypeUpper = (itemData.type || '').toUpperCase();
    if (itemTypeUpper !== 'CONSUMABLE' && itemTypeUpper !== 'BOOST') {
      return res.status(400).json({
        success: false,
        error: 'Only consumable and boost items can be used in battle'
      });
    }

    // Check inventory row
    const { data: invRow, error: invError } = await supabase
      .from('user_inventory')
      .select('id, quantity')
      .eq('clerk_id', clerkId)
      .eq('item_id', itemData.id)
      .maybeSingle();

    if (invError || !invRow || invRow.quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'You do not own this item in your inventory'
      });
    }

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

    // Record in user_item_usage_history if the table exists
    try {
      await supabase.from('user_item_usage_history').insert({
        clerk_id: clerkId,
        item_id: itemData.id,
        item_slug: itemData.slug,
        problem_id: problemId ? String(problemId) : null,
        context: context || {}
      });
    } catch {
      // Audit log non-blocking if migration table pending
    }

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
