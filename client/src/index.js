import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { HashRouter } from 'react-router-dom';
import { UserProvider } from './context/user';
import mixpanel from "mixpanel-browser";

//Initialize Mixpanel
mixpanel.init("3a0b59ad74eb6f0b0f5947adbbf947a4", {
  debug: true,
  track_pageview: true,
  persistence: "localStorage",
});

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