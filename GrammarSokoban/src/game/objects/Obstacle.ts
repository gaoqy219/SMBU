import Phaser from 'phaser';
import { TILE_SIZE, DEPTH } from '../core/Constants.js';

const EMOJIS = ['🌳','🪨','🌲','🗿','🪵'];

export class Obstacle extends Phaser.GameObjects.Container {
  gridCol: number;
  gridRow: number;

  constructor(scene: Phaser.Scene, col: number, row: number) {
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE + TILE_SIZE / 2;
    super(scene, x, y);
    this.gridCol = col;
    this.gridRow = row;

    const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    const icon = new Phaser.GameObjects.Text(scene, 0, 0, emoji, {
      fontSize: `${TILE_SIZE - 4}px`,
    });
    icon.setOrigin(0.5);

    this.add(icon);
    this.setDepth(DEPTH.OBSTACLE);
    scene.add.existing(this);
  }
}
