import { create } from 'zustand';

export type Role = 'teacher' | 'student' | null;
export type View = 'login' | 'roomSetup' | 'monitor' | 'results' | 'join' | 'lobby' | 'game' | 'admin';

interface PlayerInfo {
  id: string;
  name: string;
  teamId: number;
  color: string;
  ready: boolean;
  isCaptain: boolean;
}

export const TEAM_COLORS = [
  '#FFB3BA', // 粉
  '#BAE1FF', // 蓝
  '#BAFFC9', // 薄荷
  '#E8BAFF', // 紫
  '#FFDFBA', // 杏
];

export const TEAM_COLOR_NAMES = ['粉', '蓝', '绿', '紫', '橙'];

interface UIState {
  role: Role;
  view: View;
  setView: (v: View) => void;

  // Room
  roomCode: string;
  serverURL: string;
  setRoom: (code: string, url: string) => void;

  // Game config (teacher)
  teamCount: number;
  roundCount: number;
  membersPerTeam: number;
  setGameConfig: (teams: number, rounds: number, members: number) => void;

  // Player info
  playerId: string;
  playerName: string;
  teamId: number;
  playerColor: string;
  setPlayerInfo: (id: string, name: string, team: number, color: string) => void;

  // Lobby
  players: PlayerInfo[];
  setPlayers: (p: PlayerInfo[]) => void;

  // Game state
  currentRound: number;
  totalRounds: number;
  setRound: (cur: number, total: number) => void;

  // Leaderboard
  leaderboard: { teamId: number; roundsCompleted: number; color: string }[];
  setLeaderboard: (lb: any[]) => void;

  // Results
  allSentences: string[];
  setAllSentences: (s: string[]) => void;
}

export const useStore = create<UIState>((set) => ({
  role: null,
  view: 'login',
  setView: (v) => set({ view: v }),

  roomCode: '',
  serverURL: '',
  setRoom: (code, url) => set({ roomCode: code, serverURL: url }),

  teamCount: 2, roundCount: 3, membersPerTeam: 2,
  setGameConfig: (teams, rounds, members) => set({ teamCount: teams, roundCount: rounds, membersPerTeam: members }),

  playerId: '', playerName: '', teamId: 1, playerColor: TEAM_COLORS[0],
  setPlayerInfo: (id, name, team, color) => set({ playerId: id, playerName: name, teamId: team, playerColor: color }),

  players: [],
  setPlayers: (p) => set({ players: p }),

  currentRound: 0, totalRounds: 0,
  setRound: (cur, total) => set({ currentRound: cur, totalRounds: total }),

  leaderboard: [],
  setLeaderboard: (lb) => set({ leaderboard: lb }),

  allSentences: [],
  setAllSentences: (s) => set({ allSentences: s }),
}));
