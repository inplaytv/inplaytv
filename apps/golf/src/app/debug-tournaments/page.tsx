'use client';

import { useEffect, useState } from 'react';

export default function DebugTournaments() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/tournaments')
      .then(r => r.json())
      .then(d => {
        const alfred = d.tournaments?.find((t: any) => t.slug === 'alfred-dunhill-championship-2024');
        setData(alfred);
      });
  }, []);

  if (!data) return <div style={{padding: '2rem'}}>Loading...</div>;

  const now = new Date();

  return (
    <div style={{padding: '2rem', background: '#000', color: '#fff', minHeight: '100vh'}}>
      <h1>Alfred Dunhill Championship - Debug Info</h1>
      <p>Current Time: {now.toISOString()}</p>
      
      <h2 style={{marginTop: '2rem'}}>Competitions:</h2>
      {data.competitions?.map((comp: any) => {
        const regClose = comp.reg_close_at ? new Date(comp.reg_close_at) : null;
        const isOpen = regClose && now < regClose;
        const hoursUntil = regClose ? ((regClose.getTime() - now.getTime()) / (1000*60*60)).toFixed(1) : 'N/A';
        
        return (
          <div key={comp.id} style={{
            border: '1px solid #333',
            padding: '1rem',
            marginBottom: '1rem',
            background: isOpen ? '#1a3d1a' : '#3d1a1a'
          }}>
            <h3>{comp.competition_types?.name || 'Unknown'}</h3>
            <p>Database Status: <strong>{comp.status}</strong></p>
            <p>Registration Close Time: <strong>{comp.reg_close_at || 'Not Set'}</strong></p>
            <p>Hours Until Close: <strong>{hoursUntil}</strong></p>
            <p>Is Registration Open? <strong style={{fontSize: '1.5rem', color: isOpen ? '#0f0' : '#f00'}}>{isOpen ? '✅ YES' : '❌ NO'}</strong></p>
            <p>Should Display: <strong>{isOpen ? 'REGISTRATION OPEN' : 'TOURNAMENT IN PROGRESS'}</strong></p>
          </div>
        );
      })}
    </div>
  );
}
