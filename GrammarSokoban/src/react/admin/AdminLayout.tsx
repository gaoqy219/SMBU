import React, { useState } from 'react';
import { useStore } from '../store.js';
import { StructuresManager } from './StructuresManager.js';
import { SentencesManager } from './SentencesManager.js';

export function AdminLayout() {
  const { setView } = useStore();
  const [tab, setTab] = useState<'structures'|'sentences'>('structures');

  const tb: React.CSSProperties = {
    padding:'10px 20px',border:'none',background:'transparent',
    color:'#999',cursor:'pointer',fontSize:'15px',fontWeight:'bold',
  };
  const tbA: React.CSSProperties = { ...tb, color:'#FFB3BA',borderBottom:'3px solid #FFB3BA' };

  return (
    <div style={{ padding:'16px',height:'100%',overflow:'auto',background:'#FFF5F0' }}>
      <div style={{ display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px' }}>
        <button onClick={() => setView('login')}
          style={{ padding:'8px 16px',border:'1px solid #E8E0D8',borderRadius:'8px',background:'#fff',color:'#4A4A4A',cursor:'pointer',fontSize:'13px' }}>
          ← 返回
        </button>
        <h2 style={{ fontSize:'20px',color:'#4A4A4A' }}>数据管理</h2>
      </div>
      <div style={{ display:'flex',gap:'4px',marginBottom:'0' }}>
        <button style={tab==='structures'?tbA:tb} onClick={()=>setTab('structures')}>语法结构</button>
        <button style={tab==='sentences'?tbA:tb} onClick={()=>setTab('sentences')}>例句管理</button>
      </div>
      <div style={{ background:'#fff',borderRadius:'0 12px 12px 12px',padding:'16px',minHeight:'400px' }}>
        {tab==='structures'?<StructuresManager />:<SentencesManager />}
      </div>
    </div>
  );
}
