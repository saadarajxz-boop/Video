// Prints the trailer's cue sheet (cut times, dialogue windows, drop) as JSON
// for scripts/make_score.py, so the score always matches the edit.
import {
  defaultShots,
  defaultVoiceovers,
  FPS,
  shotStarts,
  totalDuration,
} from "../src/Trailer/shots.ts";

const sec = (f: number) => Math.round((f / FPS) * 1000) / 1000;
const starts = shotStarts(defaultShots);
const heroIndex = defaultShots.findIndex((s) => s.hero);
// The build starts on the car line and runs into the drop.
const buildIndex = defaultShots.findIndex((s) => s.caption?.includes("gym"));

const duck = [
  ...defaultShots.flatMap((s, i) =>
    s.voice ? [[sec(starts[i]), sec(starts[i] + s.durationInFrames)]] : [],
  ),
  ...defaultVoiceovers.map((v) => [
    sec(v.from),
    sec(v.from + v.durationInFrames),
  ]),
];

console.log(
  JSON.stringify(
    {
      duration: sec(totalDuration(defaultShots)),
      cuts: starts.slice(1).map(sec),
      build: [sec(starts[buildIndex]), sec(starts[heroIndex])],
      hero: sec(starts[heroIndex]),
      end: sec(starts[starts.length - 1]),
      braams: [0],
      duck,
    },
    null,
    2,
  ),
);
