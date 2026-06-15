import Phaser from 'phaser';
import { TILE_SIZE, DEPTH } from '../core/Constants.js';

export class Player extends Phaser.GameObjects.Container {
  gridCol: number; gridRow: number;
  playerId: string; playerName: string; color: number;

  constructor(scene:Phaser.Scene, col:number, row:number, playerId:string, name:string, color:number) {
    const x=col*TILE_SIZE+TILE_SIZE/2, y=row*TILE_SIZE+TILE_SIZE/2;
    super(scene,x,y);
    this.gridCol=col; this.gridRow=row; this.playerId=playerId; this.playerName=name; this.color=color;

    this.add(new Phaser.GameObjects.Ellipse(scene,0,0,TILE_SIZE-6,TILE_SIZE-6,color)
      .setStrokeStyle(2,0x4a4a4a));

    this.add(new Phaser.GameObjects.Text(scene,0,0,name,{
      fontSize:'14px',
      fontFamily:'"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif',
      color:'#4A4A4A',align:'center',fontStyle:'bold'
    }).setOrigin(0.5));

    this.setDepth(DEPTH.PLAYER);
    scene.add.existing(this);
  }

  setGrid(col:number,row:number) { this.gridCol=col;this.gridRow=row; }
}
