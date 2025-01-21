import React, { useEffect } from 'react';
import HeroSection from './HeroSection';
import IntroductionSection from './IntroductionSection';
import HowVoxxyWorks from './HowVoxxyWorks';
import AboutSection from './AboutSection';
import CallToActionSection from './CallToActionSection';
import BenefitsSection from './BenefitsSection';
import Footer from './Footer'

const LandingPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <HeroSection />
            <IntroductionSection />
            <HowVoxxyWorks />
            <AboutSection />
            <BenefitsSection />
            <CallToActionSection />
            <Footer />
        </>
    );
};

export default LandingPage;