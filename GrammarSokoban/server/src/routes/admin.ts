import { Router } from 'express';
import { getDb, saveDb } from '../db/connection.js';

export const adminRouter = Router();

// ── Structures CRUD ──
adminRouter.get('/structures', async (_req, res) => {
  const db = await getDb();
  const r = db.exec(`
    SELECT s.*, COUNT(sen.id) as sentence_count
    FROM grammar_structures s LEFT JOIN sentences sen ON sen.structure_id=s.id
    GROUP BY s.id ORDER BY s.difficulty, s.id
  `);
  const cols=r[0]?.columns??[], rows=r[0]?.values??[];
  res.json(rows.map(row=>{const o:any={};cols.forEach((c,i)=>o[c]=row[i]);return o;}));
});

adminRouter.get('/structures/:id', async (req, res) => {
  const db = await getDb();
  const r=db.exec('SELECT * FROM grammar_structures WHERE id=?',[req.params.id]);
  if(!r[0]?.values.length){res.status(404).json({error:'Not found'});return;}
  const row=r[0].values[0],cols=r[0].columns,o:any={};
  cols.forEach((c,i)=>o[c]=row[i]); res.json(o);
});

adminRouter.post('/structures', async (req, res) => {
  const db=await getDb();
  const {id,name_zh,name_en,difficulty,template,description_zh}=req.body;
  if(!id||!name_zh||!difficulty||!template){res.status(400).json({error:'Missing fields'});return;}
  try{
    db.run(`INSERT INTO grammar_structures (id,name_zh,name_en,difficulty,template,description_zh) VALUES (?,?,?,?,?,?)`,
      [id,name_zh,name_en||'',difficulty,template,description_zh||'']);
    saveDb(); res.status(201).json({id});
  }catch(e:any){res.status(409).json({error:e.message});}
});

adminRouter.put('/structures/:id', async (req, res) => {
  const db=await getDb();
  const e=db.exec('SELECT * FROM grammar_structures WHERE id=?',[req.params.id]);
  if(!e[0]?.values.length){res.status(404).json({error:'Not found'});return;}
  const fields=['name_zh','name_en','difficulty','template','description_zh'];
  const up:string[]=[],vals:any[]=[];
  for(const f of fields)if(req.body[f]!==undefined){up.push(`${f}=?`);vals.push(req.body[f]);}
  if(up.length){up.push("updated_at=datetime('now')");vals.push(req.params.id);db.run(`UPDATE grammar_structures SET ${up.join(',')} WHERE id=?`,vals);saveDb();}
  res.json({id:req.params.id});
});

adminRouter.delete('/structures/:id', async (req, res) => {
  const db=await getDb();
  db.run('DELETE FROM grammar_structures WHERE id=?',[req.params.id]); saveDb();
  res.json({ok:true});
});

// ── Sentences CRUD ──
adminRouter.get('/sentences', async (req, res) => {
  const db=await getDb();
  const sid=req.query.structure_id as string|undefined;
  let sql='SELECT * FROM sentences'; const params:any[]=[];
  if(sid){sql+=' WHERE structure_id=?'; params.push(sid);}
  sql+=' ORDER BY difficulty, id';
  const r=db.exec(sql,params),cols=r[0]?.columns??[],rows=r[0]?.values??[];
  res.json(rows.map(row=>{const o:any={};cols.forEach((c,i)=>o[c]=row[i]);return o;}));
});

adminRouter.get('/sentences/:id', async (req, res) => {
  const db=await getDb();
  const sr=db.exec('SELECT * FROM sentences WHERE id=?',[req.params.id]);
  if(!sr[0]?.values.length){res.status(404).json({error:'Not found'});return;}
  const row=sr[0].values[0],cols=sr[0].columns,s:any={};
  cols.forEach((c,i)=>s[c]=row[i]);
  const cr=db.exec('SELECT * FROM sentence_components WHERE sentence_id=? ORDER BY position',[req.params.id]);
  const ccols=cr[0]?.columns??[],crows=cr[0]?.values??[];
  s.components=crows.map(r=>{const o:any={};ccols.forEach((c,i)=>o[c]=r[i]);return o;});
  res.json(s);
});

adminRouter.post('/sentences', async (req, res) => {
  const db=await getDb();
  const {id,structure_id,english,difficulty,components}=req.body;
  if(!id||!structure_id||!components?.length){res.status(400).json({error:'Missing fields'});return;}
  try{
    const ft=components.map((c:any)=>c.text).join('');
    db.run(`INSERT INTO sentences (id,structure_id,english,difficulty,full_text) VALUES (?,?,?,?,?)`,[id,structure_id,english||'',difficulty||1,ft]);
    const ins=db.prepare(`INSERT INTO sentence_components (sentence_id,position,text,pinyin,role) VALUES (?,?,?,?,?)`);
    for(let i=0;i<components.length;i++){const c=components[i];ins.run([id,i,c.text,c.pinyin||'',c.role||'']);}
    ins.free(); saveDb(); res.status(201).json({id});
  }catch(e:any){res.status(409).json({error:e.message});}
});

adminRouter.put('/sentences/:id', async (req, res) => {
  const db=await getDb();
  const e=db.exec('SELECT * FROM sentences WHERE id=?',[req.params.id]);
  if(!e[0]?.values.length){res.status(404).json({error:'Not found'});return;}
  const {english,difficulty,components}=req.body;
  if(english!==undefined||difficulty!==undefined){
    const up:string[]=[],vals:any[]=[];
    if(english!==undefined){up.push('english=?');vals.push(english);}
    if(difficulty!==undefined){up.push('difficulty=?');vals.push(difficulty);}
    if(up.length){vals.push(req.params.id);db.run(`UPDATE sentences SET ${up.join(',')} WHERE id=?`,vals);}
  }
  if(components){
    const ft=components.map((c:any)=>c.text).join('');
    db.run('UPDATE sentences SET full_text=? WHERE id=?',[ft,req.params.id]);
    db.run('DELETE FROM sentence_components WHERE sentence_id=?',[req.params.id]);
    const ins=db.prepare(`INSERT INTO sentence_components (sentence_id,position,text,pinyin,role) VALUES (?,?,?,?,?)`);
    for(let i=0;i<components.length;i++){const c=components[i];ins.run([req.params.id,i,c.text,c.pinyin||'',c.role||'']);}
    ins.free();
  }
  saveDb(); res.json({id:req.params.id});
});

adminRouter.delete('/sentences/:id', async (req, res) => {
  const db=await getDb();
  db.run('DELETE FROM sentences WHERE id=?',[req.params.id]); saveDb();
  res.json({ok:true});
});
