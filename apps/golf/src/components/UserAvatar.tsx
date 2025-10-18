'use client';

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string;
  size?: number;
}

export default function UserAvatar({ avatarUrl, name, email, size = 40 }: UserAvatarProps) {
  // Get first letter of name or email as fallback
  const getInitial = () => {
    if (name) return name.charAt(0).toUpperCase();
    if (email) return email.charAt(0).toUpperCase();
    return 'U';
  };

  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    fontWeight: 600,
    fontSize: `${size / 2.5}px`,
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  if (avatarUrl) {
    return (
      <div style={containerStyle}>
        <img src={avatarUrl} alt="Avatar" style={imgStyle} />
      </div>
    );
  }

  return <div style={containerStyle}>{getInitial()}</div>;
}
