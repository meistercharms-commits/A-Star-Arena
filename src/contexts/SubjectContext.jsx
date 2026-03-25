import { createContext, useContext, useState, useMemo } from 'react';
import { getSubjectContent } from '../content/subjects';
import { useLevel } from './LevelContext';

const SubjectContext = createContext(null);

const STORAGE_KEY = 'astarena:currentSubject';

export function SubjectProvider({ children }) {
  const { level } = useLevel();

  const [subjectId, setSubjectIdRaw] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || (level === 'gcse' ? 'mathematics' : 'biology');
  });

  function setSubjectId(id) {
    localStorage.setItem(STORAGE_KEY, id);
    setSubjectIdRaw(id);
  }

  const { topics, bosses } = useMemo(() => getSubjectContent(subjectId, level), [subjectId, level]);

  const value = useMemo(() => ({
    subjectId,
    setSubjectId,
    topics,
    bosses,
  }), [subjectId, topics, bosses]);

  return (
    <SubjectContext.Provider value={value}>
      {children}
    </SubjectContext.Provider>
  );
}

export function useSubject() {
  const ctx = useContext(SubjectContext);
  if (!ctx) throw new Error('useSubject must be used within SubjectProvider');
  return ctx;
}
