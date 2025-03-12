import React, { useEffect, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import HeroSection from "./HeroSection";
import IntroductionSection from "./IntroductionSection";
import HowVoxxyWorks from "./HowVoxxyWorks";
import AboutSection from "./AboutSection";
import BenefitsSection from "./BenefitsSection";
import CallToActionSection from "./CallToActionSection";
import Footer from "./Footer";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-20px) scale(1.02);
  }
`;

const HeroWrapper = styled.div`
  position: fixed;
  width: 100%;
  height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${({ $isFadingOut }) =>
        $isFadingOut
            ? css`${fadeOut} 1.5s ease-in-out forwards`
            : css`${fadeIn} 1.5s ease-out forwards`};
`;

const ContentContainer = styled.div`
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 1.5s ease-in-out, transform 1.5s ease-in-out;

  ${({ $isVisible }) =>
        $isVisible &&
        css`
      opacity: 1;
      transform: translateY(0);
    `}
`;

const LandingPage = () => {
    const [showHero, setShowHero] = useState(true);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);

        const heroTimeout = setTimeout(() => {
            setShowHero(false);
            setShowContent(true)
        }, 2500);

        return () => clearTimeout(heroTimeout);
    }, []);

    return (
        <>
            {showHero && (
                <HeroWrapper $isFadingOut={!showHero}>
                    <HeroSection />
                </HeroWrapper>
            )}

            <ContentContainer $isVisible={showContent}>
                <IntroductionSection />
                <HowVoxxyWorks />
                <AboutSection />
                <BenefitsSection />
                <CallToActionSection />
                <Footer />
            </ContentContainer>
        </>
    );
};

export default LandingPage;