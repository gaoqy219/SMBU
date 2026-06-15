import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useStore, TEAM_COLORS } from '../store.js';
import { getSocket } from '../socket.js';
import { EventBus } from '../../game/core/EventBus.js';
import { createGameConfig } from '../../game/config.js';
import { EVENTS } from '../../game/core/Constants.js';
import Phaser from 'phaser';

export function GameView() {
  const { playerId, playerName, playerColor, teamId, roomCode, setRound, setView } = useStore();
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [isCaptain, setIsCaptain] = useState(false);
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const colorIdx = TEAM_COLORS.indexOf(playerColor);
  const colorHex = [0xffb3ba, 0xbae1ff, 0xbaffc9, 0xe8baff, 0xffdfba][colorIdx >= 0 ? colorIdx : 0];

  const sendMove = useCallback((dx: number, dy: number) => {
    const game = gameRef.current;
    if (!game) return;
    const scene = game.scene.getScene('GameScene') as any;
    if (scene?.movement) {
      const ok = scene.movement.tryMove(dx, dy);
      if (ok) {
        const p = scene.grid?.player;
        if (p) {
          const socket = getSocket();
          socket.emit('player:move', { roomCode, col: p.gridCol, row: p.gridRow, dx, dy });
        }
      }
    }
  }, [roomCode, playerId]);

  const refreshMap = useCallback(() => {
    const socket = getSocket();
    socket.emit('captain:refreshMap', { roomCode, teamId });
  }, [roomCode, teamId]);

  useEffect(() => {
    const socket = getSocket();

    const handleRoundStart = (data: any) => {
      setCurrentRound(data.roundNum);
      setTotalRounds(data.totalRounds);
      setRound(data.roundNum, data.totalRounds);
      if (data.isCaptain) setIsCaptain(true);

      if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; }

      setTimeout(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';
        const containerId = `game-${data.roundNum}-${Date.now()}`;
        const div = document.createElement('div');
        div.id = containerId;
        div.style.width = '100%';
        div.style.height = '100%';
        containerRef.current.appendChild(div);

        const game = new Phaser.Game(createGameConfig(containerId, playerId, playerName, colorHex));
        gameRef.current = game;

        setTimeout(() => {
          EventBus.emit('LOAD_MAP', data.mapData, data.roundNum, data.totalRounds,
            data.structureName || '', data.sentenceText || '', data.sentenceEnglish || '',
            data.teamPlayers || []);
        }, 600);
      }, 100);
    };

    const handleMapRefreshed = (data: any) => {
      if (data.isCaptain) setIsCaptain(true);
      EventBus.emit('LOAD_MAP', data.mapData, data.roundNum, data.totalRounds,
        data.structureName || '', data.sentenceText || '', data.sentenceEnglish || '',
        data.teamPlayers || []);
    };

    // Detect captain status from room players list
    const handlePlayers = (list: any[]) => {
      const me = list.find((p: any) => p.socketId === socket.id || p.id === playerId);
      if (me?.isCaptain) setIsCaptain(true);
    };

    socket.on('game:roundStart', handleRoundStart);
    socket.on('game:mapRefreshed', handleMapRefreshed);
    socket.on('room:players', handlePlayers);

    // Game over → show results for all players
    socket.on('game:over', (data: { leaderboard: any[]; allSentences: string[] }) => {
      if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; }
      const { setLeaderboard, setAllSentences } = useStore.getState();
      setLeaderboard(data.leaderboard);
      setAllSentences(data.allSentences);
      setView('results');
    });

    socket.on('remote:playerMoved', (data: any) => {
      EventBus.emit('REMOTE_PLAYER_MOVED', data.playerId, data.col, data.row);
    });
    socket.on('remote:boxMoved', (data: any) => {
      EventBus.emit('REMOTE_BOX_MOVED', data.boxKey, data.col, data.row);
    });

    // Sync box moves from local game to server
    const onBoxMoved = (data: any) => {
      socket.emit('box:moved', { roomCode, boxKey: data.boxKey, col: data.col, row: data.row });
    };
    EventBus.on('BOX_MOVED', onBoxMoved);

    const onLevelComplete = () => {
      socket.emit('team:roundComplete', { roomCode, teamId });
    };
    EventBus.on(EVENTS.LEVEL_COMPLETE, onLevelComplete);

    return () => {
      socket.off('game:roundStart', handleRoundStart);
      socket.off('game:mapRefreshed', handleMapRefreshed);
      socket.off('room:players', handlePlayers);
      socket.off('game:over');
      socket.off('remote:playerMoved');
      socket.off('remote:boxMoved');
      EventBus.off('BOX_MOVED', onBoxMoved);
      EventBus.off(EVENTS.LEVEL_COMPLETE, onLevelComplete);
      if (gameRef.current) { gameRef.current.destroy(true); gameRef.current = null; }
    };
  }, [playerId, playerName, colorHex, teamId, roomCode]);

  const dpadBtn: React.CSSProperties = {
    width: '58px', height: '58px', borderRadius: '14px',
    border: '2px solid #E8E0D8', background: '#fff',
    color: '#4A4A4A', fontSize: '24px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#FFF5F0' }}>
      {/* Top bar — no answers shown */}
      <div style={{
        padding: '6px 12px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', background: 'rgba(255,255,255,0.95)',
        borderBottom: '1px solid #E8E0D8', minHeight: '36px', flexShrink: 0,
      }}>
        <span style={{ fontSize: '13px', color: '#999' }}>
          第 {currentRound}/{totalRounds} 局
        </span>
        <span style={{ fontSize: '13px', color: '#FFB3BA', fontWeight: 'bold' }}>
          推箱子排语序
        </span>
        {isCaptain && (
          <button
            onClick={refreshMap}
            style={{
              padding: '4px 10px', fontSize: '11px', background: '#BAE1FF',
              border: 'none', borderRadius: '6px', color: '#4A4A4A',
              cursor: 'pointer', fontWeight: 'bold',
            }}
          >
            🔄 刷新
          </button>
        )}
      </div>

      {/* Game canvas */}
      <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', background: '#FFF5F0' }}>
        {!currentRound && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: '14px' }}>
            等待游戏开始...
          </div>
        )}
      </div>

      {/* Horizontal D-pad: ← ↑ ↓ → */}
      <div style={{
        padding: '10px', display: 'flex', justifyContent: 'center', gap: '10px',
        background: 'rgba(255,255,255,0.95)', borderTop: '1px solid #E8E0D8', flexShrink: 0,
      }}>
        <button style={dpadBtn}
          onTouchStart={(e) => { e.preventDefault(); sendMove(-1, 0); }}
          onMouseDown={(e) => { e.preventDefault(); sendMove(-1, 0); }}>←</button>
        <button style={dpadBtn}
          onTouchStart={(e) => { e.preventDefault(); sendMove(0, -1); }}
          onMouseDown={(e) => { e.preventDefault(); sendMove(0, -1); }}>↑</button>
        <button style={dpadBtn}
          onTouchStart={(e) => { e.preventDefault(); sendMove(0, 1); }}
          onMouseDown={(e) => { e.preventDefault(); sendMove(0, 1); }}>↓</button>
        <button style={dpadBtn}
          onTouchStart={(e) => { e.preventDefault(); sendMove(1, 0); }}
          onMouseDown={(e) => { e.preventDefault(); sendMove(1, 0); }}>→</button>
      </div>
    </div>
  );
}
