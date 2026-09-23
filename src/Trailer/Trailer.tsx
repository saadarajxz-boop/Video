import "@fontsource/anton/400.css";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Shot, shotStarts, TrailerProps, Voiceover } from "./shots";

const FONT = "Anton, Impact, 'Arial Black', sans-serif";
const CAPTION_FONT = "'Helvetica Neue', Arial, sans-serif";

// TikTok / Reels overlay their UI on the top ~210px, the bottom ~480px and a
// ~150px column on the right. Everything important stays inside this box.
const SAFE = { top: 210, bottom: 480, left: 150, right: 150 };

// The footage keeps its original 16:9 framing. On a vertical canvas it sits in
// a band across the middle, over a blurred, darkened copy of itself.
const useLayout = () => {
  const { width, height } = useVideoConfig();
  const vertical = height > width;
  const bandHeight = vertical ? Math.round((width * 9) / 16) : height;
  const bandTop = Math.round((height - bandHeight) / 2);
  return { vertical, width, height, bandHeight, bandTop };
};

const ShotView: React.FC<{ shot: Shot; source: string }> = ({
  shot,
  source,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { vertical, bandHeight, bandTop } = useLayout();
  const d = shot.durationInFrames;
  const [from, to] = shot.zoom === 1 ? [1.0, 1.05] : [1.05, 1.0];
  const scale = interpolate(frame / d, [0, 1], [from, to], {
    easing: Easing.out(Easing.quad),
  });
  const src = staticFile(shot.src ?? source);
  const startFrom = Math.round(shot.startAt * fps);
  // Short fades on the voice so hard cuts don't click.
  const voiceVolume = (f: number) =>
    interpolate(f, [0, 1, d - 4, d], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) * shot.voiceGain;

  return (
    <AbsoluteFill>
      {vertical ? (
        <AbsoluteFill style={{ transform: "scale(1.15)" }}>
          <OffthreadVideo
            src={src}
            startFrom={startFrom}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(40px) brightness(0.35)",
            }}
          />
        </AbsoluteFill>
      ) : null}
      <div
        style={{
          position: "absolute",
          top: bandTop,
          left: 0,
          right: 0,
          height: bandHeight,
          overflow: "hidden",
          boxShadow: vertical ? "0 30px 80px rgba(0,0,0,0.6)" : undefined,
        }}
      >
        <OffthreadVideo
          src={src}
          startFrom={startFrom}
          muted={!shot.voice}
          volume={voiceVolume}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `scale(${scale})`,
            filter: "contrast(1.08) saturate(1.05)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// Soft vignette over the footage band.
const Grade: React.FC = () => {
  const { bandTop, bandHeight } = useLayout();
  return (
    <div
      style={{
        position: "absolute",
        top: bandTop,
        left: 0,
        right: 0,
        height: bandHeight,
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)",
      }}
    />
  );
};

const headline: React.CSSProperties = {
  fontFamily: FONT,
  color: "white",
  textTransform: "uppercase",
  lineHeight: 0.95,
  textShadow: "0 6px 30px rgba(0,0,0,0.6)",
  margin: 0,
  textAlign: "center",
};

