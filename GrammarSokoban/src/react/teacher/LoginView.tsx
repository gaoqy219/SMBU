import React, { useState } from 'react';
import { useStore } from '../store.js';

const PASSWORD = 'SMBUCLC';

export function LoginView() {
  const setView = useStore(s => s.setView);
  const [showTeacher, setShowTeacher] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const handleLogin = () => {
    if (pw === PASSWORD) { setView('roomSetup'); }
    else { setErr('密码错误'); }
  };

  return (
    <div style={s.container}>
      <div style={s.card}>
        <h1 style={s.title}>🧩 语法推箱子</h1>
        <p style={s.sub}>Grammar Sokoban</p>

        {/* Student entry — most prominent */}
        <button style={s.studentBtn} onClick={() => setView('join')}>
          📱 加入游戏
        </button>
        <p style={s.studentHint}>输入教师屏幕上的房间码即可加入</p>

        {/* Teacher entry — de-emphasized */}
        <div style={{ marginTop: '32px' }}>
          {!showTeacher ? (
            <button style={s.teacherToggle} onClick={() => setShowTeacher(true)}>
              教师入口
            </button>
          ) : (
            <div style={s.teacherBox}>
              <input
                style={s.input}
                type="password"
                placeholder="教师密码"
                value={pw}
                onChange={e => { setPw(e.target.value); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoFocus
              />
              {err && <p style={s.err}>{err}</p>}
              <button style={s.teacherBtn} onClick={handleLogin}>进入</button>
            </div>
          )}
        </div>

        {/* Admin link */}
        <button style={s.adminLink} onClick={() => setView('admin')}>数据管理</button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', background: '#FFF5F0',
  },
  card: {
    textAlign: 'center', padding: '40px 32px',
    background: '#fff', borderRadius: '20px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    maxWidth: '400px', width: '90%',
  },
  title: { fontSize: '36px', marginBottom: '0', color: '#4A4A4A' },
  sub: { fontSize: '14px', color: '#ccc', marginBottom: '32px' },

  // Student — the star
  studentBtn: {
    width: '100%', padding: '20px', fontSize: '24px',
    border: 'none', borderRadius: '16px',
    background: 'linear-gradient(135deg, #BAE1FF, #E8BAFF)',
    color: '#4A4A4A', cursor: 'pointer', fontWeight: 'bold',
    boxShadow: '0 4px 16px rgba(186,225,255,0.4)',
    transition: 'transform 0.15s',
  },
  studentHint: { fontSize: '13px', color: '#bbb', marginTop: '8px' },

  // Teacher — de-emphasized
  teacherToggle: {
    background: 'none', border: 'none', color: '#ccc', fontSize: '13px',
    cursor: 'pointer', padding: '4px 12px',
  },
  teacherBox: {
    padding: '12px', background: '#FFF8F5', borderRadius: '10px',
  },
  input: {
    width: '100%', padding: '10px 14px', fontSize: '15px',
    border: '2px solid #E8E0D8', borderRadius: '10px',
    outline: 'none', textAlign: 'center', letterSpacing: '4px',
    background: '#fff',
  },
  err: { color: '#f44336', fontSize: '12px', marginTop: '4px' },
  teacherBtn: {
    marginTop: '8px', width: '100%', padding: '10px', fontSize: '15px',
    border: 'none', borderRadius: '10px',
    background: '#E8E0D8', color: '#4A4A4A', cursor: 'pointer',
  },

  adminLink: {
    marginTop: '20px', background: 'none', border: 'none',
    color: '#ddd', fontSize: '12px', cursor: 'pointer',
  },
};
