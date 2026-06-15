import Phaser from 'phaser';
import { TILE_SIZE, TEAM_COLORS_HEX, EVENTS } from '../core/Constants.js';
import { EventBus } from '../core/EventBus.js';
import { gameState, MapData } from '../core/GameState.js';
import { parseMap, GridObjects } from '../systems/GridSystem.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { InputSystem } from '../systems/InputSystem.js';

export class GameScene extends Phaser.Scene {
  grid: GridObjects|null=null;
  movement: MovementSystem|null=null;
  inputSys: InputSystem|null=null;
  localPlayerId='';
  localName='';
  localColor=0;
  mapData: MapData|null=null;

  constructor() { super({key:'GameScene'}); }

  init(data:any) {
    this.localPlayerId=data.playerId||'';
    this.localName=data.playerName||'P1';
    this.localColor=data.playerColor||TEAM_COLORS_HEX[0];
  }

  create() {
    // Wait for map data from server via EventBus
    EventBus.on('LOAD_MAP', (data:MapData, roundNum:number, totalRounds:number,
      structureName:string, sentenceText:string, sentenceEnglish:string, teamPlayers?:any[]) => {
      this.loadMap(data,roundNum,totalRounds,structureName,sentenceText,sentenceEnglish,teamPlayers);
    });

    // Listen for remote player updates
    EventBus.on('REMOTE_PLAYER_ADDED', (pid:string,col:number,row:number,name:string,color:number) => {
      this.movement?.addRemotePlayer(pid,col,row,name,color);
    });
    EventBus.on('REMOTE_PLAYER_MOVED', (pid:string,col:number,row:number) => {
      this.movement?.moveRemotePlayer(pid,col,row);
    });
    EventBus.on('REMOTE_PLAYER_LEFT', (pid:string) => {
      this.movement?.removeRemotePlayer(pid);
    });
    EventBus.on('REMOTE_BOX_MOVED', (boxKey:string,col:number,row:number) => {
      this.movement?.moveRemoteBox(boxKey,col,row);
    });
  }

  private loadMap(data:MapData, roundNum:number, totalRounds:number,
    structureName:string, sentenceText:string, sentenceEnglish:string, teamPlayers?:any[]) {
    // Clean up previous
    this.cleanup();

    gameState.reset();
    gameState.mapData=data;
    gameState.roundNum=roundNum;
    gameState.totalRounds=totalRounds;
    gameState.structureName=structureName;
    gameState.sentenceText=sentenceText;
    gameState.sentenceEnglish=sentenceEnglish;

    this.mapData=data;

    // Parse and spawn
    this.grid=parseMap(this,data,this.localPlayerId,this.localName,this.localColor);
    this.movement=new MovementSystem(this,this.grid,data);

    // Create remote player avatars for other team members
    if(teamPlayers) {
      for(const tp of teamPlayers) {
        const hexColor=parseInt(tp.color.replace('#',''),16);
        this.movement.addRemotePlayer(tp.id,tp.col,tp.row,tp.name,hexColor);
      }
    }

    // Input
    this.inputSys=new InputSystem(this,(dx,dy)=>{
      const ok=this.movement?.tryMove(dx,dy);
      if(ok) {
        // Sync to server
        const p=this.grid!.player;
        EventBus.emit('PLAYER_MOVED',{playerId:this.localPlayerId,col:p.gridCol,row:p.gridRow,dx,dy});
      }
    });

    // Camera
    const w=data.gridWidth*TILE_SIZE, h=data.gridHeight*TILE_SIZE;
    this.cameras.main.setBounds(0,0,w,h);
    this.cameras.main.centerOn(w/2,h/2);
    this.cameras.main.setZoom(1.0);

    EventBus.emit(EVENTS.LEVEL_READY,{roundNum,totalRounds,structureName,sentenceText});
  }

  private cleanup() {
    this.inputSys?.destroy();
    this.inputSys=null;
    this.movement?.destroy();
    this.movement=null;
    this.grid=null;
    this.children.removeAll(true);
  }

  shutdown() { this.cleanup(); }
}
