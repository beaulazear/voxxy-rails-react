import { useEffect } from 'react';
import HeroComponent from './HeroComponent';
import InfoBoxes from './InfoBoxes';
import VideoComponent from './VideoComponent';
import InfoComponent from './InfoComponent';

function Home() {

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

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