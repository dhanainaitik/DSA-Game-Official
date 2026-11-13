-- ============================================================
-- Codo Leveling — Supabase Production Schema Migration (Hardened)
-- Safe for fresh databases AND existing production projects.
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── 1. EXTENSIONS ───────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── 2. IDEMPOTENT ENUM TYPES ────────────────────────────────
-- Created with complete enum value sets if not already present.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rank_tier') THEN
    CREATE TYPE rank_tier AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ABYSS');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty') THEN
    CREATE TYPE difficulty AS ENUM ('EASY', 'EASY_MEDIUM', 'MEDIUM', 'MEDIUM_HARD', 'HARD');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status') THEN
    CREATE TYPE progress_status AS ENUM ('UNSOLVED', 'ATTEMPTED', 'SOLVED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_type') THEN
    CREATE TYPE item_type AS ENUM ('CONSUMABLE', 'BOOST', 'PASSIVE', 'COSMETIC');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_rarity') THEN
    CREATE TYPE item_rarity AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'item_source') THEN
    CREATE TYPE item_source AS ENUM ('DROP', 'SHOP', 'PVP_REWARD', 'ACHIEVEMENT');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_type') THEN
    CREATE TYPE transaction_type AS ENUM ('PURCHASE', 'REGION_UNLOCK');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'battle_status') THEN
    CREATE TYPE battle_status AS ENUM ('PENDING', 'ACTIVE', 'COMPLETE', 'ABANDONED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friend_status') THEN
    CREATE TYPE friend_status AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enemy_tier') THEN
    CREATE TYPE enemy_tier AS ENUM ('GREEN', 'YELLOW', 'BLUE', 'PURPLE', 'RED', 'GREY', 'BROWN', 'CYAN', 'FINAL');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_type') THEN
    CREATE TYPE post_type AS ENUM ('QUESTION', 'DISCUSSION', 'SOLUTION');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bg_mode') THEN
    CREATE TYPE bg_mode AS ENUM ('BG_1V1', 'BG_2V2');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bg_medal') THEN
    CREATE TYPE bg_medal AS ENUM ('GOLD', 'SILVER', 'BRONZE', 'NONE');
  END IF;
END $$;

-- ─── 3. TABLES WITH COMPATIBILITY & COLUMN GUARDS ────────────

-- 3.1 Player Profiles
CREATE TABLE IF NOT EXISTS player_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id         TEXT UNIQUE NOT NULL,
  username         TEXT,
  email            TEXT,
  avatar_url       TEXT,
  display_name     TEXT,
  level            INT NOT NULL DEFAULT 1,
  xp               INT NOT NULL DEFAULT 0,
  xp_to_next_level INT NOT NULL DEFAULT 550,
  coins            INT NOT NULL DEFAULT 100,
  rank             rank_tier NOT NULL DEFAULT 'BRONZE',
  title            TEXT,
  equipped_items   JSONB,
  total_battles    INT NOT NULL DEFAULT 0,
  battles_won      INT NOT NULL DEFAULT 0,
  battles_lost     INT NOT NULL DEFAULT 0,
  streak_days      INT NOT NULL DEFAULT 0,
  battle_tokens    INT NOT NULL DEFAULT 0,
  gold_medals      INT NOT NULL DEFAULT 0,
  silver_medals    INT NOT NULL DEFAULT 0,
  bronze_medals    INT NOT NULL DEFAULT 0,
  last_active      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE player_profiles 
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS level INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS xp INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_to_next_level INT NOT NULL DEFAULT 550,
  ADD COLUMN IF NOT EXISTS coins INT NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS rank rank_tier NOT NULL DEFAULT 'BRONZE',
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS equipped_items JSONB,
  ADD COLUMN IF NOT EXISTS total_battles INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS battles_won INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS battles_lost INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_days INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS battle_tokens INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gold_medals INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS silver_medals INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bronze_medals INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS uq_player_profiles_clerk_id ON player_profiles(clerk_id);

-- 3.2 Enemies
CREATE TABLE IF NOT EXISTS enemies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  topic       TEXT NOT NULL,
  tier        enemy_tier NOT NULL,
  base_hp     INT NOT NULL,
  base_attack INT NOT NULL,
  sprite_url  TEXT,
  battle_cry  TEXT,
  description TEXT,
  lore        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE enemies
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS tier enemy_tier,
  ADD COLUMN IF NOT EXISTS base_hp INT,
  ADD COLUMN IF NOT EXISTS base_attack INT,
  ADD COLUMN IF NOT EXISTS sprite_url TEXT,
  ADD COLUMN IF NOT EXISTS battle_cry TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS lore TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS uq_enemies_slug ON enemies(slug);

