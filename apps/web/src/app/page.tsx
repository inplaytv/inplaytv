'use client';

import Hero from '@/components/Hero';
import ValueProps from '@/components/ValueProps';
import HowItWorks from '@/components/HowItWorks';
import CTA from '@/components/CTA';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function HomePageContent() {
  const searchParams = useSearchParams();
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get('message') === 'coming-soon') {
      setShowMessage(true);
      // Hide message after 5 seconds
      const timer = setTimeout(() => setShowMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  return (
    <>
      {showMessage && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(251, 191, 36, 0.95)',
            color: '#000',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            fontWeight: '600',
            zIndex: 9999,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          🚀 Coming Soon! This page is currently being prepared for launch.
        </div>
      )}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
      <Hero />
      <ValueProps />
      <HowItWorks />
      <CTA />
      <FAQ />
      <Footer />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}