// Title sits in the empty space above the footage on vertical, or over the
// middle of the frame on landscape.
const TitleCard: React.FC<{ text: string; duration: number }> = ({
  text,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { vertical, bandTop } = useLayout();
  const enter = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  const exit = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tracking = interpolate(frame, [0, duration], [28, 10]);
  const words = text.split(" ");
  const lastWords = words.slice(-2).join(" ");
  const firstWords = words.slice(0, -2).join(" ");
  const box: React.CSSProperties = vertical
    ? { top: SAFE.top, height: bandTop - SAFE.top, left: 0, right: 0 }
    : { top: 0, bottom: 0, left: 0, right: 0 };

  return (
    <div
      style={{
        position: "absolute",
        ...box,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity: enter * exit,
          transform: `scale(${1.15 - 0.15 * enter})`,
        }}
      >
        {firstWords ? (
          <p
            style={{
              ...headline,
              fontSize: vertical ? 80 : 90,
              letterSpacing: tracking,
            }}
          >
            {firstWords}
          </p>
        ) : null}
        <p
          style={{
            ...headline,
            fontSize: vertical ? 150 : 180,
            letterSpacing: tracking / 2,
          }}
        >
          {lastWords}
        </p>
      </div>
    </div>
  );
};

// Subtitle for the lines of dialogue kept from the footage.
const Caption: React.FC<{ text: string; duration: number }> = ({
  text,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { vertical, bandTop, bandHeight, height } = useLayout();
  const opacity = interpolate(
    frame,
    [0, 4, duration - 4, duration],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const top = vertical ? bandTop + bandHeight + 40 : height - 190;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: SAFE.left,
        right: SAFE.right,
        display: "flex",
        justifyContent: "center",
        opacity,
      }}
    >
      <p
        style={{
          fontFamily: CAPTION_FONT,
          fontWeight: 800,
          fontSize: vertical ? 50 : 54,
          lineHeight: 1.2,
          color: "white",
          textAlign: "center",
          margin: 0,
          padding: "10px 22px",
          borderRadius: 14,
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
      >
        {text}
      </p>
    </div>
  );
};

const EndCard: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { vertical } = useLayout();
  const dim = interpolate(frame, [0, 12], [0, 0.7], {
    extrapolateRight: "clamp",
  });
  const lines = text.split(/\s+(?=OUT\b)/i);

  return (
    <>
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${dim})` }} />
      <AbsoluteFill
        style={{
          paddingTop: vertical ? SAFE.top : 0,
          paddingBottom: vertical ? SAFE.bottom : 0,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {lines.map((line, i) => {
          const pop = spring({
            frame: frame - 6 - i * 8,
            fps,
            config: { damping: 14, stiffness: 180 },
          });
          return (
            <p
              key={line}
              style={{
                ...headline,
                fontSize: i === 0 ? 150 : 120,
                letterSpacing: 4,
                opacity: Math.min(1, pop),
                transform: `scale(${interpolate(pop, [0, 1], [1.4, 1])})`,
              }}
            >
              {line}
            </p>
          );
        })}
      </AbsoluteFill>
    </>
  );
};

// A 3-frame white flash that lands on the cut into the hero shot.
const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 3], [0.7, 0], {
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ backgroundColor: "white", opacity }} />;
};

const SafeZoneGuide: React.FC = () => (
  <AbsoluteFill
    style={{
      top: SAFE.top,
      bottom: SAFE.bottom,
      left: SAFE.left,
      right: SAFE.right,
      width: "auto",
      height: "auto",
      border: "4px dashed rgba(255,0,80,0.8)",
    }}
  />
);

// A line of dialogue from elsewhere in the footage, laid over the current shots.
const VoiceoverLine: React.FC<{ line: Voiceover; source: string }> = ({
  line,
  source,
}) => {
  const { fps } = useVideoConfig();
  const d = line.durationInFrames;
  return (
    <>
      <Audio
        src={staticFile(source)}
        startFrom={Math.round(line.startAt * fps)}
        volume={(f) =>
          interpolate(f, [0, 1, d - 4, d], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <Caption text={line.caption} duration={d} />
    </>
  );
};

export const Trailer: React.FC<TrailerProps> = ({
  source,
  score,
  showSafeZone,
  titleText,
  endText,
  shots,
  voiceovers,
}) => {
  const { durationInFrames } = useVideoConfig();
  const starts = shotStarts(shots);
  const heroIndex = shots.findIndex((s) => s.hero);
  const endStart = starts[shots.length - 1];
  const fadeOut = interpolate(
    useCurrentFrame(),
    [durationInFrames - 10, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {shots.map((shot, i) => (
        <Sequence
          key={i}
          from={starts[i]}
          durationInFrames={shot.durationInFrames}
          premountFor={30}
        >
          <ShotView shot={shot} source={source} />
        </Sequence>
      ))}
      <Grade />
      {shots.map((shot, i) =>
        shot.caption ? (
          <Sequence
            key={`c${i}`}
            from={starts[i]}
            durationInFrames={shot.durationInFrames}
          >
            <Caption text={shot.caption} duration={shot.durationInFrames} />
          </Sequence>
        ) : null,
      )}
      {voiceovers.map((line, i) => (
        <Sequence
          key={`v${i}`}
          from={line.from}
          durationInFrames={line.durationInFrames}
        >
          <VoiceoverLine line={line} source={source} />
        </Sequence>
      ))}
      <Sequence durationInFrames={shots[0].durationInFrames}>
        <TitleCard text={titleText} duration={shots[0].durationInFrames} />
      </Sequence>
      {heroIndex > 0 ? (
        <Sequence from={starts[heroIndex]} durationInFrames={4}>
          <Flash />
        </Sequence>
      ) : null}
      <Sequence from={endStart}>
        <EndCard text={endText} />
      </Sequence>
      <AbsoluteFill style={{ backgroundColor: "black", opacity: fadeOut }} />
      {score ? <Audio src={staticFile(score)} /> : null}
      {showSafeZone ? <SafeZoneGuide /> : null}
    </AbsoluteFill>
  );
};
