// VantaWrapper.js
import React from 'react';
import VantaBackground from './VantaBackground';

const VantaWrapper = ({ children }) => {
    return (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
            {/* This renders the Vanta effect */}
            <VantaBackground />
            {/* The content is placed above the background */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
};

export default VantaWrapper;