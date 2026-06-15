import { Server, Socket } from 'socket.io';
import {
  createRoom, getRoom, addPlayer, removePlayer, updatePlayer,
  getPlayers, allReady, getAllRooms, deleteRoom
} from './RoomManager.js';
import { pickRounds, getAllSentencesForRounds, GrammarRound } from './GrammarPicker.js';
import { generateMap, GeneratedMap } from './MapGenerator.js';

interface GameState {
  roomCode:string; rounds:GrammarRound[]; currentRound:number; totalRounds:number;
  teamMaps:Map<number,GeneratedMap>;
  teamProgress:Map<number,number>;
  teamScores:Map<number,{roundsCompleted:number;teamId:number;color:string}>;
  finished:boolean;
}
const games=new Map<string,GameState>();

// Helper: send a round's map to a specific team, with per-player spawns
function sendRoundToTeam(io:Server, roomCode:string, teamId:number, round:GrammarRound, roundNum:number, totalRounds:number) {
  const gs=games.get(roomCode); if(!gs) return;
  const room=getRoom(roomCode); if(!room) return;
  const sentence=round.sentences.get(teamId); if(!sentence) return;

  const baseMap=generateMap(sentence.components,teamId);
  gs.teamMaps.set(teamId,baseMap);
  const teamPlayers=room.players.filter(p=>p.teamId===teamId);

  // Build occupied set from map
  const occupied=new Set<string>();
  for(const t of baseMap.targets) occupied.add(`${t.col},${t.row}`);
  for(const b of baseMap.boxes) occupied.add(`${b.col},${b.row}`);
  for(const o of baseMap.obstacles) occupied.add(`${o.col},${o.row}`);

  const spawnOffsets=[[0,0],[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]];
  const usedSpawns=new Set<string>();
  const teamPlayerInfo:Array<{id:string;name:string;color:string;col:number;row:number}>=[];

  for(const p of teamPlayers) {
    let sc=baseMap.playerStart.col, sr=baseMap.playerStart.row;
    for(const [ox,oy] of spawnOffsets) {
      const nc=Math.max(2,Math.min(baseMap.gridWidth-3,baseMap.playerStart.col+ox));
      const nr=Math.max(2,Math.min(baseMap.gridHeight-3,baseMap.playerStart.row+oy));
      const key=`${nc},${nr}`;
      if(!occupied.has(key)&&!usedSpawns.has(key)) { sc=nc; sr=nr; usedSpawns.add(key); break; }
    }
    teamPlayerInfo.push({id:p.socketId,name:p.name,color:p.color,col:sc,row:sr});
  }

  for(const p of teamPlayers) {
    const myInfo=teamPlayerInfo.find(tp=>tp.id===p.socketId)!;
    const others=teamPlayerInfo.filter(tp=>tp.id!==p.socketId);
    const playerMap={...baseMap,playerStart:{col:myInfo.col,row:myInfo.row}};
    io.to(p.socketId).emit('game:roundStart',{
      roundNum,totalRounds,
      structureId:round.structureId,structureName:round.nameZh,template:round.template,
      sentenceText:sentence.full_text,sentenceEnglish:sentence.english,
      components:sentence.components,mapData:playerMap,
      isCaptain:p.isCaptain, teamPlayers:others
    });
  }
  io.to(room.teacherSocketId).emit('game:roundStart',{round:roundNum,totalRounds});
}

function startNextRound(io:Server, roomCode:string) {
  const gs=games.get(roomCode); if(!gs||gs.finished) return;
  gs.currentRound++;
  if(gs.currentRound>gs.totalRounds) { endGame(io,roomCode,gs); return; }
  const round=gs.rounds[gs.currentRound-1];
  for(const [teamId] of round.sentences) {
    sendRoundToTeam(io,roomCode,teamId,round,gs.currentRound,gs.totalRounds);
  }
}

function endGame(io:Server, roomCode:string, gs:GameState) {
  gs.finished=true;
  const room=getRoom(roomCode);
  if(room) room.state='finished';

  const leaderboard=Array.from(gs.teamScores.values()).sort((a,b)=>b.roundsCompleted-a.roundsCompleted);
  const allSentences:string[]=[];
  for(const round of gs.rounds) for(const [,s] of round.sentences) allSentences.push(s.full_text);
  io.to(roomCode).emit('game:over',{leaderboard,allSentences});
}

