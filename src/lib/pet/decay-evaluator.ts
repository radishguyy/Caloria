/**
 * Evaluates dynamic pet condition based on last feeding timestamp:
 * - 20-Hour Mood Degradation: switches to 'complaining' if hoursSinceFed >= 20
 * - Gradual EXP Decay: deducts 2 EXP per hour overdue beyond 20h
 * - Level Floor Guard: EXP never drops below 0 for the active level
 */

export interface PetConditionResult {
  isComplaining: boolean;
  currentMood: "happy" | "complaining";
  adjustedExp: number;
  hoursSinceFed: number;
  hoursOverdue: number;
  expPenalty: number;
  dialogueMessage: string;
}

export function evaluatePetCondition(
  pet: {
    lastFedAt: Date | string | null | undefined;
    exp: number;
    level: number;
    moodStatus?: string;
  },
  currentDate?: Date,
): PetConditionResult {
  const now = currentDate ?? new Date();
  const lastFedDate = pet.lastFedAt ? new Date(pet.lastFedAt) : now;
  const timeDiffMs = Math.max(0, now.getTime() - lastFedDate.getTime());
  const hoursSinceFed = timeDiffMs / (1000 * 60 * 60);
  const roundedHoursSinceFed = Math.floor(hoursSinceFed);

  if (hoursSinceFed >= 20) {
    const hoursOverdue = Math.floor(hoursSinceFed - 20);
    const expPenalty = hoursOverdue * 2; // -2 EXP per hour overdue
    const newExp = Math.max(0, pet.exp - expPenalty);

    const dialogueMessage =
      roundedHoursSinceFed >= 24
        ? `Perutku keroncongan... sudah ${roundedHoursSinceFed} jam belum makan 🥺`
        : hoursOverdue > 0
          ? `Badanku lemas sekali... tolong beri aku makan! (-${expPenalty} EXP)`
          : "Perutku keroncongan... Aku belum makan selama 20 jam 🥺";

    return {
      isComplaining: true,
      currentMood: "complaining",
      adjustedExp: newExp,
      hoursSinceFed: roundedHoursSinceFed,
      hoursOverdue,
      expPenalty,
      dialogueMessage,
    };
  }

  const happyMessages = [
    "Calpal kenyang & penuh energi! ✨",
    "Yuk catat makananmu hari ini! 🥗",
    "Semangat mencapai target nutrisi! 🔥",
  ];
  const dialogueMessage =
    happyMessages[Math.floor(Math.random() * happyMessages.length)];

  return {
    isComplaining: false,
    currentMood: "happy",
    adjustedExp: pet.exp,
    hoursSinceFed: roundedHoursSinceFed,
    hoursOverdue: 0,
    expPenalty: 0,
    dialogueMessage,
  };
}
