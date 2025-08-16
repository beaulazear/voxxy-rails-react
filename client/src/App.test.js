import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { UserContext } from './context/user';

// Mock user objects
const mockNonAdminUser = {
  email: 'user@example.com',
  confirmed_at: '2024-01-01',
  admin: false,
  name: 'Test User'
};

const mockAdminUser = {
  email: 'admin@example.com',
  confirmed_at: '2024-01-01',
  admin: true,
  name: 'Admin User'
};

const mockUnconfirmedUser = {
  email: 'unconfirmed@example.com',
  confirmed_at: null,
  admin: false,
  name: 'Unconfirmed User'
};

// Helper to set window.location.hostname
const setHostname = (hostname) => {
  delete window.location;
  window.location = { 
    hostname,
    pathname: '/',
    hash: ''
  };
};

describe('Domain-based routing logic', () => {
  beforeEach(() => {
    // Reset to default
    setHostname('localhost');
  });

  describe('voxxyai.com domain', () => {
    beforeEach(() => {
      setHostname('voxxyai.com');
    });

    test('admin users can access voxxyai.com normally', () => {
      render(
        <BrowserRouter>
          <UserContext.Provider value={{ user: mockAdminUser, loading: false, setUser: jest.fn() }}>
            <App />
          </UserContext.Provider>
        </BrowserRouter>
      );

      // Admin should NOT see redirect message
      expect(screen.queryByText(/Redirecting to Hey Voxxy/i)).toBeNull();
      expect(screen.queryByText(/Coming Soon/i)).toBeNull();
    });

    test('non-admin users on voxxyai.com see redirect screen', () => {
      render(
        <BrowserRouter>
          <UserContext.Provider value={{ user: mockNonAdminUser, loading: false, setUser: jest.fn() }}>
            <App />
          </UserContext.Provider>
        </BrowserRouter>
      );

      // Should see redirect message
      const redirectText = screen.queryByText(/Redirecting to Hey Voxxy/i);
      expect(redirectText).toBeTruthy();
    });

    test('unconfirmed users on voxxyai.com see confirm email', () => {
      render(
        <BrowserRouter>
          <UserContext.Provider value={{ user: mockUnconfirmedUser, loading: false, setUser: jest.fn() }}>
            <App />
          </UserContext.Provider>
        </BrowserRouter>
      );

      // Should not see redirect
      expect(screen.queryByText(/Redirecting to Hey Voxxy/i)).toBeNull();
    });

    test('logged out users on voxxyai.com see landing page', () => {
      render(
        <BrowserRouter>
          <UserContext.Provider value={{ user: null, loading: false, setUser: jest.fn() }}>
            <App />
          </UserContext.Provider>
        </BrowserRouter>
      );

      // Should not see redirect or coming soon
      expect(screen.queryByText(/Redirecting to Hey Voxxy/i)).toBeNull();
      expect(screen.queryByText(/Coming Soon/i)).toBeNull();
    });
  });

  describe('heyvoxxy.com domain', () => {
    beforeEach(() => {
      setHostname('heyvoxxy.com');
    });

    test('non-admin users can access heyvoxxy.com normally', () => {
      render(
        <BrowserRouter>
          <UserContext.Provider value={{ user: mockNonAdminUser, loading: false, setUser: jest.fn() }}>
            <App />
          </UserContext.Provider>
        </BrowserRouter>
      );

      // Should NOT see redirect or coming soon
      expect(screen.queryByText(/Redirecting to Hey Voxxy/i)).toBeNull();
      expect(screen.queryByText(/Coming Soon/i)).toBeNull();
    });

    test('admin users can access heyvoxxy.com normally', () => {
      render(
        <BrowserRouter>
          <UserContext.Provider value={{ user: mockAdminUser, loading: false, setUser: jest.fn() }}>
            <App />
          </UserContext.Provider>
        </BrowserRouter>
      );

      // Should NOT see redirect or coming soon
      expect(screen.queryByText(/Redirecting to Hey Voxxy/i)).toBeNull();
      expect(screen.queryByText(/Coming Soon/i)).toBeNull();
    });
  });

  describe('localhost domain', () => {
    beforeEach(() => {
      setHostname('localhost');
    });

    test('non-admin users on localhost see coming soon', () => {
      render(
        <BrowserRouter>
          <UserContext.Provider value={{ user: mockNonAdminUser, loading: false, setUser: jest.fn() }}>
            <App />
          </UserContext.Provider>
        </BrowserRouter>
      );

      // Should see coming soon, NOT redirect
      expect(screen.queryByText(/Coming Soon/i)).toBeTruthy();
      expect(screen.queryByText(/Redirecting to Hey Voxxy/i)).toBeNull();
    });

    test('admin users on localhost have full access', () => {
      render(
        <BrowserRouter>
          <UserContext.Provider value={{ user: mockAdminUser, loading: false, setUser: jest.fn() }}>
            <App />
          </UserContext.Provider>
        </BrowserRouter>
      );

      // Should NOT see coming soon or redirect
      expect(screen.queryByText(/Coming Soon/i)).toBeNull();
      expect(screen.queryByText(/Redirecting to Hey Voxxy/i)).toBeNull();
    });
  });

  describe('www variants', () => {
    test('www.voxxyai.com redirects non-admin users', () => {
      setHostname('www.voxxyai.com');
      
      render(
        <BrowserRouter>
          <UserContext.Provider value={{ user: mockNonAdminUser, loading: false, setUser: jest.fn() }}>
            <App />
          </UserContext.Provider>
        </BrowserRouter>
      );

      // Should see redirect
      expect(screen.queryByText(/Redirecting to Hey Voxxy/i)).toBeTruthy();
    });

    test('www.heyvoxxy.com allows non-admin users', () => {
      setHostname('www.heyvoxxy.com');
      
      render(
        <BrowserRouter>
          <UserContext.Provider value={{ user: mockNonAdminUser, loading: false, setUser: jest.fn() }}>
            <App />
          </UserContext.Provider>
        </BrowserRouter>
      );

      // Should NOT see redirect or coming soon
      expect(screen.queryByText(/Redirecting to Hey Voxxy/i)).toBeNull();
      expect(screen.queryByText(/Coming Soon/i)).toBeNull();
    });
  });
});

describe('RedirectToHeyVoxxy component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setHostname('voxxyai.com');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('redirect happens after 3 seconds', () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { ...originalLocation, href: '' };

    render(
      <BrowserRouter>
        <UserContext.Provider value={{ user: mockNonAdminUser, loading: false, setUser: jest.fn() }}>
          <App />
        </UserContext.Provider>
      </BrowserRouter>
    );

    // Initially no redirect
    expect(window.location.href).toBe('');

    // After 3 seconds, should redirect
    jest.advanceTimersByTime(3000);
    
    waitFor(() => {
      expect(window.location.href).toBe('https://heyvoxxy.com');
    });

    window.location = originalLocation;
  });

  test('shows countdown timer', () => {
    render(
      <BrowserRouter>
        <UserContext.Provider value={{ user: mockNonAdminUser, loading: false, setUser: jest.fn() }}>
          <App />
        </UserContext.Provider>
      </BrowserRouter>
    );

    // Should show initial countdown
    expect(screen.getByText(/Redirecting to Hey Voxxy in 3/i)).toBeTruthy();
  });
});