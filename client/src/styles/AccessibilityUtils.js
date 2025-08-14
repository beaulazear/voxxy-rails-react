import { css } from 'styled-components';
import colors from './Colors';

// Screen reader only text - visually hidden but accessible
export const srOnly = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`;

// Focus visible styles for keyboard navigation
export const focusVisible = css`
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${colors.focus}40;
    border-radius: 4px;
  }
`;

// High contrast mode support
export const highContrastMode = css`
  @media (prefers-contrast: high) {
    border: 2px solid currentColor;
  }
`;

// Reduced motion support
export const reducedMotion = css`
  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transition: none;
  }
`;

// Skip to main content link
export const SkipLink = css`
  position: absolute;
  top: -40px;
  left: 0;
  background: ${colors.primaryButton};
  color: white;
  padding: 8px;
  text-decoration: none;
  z-index: 100;
  border-radius: 0 0 4px 0;
  
  &:focus {
    top: 0;
  }
`;

// Ensure minimum touch target size (44x44px)
export const touchTarget = css`
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

// Color contrast checker helper
export const ensureContrast = (bg, fg) => {
  return css`
    background-color: ${bg};
    color: ${fg};
    
    @media (prefers-contrast: high) {
      background-color: ${bg === colors.background ? '#000' : bg};
      color: ${fg === colors.textPrimary ? '#fff' : fg};
    }
  `;
};