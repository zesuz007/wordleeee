
export type Status = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

export interface TileState {
  letter: string;
  status: Status;
}

export interface GameState {
  board: TileState[][];
  currentRow: number;
  targetWord: string;
  status: 'playing' | 'won' | 'lost';
  message: string;
  wordInfo?: WordInfo;
}

export interface WordInfo {
  word: string;
  definition: string;
  example: string;
  etymology?: string;
}

export enum GameAction {
  ADD_LETTER = 'ADD_LETTER',
  DELETE_LETTER = 'DELETE_LETTER',
  SUBMIT_GUESS = 'SUBMIT_GUESS',
  NEW_GAME = 'NEW_GAME',
}
