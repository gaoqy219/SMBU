import Phaser from 'phaser';
import { TILE_SIZE, ANIM, EVENTS } from '../core/Constants.js';
import { EventBus } from '../core/EventBus.js';
import { gameState, MoveRecord, MapData } from '../core/GameState.js';
import { GridObjects, isWalkable, getBoxAt } from './GridSystem.js';
import { Player } from '../objects/Player.js';

export class MovementSystem {
  private scene: Phaser.Scene;
  grid: GridObjects;
  private data: MapData;
  isMoving = false;

  constructor(scene: Phaser.Scene, grid: GridObjects, data: MapData) {
    this.scene = scene; this.grid = grid; this.data = data;
  }

  tryMove(dx: number, dy: number): boolean {
    if (this.isMoving || gameState.isComplete) return false;

    const p = this.grid.player;
    const tc = p.gridCol + dx;
    const tr = p.gridRow + dy;

    // Check bounds and walls first — fast return
    if (tc < 0 || tc >= this.data.gridWidth || tr < 0 || tr >= this.data.gridHeight) return false;
    if (this.data.wallData[tr]?.[tc] === 1) return false;

    // Check obstacles by grid position
    for (const o of this.grid.obstacles) {
      if ((o as any).gridCol === tc && (o as any).gridRow === tr) return false;
    }

    // Check remote players (collision)
    for (const [, rp] of this.grid.remotePlayers) {
      if (rp.gridCol === tc && rp.gridRow === tr) return false;
    }

    // Is there a box at the target tile?
    const box = getBoxAt(tc, tr, this.grid.boxes);
    if (box) {
      if (box.locked) return false;

      const pc = tc + dx;
      const pr = tr + dy;

      // Check push destination
      if (pc < 0 || pc >= this.data.gridWidth || pr < 0 || pr >= this.data.gridHeight) return false;
      if (this.data.wallData[pr]?.[pc] === 1) return false;

      for (const o of this.grid.obstacles) {
        if ((o as any).gridCol === pc && (o as any).gridRow === pr) return false;
      }
      if (getBoxAt(pc, pr, this.grid.boxes)) return false;

      // Execute push
      this.isMoving = true;
      const record: MoveRecord = {
        playerFrom: { col: p.gridCol, row: p.gridRow },
        playerTo: { col: tc, row: tr },
        pushedBoxId: box.boxKey,
        boxFrom: { col: box.gridCol, row: box.gridRow },
        boxTo: { col: pc, row: pr },
      };

      if (box.isOnTarget && box.currentTarget) {
        box.currentTarget.markEmpty();
        box.isOnTarget = false;
        box.currentTarget = null;
        box.markNeutral();
      }

      // Player tween
      this.scene.tweens.add({
        targets: p,
        x: tc * TILE_SIZE + TILE_SIZE / 2,
        y: tr * TILE_SIZE + TILE_SIZE / 2,
        duration: ANIM.MOVE,
        onComplete: () => { this.isMoving = false; },
      });
      p.setGrid(tc, tr);

      // Box tween
      this.scene.tweens.add({
        targets: box,
        x: pc * TILE_SIZE + TILE_SIZE / 2,
        y: pr * TILE_SIZE + TILE_SIZE / 2,
        duration: ANIM.PUSH,
      });
      box.setGrid(pc, pr);

      gameState.addMove(record);
      this.evalTargets();
      EventBus.emit(EVENTS.STEP_UPDATED, gameState.steps);
      EventBus.emit('LOCAL_MOVE', { dx, dy });
      EventBus.emit('BOX_MOVED', { boxKey: box.boxKey, col: pc, row: pr });
    } else {
      // Just move player
      this.isMoving = true;
      const record: MoveRecord = {
        playerFrom: { col: p.gridCol, row: p.gridRow },
        playerTo: { col: tc, row: tr },
        pushedBoxId: null,
        boxFrom: null,
        boxTo: null,
      };

      this.scene.tweens.add({
        targets: p,
        x: tc * TILE_SIZE + TILE_SIZE / 2,
        y: tr * TILE_SIZE + TILE_SIZE / 2,
        duration: ANIM.MOVE,
        onComplete: () => { this.isMoving = false; },
      });
      p.setGrid(tc, tr);

      gameState.addMove(record);
      this.evalTargets();
      EventBus.emit(EVENTS.STEP_UPDATED, gameState.steps);
      EventBus.emit('LOCAL_MOVE', { dx, dy });
    }

    // Safety: force isMoving=false after 200ms in case tween onComplete never fires
    this.scene.time.delayedCall(200, () => { this.isMoving = false; });

    return true;
  }

