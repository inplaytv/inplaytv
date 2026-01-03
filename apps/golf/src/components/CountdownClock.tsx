'use client';

import { useState, useEffect } from 'react';

interface CountdownClockProps {
  targetDate: string | Date;
  style?: React.CSSProperties;
}

export default function CountdownClock({ targetDate, style }: CountdownClockProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      
      return null;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div style={{ 
        fontWeight: 700, 
        color: '#ff6b6b',
        ...style 
      }}>
        Closed
      </div>
    );
  }

  // Calculate total hours including days
  const totalHours = (timeLeft.days * 24) + timeLeft.hours;

  // If more than 72 hours away, show date/time instead of countdown
  if (totalHours > 72) {
    return (
      <div style={{ fontWeight: 700, color: 'white', ...style }}>
        {new Date(targetDate).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: '2-digit' 
        })}
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      gap: '0.25rem', 
      alignItems: 'baseline',
      fontWeight: 700,
      flexWrap: 'wrap',
      ...style 
    }}>
      <span style={{ fontSize: '0.95rem', color: '#228b22', lineHeight: 1 }}>
        {String(totalHours).padStart(2, '0')}
      </span>
      <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>hrs</span>
      <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.9rem', margin: '0 0.15rem' }}>:</span>
      <span style={{ fontSize: '0.95rem', color: '#228b22', lineHeight: 1 }}>
        {String(timeLeft.minutes).padStart(2, '0')}
      </span>
      <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>min</span>
      <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.9rem', margin: '0 0.15rem' }}>:</span>
      <span style={{ fontSize: '0.95rem', color: '#228b22', lineHeight: 1 }}>
        {String(timeLeft.seconds).padStart(2, '0')}
      </span>
      <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.6)' }}>sec</span>
    </div>
  );
}
