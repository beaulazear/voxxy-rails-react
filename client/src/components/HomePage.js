import HeroComponent from './HeroComponent';
import InfoBoxes from './InfoBoxes';
import VideoComponent from './VideoComponent';
import InfoComponent from './InfoComponent';

function Home() {
  return (
    <div>
      <HeroComponent />
      <InfoComponent />
      <VideoComponent />
      <InfoBoxes />
    </div>
  );
}

export default Home;