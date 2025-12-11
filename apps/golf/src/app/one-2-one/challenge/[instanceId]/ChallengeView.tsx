'use client';
import Link from 'next/link';

export default function ChallengeView({ data }: any) {
  const { entries, currentUserId, tournament, instance } = data;
  
  if (!entries || entries.length !== 2) {
    return <div style={{padding:'20px',color:'#fff',background:'#0f172a',minHeight:'100vh'}}>Invalid challenge</div>;
  }
  
  const [p1, p2] = entries;
  const me = p1.user_id === currentUserId ? p1 : p2;
  const opp = p1.user_id === currentUserId ? p2 : p1;
  const myScore = me.score?.total_score;
  const oppScore = opp.score?.total_score;
  let status = 'tied', diff = 0;
  if (myScore != null && oppScore != null) {
    if (myScore < oppScore) { status = 'winning'; diff = oppScore - myScore; }
    else if (myScore > oppScore) { status = 'losing'; diff = myScore - oppScore; }
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
                  <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.2rem'}}>Score</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'bold',color:status === 'winning' ? '#10b981' : '#fff'}}>
                    {myScore != null ? (myScore > 0 ? `+${myScore}` : myScore === 0 ? 'E' : myScore) : '-'}
                  </div>
                </div>
                <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.4rem 0.6rem',textAlign:'center',minWidth:'110px'}}>
                  <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.2rem'}}>Thru</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'bold'}}>{me.score?.thru ?? '-'}</div>
                </div>
                <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.4rem 0.6rem',textAlign:'center',minWidth:'110px'}}>
                  <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.2rem'}}>Pos</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'bold'}}>{me.score?.position ? `#${me.score.position}` : '-'}</div>
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
                  <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.2rem'}}>Score</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'bold',color:status === 'losing' ? '#ef4444' : '#fff'}}>
                    {oppScore != null ? (oppScore > 0 ? `+${oppScore}` : oppScore === 0 ? 'E' : oppScore) : '-'}
                  </div>
                </div>
                <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.4rem 0.6rem',textAlign:'center',minWidth:'110px'}}>
                  <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.2rem'}}>Thru</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'bold'}}>{opp.score?.thru ?? '-'}</div>
                </div>
                <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.4rem 0.6rem',textAlign:'center',minWidth:'110px'}}>
                  <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.2rem'}}>Pos</div>
                  <div style={{fontSize:'1.1rem',fontWeight:'bold'}}>{opp.score?.position ? `#${opp.score.position}` : '-'}</div>
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
              {[
                {name: 'Rory McIlroy', score: 'E', isCaptain: true},
                {name: 'Jon Rahm', score: '-1'},
                {name: 'Scottie Scheffler', score: '+2'},
                {name: 'Viktor Hovland', score: 'E'},
                {name: 'Collin Morikawa', score: '-2'},
                {name: 'Xander Schauffele', score: '+1'}
              ].map((player, idx) => {
                return (
                  <div key={`my-pick-${idx}`} style={{
                    background: player.isCaptain ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15))' : 'rgba(16, 185, 129, 0.08)',
                    border: player.isCaptain ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius:'6px',
                    padding:'0.5rem',
                    display:'flex',
                    flexDirection:'column',
                    alignItems:'center',
                    gap:'0.35rem',
                    position:'relative'
                  }}>
                    {player.isCaptain && (
                      <div style={{position:'absolute',top:'4px',right:'4px',fontSize:'0.75rem'}}>⭐</div>
                    )}
                    <div style={{fontSize:'0.7rem',fontWeight:'600',color:'#fff',textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:'100%'}}>
                      {player.name.split(' ').pop()}
                    </div>
                    <div style={{fontSize:'0.65rem',fontWeight:'700',color:'#667eea'}}>{player.score}</div>
                  </div>
                );
              })}
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
              {[
                {name: 'Brooks Koepka', score: '-1', isCaptain: true},
                {name: 'Patrick Cantlay', score: 'E'},
                {name: 'Tommy Fleetwood', score: '+1'},
                {name: 'Max Homa', score: '-2'},
                {name: 'Matt Fitzpatrick', score: 'E'},
                {name: 'Justin Thomas', score: '+3'}
              ].map((player, idx) => {
                return (
                  <div key={`opp-pick-${idx}`} style={{
                    background: player.isCaptain ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15))' : 'rgba(100, 116, 139, 0.08)',
                    border: player.isCaptain ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(100, 116, 139, 0.25)',
                    borderRadius:'6px',
                    padding:'0.5rem',
                    display:'flex',
                    flexDirection:'column',
                    alignItems:'center',
                    gap:'0.35rem',
                    position:'relative'
                  }}>
                    {player.isCaptain && (
                      <div style={{position:'absolute',top:'4px',right:'4px',fontSize:'0.75rem'}}>⭐</div>
                    )}
                    <div style={{fontSize:'0.7rem',fontWeight:'600',color:'#fff',textAlign:'center',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:'100%'}}>
                      {player.name.split(' ').pop()}
                    </div>
                    <div style={{fontSize:'0.65rem',fontWeight:'700',color:'#667eea'}}>{player.score}</div>
                  </div>
                );
              })}
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
            YOUR SCORECARD • {me.golfers?.name || 'Unknown'}
          </div>
          
          <div style={{display:'grid',gridTemplateColumns:'auto repeat(18, 1fr)',gap:'0',marginBottom:'1rem'}}>
            {/* Hole Numbers */}
            <div style={{display:'contents'}}>
              <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>HOLE</div>
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(hole => (
                <div key={`my-hole-${hole}`} style={{padding:'4px 2px',fontSize:'0.65rem',fontWeight:'600',color:'#e5e7eb',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:hole===10?'1px solid rgba(255,255,255,0.2)':'none'}}>{hole}</div>
              ))}
            </div>
            {/* Par */}
            <div style={{display:'contents'}}>
              <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>PAR</div>
              {[4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4].map((par,i) => (
                <div key={`my-par-${i}`} style={{padding:'4px 2px',fontSize:'0.65rem',color:'#9ca3af',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{par}</div>
              ))}
            </div>
            {/* Score */}
            <div style={{display:'contents'}}>
              <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#10b981',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>SCORE</div>
              {[4,3,4,5,4,4,3,4,4,4,4,4,3,5,4,4,4,4].map((score,i) => {
                const par = 4;
                const bgColor = score < par ? 'rgba(16, 185, 129, 0.2)' : score > par ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)';
                const textColor = score < par ? '#10b981' : score > par ? '#ef4444' : '#e5e7eb';
                return (
                  <div key={`my-score-${i}`} style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:textColor,textAlign:'center',background:bgColor,borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{score}</div>
                );
              })}
            </div>
            {/* Fantasy Points */}
            <div style={{display:'contents'}}>
              <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#667eea',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>FP</div>
              {[1,3,1,-1,1,1,3,1,1,1,1,1,3,-1,1,1,1,1].map((fp,i) => {
                const textColor = fp > 1 ? '#10b981' : fp < 0 ? '#ef4444' : '#9ca3af';
                return (
                  <div key={`my-fp-${i}`} style={{padding:'4px 2px',fontSize:'0.65rem',fontWeight:'600',color:textColor,textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{fp > 0 ? `+${fp}` : fp}</div>
                );
              })}
            </div>
          </div>

          <div style={{display:'flex',gap:'0.5rem',justifyContent:'space-between'}}>
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.5rem',textAlign:'center',flex:1}}>
              <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.25rem'}}>Total</div>
              <div style={{fontSize:'1.25rem',fontWeight:'bold',color:'#10b981'}}>{myScore != null ? (myScore > 0 ? `+${myScore}` : myScore === 0 ? 'E' : myScore) : '-'}</div>
            </div>
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.5rem',textAlign:'center',flex:1}}>
              <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.25rem'}}>Position</div>
              <div style={{fontSize:'1.25rem',fontWeight:'bold',color:'#fbbf24'}}>{me.score?.position ? `#${me.score.position}` : '-'}</div>
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
            OPPONENT SCORECARD • {opp.golfers?.name || 'Unknown'}
          </div>
          
          <div style={{display:'grid',gridTemplateColumns:'auto repeat(18, 1fr)',gap:'0',marginBottom:'1rem'}}>
            {/* Hole Numbers */}
            <div style={{display:'contents'}}>
              <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>HOLE</div>
              {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18].map(hole => (
                <div key={`opp-hole-${hole}`} style={{padding:'4px 2px',fontSize:'0.65rem',fontWeight:'600',color:'#e5e7eb',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:hole===10?'1px solid rgba(255,255,255,0.2)':'none'}}>{hole}</div>
              ))}
            </div>
            {/* Par */}
            <div style={{display:'contents'}}>
              <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>PAR</div>
              {[4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4].map((par,i) => (
                <div key={`opp-par-${i}`} style={{padding:'4px 2px',fontSize:'0.65rem',color:'#9ca3af',textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{par}</div>
              ))}
            </div>
            {/* Score */}
            <div style={{display:'contents'}}>
              <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#94a3b8',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>SCORE</div>
              {[4,4,4,4,5,4,4,4,4,4,3,4,4,5,4,4,4,3].map((score,i) => {
                const par = 4;
                const bgColor = score < par ? 'rgba(16, 185, 129, 0.2)' : score > par ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.05)';
                const textColor = score < par ? '#10b981' : score > par ? '#ef4444' : '#e5e7eb';
                return (
                  <div key={`opp-score-${i}`} style={{padding:'4px 2px',fontSize:'0.7rem',fontWeight:'700',color:textColor,textAlign:'center',background:bgColor,borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{score}</div>
                );
              })}
            </div>
            {/* Fantasy Points */}
            <div style={{display:'contents'}}>
              <div style={{padding:'4px 6px',fontSize:'0.65rem',fontWeight:'600',color:'#667eea',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>FP</div>
              {[1,1,1,1,-1,1,1,1,1,1,3,1,1,-1,1,1,1,3].map((fp,i) => {
                const textColor = fp > 1 ? '#10b981' : fp < 0 ? '#ef4444' : '#9ca3af';
                return (
                  <div key={`opp-fp-${i}`} style={{padding:'4px 2px',fontSize:'0.65rem',fontWeight:'600',color:textColor,textAlign:'center',borderBottom:'1px solid rgba(255,255,255,0.1)',borderLeft:i===9?'1px solid rgba(255,255,255,0.2)':'none'}}>{fp > 0 ? `+${fp}` : fp}</div>
                );
              })}
            </div>
          </div>

          <div style={{display:'flex',gap:'0.5rem',justifyContent:'space-between'}}>
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.5rem',textAlign:'center',flex:1}}>
              <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.25rem'}}>Total</div>
              <div style={{fontSize:'1.25rem',fontWeight:'bold',color:'#94a3b8'}}>{oppScore != null ? (oppScore > 0 ? `+${oppScore}` : oppScore === 0 ? 'E' : oppScore) : '-'}</div>
            </div>
            <div style={{background:'rgba(0,0,0,0.3)',borderRadius:'6px',padding:'0.5rem',textAlign:'center',flex:1}}>
              <div style={{fontSize:'0.6rem',color:'#94a3b8',marginBottom:'0.25rem'}}>Position</div>
              <div style={{fontSize:'1.25rem',fontWeight:'bold',color:'#fbbf24'}}>{opp.score?.position ? `#${opp.score.position}` : '-'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
