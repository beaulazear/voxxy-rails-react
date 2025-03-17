import React, { useEffect, useState, useCallback } from "react";
import styled, { css, keyframes } from "styled-components";
import HeroSection from "./HeroSection";
import IntroductionSection from "./IntroductionSection";
import HowVoxxyWorks from "./HowVoxxyWorks";
import AboutSection from "./AboutSection";
import BenefitsSection from "./BenefitsSection";
import CallToActionSection from "./CallToActionSection";
import Footer from "./Footer";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
`;

const HeroWrapper = styled.div`
  position: fixed;
  width: 100%;
  height: 60vh; /* Reduce height to bring content up */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${({ $isFadingOut }) =>
    $isFadingOut
      ? css`${fadeOut} 1.2s ease-in-out forwards`
      : css`${fadeIn} 1s ease-out forwards`};
`;

const ContentContainer = styled.div`
  opacity: ${({ $isVisible }) => ($isVisible ? "1" : "0")};
  transition: opacity 1s ease-in-out;
  margin-top: 0; /* Ensures content starts sooner */
  padding-top: 2rem; /* Add slight spacing instead of a huge margin */
`;

const StaggeredContent = styled.div`
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  
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
  const [visibleSections, setVisibleSections] = useState(["introduction"]);

  useEffect(() => {
    window.scrollTo(0, 0);

    setTimeout(() => {
      setShowHero(false);
      setShowContent(true);
    }, 3000);
  }, []);

  const handleScroll = useCallback(() => {
    const sections = document.querySelectorAll(".staggered-section");
    sections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85 && !visibleSections.includes(section.id)) {
        setVisibleSections((prev) => [...prev, section.id]);
      }
    });
  }, [visibleSections]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <>
      {showHero && (
        <HeroWrapper $isFadingOut={!showHero}>
          <HeroSection />
        </HeroWrapper>
      )}

      <ContentContainer $isVisible={showContent}>
        <StaggeredContent id="introduction" className="staggered-section" $isVisible={visibleSections.includes("introduction")}>
          <IntroductionSection />
        </StaggeredContent>

        <StaggeredContent id="howVoxxyWorks" className="staggered-section" $isVisible={visibleSections.includes("howVoxxyWorks")}>
          <HowVoxxyWorks />
        </StaggeredContent>

        <StaggeredContent id="about" className="staggered-section" $isVisible={visibleSections.includes("about")}>
          <AboutSection />
        </StaggeredContent>

        <StaggeredContent id="benefits" className="staggered-section" $isVisible={visibleSections.includes("benefits")}>
          <BenefitsSection />
        </StaggeredContent>

        <StaggeredContent id="cta" className="staggered-section" $isVisible={visibleSections.includes("cta")}>
          <CallToActionSection />
        </StaggeredContent>

        <Footer />
      </ContentContainer>
    </>
  );
};

export default LandingPage;