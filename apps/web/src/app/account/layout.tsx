// Force dynamic rendering for account routes (uses searchParams)
export const dynamic = 'force-dynamic';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
