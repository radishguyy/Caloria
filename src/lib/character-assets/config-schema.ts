/**
 * Caloria Character & Avatar Customization Configuration Schema & Adapters
 *
 * Provides:
 * 1. Conceptual schema support:
 *    {
 *      "characterId": "flameling",
 *      "colors": {
 *        "body": "#FF6B5B",
 *        "accent": "#FF9F43"
 *      },
 *      "accessoryIds": ["acc-round-glasses", "acc-lettuce-leaf-hat"]
 *    }
 * 2. Detailed avatar composition schema with validation, sanitization,
 *    and conflict resolution.
 * 3. Bidirectional converters between persistent store state (Zustand)
 *    and serialized configuration schemas.
 */

import {
  CharacterId,
  CharacterColorPalette,
} from "./types";
import {
  ALL_CHARACTER_IDS,
  getCharacterDefinition,
  getAccessoryDefinition,
  isAccessoryCompatible,
  DEFAULT_CHARACTER_COMPOSITIONS,
} from "./catalog";

/**
 * Conceptual schema format requested by specification.
 */
export interface ConceptualAvatarConfig {
  characterId: string;
  name?: string;
  colors?: {
    body?: string;
    accent?: string;
    belly?: string;
    innerEar?: string;
  };
  accessoryIds?: string[];
}

/**
 * Full internal composition state used during customization.
 */
export interface AvatarCustomizationState {
  characterId: CharacterId;
  name: string;
  colors: Partial<CharacterColorPalette>;
  earsVariant?: CharacterId;
  tailVariant?: CharacterId;
  faceVariant?: CharacterId;
  equipped: {
    head: string;
    glasses: string;
    body: string;
    held: string;
    skin: string;
    room: string;
  };
}

export interface ValidationFeedback {
  isValid: boolean;
  warnings: string[];
  incompatibleAccessoriesRemoved: string[];
}

/**
 * Validates a character ID, falling back safely to "flameling" if missing or invalid.
 */
export function sanitizeCharacterId(id: unknown): CharacterId {
  if (typeof id === "string" && ALL_CHARACTER_IDS.includes(id as CharacterId)) {
    return id as CharacterId;
  }
  return "flameling";
}

/**
 * Maps conceptual "body" and "accent" keys to CSS custom property tokens.
 */
export function normalizeColorTokens(
  colors?: Partial<CharacterColorPalette> & {
    body?: string;
    accent?: string;
  }
): Partial<CharacterColorPalette> {
  if (!colors) return {};
  const normalized: Partial<CharacterColorPalette> = { ...colors };

  if (colors.body && !normalized.primary) {
    normalized.primary = colors.body;
  }
  if (colors.accent && !normalized.secondary) {
    normalized.secondary = colors.accent;
  }
  return normalized;
}

/**
 * Converts a list of accessory IDs into category slots (`head`, `glasses`, `body`, `held`, `skin`, `room`).
 * Automatically resolves conflicts:
 * - Only 1 primary hat (head)
 * - Glasses coexist in their own slot
 * - 1 held food object
 * - 1 body outfit/cape
 */
export function convertAccessoryIdsToEquipped(
  accessoryIds: string[] = []
): {
  head: string;
  glasses: string;
  body: string;
  held: string;
  skin: string;
  room: string;
} {
  const result = {
    head: "head-none",
    glasses: "glasses-none",
    body: "body-none",
    held: "held-none",
    skin: "skin-default",
    room: "room-default",
  };

  for (const rawId of accessoryIds) {
    if (!rawId) continue;
    const acc = getAccessoryDefinition(rawId);
    if (acc) {
      if (acc.category === "head") result.head = acc.id;
      else if (acc.category === "glasses") result.glasses = acc.id;
      else if (acc.category === "body") result.body = acc.id;
      else if (acc.category === "held") result.held = acc.id;
      else if (acc.category === "skin") result.skin = acc.id;
      else if (acc.category === "room") result.room = acc.id;
      continue;
    }

    // Handle legacy cosmetic catalog IDs
    if (rawId.startsWith("head-")) result.head = rawId;
    else if (rawId.startsWith("glasses-")) result.glasses = rawId;
    else if (rawId.startsWith("body-")) result.body = rawId;
    else if (rawId.startsWith("held-")) result.held = rawId;
    else if (rawId.startsWith("skin-")) result.skin = rawId;
    else if (rawId.startsWith("room-")) result.room = rawId;
  }

  return result;
}

