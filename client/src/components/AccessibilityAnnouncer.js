import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { srOnly } from '../styles/AccessibilityUtils';

const Announcer = styled.div`
  ${srOnly}
`;

export const AccessibilityAnnouncer = ({ message }) => {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      setAnnouncement(message);
      const timer = setTimeout(() => setAnnouncement(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Announcer
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {announcement}
    </Announcer>
  );
};

export default AccessibilityAnnouncer;