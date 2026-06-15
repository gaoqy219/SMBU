import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene.js';

export function createGameConfig(parent:string, playerId:string, playerName:string, playerColor:number): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 720,
    height: 720,
    backgroundColor: '#FFF5F0',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [GameScene],
    input: {
      keyboard: true,
      touch: true,
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
    callbacks: {
      preBoot: (game) => {
        // Pass player info to scene init
        game.scene.start('GameScene', { playerId, playerName, playerColor });
      },
    },
  };
}
