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
  return children;
}