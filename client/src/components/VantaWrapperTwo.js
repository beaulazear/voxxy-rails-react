import React from 'react';
import styled from 'styled-components';
import VantaBackgroundTwo from './VantaBackgroundTwo';

const Wrapper = styled.div`
  position: relative;
  overflow: hidden;
`;

const Content = styled.div`
  position: relative;
  z-index: 1;
`;

const VantaWrapperTwo = ({ children }) => {
    return (
        <Wrapper>
            <VantaBackgroundTwo />
            <Content>
                {children}
            </Content>
        </Wrapper>
    );
};

export default VantaWrapperTwo;