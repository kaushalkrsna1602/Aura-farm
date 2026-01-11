/**
 * Reward Icon Utilities
 * 
 * Maps text-based icon names to emoji characters.
 * This handles legacy data where icons were stored as text.
 */

// Icon name to emoji mapping
const ICON_MAP: Record<string, string> = {
    // Food & Drinks
    coffee: "☕",
    pizza: "🍕",
    ice_cream: "🍦",
    cake: "🎂",
    burger: "🍔",
    sushi: "🍣",
    // Nature
    moon: "🌙",
    sun: "☀️",
    star: "⭐",
    fire: "🔥",
    rainbow: "🌈",
    // Activities
    gaming: "🎮",
    movie: "🎬",
    music: "🎵",
    sports: "⚽",
    gym: "💪",
    // Rewards
    gift: "🎁",
    trophy: "🏆",
    medal: "🥇",
    crown: "👑",
    diamond: "💎",
    money: "💰",
    // Time
    clock: "⏰",
    sleep: "😴",
    vacation: "🏖️",
    // Misc
    heart: "❤️",
    thumbsup: "👍",
    party: "🎉",
    rocket: "🚀",
    target: "🎯",
    // Tech / Work
    laptop: "💻",
    computer: "🖥️",
    work: "💼",
};

/**
 * Converts an icon value to an emoji.
 * - If the icon is already an emoji (single character or emoji), returns it as-is.
 * - If the icon is a text name (e.g., "coffee"), maps it to the corresponding emoji.
 * - Falls back to a default star emoji if no match is found.
 */
export function getRewardIcon(icon: string | null | undefined): string {
    if (!icon) return "⭐";

    // Check if it's already an emoji (has emoji-like characters or very short)
    // Emojis are typically 1-2 characters but can be more with modifiers
    if (icon.length <= 4 && /\p{Emoji}/u.test(icon)) {
        return icon;
    }

    // Try to map from text name (case-insensitive)
    const normalizedIcon = icon.toLowerCase().trim().replace(/[_\s-]/g, "");

    // Direct lookup
    if (ICON_MAP[normalizedIcon]) {
        return ICON_MAP[normalizedIcon];
    }

    // Fuzzy match - check if the icon name contains any known key
    for (const [key, emoji] of Object.entries(ICON_MAP)) {
        if (normalizedIcon.includes(key) || key.includes(normalizedIcon)) {
            return emoji;
        }
    }

    // Default fallback
    return "⭐";
}

/**
 * Available icons for the reward icon picker.
 * Returns an array of emoji strings.
 */
export const REWARD_ICON_OPTIONS = [
    "☕", "🎁", "⭐", "🏆", "🎮",
    "🍕", "🎬", "💎", "🌟", "🎯",
    "🍦", "💰", "🎉", "🌙", "❤️",
];
