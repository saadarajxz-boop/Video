import { z } from "zod";

export const FPS = 30;

export const shotSchema = z.object({
  // Path inside public/. Falls back to the trailer's `source` when omitted.
  src: z.string().optional(),
  // Where in the source clip this shot starts, in seconds.
  startAt: z.number().min(0),
  durationInFrames: z.number().int().positive(),
  // Subtle push-in (1) or pull-out (-1).
  zoom: z.union([z.literal(1), z.literal(-1)]).default(1),
  // Horizontal crop focus in % (0 = left edge, 100 = right edge) for
  // landscape footage cropped to 9:16.
  focusX: z.number().min(0).max(100).default(50),
});

export const trailerSchema = z.object({
  // Main footage file inside public/, e.g. "footage/day-in-the-life.mp4".
  // Leave empty to preview the edit with placeholder frames.
  source: z.string(),
  // Keep the original footage audio. Off by default: hard cuts make it choppy.
  sourceAudio: z.boolean(),
  showSafeZone: z.boolean(),
  titleText: z.string(),
  endText: z.string(),
  shots: z.array(shotSchema).min(3),
});

export type Shot = z.infer<typeof shotSchema>;
export type TrailerProps = z.infer<typeof trailerSchema>;

export const FOOTAGE = "footage/day-in-the-life.mov";

// Selects from the 12-minute "Day in the Life" footage, in story order:
// morning → kitchen → car → gym (cuts tighten) → hero pose → night → end card.
// startAt is seconds into the footage; focusX keeps the subject in the 9:16 crop.
const selects: [startAt: number, durationInFrames: number, focusX: number][] = [
  [0.5, 60, 50], // waking up in bed (title card)
  [17.5, 30, 53], // brushing teeth
  [131.2, 24, 55], // mixing the pancake batter
  [164.6, 24, 57], // cracking eggs over the pan
  [168.3, 21, 53], // overhead: eggs in the pan
  [175.2, 21, 57], // pouring pancake batter
  [216.0, 18, 32], // overhead: pancake in the pan
  [505.5, 24, 42], // flexing in the car
  [508.2, 18, 50], // gym: incline press, wide
  [515.0, 15, 38], // gym: plate-loaded row
  [521.0, 15, 32], // gym: pulldown
  [534.0, 12, 50], // gym: lateral raises
  [540.6, 12, 57], // gym: shoulder press
  [558.0, 12, 40], // gym: cable triceps
  [574.5, 12, 43], // gym: incline curls
  [582.5, 12, 50], // gym: preacher curls
  [588.1, 60, 40], // hero: double-bicep pose (flash lands here)
  [602.0, 24, 53], // back pose
  [608.6, 18, 65], // laughing on the way home
  [687.0, 18, 57], // night smoothie
  [545.0, 87, 50], // end card over the moody gym back shot
];

export const defaultShots: Shot[] = selects.map(
  ([startAt, durationInFrames, focusX], i) => ({
    startAt,
    durationInFrames,
    focusX,
    zoom: i % 2 === 0 ? 1 : -1,
  }),
);

export const totalDuration = (shots: Shot[]) =>
  shots.reduce((sum, s) => sum + s.durationInFrames, 0);