  evalTargets() {
    let allOk = true;
    for (const t of this.grid.targets) {
      const tx = t.x, ty = t.y;
      let boxOn: any = null;
      for (const [, b] of this.grid.boxes) {
        if (Math.abs(b.x - tx) < 2 && Math.abs(b.y - ty) < 2) { boxOn = b; break; }
      }
      if (boxOn) {
        boxOn.isOnTarget = true;
        boxOn.currentTarget = t;
        if (boxOn.label === t.expectedLabel) { t.markCorrect(); boxOn.markCorrect(); }
        else { t.markWrong(); boxOn.markWrong(); allOk = false; }
      } else { t.markEmpty(); allOk = false; }
    }
    if (allOk) {
      gameState.isComplete = true;
      this.scene.time.delayedCall(300, () => EventBus.emit(EVENTS.LEVEL_COMPLETE));
    }
  }

  undo() {
    if (this.isMoving || gameState.isComplete) return;
    const rec = gameState.popMove();
    if (!rec) return;
    this.isMoving = true;
    const p = this.grid.player;
    p.x = rec.playerFrom.col * TILE_SIZE + TILE_SIZE / 2;
    p.y = rec.playerFrom.row * TILE_SIZE + TILE_SIZE / 2;
    p.setGrid(rec.playerFrom.col, rec.playerFrom.row);

    if (rec.pushedBoxId && rec.boxFrom) {
      const box = this.grid.boxes.get(rec.pushedBoxId);
      if (box) {
        if (box.currentTarget) { box.currentTarget.markEmpty(); box.currentTarget = null; }
        box.isOnTarget = false; box.markNeutral();
        box.x = rec.boxFrom.col * TILE_SIZE + TILE_SIZE / 2;
        box.y = rec.boxFrom.row * TILE_SIZE + TILE_SIZE / 2;
        box.setGrid(rec.boxFrom.col, rec.boxFrom.row);
      }
    }
    gameState.steps = Math.max(0, gameState.steps - 1);
    this.isMoving = false;
    this.evalTargets();
    EventBus.emit(EVENTS.STEP_UPDATED, gameState.steps);
  }

  moveRemotePlayer(playerId: string, col: number, row: number) {
    const rp = this.grid.remotePlayers.get(playerId);
    if (rp) { rp.x = col * TILE_SIZE + TILE_SIZE / 2; rp.y = row * TILE_SIZE + TILE_SIZE / 2; rp.setGrid(col, row); }
  }
  moveRemoteBox(boxKey: string, col: number, row: number) {
    const box = this.grid.boxes.get(boxKey);
    if (box) { box.x = col * TILE_SIZE + TILE_SIZE / 2; box.y = row * TILE_SIZE + TILE_SIZE / 2; box.setGrid(col, row); }
  }
  addRemotePlayer(playerId: string, col: number, row: number, name: string, color: number) {
    if (this.grid.remotePlayers.has(playerId)) return;
    const rp = new Player(this.scene, col, row, playerId, name, color);
    rp.setAlpha(0.85);
    this.grid.remotePlayers.set(playerId, rp);
  }
  removeRemotePlayer(playerId: string) {
    const rp = this.grid.remotePlayers.get(playerId);
    if (rp) { rp.destroy(); this.grid.remotePlayers.delete(playerId); }
  }
  destroy() { this.scene.input.keyboard?.removeAllKeys(); }
}
