/**
 * Every Sky Drop gameplay number lives here, so balancing the game never means hunting through code.
 * Distances are design units (720×1280 space), times are seconds, speeds are units per second.
 */

// ---------- world layout ----------

/** Y of the ground line: where the player's feet stand. */
export const GROUND_Y = 1180;

/** Background tiles are 512 px; drawn at this scale. */
export const BG_TILE_SCALE = 1.25;
/** Top of the hills/trees band. The clouds band sits right above it, sky above that, grass below. */
export const BG_TREES_TOP_Y = 605;
/** Cloud drift speed (parallax), units per second. */
export const BG_CLOUD_SPEED = 14;

// ---------- player ----------

/** Player top speed. */
export const PLAYER_SPEED = 900;
/** Half the player's visible width, used to keep her fully inside the design area. */
export const PLAYER_HALF_WIDTH = 60;
/** Walk cycle frame rate (8 frames). */
export const PLAYER_WALK_FPS = 14;
/** Cheer frame rate (2 frames). */
export const PLAYER_CHEER_FPS = 6;
/** How long the hurt face shows after a bomb. */
export const PLAYER_HURT_SECONDS = 0.45;
/** How long she cheers after catching a star. */
export const PLAYER_CHEER_SECONDS = 0.8;
/** Bombs can't hurt her again for this long after a hit. */
export const PLAYER_INVULNERABLE_SECONDS = 1.3;
/** Blinks per second while invulnerable. */
export const PLAYER_BLINK_HZ = 12;
/** How high she hops when she dies. */
export const PLAYER_DEATH_HOP = 170;
/** The fallDown frame's head stops above the feet line; sink her this much so she lies on the ground. */
export const PLAYER_DEAD_SINK = 16;

/**
 * Catch box, relative to her feet. Generous on purpose: catching should feel easy,
 * bombs use a smaller radius instead (see items.ts) so dodging feels fair.
 */
export const CATCH_HALF_WIDTH = 62;
export const CATCH_TOP = 205; // units above the feet
export const CATCH_BOTTOM = 45; // units above the feet

// ---------- rules ----------

export const START_LIVES = 3;
/** Every this-many catches in a row adds 1 to the multiplier (5 → ×2, 10 → ×3 …). */
export const COMBO_STEP = 5;
export const COMBO_MAX_MULTIPLIER = 5;

// ---------- items & difficulty ----------

export const ITEM_SCALE = 0.85;
/** Fall speed at the start and once difficulty is maxed. */
export const FALL_SPEED_START = 280;
export const FALL_SPEED_END = 640;
/** ±fraction of random variation per item, so items don't fall in lockstep. */
export const FALL_SPEED_JITTER = 0.12;
/** Seconds between spawns at the start and at max difficulty. */
export const SPAWN_INTERVAL_START = 0.9;
export const SPAWN_INTERVAL_END = 0.36;
/** Seconds of play until difficulty reaches its max. */
export const DIFFICULTY_RAMP_SECONDS = 120;
/** Chance that a spawn is a bomb, at the start and at max difficulty. */
export const BOMB_CHANCE_START = 0.12;
export const BOMB_CHANCE_END = 0.32;
/** Items spawn at least this far from the left/right edge. */
export const SPAWN_MARGIN_X = 60;
/** Items spawn this far above the top of the visible area. */
export const SPAWN_ABOVE = 80;
/** An item whose centre passes this Y has hit the ground. */
export const MISS_Y = GROUND_Y - 20;

/** Coin spin, radians per second. */
export const COIN_SPIN_SPEED = 6;
/** Width of a coin's side frame compared to its front (32 / 75 px): below this, show the side frame. */
export const COIN_SIDE_RATIO = 32 / 75;
/** Bomb fuse blinks per second. */
export const BOMB_BLINK_HZ = 4;

// ---------- game feel ----------

/** Seconds between dying and the game-over screen. */
export const DEATH_DELAY_SECONDS = 1.6;
export const SHAKE_MAX_OFFSET = 24;
export const SHAKE_DECAY_PER_SECOND = 1.5;
export const SHAKE_BOMB_HIT = 0.8;
export const SHAKE_DEATH = 1;

export const PARTICLE_GRAVITY = 1400;
export const PARTICLE_LIFE = 0.6;
export const SPARKLE_COUNT = 10;
export const SPARKLE_SPEED = 380;
export const EXPLOSION_COUNT = 26;
export const EXPLOSION_SPEED = 620;
export const PUFF_COUNT = 6;
export const PUFF_SPEED = 160;

export const POPUP_RISE = 130;
export const POPUP_SECONDS = 0.8;

// ---------- HUD ----------

/** Gap between the safe area's edge and the HUD. */
export const HUD_MARGIN = 26;
export const HUD_HEART_SCALE = 0.55;
export const HUD_HEART_SPACING = 54;
export const HUD_DIGIT_SCALE = 0.6;
/** Digit spacing in texture pixels (the glyphs are ~64 px wide inside 128 px frames). */
export const HUD_DIGIT_ADVANCE = 58;
export const HUD_COMBO_SCALE = 0.48;
export const HUD_BUTTON_SIZE = 84;

// ---------- persistence ----------

export const STORAGE_BEST = "skydrop.best";
export const STORAGE_MUTED = "skydrop.muted";
