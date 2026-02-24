import { createContext, useContext, useState, useMemo } from 'react';
import { getSubjectContent } from '../content/subjects';

const SubjectContext = createContext(null);

const STORAGE_KEY = 'astarena:currentSubject';

export function SubjectProvider({ children }) {
  const [subjectId, setSubjectIdRaw] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'biology';
  });

  function setSubjectId(id) {
    localStorage.setItem(STORAGE_KEY, id);
    setSubjectIdRaw(id);
  }

  const { topics, bosses } = useMemo(() => getSubjectContent(subjectId), [subjectId]);

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