-- 3.3 Questions
CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  topic           TEXT NOT NULL,
  state_number    INT NOT NULL,
  question_number INT NOT NULL,
  difficulty      difficulty NOT NULL,
  narrative       TEXT,
  problem_body    TEXT NOT NULL,
  base_code       JSONB,
  test_cases      JSONB,
  enemy_id        UUID REFERENCES enemies(id),
  xp_reward       INT NOT NULL DEFAULT 50,
  coin_reward     INT NOT NULL DEFAULT 15,
  item_drop_chance FLOAT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS state_number INT,
  ADD COLUMN IF NOT EXISTS question_number INT,
  ADD COLUMN IF NOT EXISTS difficulty difficulty,
  ADD COLUMN IF NOT EXISTS narrative TEXT,
  ADD COLUMN IF NOT EXISTS problem_body TEXT,
  ADD COLUMN IF NOT EXISTS base_code JSONB,
  ADD COLUMN IF NOT EXISTS test_cases JSONB,
  ADD COLUMN IF NOT EXISTS enemy_id UUID REFERENCES enemies(id),
  ADD COLUMN IF NOT EXISTS xp_reward INT NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS coin_reward INT NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS item_drop_chance FLOAT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS uq_questions_slug ON questions(slug);

-- 3.4 User Progress
CREATE TABLE IF NOT EXISTS user_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id        TEXT NOT NULL REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  status          progress_status NOT NULL DEFAULT 'UNSOLVED',
  attempts        INT NOT NULL DEFAULT 0,
  best_score      FLOAT,
  best_submission TEXT,
  solved_at       TIMESTAMPTZ,
  time_taken_secs INT,
  UNIQUE(clerk_id, question_id)
);

ALTER TABLE user_progress
  ADD COLUMN IF NOT EXISTS status progress_status NOT NULL DEFAULT 'UNSOLVED',
  ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS best_score FLOAT,
  ADD COLUMN IF NOT EXISTS best_submission TEXT,
  ADD COLUMN IF NOT EXISTS solved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS time_taken_secs INT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_progress_clerk_question ON user_progress(clerk_id, question_id);

-- 3.5 Items Catalog
CREATE TABLE IF NOT EXISTS items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  type        item_type NOT NULL,
  rarity      item_rarity NOT NULL,
  description TEXT,
  effect      JSONB,
  icon_url    TEXT,
  shop_price  INT,
  drop_weight INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS type item_type,
  ADD COLUMN IF NOT EXISTS rarity item_rarity,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS effect JSONB,
  ADD COLUMN IF NOT EXISTS icon_url TEXT,
  ADD COLUMN IF NOT EXISTS shop_price INT,
  ADD COLUMN IF NOT EXISTS drop_weight INT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS uq_items_slug ON items(slug);

-- 3.6 User Inventory (Safe Consolidation & Audit Preservation)
-- Historical archive table to preserve 100% of inventory records before consolidation
CREATE TABLE IF NOT EXISTS user_inventory_archive (
  id             UUID PRIMARY KEY,
  clerk_id       TEXT NOT NULL,
  item_id        UUID NOT NULL,
  quantity       INT NOT NULL,
  acquired_at    TIMESTAMPTZ,
  source         item_source,
  archived_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archive_reason TEXT NOT NULL DEFAULT 'DUPLICATE_CONSOLIDATION'
);

CREATE TABLE IF NOT EXISTS user_inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    TEXT NOT NULL REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity    INT NOT NULL DEFAULT 1,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source      item_source
);

ALTER TABLE user_inventory
  ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS source item_source;

-- Consolidate duplicate records if any exist:
-- 1) Archive historical duplicate rows so zero inventory history is lost
-- 2) Consolidate sum(quantity) into primary row (user retains 100% of items)
-- 3) Delete only the merged surplus rows from the active table
DO $$
DECLARE
  v_dup_inv_count INT;
