import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { HashRouter } from 'react-router-dom';
import { UserProvider } from './context/user';
import mixpanel from "mixpanel-browser";

const mixpanelKey = process.env.REACT_APP_MIXPANEL_KEY;

mixpanel.init(mixpanelKey, {
  debug: process.env.NODE_ENV !== 'production',
  track_pageview: true,
  persistence: "localStorage",
});

mixpanel.track("App Loaded");

console.log("Mixpanel initialized and App Loaded event tracked!");

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HashRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </HashRouter>
  </React.StrictMode>
);

reportWebVitals();