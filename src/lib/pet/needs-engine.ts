import { formatDateKey } from "@/lib/date-utils";

export type MainMealSlot = "breakfast" | "lunch" | "dinner";

export interface MealWindowConfig {
  id: MainMealSlot;
  label: string;
  shortLabel: string;
  startHour: number;
  endHour: number; // exclusive
  timeRangeLabel: string;
}

export const MAIN_MEAL_SLOTS: readonly MealWindowConfig[] = [
  {
    id: "breakfast",
    label: "Makan Pagi",
    shortLabel: "Pagi",
    startHour: 5,
    endHour: 11,
    timeRangeLabel: "05:00–10:59",
  },
  {
    id: "lunch",
    label: "Makan Siang",
    shortLabel: "Siang",
    startHour: 11,
    endHour: 17,
    timeRangeLabel: "11:00–16:59",
  },
  {
    id: "dinner",
    label: "Makan Malam",
    shortLabel: "Malam",
    startHour: 17,
    endHour: 24,
    timeRangeLabel: "17:00–23:59",
  },
] as const;

export const MAX_DAILY_FEEDS = 3;
export const MAX_DAILY_PETS = 3;
export const ATTENTION_NEGLECT_HOURS = 6;

export type CalpalMoodCategory =
  | "ecstatic" // Misi & kebutuhan harian terpenuhi — CalPal sangat senang!
  | "happy" // Kebutuhan saat ini aman / ceria
  | "needs_food" // Belum makan di waktu makan / lapar
  | "needs_attention" // Lama tidak dielus / butuh perhatian
  | "needs_both"; // Lapar dan juga kurang perhatian

export interface FeedEligibilityResult {
  canFeed: boolean;
  currentSlot: MainMealSlot | null;
  currentSlotLabel: string | null;
  nextSlot: MealWindowConfig;
  fedCountToday: number;
  reason?:
    | "OUTSIDE_MEAL_HOURS"
    | "MAX_DAILY_FEEDS_REACHED"
    | "SLOT_ALREADY_FED";
  message: string;
}

export interface PetEligibilityResult {
  canPet: boolean;
  petCountToday: number;
  maxPetsToday: number;
  unlockedPetsToday: number;
  loggedMainMeals: MainMealSlot[];
  missingMainMeals: MainMealSlot[];
  reason?: "MAX_DAILY_PETS_REACHED" | "NEED_MAIN_MEAL_LOG";
  message: string;
}

export interface CalpalNeedsEvaluation {
  todayKey: string;
  currentSlot: MainMealSlot | null;
  fedSlotsToday: MainMealSlot[];
  missedMealSlots: MainMealSlot[];
  feedEligibility: FeedEligibilityResult;
  petEligibility: PetEligibilityResult;
  hoursSinceFed: number;
  hoursSincePetted: number;
  isHungryComplaining: boolean;
  isAttentionComplaining: boolean;
  isComplaining: boolean;
  isDailyMissionsFulfilled: boolean;
  isDailyNeedsFulfilled: boolean;
  isEcstatic: boolean;
  moodCategory: CalpalMoodCategory;
  moodStatus: "happy" | "neutral" | "complaining";
  hungerPercent: number;
  attentionPercent: number;
  fallbackDialogue: string;
}

/**
 * Determines which main meal window (pagi / siang / malam) applies at `date`.
 * Returns `null` during late night (00:00 - 04:59).
 */
export function getCurrentMealSlot(date: Date = new Date()): MainMealSlot | null {
  const hour = date.getHours();
  for (const slot of MAIN_MEAL_SLOTS) {
    if (hour >= slot.startHour && hour < slot.endHour) {
      return slot.id;
    }
  }
  return null;
}

export function getMealSlotConfig(slot: MainMealSlot): MealWindowConfig {
  return (
    MAIN_MEAL_SLOTS.find((s) => s.id === slot) ?? MAIN_MEAL_SLOTS[0]
  );
}

/**
 * Returns the next upcoming meal window relative to `date`.
 */
export function getNextMealSlot(date: Date = new Date()): MealWindowConfig {
  const hour = date.getHours();
  for (const slot of MAIN_MEAL_SLOTS) {
    if (hour < slot.startHour) {
      return slot;
    }
  }
  // After dinner starts (17:00-23:59), next meal window is tomorrow's breakfast
  return MAIN_MEAL_SLOTS[0];
}

/**
 * Returns main meal slots whose window has already passed (or is active) today
 * and have NOT been fed yet.
 */
