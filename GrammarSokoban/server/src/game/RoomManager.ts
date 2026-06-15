interface Player {
  id:string; socketId:string; name:string; teamId:number; color:string; ready:boolean; isCaptain:boolean;
}

interface Room {
  code:string;
  teacherSocketId:string;
  teamCount:number; roundCount:number; membersPerTeam:number;
  players:Player[];
  state:'waiting'|'playing'|'finished';
  createdAt:Date;
}

const rooms=new Map<string,Room>();

export function createRoom(code:string,teacherSocketId:string,teamCount:number,roundCount:number,membersPerTeam:number): Room {
  const room:Room={code,teacherSocketId,teamCount,roundCount,membersPerTeam,players:[],state:'waiting',createdAt:new Date()};
  rooms.set(code,room);
  return room;
}

export function getRoom(code:string): Room|undefined { return rooms.get(code); }
export function deleteRoom(code:string) { rooms.delete(code); }
export function getAllRooms(): Room[] { return [...rooms.values()]; }

export function addPlayer(roomCode:string, player:Player): boolean {
  const room=rooms.get(roomCode); if(!room) return false;
  // If player with same socketId already exists, update them instead
  const existingIdx=room.players.findIndex(p=>p.socketId===player.socketId);
  if(existingIdx>=0) {
    const existing=room.players[existingIdx];
    existing.name=player.name||existing.name;
    existing.teamId=player.teamId||existing.teamId;
    existing.color=player.color||existing.color;
    return true;
  }
  // Enforce team capacity
  const teamCount=room.players.filter(p=>p.teamId===player.teamId).length;
  if(teamCount>=room.membersPerTeam) return false;
  // First player in team is captain
  if(teamCount===0) player.isCaptain=true;
  room.players.push(player);
  return true;
}

export function removePlayer(roomCode:string, socketId:string) {
  const room=rooms.get(roomCode); if(!room) return;
  room.players=room.players.filter(p=>p.socketId!==socketId);
  // Reassign captain if needed
  for(let t=1;t<=room.teamCount;t++) {
    const teamPlayers=room.players.filter(p=>p.teamId===t);
    if(teamPlayers.length>0&&!teamPlayers.some(p=>p.isCaptain)) {
      teamPlayers[0].isCaptain=true;
    }
  }
}

export function updatePlayer(roomCode:string, socketId:string, updates:{name?:string;teamId?:number;color?:string;ready?:boolean}) {
  const room=rooms.get(roomCode); if(!room) return;
  const p=room.players.find(p=>p.socketId===socketId); if(!p) return;
  if(updates.name!==undefined) p.name=updates.name;
  if(updates.teamId!==undefined) p.teamId=updates.teamId;
  if(updates.color!==undefined) p.color=updates.color;
  if(updates.ready!==undefined) p.ready=updates.ready;
}

export function allReady(roomCode:string): boolean {
  const room=rooms.get(roomCode); if(!room) return false;
  return room.players.length>0&&room.players.every(p=>p.ready);
}

export function getPlayers(roomCode:string): Player[] {
  return rooms.get(roomCode)?.players||[];
}

// Clean up old rooms (older than 2 hours)
export function cleanupRooms() {
  const now=new Date();
  for(const [code,room] of rooms) {
    if(now.getTime()-room.createdAt.getTime()>2*60*60*1000) rooms.delete(code);
  }
}
