import { getDb } from '../db/connection.js';

interface Component { text:string;pinyin:string;role:string; }
interface Sentence { id:string;full_text:string;english:string;components:Component[]; }
interface GrammarRound {
  structureId:string; nameZh:string; template:string;
  sentences:Map<number,Sentence>; // teamId -> sentence
}

export async function pickRounds(teamCount:number, roundCount:number): Promise<GrammarRound[]> {
  const db=await getDb();
  const rounds:GrammarRound[]=[];

  // Get all structures with sentence counts
  const structsResult=db.exec(`
    SELECT g.id,g.name_zh,g.template,COUNT(s.id) as cnt
    FROM grammar_structures g
    JOIN sentences s ON s.structure_id=g.id
    GROUP BY g.id HAVING cnt>=?
    ORDER BY RANDOM()
    LIMIT ?
  `,[teamCount,roundCount]);

  const structIds=(structsResult[0]?.values||[]).map(r=>r[0] as string);
  if(structIds.length===0) throw new Error('Not enough grammar structures with sufficient sentences');

  for(let r=0;r<roundCount;r++) {
    const sid=structIds[r%structIds.length];
    const sInfo=db.exec(`SELECT name_zh,template FROM grammar_structures WHERE id=?`,[sid]);
    const nameZh=sInfo[0]?.values[0][0] as string||'';
    const template=sInfo[0]?.values[0][1] as string||'';

    // Pick different sentences for each team
    const sentResult=db.exec(`
      SELECT s.id,s.full_text,s.english FROM sentences s
      WHERE s.structure_id=? ORDER BY RANDOM() LIMIT ?
    `,[sid,teamCount]);

    const sentences=new Map<number,Sentence>();
    const sents=(sentResult[0]?.values||[]);
    for(let t=0;t<teamCount;t++) {
      const sRow=sents[t%Math.min(sents.length,teamCount)];
      if(!sRow) continue;

      // Load components
      const comps=db.exec(
        `SELECT text,pinyin,role FROM sentence_components WHERE sentence_id=? ORDER BY position`,[sRow[0] as string]
      );
      const components=(comps[0]?.values||[]).map(c=>({
        text:c[0] as string,pinyin:c[1] as string,role:c[2] as string
      }));

      sentences.set(t+1,{
        id:sRow[0] as string,full_text:sRow[1] as string,english:sRow[2] as string,components
      });
    }

    rounds.push({structureId:sid,nameZh,template,sentences});
  }
  return rounds;
}

export async function getAllSentencesForRounds(rounds:GrammarRound[]): Promise<string[]> {
  const all:string[]=[];
  for(const r of rounds) {
    for(const [,s] of r.sentences) {
      all.push(s.full_text);
    }
  }
  return all;
}
