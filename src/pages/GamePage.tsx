import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoomByCode, getMyBoard, getCurrentTurn } from '../api/room';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import BingoBoard from '../components/BingoBoard';
import PlayerList from '../components/PlayerList';
import {
    RoomResponse,
    MyBoardState,
    CurrentTurnResponse,
    GameEvent,
    GameOverState,
    LogEntry,
    PlayerInfo,
} from '../types';

export default function GamePage() {
    const { inviteCode }                = useParams<{ inviteCode: string }>();
    const navigate                      = useNavigate();
    const { user }                      = useAuth();
    const [room, setRoom]               = useState<RoomResponse | null>(null);
    const [myBoard, setMyBoard]         = useState<MyBoardState | null>(null);
    const [myPlayerId, setMyPlayerId]   = useState<number | null>(null);
    const [currentTurn, setCurrentTurn] = useState<CurrentTurnResponse | null>(null);
    const [players, setPlayers]         = useState<PlayerInfo[]>([]);
    const [calledWord, setCalledWord]   = useState('');
    const [log, setLog]                 = useState<LogEntry[]>([]);
    const [gameOver, setGameOver]       = useState<GameOverState | null>(null);
    const [toast, setToast]             = useState('');
    const [loading, setLoading]         = useState(true);
    const logRef                        = useRef<HTMLDivElement>(null);

    const myNickname = user?.nickname ?? sessionStorage.getItem('bingo_nickname') ?? '';

    const showToast = (msg: string, duration = 3000) => {
        setToast(msg);
        setTimeout(() => setToast(''), duration);
    };

    const loadBoard = useCallback(async (pid: number) => {
        try {
            const res = await getMyBoard(pid);
            setMyBoard(res.data);
        } catch { /* silent */ }
    }, []);

    const loadTurn = useCallback(async (roomId: number) => {
        try {
            const res = await getCurrentTurn(roomId);
            setCurrentTurn(res.data);
        } catch { /* silent */ }
    }, []);

    const loadRoom = useCallback(async () => {
        if (!inviteCode) return;
        try {
            const res = await getRoomByCode(inviteCode);
            const r   = res.data;
            setRoom(r);
            setPlayers(r.players);
            const pid = Number(sessionStorage.getItem('bingo_playerId'));
            if (pid) {
                setMyPlayerId(pid);
                await loadBoard(pid);
            }
            await loadTurn(r.roomId);
            setLoading(false);
        } catch {
            setLoading(false);
        }
    }, [inviteCode, loadBoard, loadTurn]);

    useEffect(() => { loadRoom(); }, [loadRoom]);

    // Auto-scroll game log
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [log]);

    // ── WebSocket event handlers ────────────────────────
    const onGameEvent = useCallback(async (event: GameEvent) => {
        const {
            type,
            calledWord: cw,
            callerNickname,
            playerStates,
            winnerNickname,
            message,
            revealedBoards,
            nextTurnNickname,
        } = event;

        if (cw) setCalledWord(cw);

        if (message) {
            setLog((prev) => [
                ...prev,
                {
                    text: message,
                    time: new Date().toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                    }),
                },
            ]);
        }

        if (type === 'WORD_CALLED' || type === 'BINGO_ACHIEVED') {
            // Sync player bingo counts from WS payload
            if (playerStates) {
                setPlayers((prev) =>
                    prev.map((p) => {
                        const updated = playerStates.find((s) => s.playerId === p.playerId);
                        return updated ? { ...p, bingoCount: updated.bingoCount } : p;
                    })
                );
            }
            // Refresh my board
            if (myPlayerId) await loadBoard(myPlayerId);
            // Advance turn
            if (nextTurnNickname) {
                setCurrentTurn((prev) => (prev ? { ...prev, nickname: nextTurnNickname } : prev));
            }
            if (room?.roomId) await loadTurn(room.roomId);
            if (type === 'BINGO_ACHIEVED') {
                showToast(`🎉 ${callerNickname ?? ''}님 빙고 달성!`);
            }
        }

        if (type === 'GAME_FINISHED') {
            if (myPlayerId) await loadBoard(myPlayerId);
            setGameOver({
                winnerNickname: winnerNickname ?? '',
                revealedBoards: revealedBoards ?? [],
            });
            showToast(`🏆 ${winnerNickname ?? ''}님이 5빙고로 우승!`, 5000);
        }
    }, [myPlayerId, loadBoard, loadTurn, room?.roomId]);

    const onPlayersEvent = useCallback((event: GameEvent) => {
        if (event.playerStates) {
            setPlayers((prev) =>
                prev.map((p) => {
                    const updated = event.playerStates?.find((s) => s.playerId === p.playerId);
                    return updated ? { ...p, bingoCount: updated.bingoCount } : p;
                })
            );
        }
        if (event.nextTurnNickname) {
            setCurrentTurn((prev) => (prev ? { ...prev, nickname: event.nextTurnNickname! } : prev));
        }
    }, []);

    const { publish } = useWebSocket({ roomId: room?.roomId, onGameEvent, onPlayersEvent });

    const isMyTurn = currentTurn?.nickname === myNickname;

    const handleCellClick = (word: string) => {
        if (!isMyTurn || !room || myPlayerId == null || gameOver) return;
        publish(`/app/room/${room.roomId}/call-word`, { playerId: myPlayerId, word });
    };

    // ── Render ───────────────────────────────────────────
    if (loading) {
        return (
            <div className="page-center">
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-2)' }}>게임 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', padding: '20px 16px' }}>
            {/* Toast */}
            {toast && (
                <div
                    className="toast"
                    style={{
                        borderColor: 'var(--accent-gold)',
                        fontWeight: 700,
                        fontSize: '1rem',
                    }}
                >
                    {toast}
                </div>
            )}

            <div
                style={{
                    maxWidth: 940,
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) 290px',
                    gap: 20,
                }}
            >
                {/* ── Left column: board + log ── */}
                <div>
                    {/* Turn banner */}
                    <div className="animate-fadeInUp" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                            <h1 style={{ fontSize: '1.6rem' }}>🎯 빙고</h1>
                            {room && <span className="badge badge-primary">주제: {room.topic}</span>}
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '12px 16px',
                                background: isMyTurn ? 'rgba(108,99,255,0.12)' : 'var(--bg-card)',
                                border: `1px solid ${isMyTurn ? 'var(--primary)' : 'var(--border)'}`,
                                borderRadius: 'var(--radius)',
                                transition: 'all 0.3s',
                                boxShadow: isMyTurn ? 'var(--glow)' : 'none',
                            }}
                        >
                            {isMyTurn ? (
                                <>
                                    <span style={{ fontSize: 20 }}>✨</span>
                                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    내 차례입니다! 단어를 선택하세요
                  </span>
                                </>
                            ) : (
                                <>
                                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, flexShrink: 0 }} />
                                    <span style={{ color: 'var(--text-2)' }}>
                    <b style={{ color: 'var(--text-1)' }}>{currentTurn?.nickname}</b>님의 차례...
                  </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Bingo board */}
                    <div className="card-elevated" style={{ padding: 16, marginBottom: 14 }}>
                        {/* Bingo progress dots */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 12,
                            }}
                        >
              <span style={{ fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 600 }}>
                내 빙고판
              </span>
                            <div style={{ display: 'flex', gap: 5 }}>
                                {Array.from({ length: 5 }).map((_, i) => {
                                    const achieved = i < (myBoard?.bingoCount ?? 0);
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                width: 26,
                                                height: 26,
                                                borderRadius: 6,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.7rem',
                                                fontWeight: 900,
                                                background: achieved
                                                    ? 'linear-gradient(135deg, var(--accent-gold), #ff9f1c)'
                                                    : 'var(--bg)',
                                                border: `1px solid ${achieved ? 'rgba(255,209,102,0.6)' : 'var(--border)'}`,
                                                color: achieved ? '#fff' : 'var(--text-2)',
                                                boxShadow: achieved ? '0 2px 8px rgba(255,209,102,0.4)' : 'none',
                                                transition: 'all 0.3s',
                                            }}
                                        >
                                            B
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {myBoard?.words && myBoard.words.length > 0 ? (
                            <BingoBoard
                                words={myBoard.words}
                                checkedCells={myBoard.checkedCells}
                                bingoCells={myBoard.bingoCells}
                                isMyTurn={isMyTurn && !gameOver}
                                onCellClick={handleCellClick}
                                disabled={gameOver != null}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-2)' }}>
                                빙고판을 불러오는 중...
                            </div>
                        )}

                        {isMyTurn && !gameOver && (
                            <p
                                style={{
                                    color: 'var(--primary)',
                                    fontSize: '0.8rem',
                                    marginTop: 10,
                                    textAlign: 'center',
                                    fontWeight: 600,
                                }}
                            >
                                👆 단어를 클릭해서 선택하세요
                            </p>
                        )}
                    </div>

                    {/* Last called word */}
                    {calledWord && (
                        <div
                            style={{
                                textAlign: 'center',
                                padding: '12px 16px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius)',
                                marginBottom: 14,
                            }}
                        >
                            <span style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>마지막 선택 단어 </span>
                            <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '1.1rem' }}>
                "{calledWord}"
              </span>
                        </div>
                    )}

                    {/* Game log */}
                    <div className="card" style={{ padding: 16 }}>
                        <p
                            style={{
                                color: 'var(--text-2)',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                marginBottom: 10,
                                letterSpacing: '0.05em',
                            }}
                        >
                            게임 로그
                        </p>
                        <div
                            ref={logRef}
                            style={{
                                maxHeight: 160,
                                overflowY: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                            }}
                        >
                            {log.length === 0 ? (
                                <p
                                    style={{
                                        color: 'var(--text-2)',
                                        fontSize: '0.82rem',
                                        textAlign: 'center',
                                        padding: '20px 0',
                                    }}
                                >
                                    게임이 시작되었습니다!
                                </p>
                            ) : (
                                log.map((entry, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.82rem' }}>
                                        <span style={{ color: 'var(--text-2)', flexShrink: 0 }}>{entry.time}</span>
                                        <span style={{ color: 'var(--text-1)' }}>{entry.text}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right column: players ── */}
                <div>
                    <div
                        className="card"
                        style={{ padding: 16, position: 'sticky', top: 20 }}
                    >
                        <h2 style={{ fontSize: '1rem', marginBottom: 14 }}>참가자</h2>
                        <PlayerList
                            players={players}
                            currentTurnNickname={currentTurn?.nickname}
                            myNickname={myNickname}
                        />
                    </div>
                </div>
            </div>

            {/* ── Game Over Modal ── */}
            {gameOver && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        padding: 24,
                    }}
                >
                    <div
                        className="card-elevated animate-fadeInUp"
                        style={{
                            width: '100%',
                            maxWidth: 720,
                            padding: 36,
                            maxHeight: '90vh',
                            overflowY: 'auto',
                        }}
                    >
                        {/* Winner announcement */}
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <div style={{ fontSize: 64, marginBottom: 12 }}>🏆</div>
                            <h1 style={{ fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: 8 }}>
                                게임 종료!
                            </h1>
                            <p style={{ fontSize: '1.1rem', color: 'var(--text-2)' }}>
                <span
                    style={{
                        color: 'var(--accent-gold)',
                        fontWeight: 700,
                        fontSize: '1.4rem',
                    }}
                >
                  {gameOver.winnerNickname}
                </span>
                                님이 5빙고로 우승하였습니다!
                            </p>
                        </div>

                        {/* Revealed boards */}
                        {gameOver.revealedBoards.length > 0 && (
                            <div>
                                <p
                                    style={{
                                        color: 'var(--text-2)',
                                        fontSize: '0.82rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.05em',
                                        marginBottom: 16,
                                    }}
                                >
                                    최종 빙고판 공개
                                </p>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                                        gap: 16,
                                    }}
                                >
                                    {gameOver.revealedBoards.map((board) => (
                                        <div key={board.playerId} className="card" style={{ padding: 16 }}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    marginBottom: 12,
                                                    flexWrap: 'wrap',
                                                }}
                                            >
                                                <span style={{ fontWeight: 700 }}>{board.nickname}</span>
                                                {board.isWinner && (
                                                    <span className="badge badge-gold">🏆 우승</span>
                                                )}
                                                <span className="badge badge-primary">{board.bingoCount}빙고</span>
                                            </div>
                                            <BingoBoard
                                                words={board.words}
                                                checkedCells={board.checkedCells}
                                                isMyTurn={false}
                                                disabled
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                            <button
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                onClick={() => navigate('/lobby')}
                            >
                                🏠 로비로 이동
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}