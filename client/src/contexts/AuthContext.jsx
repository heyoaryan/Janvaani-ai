import { createContext, useContext, useState, useEffect } from 'react';

// Generate a stable session ID for this browser profile — created once, persisted forever.
function getOrCreateSessionId() {
  const key = 'janvaani_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('janvaani_profile');
    const sessionId = getOrCreateSessionId();
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Always use the stable session ID, not whatever was saved before
        return { ...parsed, sessionId };
      } catch {
        // fall through
      }
    }
    return {
      name: '',
      occupation: '',
      age: '',
      sessionId,
    };
  });

  const [onboardingComplete, setOnboardingComplete] = useState(() => {
    return localStorage.getItem('janvaani_onboarding') === 'complete';
  });

  useEffect(() => {
    if (user.name || user.sessionId) {
      localStorage.setItem('janvaani_profile', JSON.stringify(user));
    }
  }, [user]);

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const completeOnboarding = (profile) => {
    // Preserve the stable session ID when completing onboarding
    const sessionId = getOrCreateSessionId();
    const profileWithSession = { ...profile, sessionId };
    setUser(profileWithSession);
    setOnboardingComplete(true);
    localStorage.setItem('janvaani_onboarding', 'complete');
    localStorage.setItem('janvaani_profile', JSON.stringify(profileWithSession));
  };

  const resetUser = () => {
    const sessionId = getOrCreateSessionId();
    setUser({
      name: '',
      occupation: '',
      age: '',
      sessionId,
    });
    setOnboardingComplete(false);
    localStorage.removeItem('janvaani_profile');
    localStorage.removeItem('janvaani_onboarding');
  };

  return (
    <AuthContext.Provider value={{ user, updateUser, onboardingComplete, completeOnboarding, resetUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
