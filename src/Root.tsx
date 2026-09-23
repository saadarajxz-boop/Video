import "./index.css";
import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { Logo } from "./HelloWorld/Logo";
import { Trailer } from "./Trailer/Trailer";
import {
  defaultShots,
  defaultVoiceovers,
  FOOTAGE,
  FPS,
  SCORE,
  totalDuration,
  TrailerProps,
  trailerSchema,
} from "./Trailer/shots";

const trailerProps: TrailerProps = {
  source: FOOTAGE,
  score: SCORE,
  showSafeZone: false,
  titleText: "A DAY IN MY LIFE",
  endText: "FULL VIDEO OUT NOW.",
  shots: defaultShots,
  voiceovers: defaultVoiceovers,
};

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 9:16 trailer for TikTok / Reels: npm run render:trailer */}
      <Composition
        id="Trailer"
        component={Trailer}
        schema={trailerSchema}
        durationInFrames={totalDuration(defaultShots)}
        calculateMetadata={({ props }) => ({
          durationInFrames: totalDuration(props.shots),
        })}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={trailerProps}
      />
      {/* Same edit in the footage's original 16:9 */}
      <Composition
        id="TrailerWide"
        component={Trailer}
        schema={trailerSchema}
        durationInFrames={totalDuration(defaultShots)}
        calculateMetadata={({ props }) => ({
          durationInFrames: totalDuration(props.shots),
        })}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={trailerProps}
      />
      <Composition
        // You can take the "id" to render a video:
        // npx remotion render HelloWorld
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        // You can override these props for each render:
        // https://www.remotion.dev/docs/parametrized-rendering
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />

      {/* Mount any React component to make it show up in the sidebar and work on it individually! */}
      <Composition
        id="OnlyLogo"
        component={Logo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          logoColor1: "#91dAE2",
          logoColor2: "#86A8E7",
        }}
      />
    </>
  );
};
