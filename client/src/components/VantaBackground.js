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
            highlightColor: 0x8c4aa7,
            midtoneColor: 0xa06bb6,
            lowlightColor: 0x7f359e,
            baseColor: 0xa48ecc,
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