BEGIN
  SELECT count(*) INTO v_dup_inv_count
  FROM (
    SELECT clerk_id, item_id
    FROM user_inventory
    GROUP BY clerk_id, item_id
    HAVING count(*) > 1
  ) dups;

  IF v_dup_inv_count > 0 THEN
    -- Backup duplicate inventory rows before consolidation
    INSERT INTO user_inventory_archive (id, clerk_id, item_id, quantity, acquired_at, source)
    SELECT id, clerk_id, item_id, quantity, acquired_at, source
    FROM user_inventory u
    WHERE (u.clerk_id, u.item_id) IN (
      SELECT clerk_id, item_id FROM user_inventory GROUP BY clerk_id, item_id HAVING count(*) > 1
    )
    ON CONFLICT (id) DO NOTHING;

    -- Consolidate total item count into keep_id
    WITH totals AS (
      SELECT clerk_id, item_id, sum(quantity) AS total_qty, min(id) AS keep_id
      FROM user_inventory
      GROUP BY clerk_id, item_id
      HAVING count(*) > 1
    )
    UPDATE user_inventory u
    SET quantity = t.total_qty
    FROM totals t
    WHERE u.id = t.keep_id;

    -- Remove merged duplicate rows from active table (already archived above)
    DELETE FROM user_inventory u
    USING (
      SELECT clerk_id, item_id, min(id) AS keep_id
      FROM user_inventory
      GROUP BY clerk_id, item_id
      HAVING count(*) > 1
    ) d
    WHERE u.clerk_id = d.clerk_id 
      AND u.item_id = d.item_id 
      AND u.id <> d.keep_id;

    RAISE NOTICE 'Preserved and consolidated % duplicate inventory items in user_inventory_archive', v_dup_inv_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_inventory_clerk_item ON user_inventory(clerk_id, item_id);

-- 3.7 Shop Transactions
CREATE TABLE IF NOT EXISTS shop_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id         TEXT NOT NULL REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  item_id          UUID REFERENCES items(id),
  coins_spent      INT NOT NULL,
  transaction_type transaction_type NOT NULL DEFAULT 'PURCHASE',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shop_transactions
  ADD COLUMN IF NOT EXISTS item_id UUID REFERENCES items(id),
  ADD COLUMN IF NOT EXISTS coins_spent INT,
  ADD COLUMN IF NOT EXISTS transaction_type transaction_type NOT NULL DEFAULT 'PURCHASE',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3.8 Coin Transactions (Audit & Reward Log)
-- Historical archive table to preserve 100% of transaction history before unique index
CREATE TABLE IF NOT EXISTS coin_transactions_archive (
  id                  UUID PRIMARY KEY,
  clerk_id            TEXT NOT NULL,
  problem_id          TEXT,
  problem_title       TEXT,
  section             TEXT,
  amount              INT,
  type                TEXT,
  original_created_at TIMESTAMPTZ,
  archived_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archive_reason      TEXT NOT NULL DEFAULT 'DUPLICATE_REWARD_AUDIT'
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id       TEXT NOT NULL REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  problem_id     TEXT NOT NULL,
  problem_title  TEXT,
  section        TEXT,
  amount         INT NOT NULL CHECK (amount > 0),
  type           TEXT NOT NULL DEFAULT 'REWARD',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE coin_transactions
  ADD COLUMN IF NOT EXISTS problem_id TEXT,
  ADD COLUMN IF NOT EXISTS problem_title TEXT,
  ADD COLUMN IF NOT EXISTS section TEXT,
  ADD COLUMN IF NOT EXISTS amount INT,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'REWARD',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Safely preserve duplicate reward records in coin_transactions_archive before creating unique index
DO $$
DECLARE
  v_dup_tx_count INT;
BEGIN
  SELECT count(*) INTO v_dup_tx_count
  FROM (
    SELECT clerk_id, problem_id
    FROM coin_transactions
    WHERE type = 'REWARD'
    GROUP BY clerk_id, problem_id
    HAVING count(*) > 1
  ) dups;

  IF v_dup_tx_count > 0 THEN
    -- Archive duplicates to guarantee zero audit loss
    INSERT INTO coin_transactions_archive (id, clerk_id, problem_id, problem_title, section, amount, type, original_created_at)
    SELECT id, clerk_id, problem_id, problem_title, section, amount, type, created_at
    FROM coin_transactions c
    WHERE c.type = 'REWARD'
      AND c.id NOT IN (
        SELECT min(id)
        FROM coin_transactions
        WHERE type = 'REWARD'
        GROUP BY clerk_id, problem_id
      )
    ON CONFLICT (id) DO NOTHING;

    -- Remove archived surplus records from active table to permit unique index
    DELETE FROM coin_transactions c
    WHERE c.type = 'REWARD'
      AND c.id IN (SELECT id FROM coin_transactions_archive);

    RAISE NOTICE 'Preserved % duplicate coin transaction records in coin_transactions_archive', v_dup_tx_count;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_coin_tx_reward 
  ON coin_transactions(clerk_id, problem_id) 
  WHERE type = 'REWARD';

-- 3.9 PvP Battles
CREATE TABLE IF NOT EXISTS pvp_battles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       TEXT UNIQUE,
  player_one_id TEXT REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  player_two_id TEXT REFERENCES player_profiles(clerk_id) ON DELETE SET NULL,
  problem_id    TEXT,
  status        battle_status NOT NULL DEFAULT 'PENDING',
  winner_id     TEXT REFERENCES player_profiles(clerk_id) ON DELETE SET NULL,
  p1_score      FLOAT,
  p2_score      FLOAT,
  p1_time_secs  INT,
  p2_time_secs  INT,
  coins_wagered INT NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  ended_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pvp_battles
  ADD COLUMN IF NOT EXISTS room_id TEXT,
  ADD COLUMN IF NOT EXISTS player_one_id TEXT,
  ADD COLUMN IF NOT EXISTS player_two_id TEXT,
  ADD COLUMN IF NOT EXISTS problem_id TEXT,
  ADD COLUMN IF NOT EXISTS status battle_status NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS winner_id TEXT,
  ADD COLUMN IF NOT EXISTS p1_score FLOAT,
  ADD COLUMN IF NOT EXISTS p2_score FLOAT,
  ADD COLUMN IF NOT EXISTS p1_time_secs INT,
  ADD COLUMN IF NOT EXISTS p2_time_secs INT,
  ADD COLUMN IF NOT EXISTS coins_wagered INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS uq_pvp_battles_room_id ON pvp_battles(room_id);

-- 3.10 Achievements & Codex
CREATE TABLE IF NOT EXISTS achievements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  icon_url      TEXT,
  reward_coins  INT NOT NULL DEFAULT 0,
  reward_item_id UUID REFERENCES items(id)
);

