import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoomByCode, submitBoard, setReady } from '../api/room';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { RoomResponse, PlayerBingoState, GameEvent } from '../types';

export default function WordInputPage() {
    const { inviteCode }              = useParams<{ inviteCode: string }>();
    const navigate                    = useNavigate();
    const { user }                    = useAuth();
    const [room, setRoom]             = useState<RoomResponse | null>(null);
    const [words, setWords]           = useState<string[]>(Array(25).fill(''));
    const [submitted, setSubmitted]   = useState(false);
    const [readyDone, setReadyDone]   = useState(false);
    const [myPlayerId, setMyPlayerId] = useState<number | null>(null);
    const [error, setError]           = useState('');
    const [players, setPlayers]       = useState<PlayerBingoState[]>([]);
    const navigateRef = useRef(navigate);
    useEffect(() => { navigateRef.current = navigate; }, [navigate]);

    const myNickname = user?.nickname ?? sessionStorage.getItem('bingo_nickname') ?? '';

    const loadRoom = useCallback(async () => {
        if (!inviteCode) return;
        try {
            const res = await getRoomByCode(inviteCode);
            const r   = res.data;
            setRoom(r);
            setPlayers(r.players.map((p) => ({
                playerId: p.playerId,
                nickname: p.nickname,
                bingoCount: p.bingoCount,
                isReady: p.isReady,
                isCurrentTurn: false,
            })));
            const pid = sessionStorage.getItem('bingo_playerId');
            if (pid) setMyPlayerId(Number(pid));

            // ★ 모두 준비 완료 → 게임 시작으로 즉시 이동
            if (r.status === 'IN_PROGRESS') navigateRef.current(`/game/${inviteCode}`);
        } catch {
            setError('방 정보 로드 실패');
        }
    }, [inviteCode]);

    useEffect(() => { loadRoom(); }, [loadRoom]);

    // ★ WS 이벤트 수신 시 방 상태 재조회
    const onPlayersEvent = useCallback((_event: GameEvent) => {
        loadRoom();
    }, [loadRoom]);

    useWebSocket({ roomId: room?.roomId, onPlayersEvent });

    const handleWordChange = (idx: number, val: string) => {
        setWords((prev) => {
            const next = [...prev];
            next[idx] = val.slice(0, 10);
            return next;
        });
    };

    const filledCount = words.filter((w) => w.trim()).length;
    const allFilled   = filledCount === 25;

    const handleSubmit = async () => {
        if (!room || myPlayerId == null) return;
        if (!allFilled) return setError(`${25 - filledCount}칸이 비어있습니다.`);
        const unique = new Set(words.map((w) => w.trim().toLowerCase()));
        if (unique.size < 25) return setError('중복된 단어가 있습니다. 모두 다르게 입력해주세요.');
        try {
            await submitBoard(room.roomId, myPlayerId, words.map((w) => w.trim()));
            setSubmitted(true);
            setError('');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } | string } })?.response?.data;
            if (typeof msg === 'object') setError(msg?.error ?? '제출 실패');
            else setError(msg ?? '제출 실패');
        }
    };

    const handleReady = async () => {
        if (!room || myPlayerId == null) return;
        try {
            await setReady(room.roomId, myPlayerId);
            setReadyDone(true);
            // ★ 준비 완료 후 방 상태 즉시 재조회 (혼자 마지막으로 준비하면 IN_PROGRESS로 바뀜)
            await loadRoom();
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } | string } })?.response?.data;
            if (typeof msg === 'object') setError(msg?.error ?? '준비 실패');
            else setError(msg ?? '준비 실패');
        }
    };

    if (!room) return <div className="page-center"><div className="spinner" /></div>;

    return (
        <div style={{ minHeight: '100vh', padding: '28px 16px', maxWidth: 700, margin: '0 auto' }}>
            {/* Header */}
            <div className="animate-fadeInUp" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>📝</span>
                    <h1 style={{ fontSize: '1.6rem' }}>단어 입력</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span className="badge badge-primary">주제: {room.topic}</span>
                    <span style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>
            주제에 맞는 단어를 25칸에 모두 입력하세요
          </span>
                </div>
            </div>

            {/* Players status */}
            <div className="card" style={{ padding: 16, marginBottom: 20 }}>
                <p style={{ color: 'var(--text-2)', fontSize: '0.78rem', fontWeight: 600, marginBottom: 10 }}>참가자 현황</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {players.map((p) => {
                        const rp = room.players.find((r) => r.playerId === p.playerId);
                        const status = rp?.status ?? 'JOINED';
                        return (
                            <div key={p.playerId} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', borderRadius: 99, fontSize: '0.82rem',
                                background: status === 'READY' ? 'rgba(6,214,160,0.15)'
                                    : status === 'WORD_DONE' ? 'rgba(108,99,255,0.15)' : 'var(--bg)',
                                border: `1px solid ${status === 'READY' ? 'rgba(6,214,160,0.4)'
                                    : status === 'WORD_DONE' ? 'rgba(108,99,255,0.4)' : 'var(--border)'}`,
                            }}>
                                <span>{status === 'READY' ? '✅' : status === 'WORD_DONE' ? '📝' : '⏳'}</span>
                                <span style={{ fontWeight: 600 }}>{p.nickname}</span>
                                {p.nickname === myNickname && (
                                    <span style={{ color: 'var(--primary)', fontSize: '0.72rem' }}>(나)</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Board Grid */}
            <div className="card-elevated" style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: '1rem' }}>빙고판 작성</h2>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: allFilled ? 'var(--green)' : 'var(--accent-gold)' }}>
            {filledCount}/25
          </span>
                </div>
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6,
                    opacity: submitted ? 0.5 : 1,
                    pointerEvents: submitted ? 'none' : 'auto',
                }}>
                    {words.map((w, i) => (
                        <input
                            key={i}
                            value={w}
                            onChange={(e) => handleWordChange(i, e.target.value)}
                            placeholder={String(i + 1)}
                            style={{
                                padding: '10px 6px', textAlign: 'center',
                                background: w.trim() ? 'rgba(108,99,255,0.1)' : 'var(--bg)',
                                border: `1px solid ${w.trim() ? 'var(--primary-dim)' : 'var(--border)'}`,
                                borderRadius: 8, color: 'var(--text-1)',
                                fontFamily: 'var(--font-body)', fontSize: '0.82rem', outline: 'none',
                                transition: 'all 0.15s',
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                            onBlur={(e)  => (e.currentTarget.style.borderColor = w.trim() ? 'var(--primary-dim)' : 'var(--border)')}
                        />
                    ))}
                </div>
            </div>

            {error && <p className="error-text" style={{ marginBottom: 12 }}>⚠ {error}</p>}

            <div style={{ display: 'flex', gap: 12 }}>
                {!submitted ? (
                    <button className="btn btn-primary" style={{ flex: 1, padding: 14 }} onClick={handleSubmit} disabled={!allFilled}>
                        제출하기
                    </button>
                ) : !readyDone ? (
                    <button className="btn btn-green" style={{ flex: 1, padding: 14, fontSize: '1rem' }} onClick={handleReady}>
                        준비 완료
                    </button>
                ) : (
                    <div className="card" style={{ flex: 1, padding: 14, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                            <span style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
                다른 플레이어를 기다리는 중...
              </span>
                        </div>
                    </div>
                )}
            </div>

            {submitted && !readyDone && (
                <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: '0.82rem', marginTop: 12 }}>
                    빙고판이 제출되었습니다. 준비 완료 버튼을 눌러주세요!
                </p>
            )}
        </div>
    );
}