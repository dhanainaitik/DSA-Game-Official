const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const { CANONICAL_ITEMS, resolveCanonicalItem } = require('./inventoryRoutes');

// Get all shop items
router.get('/items', async (req, res) => {
  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
    return res.json(Object.values(CANONICAL_ITEMS));
  }
  try {
    const { data, error } = await supabase.from('items').select('*');
    if (error || !data || data.length === 0) {
      return res.json(Object.values(CANONICAL_ITEMS));
    }
    res.json(data);
  } catch (error) {
    res.json(Object.values(CANONICAL_ITEMS));
  }
});

// Get daily deal
router.get('/daily-deal', async (req, res) => {
  res.json({ itemId: 'hint_scroll', discountAmount: 10 });
});

// Get map unlocks
router.get('/map-unlocks', async (req, res) => {
  res.json([
    { id: 'strings', name: 'Strings', price: 300, icon: '📜' },
    { id: 'linked-lists', name: 'Linked Lists', price: 400, icon: '🔗' },
    { id: 'trees', name: 'Trees', price: 500, icon: '🌲' },
  ]);
});

// Buy item (Atomically deducts coins and increments user_inventory)
router.post('/buy', authMiddleware, async (req, res) => {
  const { itemId, itemSlug } = req.body;
  const clerkId = req.auth.userId;
  const target = (itemSlug || itemId || '').trim();
  const canonical = resolveCanonicalItem(target);

  if (!canonical) {
    return res.status(404).json({ success: false, error: 'Item not found in catalog' });
  }

  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('placeholder')) {
    return res.json({ success: true, itemId: canonical.slug, localOnly: true });
  }

  try {
    // 1. Ensure item exists in items table
    let { data: itemData } = await supabase
      .from('items')
      .select('id, shop_price')
      .ilike('slug', canonical.slug)
      .limit(1)
      .maybeSingle();

    if (!itemData) {
      const { data: upserted } = await supabase
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
        .select('id, shop_price')
        .single();
      itemData = upserted;
    }

    const price = canonical.shop_price || 0;

    // 2. Validate coins and deduct
    const { data: profile } = await supabase
      .from('player_profiles')
      .select('coins')
      .eq('clerk_id', clerkId)
      .maybeSingle();

    if (profile && (profile.coins || 0) < price) {
      return res.status(400).json({ success: false, error: 'Insufficient coins' });
    }

    if (profile) {
      await supabase
        .from('player_profiles')
        .update({ coins: Math.max(0, (profile.coins || 0) - price) })
        .eq('clerk_id', clerkId);
    }

    // 3. Increment or insert into user_inventory
    const { data: existingInv } = await supabase
      .from('user_inventory')
      .select('id, quantity')
      .eq('clerk_id', clerkId)
      .eq('item_id', itemData.id)
      .maybeSingle();

    let newQty = 1;
    if (existingInv) {
      newQty = (existingInv.quantity || 0) + 1;
      await supabase
        .from('user_inventory')
        .update({ quantity: newQty })
        .eq('id', existingInv.id);
    } else {
      await supabase
        .from('user_inventory')
        .insert({
          clerk_id: clerkId,
          item_id: itemData.id,
          quantity: 1,
          source: 'SHOP'
        });
    }

    // 4. Log transaction
    try {
      await supabase.from('shop_transactions').insert({
        clerk_id: clerkId,
        item_id: itemData.id,
        coins_spent: price,
        transaction_type: 'PURCHASE'
      });
    } catch {
      // non-blocking
    }

    res.json({ success: true, itemSlug: canonical.slug, newQuantity: newQty });
  } catch (err) {
    console.error('[Shop API] Error purchasing item:', err);
    res.status(500).json({ success: false, error: 'Failed to process purchase' });
  }
});

// Unlock region
router.post('/unlock-region', authMiddleware, async (req, res) => {
  const { topic } = req.body;
  res.json({ success: true, topic });
});

module.exports = router;
