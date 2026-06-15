import Phaser from 'phaser';

export class InputSystem {
  private scene: Phaser.Scene;
  private onMove: (dx: number, dy: number) => void;

  constructor(scene: Phaser.Scene, onMove: (dx: number, dy: number) => void) {
    this.scene = scene;
    this.onMove = onMove;
    this.setupKeyboard();

    // Prevent default browser drag/scroll on canvas
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.downElement === scene.game.canvas) {
        scene.game.canvas.style.touchAction = 'none';
      }
    });
  }

  private setupKeyboard() {
    const kb = this.scene.input.keyboard!;
    if (!kb) return;

    const up = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const down = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const left = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    const right = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    const w = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    const a = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    const s = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    const d = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    const keys = [up, down, left, right, w, a, s, d];

    const check = () => {
      if (up.isDown || w.isDown) this.onMove(0, -1);
      else if (down.isDown || s.isDown) this.onMove(0, 1);
      else if (left.isDown || a.isDown) this.onMove(-1, 0);
      else if (right.isDown || d.isDown) this.onMove(1, 0);
    };

    for (const k of keys) {
      k.removeAllListeners();
      k.on('down', check);
    }
  }

  destroy() {
    this.scene.input.keyboard?.removeAllKeys();
  }
}
