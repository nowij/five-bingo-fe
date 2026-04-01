import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { GameEvent, CallWordPayload } from '../types';

interface UseWebSocketOptions {
    roomId?: number;
    onGameEvent?: (event: GameEvent) => void;
    onPlayersEvent?: (event: GameEvent) => void;
}

export function useWebSocket({ roomId, onGameEvent, onPlayersEvent }: UseWebSocketOptions) {
    const clientRef       = useRef<Client | null>(null);
    // ★ 콜백을 ref로 보관 → connect가 재실행되지 않아도 항상 최신 콜백 사용
    const onGameEventRef    = useRef(onGameEvent);
    const onPlayersEventRef = useRef(onPlayersEvent);

    useEffect(() => { onGameEventRef.current    = onGameEvent; },    [onGameEvent]);
    useEffect(() => { onPlayersEventRef.current = onPlayersEvent; }, [onPlayersEvent]);

    const connect = useCallback(() => {
        if (clientRef.current?.active) return;

        const client = new Client({
            webSocketFactory: () => new SockJS('/ws') as WebSocket,
            reconnectDelay: 3000,
            onConnect: () => {
                console.log('✅ WebSocket connected, roomId:', roomId);

                client.subscribe(`/topic/room/${roomId}/game`, (msg: IMessage) => {
                    const event: GameEvent = JSON.parse(msg.body);
                    console.log('📨 game event:', event.type);
                    onGameEventRef.current?.(event);
                });

                client.subscribe(`/topic/room/${roomId}/players`, (msg: IMessage) => {
                    const event: GameEvent = JSON.parse(msg.body);
                    console.log('📨 players event:', event.type);
                    onPlayersEventRef.current?.(event);
                });
            },
            onDisconnect: () => console.log('🔌 WebSocket disconnected'),
            onStompError:  (frame) => console.error('STOMP error', frame),
        });

        client.activate();
        clientRef.current = client;
        // ★ roomId만 의존 — 콜백 변화로 재연결하지 않음
    }, [roomId]);

    const disconnect = useCallback(() => {
        clientRef.current?.deactivate();
        clientRef.current = null;
    }, []);

    const publish = useCallback((destination: string, body: CallWordPayload | Record<string, unknown>) => {
        if (clientRef.current?.connected) {
            clientRef.current.publish({ destination, body: JSON.stringify(body) });
        }
    }, []);

    useEffect(() => {
        if (roomId) connect();
        return () => disconnect();
    }, [roomId, connect, disconnect]);

    return { publish };
}