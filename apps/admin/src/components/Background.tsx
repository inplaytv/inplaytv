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
        backgroundImage: 'url(/images/golf-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        filter: 'blur(1px) brightness(0.6) contrast(1.1)',
        opacity: 0.8,
        pointerEvents: 'none',
      }} 
    />
  );
}
