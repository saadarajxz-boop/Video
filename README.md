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

## "Day in the Life" trailer (9:16)

The `Trailer` composition is an ~18s vertical trailer (1080×1920, 30fps) for TikTok / Reels:
"A DAY IN MY LIFE" title → accelerating cuts with subtle zooms → hero shot → "FULL VIDEO OUT NOW." end card.
All text stays inside the TikTok/Reels safe zone (toggle `showSafeZone` in the Studio to see it). No music is added.

1. Put the footage at `public/footage/day-in-the-life.mov` (git-ignored; it is ~1 GB).
2. In the Studio (`npm run dev`), set `source` and tune each shot's `startAt` (seconds), `durationInFrames`, `zoom` and `focusX`.
3. Render: `npm run render:trailer` → `out/trailer.mp4`.
