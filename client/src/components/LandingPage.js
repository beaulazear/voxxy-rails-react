import React, { useEffect, useState, useCallback } from "react";
import styled, { css } from "styled-components";
import IntroductionSection from "./IntroductionSection";
import HowVoxxyWorks from "./HowVoxxyWorks";
import AboutSection from "./AboutSection";
import BenefitsSection from "./BenefitsSection";
import Footer from "./Footer";
import WaitlistForm from "./WaitlistForm";

const ContentContainer = styled.div`
  background-color: #0D0B1F; /* fixed background color without quotes */
  opacity: ${({ $isVisible }) => ($isVisible ? "1" : "0")};
  transition: opacity 0.7s ease-in-out;
  margin-top: 0;
  padding-top: 1rem;
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
  const [showContent, setShowContent] = useState(false);
  // Initially set visibleSections to include all section IDs
  const [visibleSections, setVisibleSections] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Instead of waiting for scroll, make all sections visible immediately.
    setVisibleSections(["introduction", "howVoxxyWorks", "about", "benefits"]);
    setShowContent(true);
  }, []);

  // Optionally, you can remove the scroll handler since it's no longer needed.
  // If you want to maintain it (for additional lazy-loading on longer pages),
  // you can leave it as is.
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
    <div style={{ background: "#0D0B1F" }}>
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
          <WaitlistForm />
        </StaggeredContent>

        <StaggeredContent id="benefits" className="staggered-section" $isVisible={visibleSections.includes("benefits")}>
          <BenefitsSection />
        </StaggeredContent>

        <Footer />
      </ContentContainer>
    </div>
  );
};

export default LandingPage;