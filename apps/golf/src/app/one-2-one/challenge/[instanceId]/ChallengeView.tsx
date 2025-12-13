'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function ChallengeView({ data }: any) {
  const { entries, currentUserId, tournament, instance } = data;
  const [selectedGolferId, setSelectedGolferId] = useState<string | null>(null);
  
  if (!entries || entries.length !== 2) {
    return <div style={{padding:'20px',color:'#fff',background:'#0f172a',minHeight:'100vh'}}>Invalid challenge</div>;
  }
  
  const [p1, p2] = entries;
  const me = p1.user_id === currentUserId ? p1 : p2;
  const opp = p1.user_id === currentUserId ? p2 : p1;
  
  // Find selected golfers from each team (default to captain if none selected)
  const mySelectedPick = selectedGolferId && me.picks?.find((p: any) => p.golfer_id === selectedGolferId)
    ? me.picks.find((p: any) => p.golfer_id === selectedGolferId)
    : me.picks?.find((p: any) => p.is_captain);
    
  const oppSelectedPick = selectedGolferId && opp.picks?.find((p: any) => p.golfer_id === selectedGolferId)
    ? opp.picks.find((p: any) => p.golfer_id === selectedGolferId)
    : opp.picks?.find((p: any) => p.is_captain);
  
  // Calculate fantasy team totals (sum of all 6 picks)
  const myScore = me.picks?.reduce((sum: number, p: any) => sum + (p.score?.total_score || 0), 0) || 0;
  const oppScore = opp.picks?.reduce((sum: number, p: any) => sum + (p.score?.total_score || 0), 0) || 0;
  let status = 'tied', diff = 0;
  if (myScore !== 0 || oppScore !== 0) {
    if (myScore < oppScore) { status = 'winning'; diff = Math.abs(oppScore - myScore); }
    else if (myScore > oppScore) { status = 'losing'; diff = Math.abs(myScore - oppScore); }
  }
  const isLive = (tournament?.status || instance?.status) === 'in-play';
  const tStatus = tournament?.status;
  
  return (
    <div style={{padding:'2rem',maxWidth:'1400px',margin:'0 auto',minHeight:'100vh',position:'relative'}}>
      {/* Background Image */}
      <div style={{
        position:'fixed',
        top:0,
        left:0,
        right:0,
        bottom:0,
        backgroundImage:'url(https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=2070)',
        backgroundSize:'cover',
        backgroundPosition:'center',
        backgroundRepeat:'no-repeat',
        backgroundAttachment:'fixed',
        opacity:0.10,
        zIndex:-1
      }}></div>

      <div style={{marginBottom:'1.5rem'}}>
        <Link href='/one-2-one' style={{color:'rgba(255,255,255,0.6)',textDecoration:'none',fontSize:'14px',display:'inline-block'}}>← Back to Challenges</Link>
      </div>
      
      <div style={{
        background:'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(16, 185, 129, 0.08))',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        border:'2px solid rgba(251, 191, 36, 0.3)',
        borderRadius:'16px',
        boxShadow:'0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(251, 191, 36, 0.2)',
        overflow:'hidden',
        marginBottom:'1.5rem'
      }}>
        <div style={{
          background:'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(16, 185, 129, 0.15))',
          backdropFilter:'blur(30px) saturate(180%)',
          WebkitBackdropFilter:'blur(30px) saturate(180%)',
          padding:'1.5rem',
          borderBottom:'1px solid rgba(251, 191, 36, 0.3)',
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          position:'relative'
        }}>
          {/* Glass highlight effect */}
          <div style={{
            position:'absolute',
            top:0,
            left:0,
            right:0,
            height:'1px',
            background:'linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.4), transparent)'
          }}></div>
          
          <div>
            <div style={{fontSize:'1.5rem',fontWeight:'600',marginBottom:'0.25rem',color:'#fbbf24',textShadow:'0 2px 8px rgba(0,0,0,0.3)'}}>ONE 2 ONE</div>
            <div style={{fontSize:'0.9rem',color:'rgba(255,255,255,0.95)'}}>{tournament?.name || 'Tournament'}</div>
          </div>
          <div style={{display:'flex',gap:'2rem',fontSize:'0.8rem',alignItems:'center'}}>
            <div>
              <div style={{color:'rgba(255,255,255,0.7)',marginBottom:'0.25rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <span style={{fontSize:'0.9rem'}}>📅</span> Tournament
              </div>
              <div style={{fontWeight:'500',color:'#fff'}}>
                {tStatus === 'completed' ? '✓ Complete' : tStatus === 'in-play' ? '● Live' : '⏱ Upcoming'}
              </div>
            </div>
            <div>
              <div style={{color:'rgba(255,255,255,0.7)',marginBottom:'0.25rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <span style={{fontSize:'0.9rem'}}>🎯</span> Status
              </div>
              <div style={{fontWeight:'500',color:'#fff'}}>
                {instance.status === 'completed' ? '✓ Finished' : instance.status === 'in-play' ? '● Active' : instance.status === 'open' ? '🔓 Open' : '⏱ Pending'}
              </div>
            </div>
            <div>
              <div style={{color:'rgba(255,255,255,0.7)',marginBottom:'0.25rem',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                <span style={{fontSize:'0.9rem'}}>💷</span> Entry Fee
              </div>
              <div style={{fontWeight:'500',color:'#fff'}}>£{((instance.entry_fee_pennies || 0) / 100).toFixed(2)}</div>
            </div>
            {status !== 'tied' && (
              <div style={{
                textAlign:'center',
                background:'rgba(255,255,255,0.15)',
                backdropFilter:'blur(10px)',
                WebkitBackdropFilter:'blur(10px)',
                borderRadius:'10px',
                padding:'0.75rem 1.25rem',
                border:'1px solid rgba(255,255,255,0.2)',
                boxShadow:'0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)'
              }}>
                <div style={{fontSize:'0.75rem',opacity:0.9,marginBottom:'0.25rem',color:'#fff',fontWeight:'600'}}>{status === 'winning' ? "LEADING" : "BEHIND"}</div>
                <div style={{fontSize:'2.25rem',fontWeight:'bold',color:'#fff',textShadow:'0 2px 8px rgba(0,0,0,0.4)'}}>{status === 'winning' ? '↑' : '↓'} {diff}</div>
              </div>
            )}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:'1px',background:'rgba(255,255,255,0.1)'}}>
          <div style={{background:status === 'winning' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)',padding:'1.5rem',position:'relative'}}>
            {status === 'winning' && <div style={{position:'absolute',top:'1rem',right:'1rem',fontSize:'2rem'}}>👑</div>}
            <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'linear-gradient(135deg, #10b981, #059669)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',fontWeight:'bold',flexShrink:0}}>
                {me.profiles?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:'0.65rem',color:'#94a3b8',marginBottom:'2px',fontWeight:'600'}}>YOU</div>
                <div style={{fontWeight:'600',fontSize:'1rem',marginBottom:'2px'}}>{me.profiles?.username || 'Player'}</div>
                <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.5)'}}>{me.golfers?.name || 'Unknown'}</div>
              </div>
              <div style={{display:'flex',gap:'0.5rem'}}>
                <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.4rem 0.6rem',textAlign:'center',minWidth:'110px'}}>
                  <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.2rem'}}>Total</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'bold',color:status === 'winning' ? '#10b981' : '#fff'}}>
                    {(() => {
                      const total = me.picks?.reduce((sum: number, p: any) => sum + (p.score?.total_score || 0), 0) || 0;
                      return total > 0 ? `+${total}` : total === 0 ? 'E' : total;
                    })()}
                  </div>
                </div>
                <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.4rem 0.6rem',textAlign:'center',minWidth:'110px'}}>
                  <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.2rem'}}>Picks</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'bold'}}>{me.picks?.length || 0}</div>
                </div>
                <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.4rem 0.6rem',textAlign:'center',minWidth:'110px'}}>
                  <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.2rem'}}>Fantasy Points</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'bold'}}>
                    {(() => {
                      const total = me.picks?.reduce((sum: number, p: any) => sum + (p.score?.total_score || 0), 0) || 0;
                      const count = me.picks?.filter((p: any) => p.score?.total_score != null).length || 1;
                      const avg = Math.round(total / count);
                      return avg > 0 ? `+${avg}` : avg === 0 ? 'E' : avg;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{background:status === 'losing' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.03)',padding:'1.5rem',position:'relative'}}>
            {status === 'losing' && <div style={{position:'absolute',top:'1rem',right:'1rem',fontSize:'2rem'}}>👑</div>}
            <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'linear-gradient(135deg, #64748b, #475569)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem',fontWeight:'bold',flexShrink:0}}>
                {opp.profiles?.username?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:'0.65rem',color:'#94a3b8',marginBottom:'2px',fontWeight:'600'}}>OPPONENT</div>
                <div style={{fontWeight:'600',fontSize:'1rem',marginBottom:'2px'}}>{opp.profiles?.username || 'Player'}</div>
                <div style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.5)'}}>{opp.golfers?.name || 'Unknown'}</div>
              </div>
              <div style={{display:'flex',gap:'0.5rem'}}>
                <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.4rem 0.6rem',textAlign:'center',minWidth:'110px'}}>
                  <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.2rem'}}>Total</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'bold',color:status === 'losing' ? '#ef4444' : '#fff'}}>
                    {(() => {
                      const total = opp.picks?.reduce((sum: number, p: any) => sum + (p.score?.total_score || 0), 0) || 0;
                      return total > 0 ? `+${total}` : total === 0 ? 'E' : total;
                    })()}
                  </div>
                </div>
                <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.4rem 0.6rem',textAlign:'center',minWidth:'110px'}}>
                  <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.2rem'}}>Picks</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'bold'}}>{opp.picks?.length || 0}</div>
                </div>
                <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.4rem 0.6rem',textAlign:'center',minWidth:'110px'}}>
                  <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.2rem'}}>Fantasy Points</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'bold'}}>
                    {(() => {
                      const total = opp.picks?.reduce((sum: number, p: any) => sum + (p.score?.total_score || 0), 0) || 0;
                      const count = opp.picks?.filter((p: any) => p.score?.total_score != null).length || 1;
                      const avg = Math.round(total / count);
                      return avg > 0 ? `+${avg}` : avg === 0 ? 'E' : avg;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Picks Comparison */}
      <div style={{
        background:'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(16, 185, 129, 0.08))',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
        border:'2px solid rgba(251, 191, 36, 0.3)',
        borderRadius:'12px',
        padding:'1.25rem',
        marginBottom:'1.5rem',
        boxShadow:'0 4px 16px rgba(0,0,0,0.2)'
      }}>
        <div style={{fontSize:'0.85rem',fontWeight:'600',color:'#fbbf24',marginBottom:'1rem',textTransform:'uppercase',letterSpacing:'0.05em',textAlign:'center'}}>
          🏌️ Team Lineups
        </div>
        <div className="challenge-lineups-grid" style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:'1.5rem',alignItems:'center'}}>
          <style>{`
            @media (max-width: 768px) {
              .challenge-lineups-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
              .challenge-lineups-grid .vs-divider { display: none !important; }
            }
          `}</style>
          {/* YOUR 6 Picks - Horizontal Grid */}
          <div>
            <div style={{fontSize:'0.7rem',fontWeight:'600',color:'#10b981',marginBottom:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>
              {me.profiles?.username || 'You'}'s Team
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:'0.5rem'}}>
              {me.picks && me.picks.length > 0 ? me.picks.map((pick: any, idx: number) => {
                const score = pick.score?.total_score;
                const scoreDisplay = score != null ? (score > 0 ? `+${score}` : score === 0 ? 'E' : score) : '-';
                const nameParts = pick.golfers?.name?.split(' ') || [];
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || 'Unknown';
                const initials = firstName.charAt(0).toUpperCase();
                const isSelected = selectedGolferId === pick.golfer_id;
                return (
                  <div 
                    key={`my-pick-${idx}`} 
                    onClick={() => setSelectedGolferId(pick.golfer_id)}
                    style={{
                      background: pick.is_captain ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15))' : 'rgba(16, 185, 129, 0.08)',
                      border: pick.is_captain ? '2px solid #fbbf24' : isSelected ? '2px solid #667eea' : '1px solid rgba(16, 185, 129, 0.25)',
                      borderRadius:'6px',
                      padding:'0.5rem',
                      display:'flex',
                      flexDirection:'column',
                      alignItems:'center',
                      gap:'0.35rem',
                      position:'relative',
                      boxShadow: pick.is_captain ? '0 4px 12px rgba(251, 191, 36, 0.3)' : isSelected ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
                      cursor: 'pointer',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.2s ease'
                    }}>
                    {pick.is_captain && (
                      <div style={{position:'absolute',top:'4px',right:'4px',fontSize:'0.75rem'}}>⭐</div>
                    )}
                    <div style={{fontSize:'0.7rem',fontWeight:'600',color:'#fff',textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:'100%'}}>
                      {initials}. {lastName}
                    </div>
                    <div style={{fontSize:'0.65rem',fontWeight:'700',color:'#667eea'}}>{scoreDisplay}</div>
                  </div>
                );
              }) : <div style={{gridColumn:'1 / -1',textAlign:'center',color:'#94a3b8',fontSize:'0.75rem',padding:'1rem'}}>No picks yet</div>}
            </div>
          </div>

          {/* VS Divider */}
          <div className="vs-divider" style={{
            width:'48px',
            height:'48px',
            borderRadius:'50%',
            background:'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(16, 185, 129, 0.2))',
            border:'2px solid rgba(251, 191, 36, 0.4)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:'1rem',
            fontWeight:'700',
            color:'#fbbf24',
            flexShrink:0
          }}>
            VS
          </div>

          {/* OPPONENT 6 Picks - Horizontal Grid */}
          <div>
            <div style={{fontSize:'0.7rem',fontWeight:'600',color:'#94a3b8',marginBottom:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>
              {opp.profiles?.username || 'Opponent'}'s Team
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:'0.5rem'}}>
              {opp.picks && opp.picks.length > 0 ? opp.picks.map((pick: any, idx: number) => {
                const score = pick.score?.total_score;
                const scoreDisplay = score != null ? (score > 0 ? `+${score}` : score === 0 ? 'E' : score) : '-';
                const nameParts = pick.golfers?.name?.split(' ') || [];
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || 'Unknown';
                const initials = firstName.charAt(0).toUpperCase();
                const isSelected = selectedGolferId === pick.golfer_id;
                return (
                  <div 
                    key={`opp-pick-${idx}`} 
                    onClick={() => setSelectedGolferId(pick.golfer_id)}
                    style={{
                      background: pick.is_captain ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15))' : 'rgba(100, 116, 139, 0.08)',
                      border: pick.is_captain ? '2px solid #fbbf24' : isSelected ? '2px solid #667eea' : '1px solid rgba(100, 116, 139, 0.25)',
                      borderRadius:'6px',
                      padding:'0.5rem',
                      display:'flex',
                      flexDirection:'column',
                      alignItems:'center',
                      gap:'0.35rem',
                      position:'relative',
                      boxShadow: pick.is_captain ? '0 4px 12px rgba(251, 191, 36, 0.3)' : isSelected ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
                      cursor: 'pointer',
                      transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.2s ease'
                    }}>
                    {pick.is_captain && (
                      <div style={{position:'absolute',top:'4px',right:'4px',fontSize:'0.75rem'}}>⭐</div>
                    )}
                    <div style={{fontSize:'0.7rem',fontWeight:'600',color:'#fff',textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:'100%'}}>
                      {initials}. {lastName}
                    </div>
                    <div style={{fontSize:'0.65rem',fontWeight:'700',color:'#667eea'}}>{scoreDisplay}</div>
                  </div>
                );
              }) : <div style={{gridColumn:'1 / -1',textAlign:'center',color:'#94a3b8',fontSize:'0.75rem',padding:'1rem'}}>No picks yet</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Scorecards */}
      <style>{`
        .scorecards-container { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media (max-width: 1024px) {
          .scorecards-container { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="scorecards-container">
        {/* YOUR Scorecard */}
        <div style={{
          background:'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.05))',
          backdropFilter:'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          border:'1px solid rgba(16, 185, 129, 0.3)',
          borderRadius:'12px',
          padding:'1rem',
          boxShadow:'0 4px 16px rgba(0,0,0,0.2)'
        }}>
          <div style={{fontSize:'0.75rem',fontWeight:'600',color:'#10b981',marginBottom:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>
            YOUR TEAM • {mySelectedPick?.golfers?.name || 'No Selection'} {mySelectedPick?.is_captain && '⭐'}
          </div>
          
          <div style={{display:'grid',gridTemplateColumns:'auto repeat(18, 1fr)',gap:'0',marginBottom:'1rem'}}>
            {/* Hole Numbers */}
            <div style={{display:'contents'}}>
              <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>HOLE</div>
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(hole => (
                <div key={`my-hole-${hole}`} style={{padding:'4px 2px',fontSize:'0.65rem',fontWeight:'600',color:'#e5e7eb',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:hole===10?'1px solid rgba(255,255,255,0.2)':'none'}}>{hole}</div>
              ))}
            </div>
            {/* Round Scores - Show hole-by-hole if available, otherwise show round total */}
            {mySelectedPick?.score?.r1 && (
              <div style={{display:'contents'}}>
                <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#10b981',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>R1</div>
                {mySelectedPick.score.r1_holes ? (
                  mySelectedPick.score.r1_holes.map((score: number, i: number) => (
                    <div key={`r1-hole-${i}`} style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#10b981',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{score}</div>
                  ))
                ) : (
                  <div style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#10b981',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',gridColumn:'span 18'}}>{mySelectedPick.score.r1}</div>
                )}
              </div>
            )}
            {mySelectedPick?.score?.r2 && (
              <div style={{display:'contents'}}>
                <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#10b981',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>R2</div>
                {mySelectedPick.score.r2_holes ? (
                  mySelectedPick.score.r2_holes.map((score: number, i: number) => (
                    <div key={`r2-hole-${i}`} style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#10b981',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{score}</div>
                  ))
                ) : (
                  <div style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#10b981',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',gridColumn:'span 18'}}>{mySelectedPick.score.r2}</div>
                )}
              </div>
            )}
            {mySelectedPick?.score?.r3 && (
              <div style={{display:'contents'}}>
                <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#10b981',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>R3</div>
                {mySelectedPick.score.r3_holes ? (
                  mySelectedPick.score.r3_holes.map((score: number, i: number) => (
                    <div key={`r3-hole-${i}`} style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#10b981',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{score}</div>
                  ))
                ) : (
                  <div style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#10b981',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',gridColumn:'span 18'}}>{mySelectedPick.score.r3}</div>
                )}
              </div>
            )}
            {mySelectedPick?.score?.r4 && (
              <div style={{display:'contents'}}>
                <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#10b981',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>R4</div>
                {mySelectedPick.score.r4_holes ? (
                  mySelectedPick.score.r4_holes.map((score: number, i: number) => (
                    <div key={`r4-hole-${i}`} style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#10b981',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{score}</div>
                  ))
                ) : (
                  <div style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#10b981',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',gridColumn:'span 18'}}>{mySelectedPick.score.r4}</div>
                )}
              </div>
            )}
            {!mySelectedPick?.score?.r1 && (
              <div style={{display:'contents'}}>
                <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>SCORE</div>
                <div style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#94a3b8',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',gridColumn:'span 18'}}>No round data available</div>
              </div>
            )}
          </div>

          <div style={{display:'flex',gap:'0.5rem',justifyContent:'space-between'}}>
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.5rem',textAlign:'center',flex:1}}>
              <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.25rem'}}>Total</div>
              <div style={{fontSize:'1.25rem',fontWeight:'bold',color:'#10b981'}}>
                {mySelectedPick?.score?.total_score != null 
                  ? (mySelectedPick.score.total_score > 0 ? `+${mySelectedPick.score.total_score}` : mySelectedPick.score.total_score === 0 ? 'E' : mySelectedPick.score.total_score) 
                  : '-'}
              </div>
            </div>
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.5rem',textAlign:'center',flex:1}}>
              <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.25rem'}}>Position</div>
              <div style={{fontSize:'1.25rem',fontWeight:'bold',color:'#fbbf24'}}>{mySelectedPick?.score?.position ? `#${mySelectedPick.score.position}` : '-'}</div>
            </div>
          </div>
        </div>

        {/* OPPONENT Scorecard */}
        <div style={{
          background:'linear-gradient(135deg, rgba(100, 116, 139, 0.08), rgba(71, 85, 105, 0.05))',
          backdropFilter:'blur(20px)',
          WebkitBackdropFilter:'blur(20px)',
          border:'1px solid rgba(100, 116, 139, 0.3)',
          borderRadius:'12px',
          padding:'1rem',
          boxShadow:'0 4px 16px rgba(0,0,0,0.2)'
        }}>
          <div style={{fontSize:'0.75rem',fontWeight:'600',color:'#94a3b8',marginBottom:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>
            OPPONENT TEAM • {oppSelectedPick?.golfers?.name || 'No Selection'} {oppSelectedPick?.is_captain && '⭐'}
          </div>
          
          <div style={{display:'grid',gridTemplateColumns:'auto repeat(18, 1fr)',gap:'0',marginBottom:'1rem'}}>
            {/* Hole Numbers */}
            <div style={{display:'contents'}}>
              <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>HOLE</div>
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(hole => (
                <div key={`opp-hole-${hole}`} style={{padding:'4px 2px',fontSize:'0.65rem',fontWeight:'600',color:'#e5e7eb',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:hole===10?'1px solid rgba(255,255,255,0.2)':'none'}}>{hole}</div>
              ))}
            </div>
            {/* Round Scores - Show hole-by-hole if available, otherwise show round total */}
            {oppSelectedPick?.score?.r1 && (
              <div style={{display:'contents'}}>
                <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>R1</div>
                {oppSelectedPick.score.r1_holes ? (
                  oppSelectedPick.score.r1_holes.map((score: number, i: number) => (
                    <div key={`opp-r1-hole-${i}`} style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#94a3b8',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{score}</div>
                  ))
                ) : (
                  <div style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#94a3b8',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',gridColumn:'span 18'}}>{oppSelectedPick.score.r1}</div>
                )}
              </div>
            )}
            {oppSelectedPick?.score?.r2 && (
              <div style={{display:'contents'}}>
                <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>R2</div>
                {oppSelectedPick.score.r2_holes ? (
                  oppSelectedPick.score.r2_holes.map((score: number, i: number) => (
                    <div key={`opp-r2-hole-${i}`} style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#94a3b8',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{score}</div>
                  ))
                ) : (
                  <div style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#94a3b8',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',gridColumn:'span 18'}}>{oppSelectedPick.score.r2}</div>
                )}
              </div>
            )}
            {oppSelectedPick?.score?.r3 && (
              <div style={{display:'contents'}}>
                <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>R3</div>
                {oppSelectedPick.score.r3_holes ? (
                  oppSelectedPick.score.r3_holes.map((score: number, i: number) => (
                    <div key={`opp-r3-hole-${i}`} style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#94a3b8',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{score}</div>
                  ))
                ) : (
                  <div style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#94a3b8',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',gridColumn:'span 18'}}>{oppSelectedPick.score.r3}</div>
                )}
              </div>
            )}
            {oppSelectedPick?.score?.r4 && (
              <div style={{display:'contents'}}>
                <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>R4</div>
                {oppSelectedPick.score.r4_holes ? (
                  oppSelectedPick.score.r4_holes.map((score: number, i: number) => (
                    <div key={`opp-r4-hole-${i}`} style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#94a3b8',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{score}</div>
                  ))
                ) : (
                  <div style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#94a3b8',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',gridColumn:'span 18'}}>{oppSelectedPick.score.r4}</div>
                )}
              </div>
            )}
            {!oppSelectedPick?.score?.r1 && (
              <div style={{display:'contents'}}>
                <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>SCORE</div>
                <div style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:'#94a3b8',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',gridColumn:'span 18'}}>No round data available</div>
              </div>
            )}
          </div>

          <div style={{display:'flex',gap:'0.5rem',justifyContent:'space-between'}}>
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.5rem',textAlign:'center',flex:1}}>
              <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.25rem'}}>Total</div>
              <div style={{fontSize:'1.25rem',fontWeight:'bold',color:'#94a3b8'}}>
                {oppSelectedPick?.score?.total_score != null 
                  ? (oppSelectedPick.score.total_score > 0 ? `+${oppSelectedPick.score.total_score}` : oppSelectedPick.score.total_score === 0 ? 'E' : oppSelectedPick.score.total_score) 
                  : '-'}
              </div>
            </div>
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.5rem',textAlign:'center',flex:1}}>
              <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.25rem'}}>Position</div>
              <div style={{fontSize:'1.25rem',fontWeight:'bold',color:'#fbbf24'}}>{oppSelectedPick?.score?.position ? `#${oppSelectedPick.score.position}` : '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Golfer Detail Scorecard (appears below when clicked) */}
      {selectedGolferId && (
        <div style={{marginTop:'1rem'}}>
          <div style={{
            background:'linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(102, 126, 234, 0.06))',
            backdropFilter:'blur(20px)',
            WebkitBackdropFilter:'blur(20px)',
            border:'2px solid rgba(102, 126, 234, 0.4)',
            borderRadius:'12px',
            padding:'1rem',
            boxShadow:'0 4px 20px rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{fontSize:'0.75rem',fontWeight:'600',color:'#667eea',marginBottom:'0.75rem',textTransform:'uppercase',letterSpacing:'0.05em',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>🎯 Click another golfer to compare • Currently showing in scorecards above</span>
              <button 
                onClick={() => setSelectedGolferId(null)}
                style={{background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'4px',padding:'4px 8px',color:'#fff',fontSize:'0.65rem',cursor:'pointer'}}>
                ✕ Show Captains
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
