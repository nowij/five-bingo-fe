import { PlayerInfo, PlayerBingoState } from '../types';

interface PlayerListProps {
    players: (PlayerInfo | PlayerBingoState)[];
    currentTurnNickname?: string;
    myNickname: string;
}

function isPlayerInfo(p: PlayerInfo | PlayerBingoState): p is PlayerInfo {
    return 'isHost' in p;
}

export default function PlayerList({ players, currentTurnNickname, myNickname }: PlayerListProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p) => {
                const isCurrentTurn = p.nickname === currentTurnNickname;
                const isMe          = p.nickname === myNickname;
                const host          = isPlayerInfo(p) ? p.isHost : false;

                return (
                    <div
                        key={p.playerId}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            borderRadius: 'var(--radius)',
                            background: isCurrentTurn ? 'rgba(108,99,255,0.12)' : 'var(--bg)',
                            border: `1px solid ${isCurrentTurn ? 'var(--primary)' : 'var(--border)'}`,
                            boxShadow: isCurrentTurn ? 'var(--glow)' : 'none',
                            transition: 'all 0.3s',
                        }}
                    >
                        {/* Turn dot */}
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                flexShrink: 0,
                                background: isCurrentTurn ? 'var(--primary)' : 'var(--border)',
                                boxShadow: isCurrentTurn ? '0 0 8px var(--primary)' : 'none',
                                transition: 'all 0.3s',
                            }}
                        />

                        {/* Avatar */}
                        <div
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                flexShrink: 0,
                                background: isCurrentTurn
                                    ? 'linear-gradient(135deg, var(--primary), #a78bfa)'
                                    : host
                                        ? 'linear-gradient(135deg, var(--accent-gold), #ff9f1c)'
                                        : 'var(--bg-elevated)',
                                border: `2px solid ${isCurrentTurn ? 'var(--primary)' : host ? 'var(--accent-gold)' : 'var(--border)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#fff',
                            }}
                        >
                            {p.nickname.charAt(0)}
                        </div>

                        {/* Name */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                    style={{
                        fontWeight: isCurrentTurn ? 700 : 500,
                        color: isCurrentTurn ? 'var(--text-1)' : 'var(--text-2)',
                        fontSize: '0.9rem',
                    }}
                >
                  {p.nickname}
                </span>
                                {isMe && (
                                    <span style={{ color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 700 }}>
                    (나)
                  </span>
                                )}
                                {host && <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>방장</span>}
                            </div>
                        </div>

                        {/* Bingo count */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            {p.bingoCount > 0 ? (
                                <div style={{ display: 'flex', gap: 3 }}>
                                    {Array.from({ length: Math.min(p.bingoCount, 5) }).map((_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                width: 18,
                                                height: 18,
                                                borderRadius: 4,
                                                background: 'linear-gradient(135deg, var(--accent-gold), #ff9f1c)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.6rem',
                                                fontWeight: 900,
                                                color: '#fff',
                                                boxShadow: '0 2px 6px rgba(255,209,102,0.4)',
                                            }}
                                        >
                                            B
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span style={{ color: 'var(--text-2)', fontSize: '0.78rem' }}>0빙고</span>
                            )}
                        </div>

                        {/* Current turn badge */}
                        {isCurrentTurn && (
                            <span className="badge badge-primary" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
                턴
              </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}