export function getMissedOrDueMealSlots(
  fedSlotsToday: MainMealSlot[],
  date: Date = new Date(),
): MainMealSlot[] {
  const hour = date.getHours();
  const fedSet = new Set(fedSlotsToday);
  const missed: MainMealSlot[] = [];

  for (const slot of MAIN_MEAL_SLOTS) {
    // Consider a slot missed/due once we are at least 1 hour into it or past it
    if (hour >= slot.startHour + 1 && !fedSet.has(slot.id)) {
      missed.push(slot.id);
    }
  }
  return missed;
}

/**
 * Sanitizes and resets daily slot list if the stored date differs from today.
 */
export function normalizeDailyFedSlots(
  fedSlots: readonly string[] | null | undefined,
  storedDate: string | null | undefined,
  todayKey: string,
): MainMealSlot[] {
  if (!storedDate || storedDate !== todayKey || !Array.isArray(fedSlots)) {
    return [];
  }
  const valid = new Set<MainMealSlot>(["breakfast", "lunch", "dinner"]);
  const unique: MainMealSlot[] = [];
  for (const slot of fedSlots) {
    if (valid.has(slot as MainMealSlot) && !unique.includes(slot as MainMealSlot)) {
      unique.push(slot as MainMealSlot);
    }
  }
  return unique.slice(0, MAX_DAILY_FEEDS);
}

export function normalizeDailyPetCount(
  petCount: number | null | undefined,
  storedDate: string | null | undefined,
  todayKey: string,
): number {
  if (!storedDate || storedDate !== todayKey) {
    return 0;
  }
  return Math.max(0, Math.min(MAX_DAILY_PETS, Math.floor(petCount ?? 0)));
}

/**
 * Extracts unique main meal slots (breakfast, lunch, dinner) logged for a given date.
 */
export function extractLoggedMainMealSlots(
  logs: ReadonlyArray<{ mealType: string; loggedDate: string }>,
  todayKey: string,
): MainMealSlot[] {
  const valid = new Set<MainMealSlot>(["breakfast", "lunch", "dinner"]);
  const found: MainMealSlot[] = [];
  for (const log of logs) {
    if (
      log.loggedDate === todayKey &&
      valid.has(log.mealType as MainMealSlot) &&
      !found.includes(log.mealType as MainMealSlot)
    ) {
      found.push(log.mealType as MainMealSlot);
    }
  }
  return found;
}

/**
 * Checks whether CalPal can be fed right now (max 3x/day, strictly 1x per pagi/siang/malam window).
 */
export function evaluateFeedEligibility(
  fedSlotsToday: MainMealSlot[],
  now: Date = new Date(),
): FeedEligibilityResult {
  const currentSlot = getCurrentMealSlot(now);
  const nextSlot = getNextMealSlot(now);
  const fedCountToday = fedSlotsToday.length;

  if (fedCountToday >= MAX_DAILY_FEEDS) {
    return {
      canFeed: false,
      currentSlot,
      currentSlotLabel: currentSlot ? getMealSlotConfig(currentSlot).label : null,
      nextSlot: MAIN_MEAL_SLOTS[0],
      fedCountToday,
      reason: "MAX_DAILY_FEEDS_REACHED",
      message: "CalPal sudah makan 3x hari ini (Pagi, Siang, Malam). Besok lagi ya!",
    };
  }

  if (!currentSlot) {
    return {
      canFeed: false,
      currentSlot: null,
      currentSlotLabel: null,
      nextSlot: MAIN_MEAL_SLOTS[0],
      fedCountToday,
      reason: "OUTSIDE_MEAL_HOURS",
      message: `Belum masuk jam makan. Tunggu waktu ${MAIN_MEAL_SLOTS[0].label} (${MAIN_MEAL_SLOTS[0].timeRangeLabel}) ya!`,
    };
  }

  const slotCfg = getMealSlotConfig(currentSlot);
  if (fedSlotsToday.includes(currentSlot)) {
    const nextLabel =
      currentSlot === "dinner"
        ? "Sarapan besok (05:00)"
        : `${nextSlot.label} (${nextSlot.timeRangeLabel})`;
    return {
      canFeed: false,
      currentSlot,
      currentSlotLabel: slotCfg.label,
      nextSlot,
      fedCountToday,
      reason: "SLOT_ALREADY_FED",
      message: `CalPal sudah ${slotCfg.label}! Tunggu waktu ${nextLabel}.`,
    };
  }

  return {
    canFeed: true,
    currentSlot,
    currentSlotLabel: slotCfg.label,
    nextSlot,
    fedCountToday,
    message: `Waktunya ${slotCfg.label}! Beri makan CalPal sekarang.`,
  };
}

