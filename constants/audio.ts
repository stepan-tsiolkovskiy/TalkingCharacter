// ─── Audio detection ──────────────────────────────────────────────────────────

export const SILENCE_THRESHOLD_DB = -28;
export const MIN_RECORDING_DURATION_MS = 300;
export const MICROPHONE_WARMUP_MS = 500;
export const SILENCE_DURATION_MS = 1000;
export const PITCH_RATE = 1.4;
export const METERING_INTERVAL_MS = 100;

/** Below microphone floor — used as initial and reset value for metering state. */
export const DB_SILENCE = -160;

/**
 * dB floor for normalization (maps to 0 on the UI scale).
 * Both the volume bar in App and VolumeIndicator use this range.
 */
export const DB_RANGE_MIN = -60;

// ─── Rive ─────────────────────────────────────────────────────────────────────

export const RIVE_STATE_MACHINE = 'State Machine 1';
export const RIVE_INPUTS = {
  hear: 'Hear',
  talk: 'Talk',
} as const;

export const RIVE_URL =
  'https://public.rive.app/community/runtime-files/5628-11215-wave-hear-and-talk.riv';

// ─── Shared layout sizes ──────────────────────────────────────────────────────

/** Width/height of the Rive animation and its error placeholder. */
export const RIVE_CHARACTER_SIZE = 300;

/** Outer character container and VolumeIndicator pulse circle. */
export const CHARACTER_CONTAINER_SIZE = 320;

// ─── Shared UI colours ────────────────────────────────────────────────────────

export const COLOR_TEAL = '#4ECDC4';
export const COLOR_BACKGROUND = '#1a1a2e';

// ─── Intro animation ─────────────────────────────────────────────────────────

/** How long to wait after onRiveReady before enabling the UI (wave animation). */
export const WAVE_ANIMATION_DURATION_MS = 2000;

// ─── Volume indicator spring animation ───────────────────────────────────────

export const VOLUME_SCALE_BASE = 1.0;
export const VOLUME_SCALE_DELTA = 0.8;
export const VOLUME_SPRING_SPEED = 30;
export const VOLUME_SPRING_BOUNCINESS = 2;

// ─── Playback tail ────────────────────────────────────────────────────────────

/** Delay after playback completes before starting a new recording session. */
export const PLAYBACK_TAIL_MS = 300;
