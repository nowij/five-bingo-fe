import api from './axios';
import { RoomResponse, MyBoardState, CurrentTurnResponse } from '../types';
import { AxiosResponse } from 'axios';

export const createRoom = (topic: string): Promise<AxiosResponse<RoomResponse>> =>
    api.post('/rooms', { topic });

export const getRoomByCode = (inviteCode: string): Promise<AxiosResponse<RoomResponse>> =>
    api.get(`/rooms/invite/${inviteCode}`);

export const getRoom = (roomId: number): Promise<AxiosResponse<RoomResponse>> =>
    api.get(`/rooms/${roomId}`);

export const joinAsGuest = (
    inviteCode: string,
    nickname: string,
    sessionId: string
): Promise<AxiosResponse<RoomResponse>> =>
    api.post(`/rooms/join/${inviteCode}/guest`, { nickname, sessionId });

export const joinAsUser = (inviteCode: string): Promise<AxiosResponse<RoomResponse>> =>
    api.post(`/rooms/join/${inviteCode}/user`);

export const startWordInput = (roomId: number): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/rooms/${roomId}/start`);

export const submitBoard = (
    roomId: number,
    playerId: number,
    words: string[]
): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/rooms/${roomId}/board`, { playerId, words });

export const setReady = (
    roomId: number,
    playerId: number
): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/rooms/${roomId}/ready`, { playerId });

export const getMyBoard = (playerId: number): Promise<AxiosResponse<MyBoardState>> =>
    api.get(`/game/board/${playerId}`);

export const getCurrentTurn = (roomId: number): Promise<AxiosResponse<CurrentTurnResponse>> =>
    api.get(`/game/room/${roomId}/current-turn`);