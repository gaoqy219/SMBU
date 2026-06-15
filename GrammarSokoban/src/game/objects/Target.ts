import Phaser from 'phaser';
import { TILE_SIZE, COLORS, DEPTH } from '../core/Constants.js';

const NUMS = ['①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];

export class Target extends Phaser.GameObjects.Container {
  expectedLabel: string; orderIndex: number; gridCol: number; gridRow: number;
  satisfied=false; occupiedByWrong=false;
  private bg: Phaser.GameObjects.Rectangle;
  private numText: Phaser.GameObjects.Text;

  constructor(scene:Phaser.Scene, col:number, row:number, expectedLabel:string, orderIndex:number) {
    const x=col*TILE_SIZE+TILE_SIZE/2, y=row*TILE_SIZE+TILE_SIZE/2;
    super(scene,x,y);
    this.expectedLabel=expectedLabel; this.orderIndex=orderIndex; this.gridCol=col; this.gridRow=row;

    this.bg=new Phaser.GameObjects.Rectangle(scene,0,0,TILE_SIZE-6,TILE_SIZE-6,COLORS.TARGET,0.6);
    this.bg.setStrokeStyle(2,0xc8bfb8);
    this.add(this.bg);

    const label=NUMS[orderIndex]||`${orderIndex+1}`;
    this.numText=new Phaser.GameObjects.Text(scene,0,1,label,{
      fontSize:'20px',fontFamily:'"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif',color:'#999',align:'center'
    });
    this.numText.setOrigin(0.5);
    this.add(this.numText);

    this.setDepth(DEPTH.TARGET);
    scene.add.existing(this);

    // Pulse animation
    scene.tweens.add({ targets:this.bg,alpha:{from:0.5,to:0.8},duration:800,yoyo:true,repeat:-1 });
  }

  markCorrect() { this.satisfied=true;this.occupiedByWrong=false;this.bg.setFillStyle(COLORS.TARGET_OK,0.5);this.bg.setStrokeStyle(2,0x4caf50);this.numText.setColor('#4caf50'); }
  markWrong() { this.satisfied=false;this.occupiedByWrong=true;this.bg.setFillStyle(COLORS.TARGET_ERR,0.3);this.bg.setStrokeStyle(2,0xf44336);this.numText.setColor('#f44336'); }
  markEmpty() { this.satisfied=false;this.occupiedByWrong=false;this.bg.setFillStyle(COLORS.TARGET,0.6);this.bg.setStrokeStyle(2,0xc8bfb8);this.numText.setColor('#999'); }
}
