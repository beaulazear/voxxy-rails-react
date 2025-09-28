// Helper functions for analytics tracking

export const trackEvent = (event, properties = {}) => {
  return fetch('/analytics/track', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event,
      properties
    }),
    credentials: 'include'
  }).catch(err => console.error('Analytics tracking failed:', err));
};

export const trackPageView = (page, properties = {}) => {
  return fetch('/analytics/page_view', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      page,
      properties
    }),
    credentials: 'include'
  }).catch(err => console.error('Analytics tracking failed:', err));
};

export const identifyUser = (trackLogin = false) => {
  return fetch('/analytics/identify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ track_login: trackLogin }),
    credentials: 'include'
  }).catch(err => console.error('Analytics tracking failed:', err));
};