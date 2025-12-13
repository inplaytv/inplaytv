'use client';

export default function Background() {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        background: 'linear-gradient(135deg, #0a0f1c 0%, #1a2332 25%, #2d4a4a 50%, #1a2332 75%, #0a0f1c 100%)',
        filter: 'blur(1px) brightness(0.6) contrast(1.1)',
        opacity: 0.8,
        pointerEvents: 'none',
      }} 
    />
  );
}
