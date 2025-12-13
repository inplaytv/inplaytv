import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coming Soon | InPlayTV',
  description: 'InPlayTV is launching soon!',
};

export default function ComingSoonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="0" />
      {children}
    </>
  );
}