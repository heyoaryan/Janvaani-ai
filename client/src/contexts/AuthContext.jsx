import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('janvaani_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fall through
      }
    }
    return {
      name: '',
      occupation: '',
      age: '',
      sessionId: '',
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
    setUser(profile);
    setOnboardingComplete(true);
    localStorage.setItem('janvaani_onboarding', 'complete');
    localStorage.setItem('janvaani_profile', JSON.stringify(profile));
  };

  const resetUser = () => {
    setUser({
      name: '',
      occupation: '',
      age: '',
      sessionId: '',
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
