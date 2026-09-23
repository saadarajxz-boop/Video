import "@fontsource/anton/400.css";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Shot, TrailerProps } from "./shots";

const FONT = "Anton, Impact, 'Arial Black', sans-serif";

// TikTok / Reels overlay their UI on the top ~210px, the bottom ~480px and a
// ~150px column on the right. Everything important stays inside this box.
const SAFE = { top: 210, bottom: 480, left: 150, right: 150 };

const ShotView: React.FC<{
  shot: Shot;
  index: number;
  source: string;
  sourceAudio: boolean;
}> = ({ shot, index, source, sourceAudio }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = frame / shot.durationInFrames;
  const [from, to] = shot.zoom === 1 ? [1.0, 1.08] : [1.08, 1.0];
  const scale = interpolate(progress, [0, 1], [from, to], {
    easing: Easing.out(Easing.quad),
  });
  const src = shot.src ?? source;

  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {src ? (
        <OffthreadVideo
          src={staticFile(src)}
          startFrom={Math.round(shot.startAt * fps)}
          muted={!sourceAudio}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: `${shot.focusX}% 50%`,
          }}
        />
      ) : (
        <Placeholder index={index} />
      )}
    </AbsoluteFill>
  );
};

const Placeholder: React.FC<{ index: number }> = ({ index }) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(160deg, hsl(${(index * 37) % 360} 30% 22%), hsl(${(index * 37 + 60) % 360} 35% 10%))`,
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 560,
      color: "rgba(255,255,255,0.35)",
      fontFamily: "sans-serif",
      fontSize: 40,
      letterSpacing: 6,
    }}
  >
    SHOT {index + 1}
  </AbsoluteFill>
);

// Cinematic grade: a little contrast, a soft vignette and a darker top/bottom.
const Grade: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
    }}
  />
);

const TextBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      paddingTop: SAFE.top,
      paddingBottom: SAFE.bottom,
      paddingLeft: SAFE.left,
      paddingRight: SAFE.right,
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    {children}
  </AbsoluteFill>
);

const headline: React.CSSProperties = {
  fontFamily: FONT,
  color: "white",
  textTransform: "uppercase",
  lineHeight: 0.95,
  textShadow: "0 6px 30px rgba(0,0,0,0.6)",
  margin: 0,
};

const TitleCard: React.FC<{ text: string; duration: number }> = ({
  text,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const exit = interpolate(frame, [duration - 8, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tracking = interpolate(frame, [0, duration], [28, 10]);
  const words = text.split(" ");
  const lastWords = words.slice(-2).join(" ");
  const firstWords = words.slice(0, -2).join(" ");

  return (
    <TextBlock>
      <div
        style={{
          opacity: enter * exit,
          transform: `scale(${1.15 - 0.15 * enter})`,
        }}
      >
        {firstWords ? (
          <p style={{ ...headline, fontSize: 88, letterSpacing: tracking }}>
            {firstWords}
          </p>
        ) : null}
        <p style={{ ...headline, fontSize: 176, letterSpacing: tracking / 2 }}>
          {lastWords}
        </p>
      </div>
    </TextBlock>
  );
};

const EndCard: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dim = interpolate(frame, [0, 12], [0, 0.6], {
    extrapolateRight: "clamp",
  });
  const lines = text.split(/\s+(?=OUT\b)/i);

  return (
    <>
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${dim})` }} />
      <TextBlock>
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
      </TextBlock>
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

export const Trailer: React.FC<TrailerProps> = ({
  source,
  sourceAudio,
  showSafeZone,
  titleText,
  endText,
  shots,
}) => {
  const { durationInFrames } = useVideoConfig();
  const starts = shots.reduce<number[]>(
    (acc, s, i) => [
      ...acc,
      i === 0 ? 0 : acc[i - 1] + shots[i - 1].durationInFrames,
    ],
    [],
  );
  const heroIndex = shots.reduce(
    (best, s, i) =>
      i > 0 &&
      i < shots.length - 1 &&
      s.durationInFrames > shots[best].durationInFrames
        ? i
        : best,
    1,
  );
  const endStart = starts[shots.length - 1];
  const fadeOut = interpolate(
    useCurrentFrame(),
    [durationInFrames - 10, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <AbsoluteFill style={{ filter: "contrast(1.08) saturate(1.05)" }}>
        {shots.map((shot, i) => (
          <Sequence
            key={i}
            from={starts[i]}
            durationInFrames={shot.durationInFrames}
            premountFor={30}
          >
            <ShotView
              shot={shot}
              index={i}
              source={source}
              sourceAudio={sourceAudio}
            />
          </Sequence>
        ))}
      </AbsoluteFill>
      <Grade />
      <Sequence durationInFrames={shots[0].durationInFrames}>
        <TitleCard text={titleText} duration={shots[0].durationInFrames} />
      </Sequence>
      <Sequence from={starts[heroIndex]} durationInFrames={4}>
        <Flash />
      </Sequence>
      <Sequence from={endStart}>
        <EndCard text={endText} />
      </Sequence>
      <AbsoluteFill style={{ backgroundColor: "black", opacity: fadeOut }} />
      {showSafeZone ? <SafeZoneGuide /> : null}
    </AbsoluteFill>
  );
};
