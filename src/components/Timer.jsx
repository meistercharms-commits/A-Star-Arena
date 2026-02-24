import { useState, useEffect, useRef } from 'react';

export default function Timer({ seconds, onExpire, running = true, className = '' }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining <= 30;
  const isCritical = remaining <= 10;

  return (
    <span
      className={`font-mono text-sm tabular-nums ${
        isCritical ? 'text-weak animate-pulse' : isLow ? 'text-developing' : 'text-text-secondary'
      } ${className}`}
    >
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}
