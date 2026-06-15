export interface MoveRecord {
  playerFrom: {col:number;row:number};
  playerTo: {col:number;row:number};
  pushedBoxId: string|null;
  boxFrom: {col:number;row:number}|null;
  boxTo: {col:number;row:number}|null;
}

export interface MapData {
  gridWidth: number;
  gridHeight: number;
  wallData: number[][];
  playerStart: {col:number;row:number};
  boxes: {key:string;col:number;row:number;label:string;locked:boolean}[];
  targets: {col:number;row:number;expectedLabel:string;orderIndex:number}[];
  obstacles: {col:number;row:number}[];
}

export class GameState {
  steps=0;
  undoStack:MoveRecord[]=[];
  isComplete=false;
  mapData:MapData|null=null;
  sentenceText='';
  sentenceEnglish='';
  structureName='';
  roundNum=0;
  totalRounds=0;
  teamId=0;

  reset() { this.steps=0;this.undoStack=[];this.isComplete=false; }
  addMove(r:MoveRecord) { this.undoStack.push(r);this.steps++; }
  popMove() { return this.undoStack.pop(); }
}
export const gameState = new GameState();
