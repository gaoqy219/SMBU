// Random Sokoban map generator with BFS solvability check

interface BoxDef { key:string;col:number;row:number;label:string;locked:boolean; }
interface TargetDef { col:number;row:number;expectedLabel:string;orderIndex:number; }
interface ObstacleDef { col:number;row:number; }

export interface GeneratedMap {
  gridWidth:number; gridHeight:number;
  wallData:number[][];
  playerStart:{col:number;row:number};
  boxes:BoxDef[];
  targets:TargetDef[];
  obstacles:ObstacleDef[];
}

const GRID=15;

export function generateMap(components:{text:string;role:string}[], teamId:number): GeneratedMap {
  const numBoxes=components.length;
  const maxAttempts=50;

  for(let attempt=0;attempt<maxAttempts;attempt++) {
    const map=tryGenerate(components,numBoxes);
    if(verifySolvable(map)) return map;
  }
  // Fallback: last attempt
  return tryGenerate(components,numBoxes);
}

function tryGenerate(components:{text:string;role:string}[], numBoxes:number): GeneratedMap {
  const wallData:number[][]=Array.from({length:GRID},()=>Array(GRID).fill(0));
  for(let c=0;c<GRID;c++) { wallData[0][c]=1; wallData[GRID-1][c]=1; }
  for(let r=0;r<GRID;r++) { wallData[r][0]=1; wallData[r][GRID-1]=1; }

  const occupied=new Set<string>();
  const markerWords=new Set(['把','被','一','就','如果','连','都','的','得','了','过','着','比','从','到','在','给','是','也','正在','和','跟']);

  // 1. Place targets — horizontal row
  const targetRow=11+Math.floor(Math.random()*2);
  const startCol=Math.floor((GRID-numBoxes)/2);
  const targets:TargetDef[]=[];

  for(let i=0;i<numBoxes;i++) {
    const tc=startCol+i;
    targets.push({col:tc,row:targetRow,expectedLabel:components[i].text,orderIndex:i});
    occupied.add(`${tc},${targetRow}`);
  }

  // 2. Place obstacles FIRST (so boxes can avoid them)
  const obstacles:ObstacleDef[]=[];
  const obstacleCount=6+Math.floor(Math.random()*5); // 6-10 obstacles

  for(let i=0;i<obstacleCount;i++) {
    for(let tries=0;tries<30;tries++) {
      const oc=2+Math.floor(Math.random()*(GRID-4));
      const or=2+Math.floor(Math.random()*(GRID-4));
      const key=`${oc},${or}`;
      if(occupied.has(key)) continue;
      // Don't block target row entirely
      if(or===targetRow && oc>=startCol && oc<startCol+numBoxes) continue;
      obstacles.push({col:oc,row:or});
      occupied.add(key);
      break;
    }
  }

  // 3. Collect all free cells for random box placement
  const isWallOrBorder=(c:number,r:number)=>c<=1||c>=GRID-2||r<=1||r>=GRID-2||wallData[r]?.[c]===1;
  const freeCells:Array<[number,number]>=[];

  for(let r=2;r<GRID-2;r++) {
    for(let c=2;c<GRID-2;c++) {
      if(!isWallOrBorder(c,r)&&!occupied.has(`${c},${r}`)) {
        freeCells.push([c,r]);
      }
    }
  }

  // Shuffle free cells (Fisher-Yates)
  for(let i=freeCells.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [freeCells[i],freeCells[j]]=[freeCells[j],freeCells[i]];
  }

  // 4. Place boxes randomly from shuffled free cells
  const boxes:BoxDef[]=[];
  let cellIdx=0;

  for(let i=0;i<numBoxes;i++) {
    const locked=markerWords.has(components[i].text);
    let bc:number, br:number;

    if(locked) {
      // Locked boxes stay on their target
      bc=startCol+i; br=targetRow;
      // Don't consume a free cell for locked boxes
    } else {
      if(cellIdx<freeCells.length) {
        [bc,br]=freeCells[cellIdx++];
      } else {
        // Fallback: place near target
        bc=startCol+i; br=targetRow-1;
      }
    }
    const key=`${bc},${br}`;
    occupied.add(key);
    boxes.push({key:`b_${i}`,col:bc,row:br,label:components[i].text,locked});
  }

  // 5. Player start — use remaining free cells (away from boxes)
  let psCol=3, psRow=3;
  if(cellIdx<freeCells.length) {
    [psCol,psRow]=freeCells[cellIdx];
  } else {
    for(let r=2;r<GRID-2;r++) {
      for(let c=2;c<GRID-2;c++) {
        if(!occupied.has(`${c},${r}`)) { psCol=c; psRow=r; break; }
      }
    }
  }

  return {gridWidth:GRID,gridHeight:GRID,wallData,playerStart:{col:psCol,row:psRow},boxes,targets,obstacles};
}

// BFS over Sokoban state space (simplified: just check reachability)
function verifySolvable(map:GeneratedMap): boolean {
  // Quick check: can player reach all boxes?
  const wallData=map.wallData;
  const obstacles=new Set(map.obstacles.map(o=>`${o.col},${o.row}`));
  const boxPositions=new Set(map.boxes.map(b=>`${b.col},${b.row}`));
  const targetPositions=new Set(map.targets.map(t=>`${t.col},${t.row}`));

  // BFS from player start to check reachable area
  const visited=new Set<string>();
  const queue:[number,number][]=[[map.playerStart.col,map.playerStart.row]];
  visited.add(`${queue[0][0]},${queue[0][1]}`);

  while(queue.length) {
    const [c,r]=queue.shift()!;
    for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const nc=c+dx, nr=r+dy;
      const key=`${nc},${nr}`;
      if(visited.has(key)) continue;
      if(nc<0||nc>=GRID||nr<0||nr>=GRID) continue;
      if(wallData[nr][nc]===1) continue;
      if(obstacles.has(key)) continue;
      if(boxPositions.has(key)) continue; // boxes block movement too
      visited.add(key);
      queue.push([nc,nr]);
    }
  }

  // Check each box is reachable (player can stand next to it)
  for(const b of map.boxes) {
    let canReach=false;
    for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const nc=b.col+dx, nr=b.row+dy;
      if(visited.has(`${nc},${nr}`)) { canReach=true; break; }
    }
    if(!canReach) return false;
  }

  // Each box must have a path to its target (simple BFS ignoring other boxes)
  for(let i=0;i<map.boxes.length;i++) {
    const b=map.boxes[i];
    const t=map.targets.find(tg=>tg.expectedLabel===b.label);
    if(!t) continue;
    if(!hasPath(b.col,b.row,t.col,t.row,wallData,obstacles,boxPositions,b.col,b.row)) return false;
  }

  return true;
}

function hasPath(sx:number,sy:number,ex:number,ey:number,wallData:number[][],obstacles:Set<string>,boxPositions:Set<string>,excludeBx:number,excludeBy:number): boolean {
  const visited=new Set<string>();
  const queue:[number,number][]=[[sx,sy]];
  visited.add(`${sx},${sy}`);
  while(queue.length) {
    const [c,r]=queue.shift()!;
    if(c===ex&&r===ey) return true;
    for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const nc=c+dx, nr=r+dy;
      const key=`${nc},${nr}`;
      if(visited.has(key)) continue;
      if(nc<0||nc>=GRID||nr<0||nr>=GRID) continue;
      if(wallData[nr][nc]===1) continue;
      if(obstacles.has(key)) continue;
      if(boxPositions.has(key)&&!(nc===excludeBx&&nr===excludeBy)) continue;
      visited.add(key);
      queue.push([nc,nr]);
    }
  }
  return false;
}
