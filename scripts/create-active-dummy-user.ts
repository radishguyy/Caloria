import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!connectionString || !supabaseUrl || !serviceKey) {
    throw new Error("Missing required credentials in .env.local");
  }

  console.log("🚀 Creating Active Dummy User for Caloria...");

  const adminClient = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const sql = postgres(connectionString, { max: 1, ssl: "require" });

  const dummyEmail = "dummy@caloria.app";
  const dummyPassword = "Password123!";
  const dummyUsername = "caloria_dummy";
  const dummyFullName = "Caloria Veteran (Active Dummy)";

  // 1. Check if user already exists in Auth
  let userId: string;
  const { data: userList } = await adminClient.auth.admin.listUsers();
  const existingAuthUser = userList?.users?.find(
    (u) => u.email === dummyEmail || (u.user_metadata as any)?.username === dummyUsername
  );

  if (existingAuthUser) {
    console.log(`Found existing auth user: ${existingAuthUser.id} (${existingAuthUser.email})`);
    userId = existingAuthUser.id;
    // Update password & confirmed status
    await adminClient.auth.admin.updateUserById(userId, {
      password: dummyPassword,
      email_confirm: true,
      user_metadata: {
        full_name: dummyFullName,
        username: dummyUsername,
      },
    });
  } else {
    console.log(`Creating new auth user in Supabase Auth: ${dummyEmail}...`);
    const { data: newAuth, error: createErr } = await adminClient.auth.admin.createUser({
      email: dummyEmail,
      password: dummyPassword,
      email_confirm: true,
      user_metadata: {
        full_name: dummyFullName,
        username: dummyUsername,
      },
    });

    if (createErr || !newAuth.user) {
      throw new Error(`Failed to create auth user: ${createErr?.message}`);
    }
    userId = newAuth.user.id;
    console.log(`✅ Auth user created with ID: ${userId}`);
  }

  // 2. Set auth.users created_at to 9 Oktober 2026
  try {
    await sql`
      UPDATE auth.users
      SET created_at = '2026-10-09 08:00:00+00'::timestamptz
      WHERE id = ${userId}::uuid
    `;
    console.log("✅ Updated auth.users created_at to 2026-10-09");
  } catch (err) {
    console.warn("Could not directly update auth.users created_at (may need superuser, continuing):", err);
  }

  // 3. Upsert Profile
  console.log("👤 Upserting profile with 99999 coins and active streak since 9 Oktober...");
  await sql`
    INSERT INTO profiles (
      id,
      username,
      full_name,
      avatar_url,
      goal,
      gender,
      birth_date,
      height_cm,
      initial_weight_kg,
      current_weight_kg,
      target_weight_kg,
      activity_level,
      bmi_score,
      tdee_kcal,
      target_calories_kcal,
      target_protein_g,
      target_carbs_g,
      target_fat_g,
      projected_days,
      caloria_coins,
      current_streak_days,
      longest_streak_days,
      is_onboarding_completed,
      created_at,
      updated_at,
      weight_kg,
      age,
      goal_path,
      current_level,
      current_week,
      streak_consecutive_logs,
      streak_count,
      last_logged_date
    ) VALUES (
      ${userId}::uuid,
      ${dummyUsername},
      ${dummyFullName},
      NULL,
      'diet'::goal_type_enum,
      'male',
      '1998-05-15',
      175.00,
      74.50,
      70.80,
      68.00,
      'moderately_active'::activity_level_enum,
      23.12,
      2400,
      1900,
      140.00,
      190.00,
      60.00,
      60,
      99999,
      22,
      22,
      true,
      '2026-10-09 08:00:00+00'::timestamptz,
      '2026-10-30 06:00:00+00'::timestamptz,
      70.80,
      28,
      'lose_weight',
      2,
      3,
      22,
      22,
      '2026-10-30'
    )
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      full_name = EXCLUDED.full_name,
      caloria_coins = 99999,
      current_streak_days = 22,
      longest_streak_days = 22,
      streak_count = 22,
      streak_consecutive_logs = 22,
      current_level = 2,
      current_week = 3,
      is_onboarding_completed = true,
      current_weight_kg = 70.80,
      weight_kg = 70.80,
      last_logged_date = '2026-10-30',
      created_at = '2026-10-09 08:00:00+00'::timestamptz,
      updated_at = NOW()
  `;
  console.log("✅ Profile upserted successfully!");

  // 4. Find plaza items for pet dressing
  const crown = await sql`SELECT id FROM plaza_items WHERE asset_url = 'head-golden-crown' LIMIT 1`;
  const shades = await sql`SELECT id FROM plaza_items WHERE asset_url = 'glasses-cool-shades' LIMIT 1`;
  const cape = await sql`SELECT id FROM plaza_items WHERE asset_url = 'body-hero-cape' LIMIT 1`;
  const water = await sql`SELECT id FROM plaza_items WHERE asset_url = 'acc-water-bottle' LIMIT 1`;
  const dojo = await sql`SELECT id FROM plaza_items WHERE asset_url = 'room-zen-dojo' LIMIT 1`;

  const crownId = crown[0]?.id || null;
  const shadesId = shades[0]?.id || null;
  const capeId = cape[0]?.id || null;
  const waterId = water[0]?.id || null;
  const dojoId = dojo[0]?.id || null;

  // 5. Upsert Pet
  console.log("🐾 Upserting adult pet with 99999 coins and equipped items...");
  await sql`
    INSERT INTO pets (
      user_id,
      name,
      species,
      character_id,
      stage,
      level,
      exp,
      current_xp,
      next_level_xp,
      hunger,
      happiness,
      coins,
      skin_color,
      equipped_hat_id,
      equipped_glasses_id,
      equipped_outfit_id,
      equipped_accessory_id,
      equipped_room_id,
      custom_colors,
      created_at,
      updated_at
    ) VALUES (
      ${userId}::uuid,
      'Pyro Blaze',
      'flameling',
      'flameling',
      'adult',
      8,
      350,
      350,
      500,
      98,
      100,
      99999,
      'default',
      ${crownId}::uuid,
      ${shadesId}::uuid,
      ${capeId}::uuid,
      ${waterId}::uuid,
      ${dojoId}::uuid,
      '{}'::jsonb,
      '2026-10-09 08:05:00+00'::timestamptz,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = 'Pyro Blaze',
      species = 'flameling',
      character_id = 'flameling',
      stage = 'adult',
      level = 8,
      coins = 99999,
      hunger = 98,
      happiness = 100,
      equipped_hat_id = ${crownId}::uuid,
      equipped_glasses_id = ${shadesId}::uuid,
      equipped_outfit_id = ${capeId}::uuid,
      equipped_accessory_id = ${waterId}::uuid,
      equipped_room_id = ${dojoId}::uuid,
      created_at = '2026-10-09 08:05:00+00'::timestamptz,
      updated_at = NOW()
  `;
  console.log("✅ Pet configured with 99999 coins and adult stage!");

  // 6. Add Wardrobe items
  console.log("👒 Populating user wardrobe with owned cosmetics...");
  const itemsToOwn = [crownId, shadesId, capeId, waterId, dojoId].filter(Boolean);
  for (const itemId of itemsToOwn) {
    await sql`
      INSERT INTO user_wardrobe (user_id, item_id, purchased_at)
      VALUES (${userId}::uuid, ${itemId}::uuid, '2026-10-15 12:00:00+00'::timestamptz)
      ON CONFLICT (user_id, item_id) DO NOTHING
    `;
  }

  // 7. Seed Weight Logs across journey (from 9 Okt to 30 Okt)
  console.log("⚖️ Seeding weight journey from Oct 9 to Oct 30...");
  await sql`DELETE FROM weight_logs WHERE user_id = ${userId}::uuid`;
  const weightEntries = [
    { date: "2026-10-09", weight: 74.50, notes: "Mulai journey sehat Caloria! 🚀" },
    { date: "2026-10-13", weight: 73.80, notes: "Defisit kalori 500 terjaga" },
    { date: "2026-10-18", weight: 72.90, notes: "Pet berevolusi ke stage 2" },
    { date: "2026-10-22", weight: 72.10, notes: "Konsisten olahraga 4x seminggu" },
    { date: "2026-10-26", weight: 71.40, notes: "Makin fit dan berenergi" },
    { date: "2026-10-30", weight: 70.80, notes: "Timbang pagi, turun total 3.7 kg!" },
  ];

  for (const w of weightEntries) {
    await sql`
      INSERT INTO weight_logs (user_id, weight_kg, logged_date, notes, created_at)
      VALUES (${userId}::uuid, ${w.weight}, ${w.date}, ${w.notes}, (${w.date} || ' 07:00:00+00')::timestamptz)
      ON CONFLICT (user_id, logged_date) DO UPDATE SET
        weight_kg = EXCLUDED.weight_kg,
        notes = EXCLUDED.notes
    `;
  }
  console.log(`✅ Seeded ${weightEntries.length} weight logs.`);

  // 8. Seed Daily Meal Logs and Daily Mission Evaluations for 22 days (Oct 9 to Oct 30)
  console.log("🥗 Seeding daily meal logs & mission evaluations for all 22 active days...");
  await sql`DELETE FROM meal_logs WHERE user_id = ${userId}::uuid`;
  await sql`DELETE FROM user_mission_evaluations WHERE user_id = ${userId}::uuid`;

  // Fetch foods to use for logs
  const foodsList = await sql`
    SELECT id, name, calories_kcal, protein_g, carbs_g, fat_g
    FROM foods
    LIMIT 20
  `;

  const nasiPutih = foodsList.find((f) => f.name.includes("Nasi Putih")) || foodsList[0];
  const nasiMerah = foodsList.find((f) => f.name.includes("Nasi Merah")) || foodsList[1];
  const ayamPanggang = foodsList.find((f) => f.name.includes("Dada Ayam")) || foodsList[2];
  const telurRebus = foodsList.find((f) => f.name.includes("Telur Ayam Rebus")) || foodsList[4];
  const tempeGoreng = foodsList.find((f) => f.name.includes("Tempe")) || foodsList[6];
  const tahu = foodsList.find((f) => f.name.includes("Tahu")) || foodsList[7];

  for (let day = 9; day <= 30; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `2026-10-${dayStr}`;

    // Breakfast: 2 Telur Rebus
    await sql`
      INSERT INTO meal_logs (
        user_id, food_id, logged_date, meal_type, servings,
        calculated_calories, calculated_protein, calculated_carbs, calculated_fat,
        custom_food_name, created_at
      ) VALUES (
        ${userId}::uuid, ${telurRebus.id}::uuid, ${dateStr}, 'breakfast'::meal_time_enum, 2.0,
        156.00, 12.60, 1.20, 10.60,
        ${telurRebus.name}, (${dateStr} || ' 07:30:00+00')::timestamptz
      )
    `;

    // Lunch: Nasi Putih + Dada Ayam Panggang + Tempe Goreng
    await sql`
      INSERT INTO meal_logs (
        user_id, food_id, logged_date, meal_type, servings,
        calculated_calories, calculated_protein, calculated_carbs, calculated_fat,
        custom_food_name, created_at
      ) VALUES (
        ${userId}::uuid, ${nasiPutih.id}::uuid, ${dateStr}, 'lunch'::meal_time_enum, 1.0,
        204.00, 4.20, 44.00, 0.40,
        ${nasiPutih.name}, (${dateStr} || ' 12:30:00+00')::timestamptz
      )
    `;
    await sql`
      INSERT INTO meal_logs (
        user_id, food_id, logged_date, meal_type, servings,
        calculated_calories, calculated_protein, calculated_carbs, calculated_fat,
        custom_food_name, created_at
      ) VALUES (
        ${userId}::uuid, ${ayamPanggang.id}::uuid, ${dateStr}, 'lunch'::meal_time_enum, 1.5,
        372.00, 46.50, 0.00, 5.40,
        ${ayamPanggang.name}, (${dateStr} || ' 12:32:00+00')::timestamptz
      )
    `;
    await sql`
      INSERT INTO meal_logs (
        user_id, food_id, logged_date, meal_type, servings,
        calculated_calories, calculated_protein, calculated_carbs, calculated_fat,
        custom_food_name, created_at
      ) VALUES (
        ${userId}::uuid, ${tempeGoreng.id}::uuid, ${dateStr}, 'lunch'::meal_time_enum, 2.0,
        236.00, 22.00, 18.00, 9.00,
        ${tempeGoreng.name}, (${dateStr} || ' 12:35:00+00')::timestamptz
      )
    `;

    // Dinner: Nasi Merah + Dada Ayam Panggang + Tahu
    await sql`
      INSERT INTO meal_logs (
        user_id, food_id, logged_date, meal_type, servings,
        calculated_calories, calculated_protein, calculated_carbs, calculated_fat,
        custom_food_name, created_at
      ) VALUES (
        ${userId}::uuid, ${nasiMerah.id}::uuid, ${dateStr}, 'dinner'::meal_time_enum, 1.0,
        165.00, 3.50, 35.00, 1.20,
        ${nasiMerah.name}, (${dateStr} || ' 19:15:00+00')::timestamptz
      )
    `;
    await sql`
      INSERT INTO meal_logs (
        user_id, food_id, logged_date, meal_type, servings,
        calculated_calories, calculated_protein, calculated_carbs, calculated_fat,
        custom_food_name, created_at
      ) VALUES (
        ${userId}::uuid, ${ayamPanggang.id}::uuid, ${dateStr}, 'dinner'::meal_time_enum, 1.2,
        297.00, 37.20, 0.00, 4.30,
        ${ayamPanggang.name}, (${dateStr} || ' 19:18:00+00')::timestamptz
      )
    `;
    await sql`
      INSERT INTO meal_logs (
        user_id, food_id, logged_date, meal_type, servings,
        calculated_calories, calculated_protein, calculated_carbs, calculated_fat,
        custom_food_name, created_at
      ) VALUES (
        ${userId}::uuid, ${tahu.id}::uuid, ${dateStr}, 'dinner'::meal_time_enum, 2.0,
        184.00, 16.00, 8.00, 9.60,
        ${tahu.name}, (${dateStr} || ' 19:20:00+00')::timestamptz
      )
    `;

    // Snack: Telur Rebus 1x
    await sql`
      INSERT INTO meal_logs (
        user_id, food_id, logged_date, meal_type, servings,
        calculated_calories, calculated_protein, calculated_carbs, calculated_fat,
        custom_food_name, created_at
      ) VALUES (
        ${userId}::uuid, ${telurRebus.id}::uuid, ${dateStr}, 'snack'::meal_time_enum, 1.0,
        78.00, 6.30, 0.60, 5.30,
        ${telurRebus.name}, (${dateStr} || ' 16:00:00+00')::timestamptz
      )
    `;

    // Daily Mission Evaluation: 100% compliant
    await sql`
      INSERT INTO user_mission_evaluations (
        user_id, evaluation_date,
        total_calories, total_protein, total_carbs, total_fat,
        is_macro_compliant, is_calorie_target_met, passed_day,
        xp_earned, coins_earned, created_at, updated_at
      ) VALUES (
        ${userId}::uuid, ${dateStr},
        1692.00, 148.30, 106.80, 45.80,
        true, true, true,
        100, 50, (${dateStr} || ' 21:00:00+00')::timestamptz, (${dateStr} || ' 21:00:00+00')::timestamptz
      )
      ON CONFLICT (user_id, evaluation_date) DO UPDATE SET
        total_calories = EXCLUDED.total_calories,
        total_protein = EXCLUDED.total_protein,
        is_macro_compliant = true,
        is_calorie_target_met = true,
        passed_day = true
    `;
  }
  console.log("✅ Seeded 22 days of full meal logs (176 logs) & daily mission evaluations.");

  // 9. Badges
  console.log("🏅 Unlocking consistency & nutrition badges...");
  const badgeCodes = ["badge-consistency-3", "badge-consistency-7", "badge-protein-champion"];
  for (const code of badgeCodes) {
    const [b] = await sql`SELECT id FROM badges WHERE code = ${code} LIMIT 1`;
    if (b) {
      await sql`
        INSERT INTO user_badges (user_id, badge_id, unlocked_at)
        VALUES (${userId}::uuid, ${b.id}::uuid, '2026-10-16 10:00:00+00'::timestamptz)
        ON CONFLICT (user_id, badge_id) DO NOTHING
      `;
    }
  }
  console.log("✅ Badges unlocked.");

  await sql.end();

  console.log("\n========================================================");
  console.log("🎉 AKUN DUMMY AKTIF CALORIA SELESAI DIBUAT DENGAN SUKSES!");
  console.log("========================================================");
  console.log(`📧 Email      : ${dummyEmail}`);
  console.log(`🔑 Password   : ${dummyPassword}`);
  console.log(`👤 Username   : ${dummyUsername}`);
  console.log(`🪙 Koin       : 99999 Koin`);
  console.log(`📅 Aktif sejak: 9 Oktober 2026 (22 Hari Streak Aktif Penuh)`);
  console.log(`🐾 Pet        : Pyro Blaze (Flameling Adult Lv 8, Full Equipment)`);
  console.log(`🥗 Log Nutrisi: 22 hari konsisten (176 catatan makan lengkap)`);
  console.log(`⚖️ Berat Badan: Turun konsisten dari 74.5 kg ke 70.8 kg`);
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("Fatal error creating dummy user:", err);
  process.exit(1);
});
