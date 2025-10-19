export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div style={{
      maxWidth: '400px',
      margin: '4rem auto',
      padding: '2rem',
      border: '1px solid #eaeaea',
      borderRadius: '8px',
      background: '#fff',
    }}>
      <h1 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Admin Access</h1>
      
      {searchParams.error === 'unauthorized' && (
        <div style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          background: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          color: '#856404',
        }}>
          Access denied. You must be an authorized staff member.
        </div>
      )}
      
      <p style={{ marginBottom: '1.5rem', color: '#666' }}>
        Admins only. Sign in with your staff account.
      </p>
      
      <a 
        href="https://www.inplay.tv/login"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: '#0070f3',
          color: '#fff',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        Sign in on Website
      </a>
      
      <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#999' }}>
        Note: Once signed in, return to admin.inplay.tv. RBAC is enforced server-side.
      </p>
    </div>
  );
}
