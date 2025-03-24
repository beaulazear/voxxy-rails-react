import React, { useEffect, useRef } from 'react';

const VantaBackgroundTwo = () => {
    const vantaRef = useRef(null);

    useEffect(() => {
        const dotsEffect = window.VANTA.DOTS({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            scale: 1.0,
            scaleMobile: 1.0,
            backgroundColor: 0x222222,
            color: 0x9b59b6,   // Voxxy primary purple
            color2: 0xbb80d5,  // Complementary lighter purple
            size: 3,
            spacing: 35,
            showLines: false,
        });

        // Cleanup on unmount
        return () => {
            if (dotsEffect) dotsEffect.destroy();
        };
    }, []);

    return (
        <div
            ref={vantaRef}
            style={{
                position: 'fixed', // Keeps the background fixed
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,       // Ensure it's behind other content
            }}
        />
    );
};

export default VantaBackgroundTwo;