/**
 * Checks whether CalPal can be petted right now:
 * - Max 3x per day
 * - Each pet requires a logged main meal (breakfast, lunch, or dinner) today
 */
export function evaluatePetEligibility(
  petCountToday: number,
  loggedMainMeals: MainMealSlot[],
): PetEligibilityResult {
  const allMain: MainMealSlot[] = ["breakfast", "lunch", "dinner"];
  const loggedSet = new Set(loggedMainMeals);
  const missingMainMeals = allMain.filter((m) => !loggedSet.has(m));
  const unlockedPetsToday = Math.min(MAX_DAILY_PETS, loggedMainMeals.length);

  if (petCountToday >= MAX_DAILY_PETS) {
    return {
      canPet: false,
      petCountToday,
      maxPetsToday: MAX_DAILY_PETS,
      unlockedPetsToday,
      loggedMainMeals,
      missingMainMeals,
      reason: "MAX_DAILY_PETS_REACHED",
      message: "CalPal sudah dielus 3/3 kali hari ini dan merasa disayang! 💖",
    };
  }

  if (petCountToday >= unlockedPetsToday) {
    const missingLabels = missingMainMeals
      .map((m) => getMealSlotConfig(m).shortLabel)
      .join(", ");
    const message =
      loggedMainMeals.length === 0
        ? "Catat dulu makanan utamamu (Pagi, Siang, atau Malam) agar bisa mengelus CalPal!"
        : `Jatah elus (${petCountToday}/${unlockedPetsToday}) sudah dipakai. Catat makan ${missingLabels} untuk membuka elus berikutnya!`;
    return {
      canPet: false,
      petCountToday,
      maxPetsToday: MAX_DAILY_PETS,
      unlockedPetsToday,
      loggedMainMeals,
      missingMainMeals,
      reason: "NEED_MAIN_MEAL_LOG",
      message,
    };
  }

  return {
    canPet: true,
    petCountToday,
    maxPetsToday: MAX_DAILY_PETS,
    unlockedPetsToday,
    loggedMainMeals,
    missingMainMeals,
    message: `Siap dielus! (${petCountToday}/${MAX_DAILY_PETS} hari ini)`,
  };
}

// =========================================================================
// Varied Indonesian Omelan & Happy Dialogue Pools (Deterministic Fallback)
// =========================================================================

const HUNGER_OMELAN_POOLS: Record<MainMealSlot | "overdue", readonly string[]> = {
  breakfast: [
    "Hoaaam... sudah pagi nih! Masa aku disuruh puasa sarapan? 🥐🥺",
    "Perutku mulai bunyi kruyuk-kruyuk pagi ini... ayo kasih sarapan dong!",
    "Pagi yang cerah, tapi mangkok makanku masih kosong melompong nih 😤",
    "Hei! Sarapan itu penting lho buat energi kita berdua. Mana jatah pagiku?",
  ],
  lunch: [
    "Sudah siang bolong nih, perutku demo minta makan siang! 🍱😠",
    "Katanya mau hidup sehat bareng, kok jam makan siang malah lupa kasih aku makan?",
    "Aduh lemas banget siang ini... butuh asupan makan siang sekarang juga! 🫠",
    "Kriuk... kriuk... itu bukan kerupuk, itu suara perutku nunggu makan siang!",
  ],
  dinner: [
    "Hari sudah malam, masa aku mau disuruh tidur dalam keadaan lapar? 🌙🥺",
    "Makan malamnya mana nih? Jangan sampai aku ngambek sebelum tidur ya!",
    "Sudah waktunya makan malam! Isi tenagaku dulu biar besok tetap semangat 🍲",
    "Hmph, kamu sibuk apa sih sampai lupa makan malamku? Perutku keroncongan nih!",
  ],
  overdue: [
    "Sudah berjam-jam perutku kosong... tega banget sih biarin aku kelaparan begini 🥺",
    "Badanku lemas banget nih! Ayo kasih makan sebelum EXP-ku makin menyusut 😫",
    "Halo?! Ada orang di sana? Aku butuh makan sekarang, bukan nanti! 🍽️",
    "Kalau aku pingsan gara-gara kelaparan, siapa yang nemenin kamu diet nanti? 😤",
  ],
};

