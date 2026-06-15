import React, { useEffect, useState } from 'react';
import { useStore, TEAM_COLORS } from '../store.js';
import { getSocket } from '../socket.js';

export function GameMonitor() {
  const { teamCount, currentRound, totalRounds, leaderboard, setRound, setLeaderboard, setAllSentences, setView } = useStore();
  const [teamProgress, setTeamProgress] = useState<number[]>(Array(teamCount).fill(0));

  useEffect(() => {
    const socket = getSocket();
    socket.on('game:roundStart', (data: any) => {
      setRound(data.round, data.totalRounds);
      setTeamProgress(Array(teamCount).fill(0));
    });
    socket.on('game:teamRoundComplete', (data: { teamId: number }) => {
      setTeamProgress(prev => {
        const next = [...prev];
        next[data.teamId - 1]++;
        return next;
      });
    });
    socket.on('game:over', (data: { leaderboard: any[]; allSentences: string[] }) => {
      setLeaderboard(data.leaderboard);
      setAllSentences(data.allSentences);
      setView('results');
    });
    return () => { socket.off('game:roundStart'); socket.off('game:teamRoundComplete'); socket.off('game:over'); };
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>游戏进行中</h2>
      <p style={styles.round}>第 {currentRound} / {totalRounds} 局</p>
      <div style={styles.grid}>
        {Array.from({ length: teamCount }, (_, i) => (
          <div key={i} style={{ ...styles.teamCard, borderColor: TEAM_COLORS[i] }}>
            <div style={{ ...styles.teamColor, background: TEAM_COLORS[i] }} />
            <div style={styles.teamName}>第 {i + 1} 队</div>
            <div style={styles.teamScore}>{teamProgress[i] ?? 0} 局完成</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding:'32px',height:'100%',background:'#FFF5F0',textAlign:'center' },
  title: { fontSize:'24px',color:'#4A4A4A',marginBottom:'8px' },
  round: { fontSize:'18px',color:'#FFB3BA',fontWeight:'bold',marginBottom:'32px' },
  grid: { display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap' },
  teamCard: { background:'#fff',borderRadius:'16px',padding:'24px',minWidth:'160px',border:'3px solid',boxShadow:'0 2px 12px rgba(0,0,0,0.04)' },
  teamColor: { width:'48px',height:'48px',borderRadius:'50%',margin:'0 auto 12px' },
  teamName: { fontSize:'16px',color:'#4A4A4A',fontWeight:'bold' },
  teamScore: { fontSize:'28px',color:'#FFB3BA',fontWeight:'bold',marginTop:'8px' },
};
