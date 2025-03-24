import React, { useEffect, useRef } from 'react';

const VantaBackground = () => {
    const vantaRef = useRef(null);

    useEffect(() => {
        const fogEffect = window.VANTA.FOG({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.0,
            minWidth: 200.0,
            highlightColor: 0x6a3b8c, // Darker purple for highlights
            midtoneColor: 0x7f50a3,   // Darker midtone purple
            lowlightColor: 0x5e3b85,  // Darker lowlight purple
            baseColor: 0x222222,      // Dark gray background for contrast
            blurFactor: 0.6,
            zoom: 1,
            speed: 1,
        });

        // Cleanup on unmount
        return () => {
            if (fogEffect) fogEffect.destroy();
        };
    }, []);

    return (
        <div
            ref={vantaRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,
            }}
        />
    );
};

export default VantaBackground;