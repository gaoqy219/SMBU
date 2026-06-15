export const TILE_SIZE = 48;
export const GRID_SIZE = 15; // 15×15

// Macaron color palette
export const COLORS = {
  BG:        0xfff5f0,
  FLOOR_A:   0xfff8f5,
  FLOOR_B:   0xfff0eb,
  WALL:      0xd4c5c0,
  WALL_TOP:  0xe0d5d0,
  OBSTACLE:  0xc8bfb8,
  TARGET:    0xe8e0d8,
  TARGET_OK: 0xbaffc9,
  TARGET_ERR:0xffb3ba,
  BOX_BG:    0xfff9e6,
  BOX_OK:    0xbaffc9,
  BOX_ERR:   0xffb3ba,
  BOX_LOCKED:0xddd5c8,
  TEXT:       0x4a4a4a,
  TEXT_LIGHT: 0x999999,
};

export const TEAM_COLORS_HEX = [0xffb3ba, 0xbae1ff, 0xbaffc9, 0xe8baff, 0xffdfba];

export const DEPTH = { FLOOR:0, TARGET:1, OBSTACLE:5, BOX:10, PLAYER:20, NAME:25 };

export const ANIM = { MOVE: 100, PUSH: 100 };

export const EVENTS = {
  START_LEVEL: 'START_LEVEL',
  LEVEL_READY: 'LEVEL_READY',
  STEP_UPDATED: 'STEP_UPDATED',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  REMOTE_MOVE: 'REMOTE_MOVE',
  REMOTE_BOX: 'REMOTE_BOX',
};
