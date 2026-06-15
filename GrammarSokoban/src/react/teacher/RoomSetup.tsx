import React, { useState, useEffect } from 'react';
import { useStore, TEAM_COLORS } from '../store.js';
import { getSocket } from '../socket.js';
import { QRCode } from '../components/QRCode.js';

interface Player {
  id: string; socketId: string; name: string; teamId: number;
  color: string; ready: boolean; isCaptain: boolean;
}

export function RoomSetup() {
  const { setView, setRoom, setGameConfig, teamCount, roundCount, membersPerTeam, setPlayers } = useStore();
  const [roomCode, setRoomCode] = useState('');
  const [serverURL, setServerURL] = useState('');
  const [created, setCreated] = useState(false);
  const [players, setLocalPlayers] = useState<Player[]>([]);

  useEffect(() => {
    fetch('/api/health').then(() => setServerURL(window.location.origin));
  }, []);

  // Set up socket listeners when created
  useEffect(() => {
    if (!created || !roomCode) return;
    const socket = getSocket();

    const onPlayers = (list: Player[]) => {
      setLocalPlayers(list);
      setPlayers(list);
    };

    socket.on('room:players', onPlayers);
    return () => { socket.off('room:players', onPlayers); };
  }, [created, roomCode]);

  const handleCreate = () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    setRoomCode(code);
    setRoom(code, window.location.origin);
    setCreated(true);

    const socket = getSocket();
    socket.emit('teacher:createRoom', { roomCode: code, teamCount, roundCount, membersPerTeam });
  };

  const handleStart = () => {
    const socket = getSocket();
    socket.emit('teacher:startGame', { roomCode });
    setView('monitor');
  };

  const teams = Array.from({ length: teamCount }, (_, i) => i + 1);
  // All joined players ready + every team has at least 1 ready player
  const allReady =
    players.length > 0 &&
    players.every(p => p.ready) &&
    teams.every(tId => players.some(p => p.teamId === tId && p.ready));

  if (created) {
    return (
      <div style={{ padding: '20px', height: '100%', overflow: 'auto', background: '#FFF5F0' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          {/* Room code & QR */}
          <div style={{ textAlign: 'center', marginBottom: '16px', background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '13px', color: '#999' }}>房间码</div>
            <div style={{ fontSize: '44px', fontWeight: 'bold', letterSpacing: '10px', color: '#4A4A4A' }}>{roomCode}</div>
            <div style={{ margin: '12px 0' }}><QRCode url={`${serverURL}?room=${roomCode}`} size={180} /></div>
            <div style={{ fontSize: '13px', color: '#999' }}>学生扫码或输入房间码加入</div>
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#ccc' }}>
              {teamCount}队 × {membersPerTeam}人 | {roundCount}局
            </div>
          </div>

          {/* Team cards */}
          {teams.map(tId => {
            const teamPlayers = players.filter(p => p.teamId === tId);
            return (
              <div key={tId} style={{ background: '#fff', borderRadius: '12px', padding: '14px', marginBottom: '10px', boxShadow: '0 1px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: teamPlayers.length > 0 ? '8px' : '0' }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: TEAM_COLORS[tId - 1], display: 'inline-block' }} />
                  <span style={{ fontWeight: 'bold', color: '#4A4A4A', fontSize: '15px' }}>第 {tId} 队</span>
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    {teamPlayers.length}/{membersPerTeam} 人
                  </span>
                </div>
                {teamPlayers.length === 0 ? (
                  <div style={{ color: '#ddd', fontSize: '13px', padding: '4px 8px' }}>等待加入...</div>
                ) : (
                  teamPlayers.map(p => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '6px 10px', borderRadius: '8px', background: '#FFF8F5',
                      marginBottom: '4px',
                    }}>
                      <span style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: p.color, display: 'inline-block',
                        border: '2px solid #E8E0D8', flexShrink: 0,
                      }} />
                      <span style={{ flex: 1, fontSize: '15px', fontWeight: 'bold', color: '#4A4A4A' }}>{p.name}</span>
                      {p.isCaptain && <span style={{ fontSize: '11px', color: '#FFB3BA' }}>👑</span>}
                      <span style={{
                        padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold',
                        background: p.ready ? '#BAFFC9' : '#FFF0EB',
                        color: p.ready ? '#2e7d32' : '#999',
                      }}>
                        {p.ready ? '✓' : '等待'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            );
          })}

          <button onClick={handleStart} disabled={!allReady} style={{
            width: '100%', padding: '16px', fontSize: '20px', border: 'none',
            borderRadius: '14px', cursor: allReady ? 'pointer' : 'not-allowed',
            background: allReady ? '#FFB3BA' : '#E8E0D8',
            color: allReady ? '#4A4A4A' : '#aaa',
            fontWeight: 'bold', marginTop: '12px', transition: 'all 0.2s',
          }}>
            {allReady
              ? '开始游戏'
              : `等待全部准备 (${players.filter(p => p.ready).length}/${players.length})`}
          </button>
        </div>
      </div>
    );
  }

  // Config view
  const ROUND_OPTS = [1, 3, 5, 7, 9];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#FFF5F0' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', maxWidth: '420px', width: '90%', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '24px', color: '#4A4A4A' }}>游戏配置</h2>

        <div style={rowStyle}>
          <label style={lblStyle}>队伍数量</label>
          <select style={selStyle} value={teamCount}
            onChange={e => setGameConfig(Number(e.target.value), roundCount, membersPerTeam)}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} 队</option>)}
          </select>
        </div>

        <div style={rowStyle}>
          <label style={lblStyle}>每队人数</label>
          <select style={selStyle} value={membersPerTeam}
            onChange={e => setGameConfig(teamCount, roundCount, Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} 人</option>)}
          </select>
        </div>

        <div style={rowStyle}>
          <label style={lblStyle}>局数</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {ROUND_OPTS.map(n => (
              <button key={n} onClick={() => setGameConfig(teamCount, n, membersPerTeam)}
                style={{
                  padding: '8px 14px', fontSize: '14px', border: '2px solid',
                  borderRadius: '8px', cursor: 'pointer', color: '#4A4A4A',
                  background: roundCount === n ? '#FFB3BA' : '#FFF8F5',
                  borderColor: roundCount === n ? '#FFB3BA' : '#E8E0D8',
                }}>{n}</button>
            ))}
          </div>
        </div>

        <button style={btnStyle} onClick={handleCreate}>创建房间</button>
        <button style={backStyle} onClick={() => setView('login')}>← 返回</button>
      </div>
    </div>
  );
}

const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' };
const lblStyle: React.CSSProperties = { fontSize: '15px', color: '#666' };
const selStyle: React.CSSProperties = { padding: '8px 16px', fontSize: '15px', border: '2px solid #E8E0D8', borderRadius: '10px', background: '#FFF8F5', color: '#4A4A4A' };
const btnStyle: React.CSSProperties = { marginTop: '20px', width: '100%', padding: '14px', fontSize: '18px', border: 'none', borderRadius: '12px', background: '#FFB3BA', color: '#4A4A4A', cursor: 'pointer', fontWeight: 'bold' };
const backStyle: React.CSSProperties = { marginTop: '12px', background: 'none', border: 'none', color: '#999', fontSize: '13px', cursor: 'pointer' };
