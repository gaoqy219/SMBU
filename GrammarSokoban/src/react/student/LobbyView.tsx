import React, { useState, useEffect } from 'react';
import { useStore, TEAM_COLORS, TEAM_COLOR_NAMES } from '../store.js';
import { getSocket } from '../socket.js';

export function LobbyView() {
  const { roomCode, players, setPlayers, setPlayerInfo, setView, setGameConfig } = useStore();
  const [name, setName] = useState('');
  const [team, setTeam] = useState(1);
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [serverTeamCount, setServerTeamCount] = useState(2);
  const [ready, setReady] = useState(false);
  const [joined, setJoined] = useState(false);

  const takenColors = new Map<number, Set<string>>();
  players.forEach(p => {
    if (!takenColors.has(p.teamId)) takenColors.set(p.teamId, new Set());
    takenColors.get(p.teamId)!.add(p.color);
  });

  useEffect(() => {
    const socket = getSocket();
    let didJoin = false;

    socket.on('room:config', (config: { teamCount: number; roundCount: number; membersPerTeam: number }) => {
      setServerTeamCount(config.teamCount);
      setGameConfig(config.teamCount, config.roundCount, config.membersPerTeam);
    });

    socket.on('room:players', (list: any[]) => setPlayers(list));
    socket.on('game:starting', () => setView('game'));

    // Join room (only once — server makes it idempotent)
    if (!didJoin) {
      socket.emit('student:joinRoom', { roomCode, name: 'P1', teamId: 1, color: TEAM_COLORS[0] });
      didJoin = true;
      setJoined(true);
    }

    return () => {
      socket.off('room:config');
      socket.off('room:players');
      socket.off('game:starting');
    };
  }, [roomCode]);

  const handleReady = () => {
    const finalName = name.trim() || 'P1';
    if (finalName.length > 3) return;

    // Always update info before marking ready — sends teamId too
    setPlayerInfo('', finalName.toUpperCase(), team, color);
    const socket = getSocket();
    socket.emit('student:updateInfo', {
      roomCode,
      name: finalName.toUpperCase(),
      teamId: team,
      color,
    });
    // Small delay to ensure updateInfo is processed before ready
    setTimeout(() => {
      socket.emit('student:ready', { roomCode });
      setReady(true);
    }, 150);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.roomCode}>房间 {roomCode}</span>
          <span style={styles.playerCount}>{players.length} 人已加入</span>
        </div>

        <label style={styles.label}>角色名称（1-3个字母）</label>
        <input
          style={styles.input}
          value={name}
          maxLength={3}
          placeholder="ABC"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          onChange={e => setName(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
        />

        <label style={styles.label}>选择队伍</label>
        <div style={styles.teamRow}>
          {Array.from({ length: serverTeamCount }, (_, i) => (
            <button
              key={i}
              onClick={() => setTeam(i + 1)}
              style={{
                ...styles.teamBtn,
                background: team === i + 1 ? TEAM_COLORS[i] : '#FFF0EB',
                borderColor: TEAM_COLORS[i],
              }}
            >
              第{i + 1}队
            </button>
          ))}
        </div>

        <label style={styles.label}>选择颜色</label>
        <div style={styles.colorRow}>
          {TEAM_COLORS.map((c, i) => {
            const taken = takenColors.get(team)?.has(c);
            return (
              <button
                key={c}
                disabled={taken}
                onClick={() => setColor(c)}
                style={{
                  ...styles.colorBtn,
                  background: c,
                  border: color === c ? '3px solid #4A4A4A' : '3px solid transparent',
                  opacity: taken ? 0.3 : 1,
                }}
              >
                {TEAM_COLOR_NAMES[i]}
              </button>
            );
          })}
        </div>

        {!ready ? (
          <button style={styles.readyBtn} onClick={handleReady}>
            准备就绪
          </button>
        ) : (
          <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
            <button style={{ ...styles.readyBtn, background: '#BAFFC9', flex: 1 }}
              onClick={() => {
                setReady(false);
                const socket = getSocket();
                socket.emit('student:ready', { roomCode, cancel: true });
              }}>
              已准备 ✓
            </button>
            <button style={{ ...styles.cancelBtn }}
              onClick={() => {
                setReady(false);
                const socket = getSocket();
                socket.emit('student:ready', { roomCode, cancel: true });
              }}>
              取消准备
            </button>
          </div>
        )}

        <div style={{ marginTop: '12px', fontSize: '12px', color: '#ccc', textAlign: 'center' }}>
          设置名称、队伍和颜色后点击准备
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', background: '#FFF5F0', padding: '16px' },
  card: { background: '#fff', borderRadius: '16px', padding: '24px 20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', maxWidth: '380px', width: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  roomCode: { fontSize: '18px', fontWeight: 'bold', color: '#4A4A4A' },
  playerCount: { fontSize: '13px', color: '#999' },
  label: { fontSize: '14px', color: '#999', marginBottom: '6px', display: 'block', marginTop: '14px' },
  input: {
    width: '100%', padding: '14px', fontSize: '28px', textAlign: 'center', letterSpacing: '10px',
    border: '2px solid #E8E0D8', borderRadius: '10px', outline: 'none',
    background: '#FFF8F5', color: '#4A4A4A', fontWeight: 'bold',
  },
  teamRow: { display: 'flex', gap: '8px' },
  teamBtn: { flex: 1, padding: '10px', fontSize: '14px', border: '2px solid', borderRadius: '8px', cursor: 'pointer', color: '#4A4A4A' },
  colorRow: { display: 'flex', gap: '8px' },
  colorBtn: { width: '48px', height: '48px', borderRadius: '50%', fontSize: '10px', color: '#4A4A4A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  readyBtn: { width: '100%', padding: '14px', fontSize: '18px', border: 'none', borderRadius: '12px', background: '#BAFFC9', color: '#4A4A4A', cursor: 'pointer', fontWeight: 'bold' },
  cancelBtn: { padding: '14px 16px', fontSize: '13px', border: '2px solid #FFB3BA', borderRadius: '12px', background: '#fff', color: '#666', cursor: 'pointer' },
};
