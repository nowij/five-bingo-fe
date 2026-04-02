import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoomByCode, joinAsUser, startWordInput } from '../api/room';
import { useWebSocket } from '../hooks/useWebSocket';
import { RoomResponse, GameEvent } from '../types';

const POLL_INTERVAL = 3000; // WebSocket 이벤트 못 받을 때 폴백용 폴링

export default function WaitingRoomPage() {
    const { inviteCode }      = useParams<{ inviteCode: string }>();
    const navigate            = useNavigate();
    const { user }            = useAuth();
    const [room, setRoom]     = useState<RoomResponse | null>(null);
    const [myPlayerId, setMyPlayerId] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError]   = useState('');
    // ★ navigate를 ref로 보관해서 loadRoom 의존성 제거
    const navigateRef = useRef(navigate);
    const inviteCodeRef       = useRef(inviteCode);

    useEffect(() => { navigateRef.current    = navigate;    }, [navigate]);
    useEffect(() => { inviteCodeRef.current  = inviteCode;  }, [inviteCode]);

    const inviteLink = `${window.location.origin}/join/${inviteCode}`;
    const isHost = room != null && user != null && room.hostNickname === user.nickname;

    const loadRoom = useCallback(async () => {
        if (!inviteCode) return;
        try {
            const res = await getRoomByCode(inviteCode);
            const r   = res.data;
            setRoom(r);

            if (user) {
                const me = r.players.find((p) => p.nickname === user.nickname);
                if (me) {
                    setMyPlayerId(me.playerId);
                    sessionStorage.setItem('bingo_playerId', String(me.playerId));
                }
            } else {
                const pid = sessionStorage.getItem('bingo_playerId');
                if (pid) setMyPlayerId(Number(pid));
            }

            // ★ 상태 변화에 따라 즉시 페이지 이동
            if (r.status === 'WORD_INPUT')
                navigateRef.current(`/word-input/${inviteCode}`);
            if (r.status === 'IN_PROGRESS' || r.status === 'FINISHED')
                navigateRef.current(`/game/${inviteCode}`);
        } catch {
            setError('방 정보를 불러올 수 없습니다.');
        }
    }, [inviteCode, user]); // ★ navigate 제거

    useEffect(() => {
        const init = async () => {
            if (user && inviteCode) {
                try { await joinAsUser(inviteCode); } catch { /* already joined */ }
            }
            await loadRoom();
        };
        init();
    }, [inviteCode, user, loadRoom]);

    // ── 폴링: WS 이벤트 유실 대비 3초마다 방 상태 확인 ─────
    useEffect(() => {
        const timer = setInterval(() => {
            loadRoom();
        }, POLL_INTERVAL);
        return () => clearInterval(timer);
    }, [loadRoom]);

    // ★ WebSocket 이벤트 수신 시 loadRoom 호출 → 상태 변화 감지 후 자동 이동
    const onPlayersEvent = useCallback((_event: GameEvent) => {
        loadRoom();
    }, [loadRoom]);

    const { publish } = useWebSocket({ roomId: room?.roomId, onPlayersEvent });

    // 입장 알림
    useEffect(() => {
        if (room?.roomId && myPlayerId) {
            publish(`/app/room/${room.roomId}/enter`, { playerId: myPlayerId });
        }
    }, [room?.roomId, myPlayerId, publish]);

    // ── 방장 게임 시작 ────────────────────────────────────
    const handleStart = async () => {
        if (!room) return;
        try {
            await startWordInput(room.roomId);
            // ★ API 성공 후 바로 이동 (WS 이벤트 기다리지 않음)
            navigate(`/word-input/${inviteCode}`);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } | string } })?.response?.data;
            if (typeof msg === 'object') setError(msg?.error ?? '시작 실패');
            else setError(msg ?? '시작 실패');
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const myNickname = user?.nickname ?? sessionStorage.getItem('bingo_nickname') ?? '';

    if (!room) {
        return (
            <div className="page-center">
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-2)' }}>방 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
            {/* Header */}
            <div className="animate-fadeInUp" style={{marginBottom: 32}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8}}>
                    <h1 style={{fontSize: '1.8rem'}}>대기실</h1>
                    <span className="badge badge-primary">대기 중</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
                    <div style={{
                        background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '10px 16px',
                        border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 8,
                    }}>
                        <span style={{color: 'var(--text-2)', fontSize: '0.82rem'}}>주제</span>
                        <span
                            style={{fontWeight: 700, color: 'var(--accent-gold)', fontSize: '1rem'}}>{room.topic}</span>
                    </div>
                    <button className="btn btn-ghost" style={{padding: '8px 16px', fontSize: '0.85rem'}}>
                        로그아웃
                    </button>
                </div>
            </div>

            {/* Invite Link */}
            <div className="card" style={{padding: 20, marginBottom: 20}}>
                <p style={{color: 'var(--text-2)', fontSize: '0.82rem', marginBottom: 10, fontWeight: 600}}>
                    초대 링크
                </p>
                <div style={{display: 'flex', gap: 10}}>
                    <div style={{
                        flex: 1, padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)', fontSize: '0.82rem', color: 'var(--text-2)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {inviteLink}
                    </div>
                    <button className="btn btn-ghost" onClick={copyLink} style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}>
                        {copied ? '✅ 복사됨' : '복사'}
                    </button>
                </div>
            </div>

            {/* Players */}
            <div className="card" style={{ padding: 24, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: '1rem' }}>참가자</h2>
                    <span style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>
            {room.players.length} / {room.maxPlayers}명
          </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {room.players.map((p) => (
                        <div key={p.playerId} style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius)',
                            border: `1px solid ${p.nickname === myNickname ? 'var(--primary)' : 'var(--border)'}`,transition: 'all 0.3s',
                        }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                background: p.isHost ? 'var(--accent-gold)' : 'var(--primary-dim)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1rem', fontWeight: 700, color: '#fff',
                            }}>
                                {p.nickname.charAt(0)}
                            </div>
                            <span style={{ fontWeight: 600, flex: 1 }}>{p.nickname}</span>
                            {p.isHost && <span className="badge badge-gold">방장</span>}
                            {p.nickname === myNickname && <span className="badge badge-primary">나</span>}
                        </div>
                    ))}
                    {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
                        <div key={i} style={{
                            padding: '12px 16px', background: 'var(--bg)', borderRadius: 'var(--radius)',
                            border: '1px dashed var(--border)', color: 'var(--text-2)',
                            fontSize: '0.88rem', textAlign: 'center',
                        }}>
                            대기 중...
                        </div>
                    ))}
                </div>
            </div>

            {error && <p className="error-text" style={{ marginBottom: 12 }}>⚠ {error}</p>}

            {isHost ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                        className="btn btn-primary"
                        style={{ width: '100%', padding: 16, fontSize: '1rem' }}
                        onClick={handleStart}
                        disabled={room.players.length < 2}
                    >
                        게임 시작
                    </button>
                    {room.players.length < 2 && (
                        <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: '0.82rem' }}>
                            최소 2명 이상이어야 시작할 수 있습니다.
                        </p>
                    )}
                </div>
            ) : (
                <div className="card" style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                        <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
                            방장이 게임을 시작할 때까지 기다려주세요.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}