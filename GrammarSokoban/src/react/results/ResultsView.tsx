import React, { useEffect, useState } from 'react';
import { useStore, TEAM_COLORS } from '../store.js';
import { BulletScreen } from '../components/BulletScreen.js';

export function ResultsView() {
  const { leaderboard, allSentences, teamCount, setView } = useStore();
  const [showBullets, setShowBullets] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowBullets(true), 1000);
    return () => clearTimeout(t);
  }, []);

  // Sort leaderboard by rounds completed
  const sorted = [...leaderboard].sort((a, b) => b.roundsCompleted - a.roundsCompleted);

  return (
    <div style={styles.container}>
      {showBullets && <BulletScreen sentences={allSentences} />}

      <div style={styles.content}>
        <h2 style={styles.title}>🏆 游戏结束</h2>

        <div style={styles.podium}>
          {sorted.map((t, i) => (
            <div key={t.teamId} style={{
              ...styles.podiumCard,
              borderColor: TEAM_COLORS[t.teamId - 1] || '#ccc',
              transform: i === 0 ? 'scale(1.05)' : 'scale(1)',
            }}>
              <div style={{ ...styles.medal, color: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
              </div>
              <div style={{ ...styles.teamDot, background: TEAM_COLORS[t.teamId - 1] }} />
              <div style={styles.teamLabel}>第 {t.teamId} 队</div>
              <div style={styles.score}>{t.roundsCompleted} 局</div>
            </div>
          ))}
        </div>

        <button style={styles.btn} onClick={() => setView('login')}>返回首页</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { height:'100%',background:'#FFF5F0',position:'relative',overflow:'hidden' },
  content: { position:'relative',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',paddingTop:'64px' },
  title: { fontSize:'32px',color:'#4A4A4A',marginBottom:'32px' },
  podium: { display:'flex',gap:'20px',justifyContent:'center',flexWrap:'wrap' },
  podiumCard: { background:'#fff',borderRadius:'16px',padding:'24px 20px',minWidth:'140px',textAlign:'center',border:'3px solid',boxShadow:'0 4px 20px rgba(0,0,0,0.06)' },
  medal: { fontSize:'36px' },
  teamDot: { width:'32px',height:'32px',borderRadius:'50%',margin:'8px auto' },
  teamLabel: { fontSize:'14px',color:'#666' },
  score: { fontSize:'24px',fontWeight:'bold',color:'#4A4A4A',marginTop:'4px' },
  btn: { marginTop:'32px',padding:'12px 32px',fontSize:'16px',border:'none',borderRadius:'12px',background:'#FFB3BA',color:'#4A4A4A',cursor:'pointer',fontWeight:'bold' },
};
