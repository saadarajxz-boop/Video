import "@fontsource/anton/400.css";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import captionData from "./captions.json";
import {
  BASE_FILTER,
  Callout,
  callouts,
  chapters,
  counter,
  FACE,
  FULL_AUDIO,
  FULL_SOURCE,
  grades,
  infoCards,
  SUBSCRIBE_AT,
  TITLE,
} from "./edit";

const HEADLINE = "Anton, Impact, 'Arial Black', sans-serif";
const BODY = "'Helvetica Neue', Arial, sans-serif";
const ACCENT = "#FFD400";

type Word = [start: number, end: number, text: string];
type Group = { s: number; e: number; w: Word[] };
const data = captionData as unknown as {
  groups: Group[];
  punches: [time: number, scale: number][];
};
const { groups, punches } = data;

// Last entry whose start is <= t (entries sorted by start).
function findAt<T>(items: T[], t: number, start: (item: T) => number) {
  let lo = 0;
  let hi = items.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (start(items[mid]) <= t) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return found;
}

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useSeconds = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

// In/out envelope for an overlay that lives `duration` frames.
const useEnvelope = (duration: number, inFrames = 8, outFrames = 8) => {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [0, inFrames, duration - outFrames, duration],
    [0, 1, 1, 0],
    clamp,
  );
};