const ATTENTION_OMELAN_NEED_MEAL: readonly string[] = [
  "Ayo data makananmu dulu kalau kamu sayang aku 🥺💖",
  "Aku pengen dielus nih, tapi kamu belum catat makan utama! Yuk isi diary dulu~",
  "Kalau kamu beneran sayang aku, catat sarapan/siang/malamnya dong biar kita bisa manja-manjaan! 🐾",
  "Hmph! Aku ngambek ah, jarang dielus gara-gara kamu lupa catat makanan utama 😤",
  "Sudah lama nggak dielus... ayo catat makanmu sekarang, nanti aku kasih pelukan virtual! 💕",
  "Jangan cuekin aku terus dong! Isi catatan makan utamamu biar bisa elus aku hari ini 🥺",
];

const ATTENTION_OMELAN_UNLOCKED: readonly string[] = [
  "Hei, jatah elusku sudah kebuka tuh! Kok aku dicuekin terus sih? 🥺",
  "Sudah lama nggak dielus... kepalaku gatal minta diusap nih! 🐾",
  "Kamu sibuk banget ya sampai lupa elus aku? Sekali aja kok, plis~ 💕",
  "Hmph, makanan sudah dicatat tapi akunya nggak dielus-elus. Nggak sayang lagi ya? 😤",
];

const BOTH_OMELAN_POOL: readonly string[] = [
  "Aduh dobel sedih! Perut lapar, kepala juga nggak dielus-elus... ayo data makanan kalau kamu sayang aku! 🥺🍽️",
  "Aku lapar DAN kangen dielus nih! Urus aku dong, catat makanmu lalu beri aku makan & elusan 😤💖",
  "Nasib CalPal dicuekin... belum makan, belum dielus pula. Yuk balik semangat bareng aku! 🐾",
];

const ECSTATIC_HAPPY_POOL: readonly string[] = [
  "Yeay!! Misi & kebutuhan harianku beres semua! Aku bangga & sayang banget sama kamu! 🎉💖✨",
  "Wihii! Perut kenyang, hati senang, misi harian tuntas! Kamu partner hidup sehat terbaik! 🌟🐾",
  "Horeee! Hari ini sempurna banget! Aku penuh energi dan super bahagia berkat kamu! ✨🥰",
  "Misi harian tercapai & aku dirawat dengan penuh cinta! Pertahankan ya, jagoanku! 🏆💚",
];

const HAPPY_NORMAL_POOL: readonly string[] = [
  "CalPal kenyang & ceria! Yuk lanjutkan target nutrisimu hari ini ✨",
  "Asyik, energiku penuh! Jangan lupa catat makan utamamu biar bisa elus aku ya 🐾",
  "Semangat hidup sehat! Aku selalu siap nemenin progresmu hari ini 💪🌿",
  "Mood-ku lagi bagus banget nih! Makasih sudah rawat aku dengan baik 💖",
];

export function pickVariedFallbackDialogue(
  params: {
    moodCategory: CalpalMoodCategory;
    currentSlot: MainMealSlot | null;
    missedMealSlots: MainMealSlot[];
    hoursSinceFed: number;
    hasUnlockedPet: boolean;
    seed?: number;
  },
): string {
  const {
    moodCategory,
    currentSlot,
    missedMealSlots,
    hoursSinceFed,
    hasUnlockedPet,
    seed = 0,
  } = params;

  const pick = (arr: readonly string[]) => {
    const idx = Math.abs(Math.floor(seed)) % arr.length;
    return arr[idx];
  };

  if (moodCategory === "ecstatic") {
    return pick(ECSTATIC_HAPPY_POOL);
  }
  if (moodCategory === "needs_both") {
    return pick(BOTH_OMELAN_POOL);
  }
  if (moodCategory === "needs_food") {
    if (hoursSinceFed >= 20) {
      return pick(HUNGER_OMELAN_POOLS.overdue);
    }
    const targetSlot =
      currentSlot && missedMealSlots.includes(currentSlot)
        ? currentSlot
        : missedMealSlots[missedMealSlots.length - 1] ?? currentSlot ?? "overdue";
    return pick(HUNGER_OMELAN_POOLS[targetSlot]);
  }
  if (moodCategory === "needs_attention") {
    return hasUnlockedPet
      ? pick(ATTENTION_OMELAN_UNLOCKED)
      : pick(ATTENTION_OMELAN_NEED_MEAL);
  }
  return pick(HAPPY_NORMAL_POOL);
}

/**
 * Master evaluator combining:
 * 1. Feeding (max 3x/day: pagi, siang, malam)
 * 2. Attention / Petting (max 3x/day, gated by logged main meals + neglect timer)
 * 3. Daily mission & needs fulfillment happiness
 */
