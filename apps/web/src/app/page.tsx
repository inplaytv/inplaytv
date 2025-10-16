import Hero from '@/components/Hero';
import ValueProps from '@/components/ValueProps';
import HowItWorks from '@/components/HowItWorks';
import CTA from '@/components/CTA';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <>
      <Hero />
      <ValueProps />
      <HowItWorks />
      <CTA />
      <FAQ />
      <Footer />
    </>
  );
}

