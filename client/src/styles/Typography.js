import styled from 'styled-components';

export const BaseText = styled.p`
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 400;
  color: #111; /* Or use a prop for dynamic theming */
`;

export const Heading1 = styled.h1`
  font-family: 'Inter', sans-serif;
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
`;

export const Heading2 = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 0.75rem;
`;

export const Heading3 = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

export const ButtonText = styled.span`
  font-size: 1rem;
  font-weight: 500;
`;

export const MutedText = styled.p`
  font-size: 0.9rem;
  font-weight: 400;
  color: #dbd3de;
  line-height: 1.5;
`;