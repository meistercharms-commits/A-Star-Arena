import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { getCurrentLevel, setCurrentLevel as persistLevel } from '../lib/qualificationLevel';

const LevelContext = createContext(null);

export function LevelProvider({ children }) {
  const [level, setLevelRaw] = useState(() => getCurrentLevel() || 'alevel');

  const setLevel = useCallback((newLevel) => {
    persistLevel(newLevel);
    setLevelRaw(newLevel);
  }, []);

  const value = useMemo(() => ({ level, setLevel }), [level, setLevel]);

  return (
    <LevelContext.Provider value={value}>
      {children}
    </LevelContext.Provider>
  );
}

export function useLevel() {
  const ctx = useContext(LevelContext);
  if (!ctx) throw new Error('useLevel must be used within LevelProvider');
  return ctx;
}
