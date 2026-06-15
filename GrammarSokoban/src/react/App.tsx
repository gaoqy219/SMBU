import React from 'react';
import { useStore } from './store.js';
import { LoginView } from './teacher/LoginView.js';
import { RoomSetup } from './teacher/RoomSetup.js';
import { GameMonitor } from './teacher/GameMonitor.js';
import { JoinView } from './student/JoinView.js';
import { LobbyView } from './student/LobbyView.js';
import { GameView } from './student/GameView.js';
import { AdminLayout } from './admin/AdminLayout.js';
import { ResultsView } from './results/ResultsView.js';

export function App() {
  const view = useStore(s => s.view);

  return (
    <div style={{ width: '100%', height: '100%', color: '#4A4A4A' }}>
      {view === 'login' && <LoginView />}
      {view === 'roomSetup' && <RoomSetup />}
      {view === 'monitor' && <GameMonitor />}
      {view === 'join' && <JoinView />}
      {view === 'lobby' && <LobbyView />}
      {view === 'game' && <GameView />}
      {view === 'results' && <ResultsView />}
      {view === 'admin' && <AdminLayout />}
    </div>
  );
}
