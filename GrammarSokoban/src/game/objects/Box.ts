import Phaser from 'phaser';
import { TILE_SIZE, COLORS, DEPTH } from '../core/Constants.js';

export class Box extends Phaser.GameObjects.Container {
  boxKey: string; label: string; locked: boolean;
  gridCol: number; gridRow: number;
  isOnTarget=false; currentTarget: any=null;
  private bg: Phaser.GameObjects.Rectangle;
  private txt: Phaser.GameObjects.Text;

  constructor(scene:Phaser.Scene, key:string, col:number, row:number, label:string, locked=false) {
    const x=col*TILE_SIZE+TILE_SIZE/2, y=row*TILE_SIZE+TILE_SIZE/2;
    super(scene,x,y);
    this.boxKey=key; this.label=label; this.locked=locked; this.gridCol=col; this.gridRow=row;

    const bgColor=locked?COLORS.BOX_LOCKED:COLORS.BOX_BG;
    this.bg=new Phaser.GameObjects.Rectangle(scene,0,0,TILE_SIZE-4,TILE_SIZE-4,bgColor);
    this.bg.setStrokeStyle(locked?2:1,locked?0x999999:0x8d6e4c);
    this.add(this.bg);

    const fs=label.length>3?'16px':label.length>2?'18px':'22px';
    this.txt=new Phaser.GameObjects.Text(scene,0,0,label,{
      fontSize:fs,fontFamily:'"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif',color:'#4A4A4A',fontStyle:'bold',align:'center'
    });
    this.txt.setOrigin(0.5);
    this.add(this.txt);

    if(locked) {
      const lock=new Phaser.GameObjects.Text(scene,TILE_SIZE/2-16,-TILE_SIZE/2+6,'🔒',{fontSize:'10px'});
      lock.setOrigin(0,0); this.add(lock);
    }
    this.setDepth(DEPTH.BOX);
    scene.add.existing(this);
  }

  setGrid(c:number,r:number) { this.gridCol=c;this.gridRow=r; }
  markCorrect() { this.bg.setFillStyle(COLORS.BOX_OK,0.4); this.bg.setStrokeStyle(2,0x4caf50); }
  markWrong() { this.bg.setFillStyle(COLORS.BOX_ERR,0.3); this.bg.setStrokeStyle(2,0xf44336); }
  markNeutral() { this.bg.setFillStyle(this.locked?COLORS.BOX_LOCKED:COLORS.BOX_BG); this.bg.setStrokeStyle(this.locked?2:1,this.locked?0x999999:0x8d6e4c); }
}
