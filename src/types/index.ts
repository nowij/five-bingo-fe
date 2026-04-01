// ── Auth ──────────────────────────────────────────────
export interface AuthUser {
    token: string;
    nickname: string;
    userId: number;
}

export interface SignupRequest {
    username: string;
    password: string;
    nickname: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

// ── Room ──────────────────────────────────────────────
export type RoomStatus = 'WAITING' | 'WORD_INPUT' | 'IN_PROGRESS' | 'FINISHED';
export type PlayerStatus = 'JOINED' | 'WORD_DONE' | 'READY';

export interface PlayerInfo {
    playerId: number;
    nickname: string;
    isHost: boolean;
    isReady: boolean;
    bingoCount: number;
    status: PlayerStatus;
    turnOrder: number | null;
}

export interface RoomResponse {
    roomId: number;
    inviteCode: string;
    topic: string;
    hostNickname: string;
    status: RoomStatus;
    players: PlayerInfo[];
    maxPlayers: number;
}

// ── Game ──────────────────────────────────────────────
export type GameEventType =
    | 'WORD_CALLED'
    | 'BINGO_ACHIEVED'
    | 'GAME_FINISHED'
    | 'TURN_CHANGED'
    | 'ROOM_STATUS_CHANGED'
    | 'PLAYER_JOINED'
    | 'PLAYER_LEFT'
    | 'PLAYER_READY'
    | 'BOARD_SUBMITTED';

export interface PlayerBingoState {
    playerId: number;
    nickname: string;
    bingoCount: number;
    isReady: boolean;
    isCurrentTurn: boolean;
}

export interface PlayerBoardReveal {
    playerId: number;
    nickname: string;
    words: string[];
    checkedCells: boolean[];
    bingoCount: number;
    isWinner: boolean;
}

export interface GameEvent {
    type: GameEventType;
    callerNickname?: string;
    calledWord?: string;
    playerStates?: PlayerBingoState[];
    winnerId?: number;
    winnerNickname?: string;
    revealedBoards?: PlayerBoardReveal[];
    turnNumber?: number;
    nextTurnNickname?: string;
    message?: string;
}

export interface MyBoardState {
    words: string[];
    checkedCells: boolean[];
    bingoCount: number;
    bingoCells: number[];
}

export interface CurrentTurnResponse {
    playerId: number;
    nickname: string;
    turnOrder: number;
}

export interface GameOverState {
    winnerNickname: string;
    revealedBoards: PlayerBoardReveal[];
}

// ── WebSocket ─────────────────────────────────────────
export interface CallWordPayload {
    playerId: number;
    word: string;
    sessionId?: string;
}

// ── Log Entry ─────────────────────────────────────────
export interface LogEntry {
    text: string;
    time: string;
}