export function setupGameHandlers(io:Server) {
  io.on('connection',(socket:Socket)=>{

    socket.on('teacher:createRoom',(data:{roomCode:string;teamCount:number;roundCount:number;membersPerTeam:number})=>{
      createRoom(data.roomCode,socket.id,data.teamCount,data.roundCount,data.membersPerTeam);
      socket.join(data.roomCode);
      socket.emit('room:created',{roomCode:data.roomCode});
    });

    socket.on('teacher:startGame',async(data:{roomCode:string})=>{
      const room=getRoom(data.roomCode); if(!room) return;
      room.state='playing';
      const rounds=await pickRounds(room.teamCount,room.roundCount);
      const gs:GameState={roomCode:data.roomCode,rounds,totalRounds:room.roundCount,currentRound:0,teamMaps:new Map(),teamProgress:new Map(),teamScores:new Map(),finished:false};
      for(let t=1;t<=room.teamCount;t++) gs.teamProgress.set(t,0);
      games.set(data.roomCode,gs);
      io.to(data.roomCode).emit('game:starting',{totalRounds:room.roundCount});
      setTimeout(()=>startNextRound(io,data.roomCode),2000);
    });

    socket.on('student:joinRoom',(data:{roomCode:string;name:string;teamId:number;color:string})=>{
      const room=getRoom(data.roomCode);
      if(!room) { socket.emit('error',{msg:'房间不存在'}); return; }
      const player={id:socket.id.substring(0,8),socketId:socket.id,name:data.name||'P1',teamId:data.teamId||1,color:data.color||'#FFB3BA',ready:false,isCaptain:false};
      if(!addPlayer(data.roomCode,player)) { socket.emit('error',{msg:'队伍已满'}); return; }
      socket.join(data.roomCode);
      // Send room config to the joining student
      socket.emit('room:config',{teamCount:room.teamCount,roundCount:room.roundCount,membersPerTeam:room.membersPerTeam});
      io.to(data.roomCode).emit('room:players',getPlayers(data.roomCode));
    });

    socket.on('student:updateInfo',(data:{roomCode:string;name:string;teamId:number;color:string})=>{
      updatePlayer(data.roomCode,socket.id,{name:data.name,teamId:data.teamId,color:data.color});
      io.to(data.roomCode).emit('room:players',getPlayers(data.roomCode));
    });

    socket.on('student:ready',(data:{roomCode:string;cancel?:boolean})=>{
      updatePlayer(data.roomCode,socket.id,{ready:!data.cancel});
      io.to(data.roomCode).emit('room:players',getPlayers(data.roomCode));
      if(!data.cancel&&allReady(data.roomCode)) io.to(data.roomCode).emit('room:allReady');
    });

    socket.on('player:move',(data:{roomCode:string;col:number;row:number;dx:number;dy:number})=>{
      socket.to(data.roomCode).emit('remote:playerMoved',{playerId:socket.id,col:data.col,row:data.row,dx:data.dx,dy:data.dy});
    });

    socket.on('box:moved',(data:{roomCode:string;boxKey:string;col:number;row:number})=>{
      socket.to(data.roomCode).emit('remote:boxMoved',{boxKey:data.boxKey,col:data.col,row:data.row});
    });

    socket.on('team:roundComplete',(data:{roomCode:string;teamId:number})=>{
      const gs=games.get(data.roomCode); if(!gs||gs.finished) return;
      const progress=(gs.teamProgress.get(data.teamId)||0)+1;
      gs.teamProgress.set(data.teamId,progress);
      const room=getRoom(data.roomCode);
      const tp=room?.players.filter(p=>p.teamId===data.teamId)||[];
      gs.teamScores.set(data.teamId,{roundsCompleted:progress,teamId:data.teamId,color:tp[0]?.color||'#ccc'});
      io.to(data.roomCode).emit('game:teamRoundComplete',{teamId:data.teamId,roundsCompleted:progress});

      // If team still has rounds left, send next round immediately
      if(progress<gs.totalRounds) {
        const nextRound=gs.rounds[progress];
        if(nextRound) sendRoundToTeam(io,data.roomCode,data.teamId,nextRound,progress+1,gs.totalRounds);
      } else {
        endGame(io,data.roomCode,gs);
      }
    });

    socket.on('captain:refreshMap',async(data:{roomCode:string;teamId:number})=>{
      const gs=games.get(data.roomCode); if(!gs) return;
      // Use team's actual progress, not global counter
      const teamProgress=gs.teamProgress.get(data.teamId)||0;
      const roundIdx=teamProgress; // 0-based: progress=0 means playing round 0
      const round=gs.rounds[roundIdx]; if(!round) return;
      sendRoundToTeam(io,data.roomCode,data.teamId,round,teamProgress+1,gs.totalRounds);
    });

    socket.on('disconnect',()=>{
      for(const room of getAllRooms()) {
        const before=room.players.length;
        removePlayer(room.code,socket.id);
        if(room.players.length<before) {
          io.to(room.code).emit('room:players',getPlayers(room.code));
        }
        if(room.players.length===0&&room.state==='finished') {
          deleteRoom(room.code); games.delete(room.code);
        }
      }
    });
  });
}
