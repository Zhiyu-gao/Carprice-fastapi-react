import "./index.css";
import { Composition } from "remotion";
import { VipIntroVideo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VehicleIntroCN"
        component={VipIntroVideo}
        durationInFrames={4200}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
