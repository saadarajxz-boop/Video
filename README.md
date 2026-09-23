# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

## "Day in the Life" trailer

Two compositions share one edit (`src/Trailer/shots.ts`), both ~20s at 30fps:

- `Trailer`: 1080×1920 for TikTok / Reels. The footage keeps its original 16:9 framing in a band across the middle, over a blurred copy of itself; the title sits above it and captions below, all inside the platform safe zone.
- `TrailerWide`: 1920×1080, the footage's original format.

The sound is an original score synthesized by `scripts/make_score.py` (no copyrighted music), timed to the edit's cut sheet, and ducked under the lines of dialogue kept from the footage.

1. Put the footage at `public/footage/day-in-the-life.mov` (git-ignored; it is ~1 GB).
2. After changing the edit, regenerate the score: `npm run score` (needs Python with numpy).
3. Render: `npm run render:trailer` → `out/trailer.mp4`, `npm run render:trailer-wide` → `out/trailer-wide.mp4`.

## Full video edit (`FullVideo`)

The complete 12-minute video, **uncut and in original order**, with everything layered on top:

- Word-by-word captions (`src/FullVideo/captions.json`, built from `scripts/transcript.json` by `npm run captions`).
- Jump-zoom punch-ins on sentence starts during the car talk.
- Quote cards for key lines, a follower counter, info cards for facts/tips, section titles, an opening title and a subscribe button.
- Color fixes per section (switched on scene cuts) and leveled, loudness-normalized audio (`scripts/level_audio.py`, target -14 LUFS).

Edit the overlays in `src/FullVideo/edit.ts`. Render with `npm run render:full` → `out/day-in-the-life-final.mp4` (the last step re-muxes the leveled audio directly, which keeps it sample-aligned with the picture).
