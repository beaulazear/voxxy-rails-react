import React from 'react';

function CreateCardComponent({ isInvitesEmpty = false, onClick }) {
  const title = isInvitesEmpty ? 'No Current Invites' : 'Plan Your Next Outing';
  const subtitle = isInvitesEmpty ? 'Be the first to invite your friends!' : 'Discover great restaurants & bars';
  const actionText = isInvitesEmpty ? 'Start planning →' : 'Choose your vibe →';
  
  return (
    <div
      onClick={onClick}
      style={{
        height: '380px',
        background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
        borderRadius: '24px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Dark overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(32, 25, 37, 0.92)',
        zIndex: 1
      }} />
      
      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        padding: '32px',
        textAlign: 'center'
      }}>
        {/* Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
        }}>
          {isInvitesEmpty ? '💌' : '✨'}
        </div>
        
        {/* Title */}
        <h3 style={{
          color: '#fff',
          fontSize: '24px',
          fontWeight: '700',
          margin: 0,
          letterSpacing: '-0.3px'
        }}>
          {title}
        </h3>
        
        {/* Subtitle */}
        <p style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: '15px',
          fontWeight: '500',
          margin: 0,
          maxWidth: '260px',
          lineHeight: '1.5'
        }}>
          {subtitle}
        </p>
        
        {/* Restaurant/Bar icons */}
        {!isInvitesEmpty && (
          <div style={{
            display: 'flex',
            gap: '16px',
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '20px'
          }}>
            <span style={{ fontSize: '24px' }}>🍴</span>
            <span style={{ fontSize: '24px' }}>🍷</span>
          </div>
        )}
        
        {/* Action button */}
        <div style={{
          padding: '12px 28px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.2)',
          marginTop: '8px'
        }}>
          <span style={{
            color: '#fff',
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.3px'
          }}>
            {actionText}
          </span>
        </div>
      </div>
      
      {/* Responsive styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          div[onClick] {
            height: 320px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default CreateCardComponent;