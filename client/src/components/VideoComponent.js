import React from 'react';
import styled from 'styled-components';
import VoxxyVideo from '../attachments/VoxxyVideo.mp4';
import VideoPoster from '../attachments/VideoPoster.jpeg'; // Add your poster image here

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background-color: #f4f4f8;
  border-radius: 12px;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.1);
  margin: 20px auto;
  max-width: 800px;

  @media (max-width: 768px) {
    padding: 20px;
    max-width: 100%;
  }
`;

const VideoWrapper = styled.video`
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  box-shadow: 0px 4px 15px rgba(0, 0, 0, 0.2);
`;

const VideoComponent = () => {
  return (
    <Container>
      <VideoWrapper
        src={VoxxyVideo}
        controls
        poster={VideoPoster} // Add the poster attribute
      >
        Your browser does not support the video tag.
      </VideoWrapper>
    </Container>
  );
};

export default VideoComponent;