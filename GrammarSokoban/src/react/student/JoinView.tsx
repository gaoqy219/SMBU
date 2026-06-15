import React, { useState, useEffect } from 'react';
import { useStore } from '../store.js';

export function JoinView() {
  const { setView, setRoom } = useStore();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) setCode(roomParam.toUpperCase());
  }, []);

  const handleJoin = () => {
    if (code.trim().length < 2) { setErr('请输入房间码'); return; }
    setRoom(code.trim().toUpperCase(), window.location.origin);
    setView('lobby');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>加入游戏</h2>
        <p style={styles.hint}>输入教师屏幕上显示的房间码</p>
        <input
          style={styles.input}
          placeholder="ABCD"
          value={code}
          onChange={e => { setCode(e.target.value.replace(/[^a-zA-Z0-9]/g,'').toUpperCase()); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          maxLength={4}
          autoFocus
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        {err && <p style={styles.err}>{err}</p>}
        <button style={styles.btn} onClick={handleJoin}>加入</button>
        <button style={styles.backBtn} onClick={() => setView('login')}>← 返回</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display:'flex',alignItems:'center',justifyContent:'center',height:'100%',background:'#FFF5F0' },
  card: { background:'#fff',borderRadius:'20px',padding:'40px 28px',boxShadow:'0 4px 24px rgba(0,0,0,0.06)',maxWidth:'400px',width:'90%',textAlign:'center' },
  title: { fontSize:'28px',marginBottom:'8px',color:'#4A4A4A' },
  hint: { fontSize:'14px',color:'#999',marginBottom:'20px' },
  input: {
    width:'100%',padding:'16px',fontSize:'36px',textAlign:'center',letterSpacing:'14px',
    border:'2px solid #E8E0D8',borderRadius:'14px',outline:'none',
    background:'#FFF8F5',color:'#4A4A4A',fontWeight:'bold',
  },
  err: { color:'#f44336',fontSize:'14px',marginTop:'10px' },
  btn: {
    marginTop:'24px',width:'100%',padding:'16px',fontSize:'20px',
    border:'none',borderRadius:'14px',background:'#BAE1FF',color:'#4A4A4A',
    cursor:'pointer',fontWeight:'bold',
  },
  backBtn: { marginTop:'14px',background:'none',border:'none',color:'#999',fontSize:'14px',cursor:'pointer',display:'block',width:'100%' },
};