/**
 * Converts equipped category slots back to a compact list of active accessory IDs.
 */
export function convertEquippedToAccessoryIds(equipped: {
  head?: string | null;
  glasses?: string | null;
  body?: string | null;
  held?: string | null;
  skin?: string | null;
  room?: string | null;
}): string[] {
  const activeIds: string[] = [];
  const entries = Object.entries(equipped);

  for (const [, id] of entries) {
    if (!id) continue;
    // Exclude empty default slots
    if (
      id === "head-none" ||
      id === "glasses-none" ||
      id === "body-none" ||
      id === "held-none" ||
      id === "skin-default" ||
      id === "room-default"
    ) {
      continue;
    }
    activeIds.push(id);
  }

  return activeIds;
}

/**
 * Verifies compatibility of equipped items against the active character ID.
 * Removes any incompatible accessories and returns feedback.
 */
export function sanitizeEquippedForCharacter(
  characterId: CharacterId,
  equipped: AvatarCustomizationState["equipped"]
): {
  sanitized: AvatarCustomizationState["equipped"];
  removedItems: { slot: string; id: string; name: string }[];
} {
  const sanitized = { ...equipped };
  const removedItems: { slot: string; id: string; name: string }[] = [];

  const slots: (keyof typeof sanitized)[] = [
    "head",
    "glasses",
    "body",
    "held",
    "skin",
    "room",
  ];

  for (const slot of slots) {
    const itemId = sanitized[slot];
    if (
      !itemId ||
      itemId.endsWith("-none") ||
      itemId === "skin-default" ||
      itemId === "room-default"
    ) {
      continue;
    }

    if (!isAccessoryCompatible(characterId, itemId)) {
      const def = getAccessoryDefinition(itemId);
      removedItems.push({
        slot,
        id: itemId,
        name: def?.name || itemId,
      });
      sanitized[slot] = `${slot}-none`;
    }
  }

  return { sanitized, removedItems };
}

/**
 * Creates a complete default avatar state for a character.
 */
export function getDefaultAvatarState(
  characterId: CharacterId
): AvatarCustomizationState {
  const def = getCharacterDefinition(characterId);
  const comp = DEFAULT_CHARACTER_COMPOSITIONS[characterId];

  return {
    characterId,
    name: def.defaultNickname,
    colors: {},
    earsVariant: undefined,
    tailVariant: undefined,
    faceVariant: undefined,
    equipped: {
      head: comp?.equippedAccessories?.head || "head-none",
      glasses: comp?.equippedAccessories?.glasses || "glasses-none",
      body: comp?.equippedAccessories?.body || "body-none",
      held: comp?.equippedAccessories?.held || "held-none",
      skin: comp?.equippedAccessories?.skin || "skin-default",
      room: comp?.equippedAccessories?.room || "room-default",
    },
  };
}

/**
 * Exports current customization state to the canonical conceptual format.
 */
export function exportConceptualConfig(
  state: AvatarCustomizationState
): ConceptualAvatarConfig {
  const charDef = getCharacterDefinition(state.characterId);
  const primary = state.colors.primary || charDef.defaultColors.primary;
  const secondary = state.colors.secondary || charDef.defaultColors.secondary;

  return {
    characterId: state.characterId,
    name: state.name,
    colors: {
      body: primary,
      accent: secondary,
      belly: state.colors.belly || charDef.defaultColors.belly,
      innerEar: state.colors.innerEar || charDef.defaultColors.innerEar,
    },
    accessoryIds: convertEquippedToAccessoryIds(state.equipped),
  };
}

/**
 * Imports a conceptual configuration into an AvatarCustomizationState.
 */
export function importConceptualConfig(
  config: ConceptualAvatarConfig
): AvatarCustomizationState {
  const characterId = sanitizeCharacterId(config.characterId);
  const charDef = getCharacterDefinition(characterId);
  const normalizedColors = normalizeColorTokens(config.colors);
  const equipped = convertAccessoryIdsToEquipped(config.accessoryIds || []);
  const { sanitized } = sanitizeEquippedForCharacter(characterId, equipped);

  return {
    characterId,
    name: config.name || charDef.defaultNickname,
    colors: normalizedColors,
    earsVariant: undefined,
    tailVariant: undefined,
    faceVariant: undefined,
    equipped: sanitized,
  };
}
