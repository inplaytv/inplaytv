'use client';

import { useEffect, useState } from 'react';

export default function BackgroundDebug() {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageUrl, setImageUrl] = useState('');
  const [computedStyles, setComputedStyles] = useState<any>(null);

  useEffect(() => {
    // No hardcoded background image testing
    setImageUrl('');
    setImageStatus('none');
  }, []);

    // Check computed styles
    const checkStyles = () => {
      const body = document.querySelector('body');
      if (body) {
        const before = window.getComputedStyle(body, '::before');
        setComputedStyles({
          bodyBg: window.getComputedStyle(body).backgroundColor,
          bodyPosition: window.getComputedStyle(body).position,
          beforeContent: before.content,
          beforeBgImage: before.backgroundImage,
          beforeZIndex: before.zIndex,
          beforeOpacity: before.opacity,
          beforeFilter: before.filter,
        });
      }
    };
    
    setTimeout(checkStyles, 1000);
  }, []);

  return (
    <>
      {/* Actual background - now with proper z-index behind content */}
      <div 
        data-background
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          background: 'linear-gradient(135deg, #0a0f1c 0%, #1a2332 25%, #2d4a4a 50%, #1a2332 75%, #0a0f1c 100%)',
          filter: 'blur(2px) brightness(0.4) contrast(1.1)',
          opacity: 0.7,
          pointerEvents: 'none',
        }} 
      />
      
      {/* Gradient overlay */}
      <div 
        data-gradient
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} 
      />

      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        background: 'rgba(0,0,0,0.9)',
        color: '#fff',
        padding: '20px',
        borderRadius: '8px',
        fontSize: '12px',
        maxWidth: '400px',
        fontFamily: 'monospace',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#3b82f6' }}>
        🔍 Background Debug
      </h3>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Image URL:</strong> {imageUrl}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Status:</strong>{' '}
        <span style={{ 
          color: imageStatus === 'loaded' ? '#22c55e' : imageStatus === 'error' ? '#ef4444' : '#fbbf24'
        }}>
          {imageStatus === 'loaded' ? '✅ Loaded' : imageStatus === 'error' ? '❌ Error' : '⏳ Loading'}
        </span>
      </div>

      {/* Test thumbnail */}
      <div style={{ marginTop: '10px', marginBottom: '10px' }}>
        <strong>Test Thumbnail:</strong>
        <div style={{ 
          marginTop: '5px',
          width: '100px', 
          height: '60px', 
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '2px solid #3b82f6',
          borderRadius: '4px',
        }} />
      </div>

      {computedStyles && (
        <>
          <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #333' }}>
            <strong>Computed Styles:</strong>
          </div>
          <div style={{ fontSize: '11px', lineHeight: '1.6' }}>
            <div>body bg: {computedStyles.bodyBg}</div>
            <div>body position: {computedStyles.bodyPosition}</div>
            <div>before content: {computedStyles.beforeContent}</div>
            <div>before bg-image: {computedStyles.beforeBgImage?.substring(0, 50)}...</div>
            <div>before z-index: {computedStyles.beforeZIndex}</div>
            <div>before opacity: {computedStyles.beforeOpacity}</div>
            <div>before filter: {computedStyles.beforeFilter?.substring(0, 40)}...</div>
          </div>
        </>
      )}

      <button
        onClick={() => {
          const debugDiv = document.querySelector('[data-debug]');
          if (debugDiv) debugDiv.remove();
        }}
        style={{
          marginTop: '15px',
          padding: '8px 12px',
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
        }}
      >
        Close Debug
      </button>
    </div>
    </>
  );
}
