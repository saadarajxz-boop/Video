// Everything layered on top of the full, uncut "Day in the Life" footage.
// Times are seconds into the footage (the video is never cut or reordered).

export const FULL_SOURCE = "footage/day-in-the-life.mov";
// Leveled + loudness-normalized audio (scripts/level_audio.py, npm run level-audio).
export const FULL_AUDIO = "footage/audio-leveled.wav";
export const FULL_DURATION_FRAMES = 21856; // 12:08.5 at 30fps

export const TITLE = { text: "A DAY IN MY LIFE", from: 0.3, to: 4.6 };

// Section titles that slide in at the top left.
export const chapters: { at: number; text: string; big?: boolean }[] = [
  { at: 5.2, text: "Morning routine" },
  { at: 88.9, text: "Breakfast" },
  { at: 236.6, text: "Real talk", big: true },
  { at: 506.8, text: "Gym · Upper day" },
  { at: 619.9, text: "Cardio · 10K steps" },
  { at: 654.5, text: "Protein shake" },
  { at: 688.9, text: "Night skincare" },
];

// Color fixes, switched exactly on scene cuts so they're invisible.
export const grades: { from: number; to: number; filter: string }[] = [
  // Kitchen by the window: highlights blowing out.
  { from: 130.3, to: 179.0, filter: "brightness(0.93) contrast(1.06)" },
  // Car talk: face in shade.
  { from: 233.7, to: 505.5, filter: "brightness(1.12) contrast(1.05)" },
  // Night selfie outside the gym.
  { from: 603.2, to: 610.3, filter: "brightness(1.45) contrast(1.05)" },
  // Basement walk.
  { from: 636.8, to: 654.2, filter: "brightness(1.2)" },
  // Kitchen at night.
  { from: 654.3, to: 694.3, filter: "brightness(1.08)" },
];
export const BASE_FILTER = "contrast(1.04) saturate(1.06)";

// Big quote cards during the car talk, on the empty left side of the frame.
export type Callout = {
  from: number;
  to: number;
  lines: string[];
  // Optional emphasised line (drawn in the accent colour).
  accent?: number;
};

export const callouts: Callout[] = [
  {
    from: 243.1,
    to: 247.3,
    lines: ["Let go of what", "you've been carrying"],
    accent: 0,
  },
  {
    from: 252.4,
    to: 255.4,
    lines: ["I knew I would", "never quit"],
    accent: 1,
  },
  {
    from: 283.5,
    to: 286.6,
    lines: ["How I feel shouldn't", "decide what I do"],
    accent: 1,
  },
  {
    from: 300.0,
    to: 302.5,
    lines: ["Motivation asks:", "Do I feel like", "doing this today?"],
    accent: 0,
  },
  {
    from: 302.5,
    to: 306.3,
    lines: [
      "Discipline asks:",
      "Does the person I want",
      "to become do this today?",
    ],
    accent: 0,
  },
  {
    from: 306.5,
    to: 309.3,
    lines: ["Your feelings were never", "supposed to be your boss"],
    accent: 1,
  },
  {
    from: 320.9,
    to: 325.3,
    lines: ["Another day you", "can never earn back"],
    accent: 1,
  },
  {
    from: 334.0,
    to: 340.2,
    lines: ["A wasted life:", "always about to start"],
    accent: 1,
  },
  {
    from: 359.2,
    to: 364.3,
    lines: ["Can I do this?", "How do I do this?"],
    accent: 1,
  },
  {
    from: 390.0,
    to: 393.5,
    lines: ["Yesterday's dream is", "today's baseline"],
    accent: 1,
  },
  {
    from: 405.0,
    to: 409.0,
    lines: ["Achievement gives direction", "not meaning"],
    accent: 1,
  },
  {
    from: 428.6,
    to: 435.2,
    lines: ["Health · Family", "Friends · God"],
    accent: 1,
  },
  { from: 463.7, to: 467.0, lines: ["Ambition", "needs roots"], accent: 1 },
  {
    from: 474.9,
    to: 478.4,
    lines: ["Achieving everything ≠", "having everything"],
    accent: 1,
  },
  {
    from: 478.5,
    to: 483.4,
    lines: ["Success builds", "the life around you", "not the life inside you"],
    accent: 2,
  },
];

// Follower counter while he talks about growing the account.
export const counter = {
  from: 255.6,
  to: 264.0,
  steps: [
    { at: 255.6, value: "1K" },
    { at: 257.0, value: "10K" },
    { at: 258.0, value: "100K" },
    { at: 262.1, value: "200K" },
  ],
};

// Small info cards (top right) for facts and tips said on camera.
export const infoCards: {
  from: number;
  to: number;
  title: string;
  body: string;
}[] = [
  {
    from: 72.0,
    to: 85.0,
    title: "Pro tip",
    body: "Make your bed → behavioral momentum",
  },
  {
    from: 90.4,
    to: 95.4,
    title: "Breakfast",
    body: "6 eggs + Kodiak Power Cakes",
  },
  { from: 97.7, to: 102.5, title: "Power Cakes", body: "110 cal · 8g protein" },
  { from: 120.2, to: 125.3, title: "Almond milk", body: "35 calories" },
  { from: 182.8, to: 186.9, title: "Water so far", body: "2 liters" },
  { from: 187.9, to: 191.5, title: "Daily water", body: "Men 4L · Women 3L" },
  {
    from: 196.5,
    to: 202.1,
    title: "Electrolytes",
    body: "Sodium · Potassium · Magnesium",
  },
  { from: 620.1, to: 624.9, title: "Cardio", body: "10,000 steps a day" },
  { from: 641.4, to: 646.0, title: "Posting", body: "~20 TikToks a day" },
  {
    from: 659.7,
    to: 684.2,
    title: "Protein shake",
    body: "Berries · almond milk · protein · creatine · cinnamon",
  },
  {
    from: 699.4,
    to: 712.0,
    title: "Skincare",
    body: "Exfoliator → Vitamin C → Moisturizer → Lip balm",
  },
];

export const SUBSCRIBE_AT = 717.8;

// Punch-in zooms during the car talk, centred on his face. Each entry holds
// until the next one; the cut between them is a hard "jump" zoom.
export const FACE = { x: 53, y: 42 }; // % of frame
export const PUNCH_RANGE = { from: 233.7, to: 505.5 };
