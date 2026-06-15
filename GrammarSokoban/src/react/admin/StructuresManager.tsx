import React, { useEffect, useState } from 'react';

interface Structure {
  id: string; name_zh: string; name_en: string; difficulty: number;
  template: string; description_zh: string; sentence_count: number;
}

const API = '/api/admin/structures';

export function StructuresManager() {
  const [list, setList] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Structure | null>(null);
  const [f, setF] = useState({ id:'',name_zh:'',name_en:'',difficulty:1,template:'',description_zh:'' });

  const fetchList = () => fetch(API).then(r=>r.json()).then(d=>{setList(d);setLoading(false);});
  useEffect(() => { fetchList(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = edit ? `${API}/${edit.id}` : API;
    const method = edit ? 'PUT' : 'POST';
    const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(f) });
    if (r.ok) { fetchList(); setEdit(null); setF({id:'',name_zh:'',name_en:'',difficulty:1,template:'',description_zh:''}); }
    else { const err=await r.json(); alert(err.error||'Error'); }
  };

  const startEdit = (s: Structure) => { setEdit(s); setF({id:s.id,name_zh:s.name_zh,name_en:s.name_en,difficulty:s.difficulty,template:s.template,description_zh:s.description_zh||''}); };
  const handleDelete = async (id: string) => {
    if (!confirm(`Delete "${id}"?`)) return;
    await fetch(`${API}/${id}`, { method:'DELETE' }); fetchList();
  };

  const inp: React.CSSProperties = { padding:'6px 10px',borderRadius:'6px',border:'1px solid #E8E0D8',background:'#FFF8F5',color:'#4A4A4A',fontSize:'13px',width:'100%' };

  return (
    <div>
      <h3 style={{ marginBottom:'12px',color:'#4A4A4A' }}>{edit?'编辑结构':'新增结构'}</h3>
      <form onSubmit={handleSubmit} style={{ marginBottom:'20px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',maxWidth:'600px' }}>
        <input style={inp} placeholder="ID" value={f.id} onChange={e=>setF({...f,id:e.target.value})} disabled={!!edit} />
        <input style={inp} placeholder="中文名" value={f.name_zh} onChange={e=>setF({...f,name_zh:e.target.value})} />
        <input style={inp} placeholder="English" value={f.name_en} onChange={e=>setF({...f,name_en:e.target.value})} />
        <select style={inp} value={f.difficulty} onChange={e=>setF({...f,difficulty:+e.target.value})}>
          {[1,2,3,4,5].map(d=><option key={d} value={d}>L{d}</option>)}
        </select>
        <input style={{...inp,gridColumn:'span 2'}} placeholder="模板" value={f.template} onChange={e=>setF({...f,template:e.target.value})} />
        <textarea style={{...inp,gridColumn:'span 2',minHeight:'50px'}} placeholder="描述" value={f.description_zh} onChange={e=>setF({...f,description_zh:e.target.value})} />
        <div style={{gridColumn:'span 2',display:'flex',gap:'8px'}}>
          <button type="submit" style={{padding:'8px 20px',background:'#FFB3BA',border:'none',color:'#4A4A4A',borderRadius:'6px',cursor:'pointer',fontWeight:'bold'}}>{edit?'更新':'创建'}</button>
          {edit && <button type="button" onClick={()=>{setEdit(null);setF({id:'',name_zh:'',name_en:'',difficulty:1,template:'',description_zh:''});}} style={{padding:'8px 16px',background:'#fff',border:'1px solid #E8E0D8',color:'#4A4A4A',borderRadius:'6px',cursor:'pointer'}}>取消</button>}
        </div>
      </form>

      <h3 style={{marginBottom:'8px',color:'#4A4A4A'}}>已有结构 ({list.length})</h3>
      {loading ? <p style={{color:'#999'}}>加载中...</p> : (
        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
          {list.map(s=>(
            <div key={s.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',background:'#FFF8F5',borderRadius:'8px'}}>
              <div>
                <span style={{fontWeight:'bold',marginRight:'8px',color:'#4A4A4A'}}>{s.name_zh}</span>
                <span style={{color:'#999',fontSize:'11px',marginRight:'8px'}}>{s.id}</span>
                <span style={{color:'#FFB3BA',fontSize:'11px',padding:'2px 6px',background:'#FFF0EB',borderRadius:'4px'}}>L{s.difficulty}</span>
                <span style={{color:'#999',fontSize:'11px',marginLeft:'8px'}}>{s.template}</span>
                <span style={{color:'#ccc',fontSize:'11px',marginLeft:'8px'}}>{s.sentence_count} 例句</span>
              </div>
              <div style={{display:'flex',gap:'4px'}}>
                <button onClick={()=>startEdit(s)} style={{padding:'3px 8px',fontSize:'11px',background:'#BAE1FF',border:'none',color:'#4A4A4A',borderRadius:'4px',cursor:'pointer'}}>编辑</button>
                <button onClick={()=>handleDelete(s.id)} style={{padding:'3px 8px',fontSize:'11px',background:'#FFB3BA',border:'none',color:'#4A4A4A',borderRadius:'4px',cursor:'pointer'}}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
