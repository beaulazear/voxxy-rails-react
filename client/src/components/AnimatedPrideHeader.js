import React, { useState, useEffect } from 'react';

// CSS styles as objects
const styles = {
    logoContainer: {
        position: 'relative',
        height: '36px',
        width: 'auto',
        display: 'inline-block',
    },
    logoContainerMobile: {
        position: 'relative',
        height: '30px',
        width: 'auto',
        display: 'inline-block',
    },
    logoImage: {
        height: '100%',
        width: 'auto',
        position: 'absolute',
        top: 0,
        left: 0,
        transition: 'opacity 0.8s ease-in-out',
    },
    hoverContainer: {
        display: 'inline-block',
        cursor: 'pointer',
    },
    fadeAnimation: {
        animation: 'fadeTransition 4s infinite',
    }
};

// CSS animation as a style tag
const animationStyles = `
  @keyframes fadeTransition {
    0% { opacity: 1; }
    50% { opacity: 0; }
    100% { opacity: 1; }
  }
`;

export default function AnimatedPrideHeader({
    regularSrc = "/api/placeholder/120/36", // Your HEADER.svg path
    prideSrc = "/api/placeholder/120/36",   // Your GAYHEADER.svg path
    alt = "Voxxy Logo",
    animationType = "cycle" // "cycle", "hover", or "pulse"
}) {
    const [showPride, setShowPride] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 480);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (animationType === "cycle") {
            // Cycle between logos every 3 seconds
            const interval = setInterval(() => {
                setShowPride(prev => !prev);
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [animationType]);

    const containerStyle = isMobile ? styles.logoContainerMobile : styles.logoContainer;

    // Hover-only version
    if (animationType === "hover") {
        return (
            <>
                <style>{animationStyles}</style>
                <div
                    style={styles.hoverContainer}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div style={containerStyle}>
                        <img
                            src={regularSrc}
                            alt={alt}
                            style={{
                                ...styles.logoImage,
                                opacity: isHovered ? 0 : 1
                            }}
                        />
                        <img
                            src={prideSrc}
                            alt={`${alt} Pride`}
                            style={{
                                ...styles.logoImage,
                                opacity: isHovered ? 1 : 0
                            }}
                        />
                    </div>
                </div>
            </>
        );
    }

    // Pulse version - pride logo pulses in occasionally
    if (animationType === "pulse") {
        return (
            <>
                <style>{animationStyles}</style>
                <div style={containerStyle}>
                    <img
                        src={regularSrc}
                        alt={alt}
                        style={{
                            ...styles.logoImage,
                            opacity: showPride ? 0 : 1
                        }}
                    />
                    <img
                        src={prideSrc}
                        alt={`${alt} Pride`}
                        style={{
                            ...styles.logoImage,
                            opacity: showPride ? 1 : 0,
                            ...styles.fadeAnimation
                        }}
                    />
                </div>
            </>
        );
    }

    // Default cycle version
    return (
        <>
            <style>{animationStyles}</style>
            <div style={containerStyle}>
                <img
                    src={regularSrc}
                    alt={alt}
                    style={{
                        ...styles.logoImage,
                        opacity: showPride ? 0 : 1
                    }}
                />
                <img
                    src={prideSrc}
                    alt={`${alt} Pride`}
                    style={{
                        ...styles.logoImage,
                        opacity: showPride ? 1 : 0
                    }}
                />
            </div>
        </>
    );
}