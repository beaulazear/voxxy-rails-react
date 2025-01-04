import React from 'react';
import HeroSection from './HeroSection';
import IntroductionSection from './IntroductionSection';
import HowVoxxyWorks from './HowVoxxyWorks';
import AboutSection from './AboutSection';
import CallToActionSection from './CallToActionSection';
import BenefitsSection from './BenefitsSection';

const LandingPage = () => {
    return (
        <>
            <HeroSection />
            <IntroductionSection />
            <HowVoxxyWorks />
            <AboutSection />
            <BenefitsSection />
            <CallToActionSection />
        </>
    );
};

export default LandingPage;