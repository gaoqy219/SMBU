import Phaser from 'phaser';
import { TILE_SIZE, COLORS, DEPTH } from '../core/Constants.js';
import { MapData } from '../core/GameState.js';
import { Player } from '../objects/Player.js';
import { Box } from '../objects/Box.js';
import { Target } from '../objects/Target.js';
import { Obstacle } from '../objects/Obstacle.js';

export interface GridObjects {
  player: Player;
  remotePlayers: Map<string, Player>;
  boxes: Map<string, Box>;
  targets: Target[];
  obstacles: Obstacle[];
}

export function parseMap(scene:Phaser.Scene, data:MapData, localPlayerId:string, localName:string, localColor:number): GridObjects {
  // Floors
  for(let r=0;r<data.gridHeight;r++){
    for(let c=0;c<data.gridWidth;c++){
      if(data.wallData[r]?.[c]===1) continue;
      const color=(c+r)%2===0?COLORS.FLOOR_A:COLORS.FLOOR_B;
      const floor=new Phaser.GameObjects.Rectangle(scene,c*TILE_SIZE+TILE_SIZE/2,r*TILE_SIZE+TILE_SIZE/2,TILE_SIZE,TILE_SIZE,color);
      floor.setDepth(DEPTH.FLOOR); scene.add.existing(floor);
    }
  }

  // Walls
  for(let r=0;r<data.gridHeight;r++){
    for(let c=0;c<data.gridWidth;c++){
      if(data.wallData[r]?.[c]!==1) continue;
      const w=new Phaser.GameObjects.Rectangle(scene,c*TILE_SIZE+TILE_SIZE/2,r*TILE_SIZE+TILE_SIZE/2,TILE_SIZE,TILE_SIZE,COLORS.WALL);
      w.setStrokeStyle(1,COLORS.WALL_TOP);
      w.setDepth(DEPTH.FLOOR+1); scene.add.existing(w);
    }
  }

  // Obstacles
  const obstacles:Obstacle[]=[];
  for(const o of data.obstacles||[]) {
    obstacles.push(new Obstacle(scene,o.col,o.row));
  }

  // Targets
  const targets:Target[]=[];
  for(const t of data.targets) {
    targets.push(new Target(scene,t.col,t.row,t.expectedLabel,t.orderIndex));
  }

  // Boxes
  const boxes=new Map<string,Box>();
  for(const b of data.boxes) {
    const box=new Box(scene,b.key,b.col,b.row,b.label,b.locked);
    boxes.set(b.key,box);
    if(b.locked) {
      const matched=targets.find(t=>t.gridCol===b.col&&t.gridRow===b.row);
      if(matched) { box.isOnTarget=true;box.currentTarget=matched;box.markCorrect();matched.markCorrect(); }
    }
  }

  // Local player
  const pStart=data.playerStart||{col:1,row:1};
  const player=new Player(scene,pStart.col,pStart.row,localPlayerId,localName,localColor);

  return { player, remotePlayers:new Map(), boxes, targets, obstacles };
}

export function isWalkable(col:number,row:number,gridW:number,gridH:number,wallData:number[][],boxes:Map<string,Box>,obstacles:Obstacle[],remotePlayers:Map<string,Player>,excludeBox?:string): boolean {
  if(col<0||col>=gridW||row<0||row>=gridH) return false;
  if(wallData[row]?.[col]===1) return false;
  // Obstacle check
  for(const o of obstacles) {
    const ox=o.x, oy=o.y;
    if(Math.abs(ox-(col*TILE_SIZE+TILE_SIZE/2))<1 && Math.abs(oy-(row*TILE_SIZE+TILE_SIZE/2))<1) return false;
  }
  // Box check
  for(const [k,b] of boxes) {
    if(k===excludeBox) continue;
    if(b.gridCol===col&&b.gridRow===row) return false;
  }
  // Remote player check (collision!)
  for(const [,rp] of remotePlayers) {
    if(rp.gridCol===col&&rp.gridRow===row) return false;
  }
  return true;
}

export function getBoxAt(col:number,row:number,boxes:Map<string,Box>,excludeKey?:string): Box|null {
  for(const [k,b] of boxes) { if(k===excludeKey) continue; if(b.gridCol===col&&b.gridRow===row) return b; }
  return null;
}
