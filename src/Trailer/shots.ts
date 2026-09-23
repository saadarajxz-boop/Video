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

// Edit rhythm for an 18s trailer: a held opener under the title, cuts that
// get shorter as the build climbs, one held hero shot, then the end card.
// The `startAt` values are placeholders until the footage has been reviewed.
const rhythm = [
  60, 36, 33, 30, 27, 24, 21, 18, 18, 15, 15, 12, 12, 60, 24, 21, 18, 90,
];

export const defaultShots: Shot[] = rhythm.map((durationInFrames, i) => ({
  startAt: i * 4,
  durationInFrames,
  zoom: i % 2 === 0 ? 1 : -1,
  focusX: 50,
}));

export const totalDuration = (shots: Shot[]) =>
  shots.reduce((sum, s) => sum + s.durationInFrames, 0);
