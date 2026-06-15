import React, { useEffect, useState } from 'react';

interface Comp { text: string; pinyin: string; role: string; }
interface Sentence { id: string; structure_id: string; english: string; difficulty: number; full_text: string; components?: Comp[]; }
interface Structure { id: string; name_zh: string; }

const API = '/api/admin/sentences';

export function SentencesManager() {
  const [list, setList] = useState<Sentence[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<string|null>(null);

  const [edit, setEdit] = useState<Sentence|null>(null);
  const [fId, setFId] = useState('');
  const [fSid, setFSid] = useState('');
  const [fEn, setFEn] = useState('');
  const [fDiff, setFDiff] = useState(1);
  const [fComps, setFComps] = useState<Comp[]>([{text:'',pinyin:'',role:''}]);

  const fetchList = () => {
    const url = filter ? `${API}?structure_id=${filter}` : API;
    fetch(url).then(r=>r.json()).then(d=>{setList(d);setLoading(false);});
  };

  useEffect(() => {
    fetch('/api/admin/structures').then(r=>r.json()).then(setStructures);
    fetchList();
  }, []);

  useEffect(() => { fetchList(); }, [filter]);

  const loadExpanded = async (id: string) => {
    if (expanded===id) { setExpanded(null); return; }
    setExpanded(id);
    const r = await fetch(`${API}/${id}`);
    const d = await r.json();
    setList(prev=>prev.map(s=>s.id===id?d:s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = edit ? `${API}/${edit.id}` : API;
    const method = edit ? 'PUT' : 'POST';
    const body:any = { id:fId, structure_id:fSid, english:fEn, difficulty:fDiff, components:fComps.filter(c=>c.text) };
    const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    if (r.ok) { fetchList(); resetForm(); }
    else { const err=await r.json(); alert(err.error||'Error'); }
  };

  const resetForm = () => { setEdit(null); setFId(''); setFSid(''); setFEn(''); setFDiff(1); setFComps([{text:'',pinyin:'',role:''}]); };
  const startEdit = (s: Sentence) => {
    setEdit(s); setFId(s.id); setFSid(s.structure_id); setFEn(s.english||''); setFDiff(s.difficulty);
    fetch(`${API}/${s.id}`).then(r=>r.json()).then(d=>setFComps(d.components?.length?d.components:[{text:'',pinyin:'',role:''}]));
  };
  const handleDelete = async (id: string) => {
    if (!confirm(`Delete "${id}"?`)) return;
    await fetch(`${API}/${id}`, { method:'DELETE' }); fetchList();
  };

  const inp: React.CSSProperties = { padding:'6px 8px',borderRadius:'5px',border:'1px solid #E8E0D8',background:'#FFF8F5',color:'#4A4A4A',fontSize:'12px' };

  return (
    <div>
      <div style={{display:'flex',gap:'12px',marginBottom:'12px',alignItems:'center'}}>
        <h3 style={{margin:0,color:'#4A4A4A'}}>{edit?'编辑例句':'例句管理'}</h3>
        <select style={{...inp}} value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="">全部结构</option>
          {structures.map(s=><option key={s.id} value={s.id}>{s.name_zh}</option>)}
        </select>
      </div>

      <form onSubmit={handleSubmit} style={{marginBottom:'16px',padding:'12px',background:'#FFF8F5',borderRadius:'10px',maxWidth:'700px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',marginBottom:'8px'}}>
          <input style={inp} placeholder="ID" value={fId} onChange={e=>setFId(e.target.value)} disabled={!!edit} />
          <select style={inp} value={fSid} onChange={e=>setFSid(e.target.value)}><option value="">选择结构</option>{structures.map(s=><option key={s.id} value={s.id}>{s.name_zh}</option>)}</select>
          <input style={inp} placeholder="English" value={fEn} onChange={e=>setFEn(e.target.value)} />
          <select style={inp} value={fDiff} onChange={e=>setFDiff(+e.target.value)}>{[1,2,3,4,5].map(d=><option key={d} value={d}>L{d}</option>)}</select>
        </div>
        <div style={{fontSize:'12px',color:'#999',marginBottom:'4px'}}>句法成分:</div>
        {fComps.map((c,i)=>(
          <div key={i} style={{display:'flex',gap:'4px',marginBottom:'3px'}}>
            <span style={{color:'#ccc',fontSize:'10px',lineHeight:'30px',minWidth:'16px'}}>{i+1}.</span>
            <input style={{...inp,width:'100px'}} placeholder="文本" value={c.text} onChange={e=>{const cp=[...fComps];cp[i]={...cp[i],text:e.target.value};setFComps(cp);}} />
            <input style={{...inp,width:'80px'}} placeholder="拼音" value={c.pinyin} onChange={e=>{const cp=[...fComps];cp[i]={...cp[i],pinyin:e.target.value};setFComps(cp);}} />
            <input style={{...inp,width:'80px'}} placeholder="角色" value={c.role} onChange={e=>{const cp=[...fComps];cp[i]={...cp[i],role:e.target.value};setFComps(cp);}} />
            <button type="button" onClick={()=>setFComps(fComps.filter((_,j)=>j!==i))} style={{padding:'2px 6px',fontSize:'10px',background:'#FFB3BA',border:'none',color:'#4A4A4A',borderRadius:'3px',cursor:'pointer'}}>✕</button>
          </div>
        ))}
        <button type="button" onClick={()=>setFComps([...fComps,{text:'',pinyin:'',role:''}])} style={{padding:'3px 10px',fontSize:'11px',background:'#BAE1FF',border:'none',color:'#4A4A4A',borderRadius:'4px',cursor:'pointer',marginTop:'4px'}}>+ 添加成分</button>
        <div style={{marginTop:'8px',display:'flex',gap:'6px'}}>
          <button type="submit" style={{padding:'7px 16px',background:'#FFB3BA',border:'none',color:'#4A4A4A',borderRadius:'6px',cursor:'pointer',fontWeight:'bold'}}>{edit?'更新':'创建'}</button>
          {edit && <button type="button" onClick={resetForm} style={{padding:'7px 14px',background:'#fff',border:'1px solid #E8E0D8',color:'#4A4A4A',borderRadius:'6px',cursor:'pointer'}}>取消</button>}
        </div>
      </form>

      {loading ? <p style={{color:'#999'}}>加载中...</p> : (
        <div style={{display:'flex',flexDirection:'column',gap:'3px'}}>
          {list.map(s=>(
            <div key={s.id}>
              <div onClick={()=>loadExpanded(s.id)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'6px 10px',background:'#FFF8F5',borderRadius:'6px',cursor:'pointer'}}>
                <div>
                  <span style={{fontSize:'15px',marginRight:'8px',color:'#4A4A4A'}}>{s.full_text}</span>
                  <span style={{color:'#999',fontSize:'10px'}}>{s.id}</span>
                  <span style={{color:'#ccc',fontSize:'10px',marginLeft:'6px'}}>{s.english}</span>
                </div>
                <div style={{display:'flex',gap:'4px'}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>startEdit(s)} style={{padding:'2px 7px',fontSize:'10px',background:'#BAE1FF',border:'none',color:'#4A4A4A',borderRadius:'3px',cursor:'pointer'}}>编辑</button>
                  <button onClick={()=>handleDelete(s.id)} style={{padding:'2px 7px',fontSize:'10px',background:'#FFB3BA',border:'none',color:'#4A4A4A',borderRadius:'3px',cursor:'pointer'}}>删除</button>
                </div>
              </div>
              {expanded===s.id && s.components && (
                <div style={{padding:'6px 16px',fontSize:'12px',color:'#999'}}>
                  {s.components.map((c,i)=><span key={i} style={{marginRight:'6px'}}><span style={{color:'#4A4A4A'}}>{c.text}</span><span style={{color:'#ccc',fontSize:'9px'}}>_{c.role}</span></span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
