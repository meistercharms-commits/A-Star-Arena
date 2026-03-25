import { useState, useEffect, useRef } from 'react';

export default function Timer({ seconds, onExpire, running = true, softExpire = false, className = '' }) {
  const [remaining, setRemaining] = useState(seconds);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemaining(seconds);
    setExpired(false);
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
          if (softExpire) {
            setExpired(true);
          } else {
            onExpire?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running, onExpire, softExpire]);

  if (expired) {
    return (
      <span className={`text-developing text-sm font-medium animate-pulse ${className}`}>
        Time's up. Take your time
      </span>
    );
  }

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