ALTER TABLE achievements
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS icon_url TEXT,
  ADD COLUMN IF NOT EXISTS reward_coins INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_item_id UUID REFERENCES items(id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_achievements_slug ON achievements(slug);

CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id       TEXT NOT NULL REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clerk_id, achievement_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_achievements ON user_achievements(clerk_id, achievement_id);

CREATE TABLE IF NOT EXISTS codex_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id      TEXT NOT NULL REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  enemy_id      UUID NOT NULL REFERENCES enemies(id) ON DELETE CASCADE,
  encountered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  defeated_at   TIMESTAMPTZ,
  UNIQUE(clerk_id, enemy_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_codex_entries ON codex_entries(clerk_id, enemy_id);

CREATE TABLE IF NOT EXISTS friends (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id   TEXT NOT NULL REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  friend_id  TEXT NOT NULL REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  status     friend_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clerk_id, friend_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_friends ON friends(clerk_id, friend_id);

-- 3.11 Community (Posts, Comments, Votes)
CREATE TABLE IF NOT EXISTS posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id     TEXT NOT NULL REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  type         post_type NOT NULL DEFAULT 'DISCUSSION',
  tags         TEXT[] NOT NULL DEFAULT '{}',
  code_snippet TEXT,
  code_lang    TEXT,
  vote_score   INT NOT NULL DEFAULT 0,
  views        INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS type post_type NOT NULL DEFAULT 'DISCUSSION',
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS code_snippet TEXT,
  ADD COLUMN IF NOT EXISTS code_lang TEXT,
  ADD COLUMN IF NOT EXISTS vote_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  clerk_id    TEXT NOT NULL REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  vote_score  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS vote_score INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    TEXT NOT NULL REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
  value       SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(clerk_id, post_id),
  UNIQUE(clerk_id, comment_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_votes_post ON votes(clerk_id, post_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_votes_comment ON votes(clerk_id, comment_id);

-- 3.12 Battle Ground System
CREATE TABLE IF NOT EXISTS battle_ground_matches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id        TEXT UNIQUE NOT NULL,
  mode           bg_mode NOT NULL,
  problem_id     TEXT NOT NULL,
  winner_team    TEXT NOT NULL,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE battle_ground_matches
  ADD COLUMN IF NOT EXISTS room_id TEXT,
  ADD COLUMN IF NOT EXISTS mode bg_mode,
  ADD COLUMN IF NOT EXISTS problem_id TEXT,
  ADD COLUMN IF NOT EXISTS winner_team TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS uq_bg_matches_room_id ON battle_ground_matches(room_id);

CREATE TABLE IF NOT EXISTS battle_ground_participants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id       UUID REFERENCES battle_ground_matches(id) ON DELETE CASCADE,
  clerk_id       TEXT NOT NULL REFERENCES player_profiles(clerk_id) ON DELETE CASCADE,
  team           TEXT NOT NULL,
  damage_dealt   INT NOT NULL DEFAULT 0,
  correctness    FLOAT NOT NULL DEFAULT 0,
  medal_awarded  bg_medal NOT NULL DEFAULT 'NONE',
  tokens_spent   INT NOT NULL DEFAULT 5,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE battle_ground_participants
  ADD COLUMN IF NOT EXISTS match_id UUID REFERENCES battle_ground_matches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS team TEXT,
  ADD COLUMN IF NOT EXISTS damage_dealt INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correctness FLOAT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medal_awarded bg_medal NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS tokens_spent INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ─── 4. PERFORMANCE INDEXES ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_clerk_id     ON posts(clerk_id);
CREATE INDEX IF NOT EXISTS idx_posts_tags         ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_posts_created_at   ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_vote_score   ON posts(vote_score DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id   ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_votes_post_id      ON votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_comment_id   ON votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_bg_participants_clerk ON battle_ground_participants(clerk_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_medals ON player_profiles(gold_medals DESC, silver_medals DESC, bronze_medals DESC);

-- ─── 5. HARDENED ROW LEVEL SECURITY (RLS) & PRIVACY POLICIES ─
-- The Express backend operates with SUPABASE_SERVICE_ROLE_KEY, which completely
-- bypasses RLS. These policies strictly guard against anonymous/direct client leaks.

ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE codex_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_ground_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_ground_participants ENABLE ROW LEVEL SECURITY;

-- 5.1 Public Read Tables (Game Catalog, Community Feed, Match History)
DROP POLICY IF EXISTS "Public read items" ON items;
CREATE POLICY "Public read items" ON items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read posts" ON posts;
CREATE POLICY "Public read posts" ON posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read comments" ON comments;
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read battle_ground_matches" ON battle_ground_matches;
CREATE POLICY "Public read battle_ground_matches" ON battle_ground_matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read battle_ground_participants" ON battle_ground_participants;
CREATE POLICY "Public read battle_ground_participants" ON battle_ground_participants FOR SELECT USING (true);

-- 5.2 Community Mutation Policies (Strictly Verified Authors)
DROP POLICY IF EXISTS "Authors insert posts" ON posts;
CREATE POLICY "Authors insert posts" ON posts FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Authors update own posts" ON posts;
CREATE POLICY "Authors update own posts" ON posts FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Authors delete own posts" ON posts;
CREATE POLICY "Authors delete own posts" ON posts FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Authors insert comments" ON comments;
CREATE POLICY "Authors insert comments" ON comments FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Authors delete own comments" ON comments;
CREATE POLICY "Authors delete own comments" ON comments FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

-- 5.3 Strictly Private User Records (Default Deny for Unauthenticated/Anon)
-- Checks explicit auth.jwt()->>'sub'. Never uses COALESCE or grants public access.
DROP POLICY IF EXISTS "Users read own profile" ON player_profiles;
CREATE POLICY "Users read own profile" ON player_profiles FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users update own profile" ON player_profiles;
CREATE POLICY "Users update own profile" ON player_profiles FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub')
  WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users read own inventory" ON user_inventory;
CREATE POLICY "Users read own inventory" ON user_inventory FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users read own progress" ON user_progress;
CREATE POLICY "Users read own progress" ON user_progress FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users read own transactions" ON shop_transactions;
CREATE POLICY "Users read own transactions" ON shop_transactions FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users read own coin_transactions" ON coin_transactions;
CREATE POLICY "Users read own coin_transactions" ON coin_transactions FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users read own votes" ON votes;
CREATE POLICY "Users read own votes" ON votes FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

-- ─── 6. SEED SHOP ITEMS CATALOG ──────────────────────────────
-- Synchronized with frontend/src/data/items.js (11 Core Items + Cosmetics)

INSERT INTO items (slug, name, type, rarity, description, shop_price, icon_url)
VALUES
  ('hint_scroll', 'Hint Scroll', 'CONSUMABLE', 'COMMON', 'Reveals one test case input/output.', 30, '📜'),
  ('retry_shield', 'Retry Shield', 'CONSUMABLE', 'UNCOMMON', 'Negates player HP loss on next fail.', 50, '🛡️'),
  ('focus_charm', 'Focus Charm', 'CONSUMABLE', 'RARE', 'Removes attempt penalty this battle.', 80, '🧿'),
  ('lightning_flask', 'Lightning Flask', 'CONSUMABLE', 'RARE', 'Doubles coin reward (this battle).', 100, '🧪'),
  ('shadow_veil', 'Shadow Veil', 'CONSUMABLE', 'EPIC', 'Hides your PvP status from opponent.', 150, '🥷'),
  ('xp_tome', 'XP Tome', 'BOOST', 'RARE', '+50% XP for 1 hour.', 200, '📘'),
  ('coin_magnet', 'Coin Magnet', 'BOOST', 'EPIC', '+30% coins for 3 solves.', 250, '🧲'),
  ('berserker_rune', 'Berserker Rune', 'BOOST', 'LEGENDARY', 'Critical hit if 1st attempt.', 400, '🔥'),
  ('iron_shield', 'Iron Shield', 'PASSIVE', 'UNCOMMON', '-10% player HP damage taken.', 500, '🛡️'),
  ('crit_lens', 'Crit Lens', 'PASSIVE', 'EPIC', 'Lower critical hit threshold (0.90).', 800, '🔍'),
  ('ancient_codex', 'Ancient Codex', 'PASSIVE', 'LEGENDARY', '+5% XP on all solves.', 1500, '📖'),
  ('frame_gold', 'Golden Aura Frame', 'COSMETIC', 'LEGENDARY', 'Surrounds your avatar in gold.', 1000, '✨'),
  ('dmg_pixel', 'Retro Damage Text', 'COSMETIC', 'RARE', 'Changes damage numbers to pixel font.', 400, '👾')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  rarity = EXCLUDED.rarity,
  description = EXCLUDED.description,
  shop_price = EXCLUDED.shop_price,
  icon_url = EXCLUDED.icon_url;

-- ─── 7. ATOMIC RPC FUNCTIONS (SECURITY DEFINER & ROW LOCKING) ─

-- 7.1 Atomically award PvP Win Battle Token and record match completion
-- Hardened: normalized/deduplicated inputs, disjoint participant sets,
-- deterministic row locking, and secure search_path.
CREATE OR REPLACE FUNCTION public.award_pvp_win_token(
  p_room_id TEXT,
  p_winner_clerk_ids TEXT[],
  p_loser_clerk_ids TEXT[]
) RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_room_id TEXT;
  v_clean_winners TEXT[];
  v_clean_losers TEXT[];
  v_all_players TEXT[];
  v_winner_count INT;
  v_loser_count INT;
  v_total_expected INT;
  v_found_count INT;
  v_winner_id TEXT;
  v_loser_id TEXT;
  v_primary_winner TEXT := NULL;
  v_primary_loser TEXT := NULL;
BEGIN
  -- 1. Validate room ID
  v_clean_room_id := trim(coalesce(p_room_id, ''));
  IF v_clean_room_id = '' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'missing_room_id');
  END IF;

  -- 2. Validate and deduplicate winners
  IF p_winner_clerk_ids IS NULL OR array_length(p_winner_clerk_ids, 1) = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_winners');
  END IF;

  SELECT array_agg(DISTINCT trim(w) ORDER BY trim(w))
  INTO v_clean_winners
  FROM unnest(p_winner_clerk_ids) AS w
  WHERE w IS NOT NULL AND trim(w) <> '';

  v_winner_count := coalesce(array_length(v_clean_winners, 1), 0);
  -- Reject if winners had nulls, blanks, or internal duplicates
  IF v_winner_count = 0 OR v_winner_count <> array_length(p_winner_clerk_ids, 1) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_winner_ids');
  END IF;

  -- 3. Validate and deduplicate losers (if provided)
  IF p_loser_clerk_ids IS NOT NULL AND array_length(p_loser_clerk_ids, 1) > 0 THEN
    SELECT array_agg(DISTINCT trim(l) ORDER BY trim(l))
    INTO v_clean_losers
    FROM unnest(p_loser_clerk_ids) AS l
    WHERE l IS NOT NULL AND trim(l) <> '';

    v_loser_count := coalesce(array_length(v_clean_losers, 1), 0);
    -- Reject if losers had nulls, blanks, or internal duplicates
    IF v_loser_count = 0 OR v_loser_count <> array_length(p_loser_clerk_ids, 1) THEN
      RETURN jsonb_build_object('success', false, 'reason', 'invalid_loser_ids');
    END IF;
  ELSE
    v_clean_losers := '{}'::TEXT[];
    v_loser_count := 0;
  END IF;

  -- 4. Disjoint check: Reject overlapping participant IDs (cannot be in both winners and losers)
  IF v_clean_winners && v_clean_losers THEN
    RETURN jsonb_build_object('success', false, 'reason', 'overlapping_participants');
  END IF;

  -- 5. Combine distinct participant list
  v_all_players := v_clean_winners || v_clean_losers;
  v_total_expected := v_winner_count + v_loser_count;

  -- 6. Validate all participants exist and lock individual rows in deterministic order
  PERFORM 1
  FROM public.player_profiles p
  WHERE p.clerk_id = ANY(v_all_players)
  ORDER BY p.clerk_id
  FOR UPDATE;

  SELECT count(*) INTO v_found_count
  FROM public.player_profiles p
  WHERE p.clerk_id = ANY(v_all_players);

  IF v_found_count <> v_total_expected THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_participants');
  END IF;

  v_primary_winner := v_clean_winners[1];
  IF v_loser_count > 0 THEN
    v_primary_loser := v_clean_losers[1];
  END IF;

  -- 7. Atomically record match completion with ON CONFLICT (room_id) DO NOTHING.
  -- PostgreSQL unique row lock ensures only ONE concurrent call succeeds.
  INSERT INTO public.pvp_battles (room_id, player_one_id, player_two_id, winner_id, status, ended_at)
  VALUES (v_clean_room_id, v_primary_winner, v_primary_loser, v_primary_winner, 'COMPLETE', NOW())
  ON CONFLICT (room_id) DO NOTHING;

  -- If insert did not create a row, this room was already finalized.
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_awarded');
  END IF;

  -- 8. Exactly one update per distinct winner (+1 Battle Token, +1 Win, +1 Total)
  FOREACH v_winner_id IN ARRAY v_clean_winners LOOP
    UPDATE public.player_profiles
    SET battle_tokens = battle_tokens + 1,
        battles_won = battles_won + 1,
        total_battles = total_battles + 1
    WHERE clerk_id = v_winner_id;
  END LOOP;

  -- 9. Exactly one update per distinct loser (+1 Loss, +1 Total)
  IF v_loser_count > 0 THEN
    FOREACH v_loser_id IN ARRAY v_clean_losers LOOP
      UPDATE public.player_profiles
      SET battles_lost = battles_lost + 1,
          total_battles = total_battles + 1
      WHERE clerk_id = v_loser_id;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 7.2 Atomically deduct Battle Ground entry tokens (Deterministic Row Locking & All-or-Nothing)
CREATE OR REPLACE FUNCTION public.deduct_battle_ground_entry(
  p_clerk_ids TEXT[]
) RETURNS TABLE(clerk_id TEXT, success BOOLEAN, remaining_tokens INT) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_ids TEXT[];
  v_expected_count INT;
  v_eligible_count INT;
BEGIN
  -- 1. Normalize and deduplicate input IDs
  SELECT array_agg(DISTINCT trim(id) ORDER BY trim(id))
  INTO v_clean_ids
  FROM unnest(p_clerk_ids) AS id
  WHERE id IS NOT NULL AND trim(id) <> '';

  v_expected_count := coalesce(array_length(v_clean_ids, 1), 0);
  -- Reject if empty array, nulls, or duplicates were present
  IF v_expected_count = 0 OR v_expected_count <> coalesce(array_length(p_clerk_ids, 1), 0) THEN
    RETURN;
  END IF;

  -- 2. Lock individual player rows in deterministic clerk_id order to avoid deadlocks
  PERFORM 1
  FROM public.player_profiles p
  WHERE p.clerk_id = ANY(v_clean_ids)
  ORDER BY p.clerk_id
  FOR UPDATE;

  -- 3. Verify every requested player exists AND has at least 5 tokens
  SELECT count(*) INTO v_eligible_count
  FROM public.player_profiles p
  WHERE p.clerk_id = ANY(v_clean_ids) AND p.battle_tokens >= 5;

  -- All-or-Nothing: If ANY player has < 5 tokens or doesn't exist, abort
  IF v_eligible_count <> v_expected_count THEN
    RETURN;
  END IF;

  -- 4. Atomically deduct exactly 5 tokens from each player and return new balances
  RETURN QUERY
  UPDATE public.player_profiles p
  SET battle_tokens = p.battle_tokens - 5
  WHERE p.clerk_id = ANY(v_clean_ids)
  RETURNING p.clerk_id, true, p.battle_tokens;
END;
$$;

-- 7.3 Atomically award problem completion coins with idempotency guard
CREATE OR REPLACE FUNCTION public.award_problem_coins(
  p_clerk_id TEXT,
  p_problem_id TEXT,
  p_problem_title TEXT DEFAULT NULL,
  p_section TEXT DEFAULT NULL,
  p_coins INT DEFAULT 20
) RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_clerk_id TEXT;
  v_clean_problem_id TEXT;
  v_new_coins INT;
BEGIN
  v_clean_clerk_id := trim(coalesce(p_clerk_id, ''));
  v_clean_problem_id := lower(trim(coalesce(p_problem_id, '')));

  IF v_clean_clerk_id = '' OR v_clean_problem_id = '' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
  END IF;

  -- Validate positive coin reward amount
  IF p_coins IS NULL OR p_coins <= 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_coin_amount');
  END IF;

  -- Verify user exists and lock their profile row
  SELECT coins INTO v_new_coins
  FROM public.player_profiles
  WHERE clerk_id = v_clean_clerk_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'user_not_found');
  END IF;

  -- Insert reward transaction with ON CONFLICT against the partial unique index
  INSERT INTO public.coin_transactions (clerk_id, problem_id, problem_title, section, amount, type)
  VALUES (v_clean_clerk_id, v_clean_problem_id, p_problem_title, p_section, p_coins, 'REWARD')
  ON CONFLICT (clerk_id, problem_id) WHERE type = 'REWARD' DO NOTHING;

  -- Duplicate reward attempt: abort credit and return current balance
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_rewarded', 'coins', v_new_coins);
  END IF;

  -- Atomically credit player profile
  UPDATE public.player_profiles
  SET coins = coins + p_coins
  WHERE clerk_id = v_clean_clerk_id
  RETURNING coins INTO v_new_coins;

  RETURN jsonb_build_object('success', true, 'coins_awarded', p_coins, 'coins', v_new_coins);
END;
$$;

-- ─── 8. FUNCTION ACCESS SECURITY ─────────────────────────────
-- Restrict direct execution of atomic balance/token RPCs to service_role (backend only).
-- Explicitly revoke from PUBLIC, anon, and authenticated so client-side browsers cannot call them.

REVOKE EXECUTE ON FUNCTION public.award_pvp_win_token(TEXT, TEXT[], TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_pvp_win_token(TEXT, TEXT[], TEXT[]) TO service_role;

REVOKE EXECUTE ON FUNCTION public.deduct_battle_ground_entry(TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_battle_ground_entry(TEXT[]) TO service_role;

REVOKE EXECUTE ON FUNCTION public.award_problem_coins(TEXT, TEXT, TEXT, TEXT, INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_problem_coins(TEXT, TEXT, TEXT, TEXT, INT) TO service_role;

-- ─── 3.12 User Item Usage History (Audit Trail) ───────────────
CREATE TABLE IF NOT EXISTS public.user_item_usage_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id    TEXT NOT NULL REFERENCES public.player_profiles(clerk_id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  item_slug   TEXT NOT NULL,
  problem_id  TEXT,
  context     JSONB DEFAULT '{}'::jsonb,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_item_usage_clerk ON public.user_item_usage_history(clerk_id, used_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_item_usage_item ON public.user_item_usage_history(item_id);

ALTER TABLE public.user_item_usage_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own item usage history" ON user_item_usage_history;
CREATE POLICY "Users read own item usage history" ON user_item_usage_history FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'sub' IS NOT NULL AND clerk_id = auth.jwt() ->> 'sub');

-- ─── 7.4 Atomic Item Consumption Function ─────────────────────
CREATE OR REPLACE FUNCTION public.consume_user_inventory_item(
  p_clerk_id   TEXT,
  p_item_slug  TEXT,
  p_problem_id TEXT DEFAULT NULL,
  p_context    JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_clerk_id TEXT;
  v_clean_slug     TEXT;
  v_item           RECORD;
  v_inv_id         UUID;
  v_current_qty    INT;
  v_remaining_qty  INT;
BEGIN
  v_clean_clerk_id := trim(coalesce(p_clerk_id, ''));
  v_clean_slug     := lower(trim(coalesce(p_item_slug, '')));

  IF v_clean_clerk_id = '' OR v_clean_slug = '' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_arguments');
  END IF;

  -- 1. Validate Item existence in items catalog (match slug or id)
  SELECT id, slug, name, type, rarity, effect
  INTO v_item
  FROM public.items
  WHERE lower(slug) = v_clean_slug
     OR (id::text = v_clean_slug)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'item_not_found');
  END IF;

  -- 2. Validate Item usability (only CONSUMABLE and BOOST items can be consumed)
  IF v_item.type NOT IN ('CONSUMABLE', 'BOOST') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'item_not_usable', 'type', v_item.type);
  END IF;

  -- 3. Lock user inventory row FOR UPDATE to prevent race conditions
  SELECT id, quantity
  INTO v_inv_id, v_current_qty
  FROM public.user_inventory
  WHERE clerk_id = v_clean_clerk_id
    AND item_id = v_item.id
  FOR UPDATE;

  IF NOT FOUND OR v_current_qty IS NULL OR v_current_qty <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'insufficient_quantity',
      'current_quantity', coalesce(v_current_qty, 0)
    );
  END IF;

  -- 4. Atomically decrement quantity (delete row if 1, else decrement)
  IF v_current_qty = 1 THEN
    DELETE FROM public.user_inventory
    WHERE id = v_inv_id;
    v_remaining_qty := 0;
  ELSE
    UPDATE public.user_inventory
    SET quantity = quantity - 1
    WHERE id = v_inv_id
    RETURNING quantity INTO v_remaining_qty;
  END IF;

  -- 5. Record usage in audit history
  INSERT INTO public.user_item_usage_history (
    clerk_id,
    item_id,
    item_slug,
    problem_id,
    context,
    used_at
  ) VALUES (
    v_clean_clerk_id,
    v_item.id,
    v_item.slug,
    p_problem_id,
    coalesce(p_context, '{}'::jsonb),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'item_id', v_item.id,
    'item_slug', v_item.slug,
    'item_name', v_item.name,
    'remaining_quantity', v_remaining_qty,
    'effect', v_item.effect
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_user_inventory_item(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_user_inventory_item(TEXT, TEXT, TEXT, JSONB) TO service_role;