const Footage: React.FC = () => {
  const t = useSeconds();
  const grade = grades.find((g) => t >= g.from && t < g.to);
  const p = findAt(punches, t, (x) => x[0]);
  const scale = p >= 0 ? punches[p][1] : 1;

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale})`,
        transformOrigin: `${FACE.x}% ${FACE.y}%`,
        filter: `${BASE_FILTER} ${grade?.filter ?? ""}`,
      }}
    >
      <OffthreadVideo
        src={staticFile(FULL_SOURCE)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
};

const OpeningTitle: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const opacity = useEnvelope(duration, 1, 10);
  const tracking = interpolate(frame, [0, duration], [30, 12]);
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 70, opacity }}>
      <div
        style={{
          fontFamily: HEADLINE,
          fontSize: 140,
          color: "white",
          letterSpacing: tracking,
          textShadow: "0 8px 40px rgba(0,0,0,0.7)",
          transform: `scale(${1.12 - 0.12 * enter})`,
        }}
      >
        {TITLE.text}
      </div>
    </AbsoluteFill>
  );
};

const Chapter: React.FC<{ text: string; big?: boolean; duration: number }> = ({
  text,
  big,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slide = spring({ frame, fps, config: { damping: 18, stiffness: 140 } });
  const opacity = useEnvelope(duration, 4, 10);
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 64,
        display: "flex",
        alignItems: "stretch",
        gap: 18,
        opacity,
        transform: `translateX(${interpolate(slide, [0, 1], [-60, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 10,
          backgroundColor: ACCENT,
          borderRadius: 4,
          transform: `scaleY(${slide})`,
        }}
      />
      <div
        style={{
          fontFamily: HEADLINE,
          fontSize: big ? 110 : 64,
          lineHeight: 1,
          color: "white",
          textTransform: "uppercase",
          letterSpacing: 3,
          textShadow: "0 4px 24px rgba(0,0,0,0.7)",
          padding: "4px 0",
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Quote card on the empty left side of the car shot.
const CalloutCard: React.FC<{ callout: Callout; duration: number }> = ({
  callout,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = useEnvelope(duration, 6, 8);
  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0) 55%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 0,
          bottom: 0,
          width: 780,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {callout.lines.map((line, i) => {
          const pop = spring({
            frame: frame - i * 5,
            fps,
            config: { damping: 16, stiffness: 170 },
          });
          return (
            <div
              key={i}
              style={{
                fontFamily: HEADLINE,
                fontSize: Math.min(88, Math.floor(780 / (line.length * 0.46))),
                whiteSpace: "nowrap",
                lineHeight: 1.02,
                textTransform: "uppercase",
                color: i === callout.accent ? ACCENT : "white",
                textShadow: "0 6px 30px rgba(0,0,0,0.7)",
                opacity: Math.min(1, pop),
                transform: `translateY(${interpolate(pop, [0, 1], [30, 0])}px)`,
              }}
            >
              {line}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const FollowerCounter: React.FC<{ duration: number }> = ({ duration }) => {
  const t = useSeconds() + counter.from;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = useEnvelope(duration, 6, 10);
  const i = findAt(counter.steps, t, (s) => s.at);
  const step = counter.steps[Math.max(0, i)];
  const since = Math.round((t - step.at) * fps);
  const pop = spring({
    frame: since,
    fps,
    config: { damping: 12, stiffness: 200 },
  });
  const last = i === counter.steps.length - 1;
  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.3) 35%, rgba(0,0,0,0) 55%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: HEADLINE,
            fontSize: 44,
            color: "white",
            letterSpacing: 6,
            opacity: frame > 0 ? 0.9 : 0,
          }}
        >
          {last ? "CLOSING IN ON" : "FOLLOWERS"}
        </div>
        <div
          style={{
            fontFamily: HEADLINE,
            fontSize: 220,
            lineHeight: 1,
            color: last ? ACCENT : "white",
            textShadow: "0 8px 40px rgba(0,0,0,0.7)",
            transform: `scale(${interpolate(pop, [0, 1], [1.35, 1])})`,
            transformOrigin: "left center",
          }}
        >
          {step.value}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const InfoCard: React.FC<{ title: string; body: string; duration: number }> = ({
  title,
  body,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slide = spring({ frame, fps, config: { damping: 20, stiffness: 150 } });
  const opacity = useEnvelope(duration, 4, 10);
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        right: 64,
        maxWidth: 640,
        padding: "20px 28px",
        borderRadius: 18,
        backgroundColor: "rgba(10,10,10,0.72)",
        borderLeft: `8px solid ${ACCENT}`,
        opacity,
        transform: `translateX(${interpolate(slide, [0, 1], [80, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: HEADLINE,
          fontSize: 34,
          color: ACCENT,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 38,
          lineHeight: 1.2,
          color: "white",
          marginTop: 4,
        }}
      >
        {body}
      </div>
    </div>
  );
};

const Subscribe: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 160 } });
  const clicked = frame > 40;
  const press = spring({ frame: frame - 36, fps, config: { damping: 10 } });
  const opacity = useEnvelope(duration, 4, 12);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "flex-end",
        paddingTop: 60,
        paddingRight: 64,
        opacity,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          transform: `scale(${pop * (clicked ? 1 : 1 - 0.08 * press)})`,
        }}
      >
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: 48,
            color: "white",
            padding: "18px 34px",
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.18)",
          }}
        >
          👍 Like
        </div>
        <div
          style={{
            fontFamily: BODY,
            fontWeight: 800,
            fontSize: 48,
            color: clicked ? "#ddd" : "white",
            padding: "18px 38px",
            borderRadius: 999,
            backgroundColor: clicked ? "#3a3a3a" : "#FF0033",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          }}
        >
          {clicked ? "Subscribed ✓" : "Subscribe"}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Word-by-word captions: a few words at a time, the current word highlighted.
const Captions: React.FC = () => {
  const t = useSeconds();
  const i = findAt(groups, t, (g) => g.s);
  if (i < 0) return null;
  const g = groups[i];
  if (t > g.e + 0.15) return null;
  const current = findAt(g.w, t, (w) => w[0]);
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 70,
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          textAlign: "center",
          fontFamily: BODY,
          fontWeight: 900,
          fontSize: 60,
          lineHeight: 1.2,
          color: "white",
          WebkitTextStroke: "10px rgba(0,0,0,0.85)",
          paintOrder: "stroke fill",
          textShadow: "0 4px 18px rgba(0,0,0,0.5)",
        }}
      >
        {g.w.map(([ws, , text], k) => (
          <span
            key={k}
            style={{ color: t >= ws && k === current ? ACCENT : "white" }}
          >
            {text}
            {k < g.w.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const at = (seconds: number, fps: number) => Math.round(seconds * fps);

export const FullVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  const titleFrames = at(TITLE.to - TITLE.from, fps);
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Footage />
      <Sequence from={at(TITLE.from, fps)} durationInFrames={titleFrames}>
        <OpeningTitle duration={titleFrames} />
      </Sequence>
      {chapters.map((c) => {
        const d = at(c.big ? 3.6 : 3.2, fps);
        return (
          <Sequence key={c.at} from={at(c.at, fps)} durationInFrames={d}>
            <Chapter text={c.text} big={c.big} duration={d} />
          </Sequence>
        );
      })}
      {callouts.map((c) => {
        const d = at(c.to - c.from, fps);
        return (
          <Sequence key={c.from} from={at(c.from, fps)} durationInFrames={d}>
            <CalloutCard callout={c} duration={d} />
          </Sequence>
        );
      })}
      <Sequence
        from={at(counter.from, fps)}
        durationInFrames={at(counter.to - counter.from, fps)}
      >
        <FollowerCounter duration={at(counter.to - counter.from, fps)} />
      </Sequence>
      {infoCards.map((c) => {
        const d = at(c.to - c.from, fps);
        return (
          <Sequence key={c.from} from={at(c.from, fps)} durationInFrames={d}>
            <InfoCard title={c.title} body={c.body} duration={d} />
          </Sequence>
        );
      })}
      <Sequence from={at(SUBSCRIBE_AT, fps)} durationInFrames={at(4.5, fps)}>
        <Subscribe duration={at(4.5, fps)} />
      </Sequence>
      <Captions />
      <Audio src={staticFile(FULL_AUDIO)} />
    </AbsoluteFill>
  );
};