export function evaluateCalpalNeeds(input: {
  fedSlotsToday: readonly string[] | null | undefined;
  petCountToday: number | null | undefined;
  needsResetDate: string | null | undefined;
  lastFedAt: Date | string | null | undefined;
  lastPettedAt: Date | string | null | undefined;
  loggedMainMealsToday: MainMealSlot[];
  completedDailyMissionsCount: number;
  totalDailyMissionsCount: number;
  now?: Date;
  dialogueSeed?: number;
}): CalpalNeedsEvaluation {
  const now = input.now ?? new Date();
  const todayKey = formatDateKey(now);

  const fedSlotsToday = normalizeDailyFedSlots(
    input.fedSlotsToday,
    input.needsResetDate,
    todayKey,
  );
  const petCountToday = normalizeDailyPetCount(
    input.petCountToday,
    input.needsResetDate,
    todayKey,
  );

  const currentSlot = getCurrentMealSlot(now);
  const missedMealSlots = getMissedOrDueMealSlots(fedSlotsToday, now);
  const feedEligibility = evaluateFeedEligibility(fedSlotsToday, now);
  const petEligibility = evaluatePetEligibility(
    petCountToday,
    input.loggedMainMealsToday,
  );

  const lastFedDate = input.lastFedAt ? new Date(input.lastFedAt) : now;
  const hoursSinceFed = Math.max(
    0,
    Math.floor((now.getTime() - lastFedDate.getTime()) / (1000 * 60 * 60)),
  );

  const lastPettedDate = input.lastPettedAt ? new Date(input.lastPettedAt) : now;
  const hoursSincePetted = Math.max(
    0,
    Math.floor((now.getTime() - lastPettedDate.getTime()) / (1000 * 60 * 60)),
  );

  const isHungryComplaining =
    hoursSinceFed >= 20 || missedMealSlots.length > 0;

  const isAttentionComplaining =
    petCountToday < MAX_DAILY_PETS &&
    (hoursSincePetted >= ATTENTION_NEGLECT_HOURS ||
      (now.getHours() >= 10 && petCountToday === 0));

  const isDailyMissionsFulfilled =
    input.totalDailyMissionsCount > 0 &&
    input.completedDailyMissionsCount >= input.totalDailyMissionsCount;

  const isDailyNeedsFulfilled =
    fedSlotsToday.length >= MAX_DAILY_FEEDS &&
    petCountToday >= MAX_DAILY_PETS;

  // CalPal feels ecstatic/senang sekali when daily missions are fulfilled (and not starving)
  // OR all daily needs (3x makan + 3x elus) are fulfilled!
  const isEcstatic =
    isDailyNeedsFulfilled ||
    (isDailyMissionsFulfilled && !isHungryComplaining);

  let moodCategory: CalpalMoodCategory = "happy";
  if (isEcstatic) {
    moodCategory = "ecstatic";
  } else if (isHungryComplaining && isAttentionComplaining) {
    moodCategory = "needs_both";
  } else if (isHungryComplaining) {
    moodCategory = "needs_food";
  } else if (isAttentionComplaining) {
    moodCategory = "needs_attention";
  }

  const isComplaining =
    moodCategory === "needs_food" ||
    moodCategory === "needs_attention" ||
    moodCategory === "needs_both";

  const moodStatus: "happy" | "neutral" | "complaining" = isComplaining
    ? "complaining"
    : "happy";

  const hungerPercent = Math.min(
    100,
    Math.round((fedSlotsToday.length / MAX_DAILY_FEEDS) * 100),
  );
  const attentionPercent = Math.min(
    100,
    Math.round((petCountToday / MAX_DAILY_PETS) * 100),
  );

  // Use hour-based + user-controllable seed so omelan varies naturally without flickering every second
  const seed =
    input.dialogueSeed ??
    now.getDate() * 24 + now.getHours() + fedSlotsToday.length + petCountToday;

  const fallbackDialogue = pickVariedFallbackDialogue({
    moodCategory,
    currentSlot,
    missedMealSlots,
    hoursSinceFed,
    hasUnlockedPet: petEligibility.canPet,
    seed,
  });

  return {
    todayKey,
    currentSlot,
    fedSlotsToday,
    missedMealSlots,
    feedEligibility,
    petEligibility,
    hoursSinceFed,
    hoursSincePetted,
    isHungryComplaining,
    isAttentionComplaining,
    isComplaining,
    isDailyMissionsFulfilled,
    isDailyNeedsFulfilled,
    isEcstatic,
    moodCategory,
    moodStatus,
    hungerPercent,
    attentionPercent,
    fallbackDialogue,
  };
}
