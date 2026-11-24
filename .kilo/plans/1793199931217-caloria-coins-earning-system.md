# Plan: Caloria Coins Earning System

**Path**: `.kilo/plans/1793199931217-caloria-coins-earning-system.md`

## Context

Existing codebase already has:
- `profiles.caloria_coins` (integer, default 0) — persistent balance
- `daily_nutrition_summaries.coins_rewarded` (integer, default 0)
- `friendships` table (accepted/pending statuses) — social relations
- `poke_logs` table — nudges between friends
- `coop_groups.streak_count`, `coop_members.has_completed_today` — co-op streak
- `badges` + `user_badges` tables — achievements
- `plaza_items.price_coins` + `user_wardrobe` — shop/purchases
- `reward-engine.ts` — food logging XP evaluation (partially edited to remove coins)
- `use-food-store.ts` — Zustand store with `NutritionFeedback` (partially edited to remove coins)
- `src/app/actions/coins.ts` — created (centralized idempotent `awardCoins` server action)
- Migration `drizzle/0001_coin_transactions.sql` — created
- `coinTransactions` schema added to `src/db/schema/gamification.ts`

## Remaining Work

### 1. Complete `reward-engine.ts` (already done — verify)
- `evaluateFoodReward` — coins removed, XP-only ✓
- `evaluateBatchFoodReward` — coins removed, XP-only ✓
- `BatchRewardEvaluationResult` interface — remove `coinsEarned` field if present

### 2. Complete `use-food-store.ts`
- `NutritionFeedback` interface — removed `coinsEarned` ✓
- `addLog` — removed `coinsEarned` from all feedback branches ✓
- `addBatchLogs` — removed `coinsEarned` ✓
- **Remaining**: `getDailySummary()` still returns `coinsEarned` field — remove it

### 3. Fix `src/app/actions/coins.ts`
- Remove unused `sql` import (line 5) — not used anywhere
- Verify `updateAt` field name matches schema (`updatedAt`, not `updateAt`)

### 4. Create earning-method server actions

Each uses `awardCoins` with unique `(rewardType, rewardId)` for idempotency:

**a. Daily Nutrition Mission (10 coins, once/day)**
File: `src/app/actions/daily-mission.ts`
- Read `daily_nutrition_summaries` for today where `is_calorie_target_met = true` AND `is_macro_balanced = true` AND `coins_rewarded = 0`
- Call `awardCoins({amount: 10, rewardType: "daily_mission", rewardId: <date>})`
- Update `coins_rewarded` on summary to mark done

**b. Pet Own Calpal (5 coins, once/user/day)**
File: `src/app/actions/pet-interact.ts`
- Check ledger not already awarded today for user (`rewardType: "pet_pal"`, `rewardId: <date>`)
- Verify successful interaction recorded (pet store interaction or poke_logs on self)
- Call `awardCoins({amount: 5, rewardType: "pet_pal", rewardId: <userId>_<date>})`

**c. Nudge Friend (5 coins, max 3 distinct recipients/day)**
File: `src/app/actions/nudge-friend.ts`
- Verify recipient is an accepted friend (`friendships.status = 'accepted'`)
- Insert into `poke_logs` first
- Count distinct recipients already rewarded today for sender → if < 3, award
- Call `awardCoins({amount: 5, rewardType: "nudge", rewardId: <senderId>_<recipientId>_<date>})`
- Return `remainingEligibleNudges` for UI

**d. Streak Milestones (3/7/14/30/100 days: 5/10/20/50/150)**
File: `src/app/actions/streak-milestones.ts`
- Read `profiles.current_streak_days`
- Map: 3→5, 7→10, 14→20, 30→50, 100→150
- Check ledger for `(rewardType: "streak_milestone", rewardId: <days>)` not claimed
- Call `awardCoins` when exact milestone reached

**e. Nutrition Achievements (10-50 coins, once/achievement)**
File: `src/app/actions/achievement.ts`
- Check `user_badges` for newly unlocked badge not yet rewarded
- Coin amount per badge: consistency-3→10, consistency-7→15, consistency-30→25, consistency-100→50, protein-champion→20, calorie-sniper→30, goal-finisher→50, coop-starter→15, duo-unstoppable→35, senggol-master→20
- Call `awardCoins({rewardType: "achievement", rewardId: <badgeCode>})`

**f. Weekly Nutrition Challenges (20-40 coins)**
File: `src/app/actions/weekly-challenge.ts`
- Verify challenge completion (existing co-op/community system)
- Call `awardCoins({rewardType: "weekly_challenge", rewardId: <challengeId>})`

**g. Co-op Streak Milestones (10-30 coins)**
File: `src/app/actions/coop-milestones.ts`
- Read `coop_groups.streak_count`
- Map milestones to coin values (e.g., 7→10, 14→20, 30→30)
- Call `awardCoins({rewardType: "coop_milestone", rewardId: <groupId>_<days>})`

**h. Limited-Time Community Events (10-50 coins)**
File: `src/app/actions/event-reward.ts`
- Check `plaza_items.is_event_item = true`
- Reward per event rules
- Call `awardCoins({rewardType: "event", rewardId: <eventId>})`

**i. Complete Onboarding (10 coins, once/user)**
Modify: `src/app/actions/onboarding.ts`
- After `isOnboardingCompleted: true` set successfully
- Call `awardCoins({amount: 10, rewardType: "onboarding", rewardId: <userId>})`

### 5. UI Updates

**a. Dashboard** (`src/app/dashboard/page.tsx`)
- Show current coin balance from server (not just Zustand)
- Show `+N Caloria Coins` toast/confirmation after petting/nudging

**b. Pet Renderer** (`src/components/pet/pet-renderer.tsx`)
- Pet interaction button: show `+5 Caloria Coins` confirmation
- Show remaining eligible nudges for today

**c. Social/Co-op** (`src/app/social/coop/page.tsx`)
- Nudge button: show `+5 Caloria Coins` success state
- Show remaining nudge count (max 3 per day)
- Loading, error, daily-limit states

**d. Missions/Achievements/Streaks**
- Display reward amounts
- Show claim status (claimed/available/locked)

### 6. Migration Verification
- `drizzle/0001_coin_transactions.sql` — creates `coin_transactions` table with unique constraint on `(user_id, reward_type, reward_id)`
- No existing data reset — preserves all balances and progress

### 7. Constraints
- Do not modify Google login, navbar, or unrelated features
- Do not modify `.env` files
- Run `npm run build` and fix regressions
- Test: daily limits, repeated requests, concurrent claims, invalid eligibility, timezone boundaries, accessory purchase interactions

## Data Flow

```
Reward Trigger → Server Action → awardCoins() → [check ledger] → [insert ledger + update profile balance] → Return {success, coinsEarned, newBalance} → UI updates balance + shows +N coin toast
```

## Idempotency Strategy

- Unique DB constraint on `(user_id, reward_type, reward_id)` prevents duplicate rows
- `awardCoins` checks ledger before inserting — returns existing result if already claimed
- Catch `23505` unique violation → re-check ledger → return existing result
- Each reward type uses deterministic `rewardId` combining userId + date/badgeId/etc.