import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { joinAsGuest, getRoomByCode } from '../api/room';
import { useAuth } from '../context/AuthContext';
import { RoomResponse } from '../types';

export default function GuestJoinPage() {
    const { inviteCode }          = useParams<{ inviteCode: string }>();
    const navigate                = useNavigate();
    const { user }                = useAuth();
    const [room, setRoom]         = useState<RoomResponse | null>(null);
    const [nickname, setNickname] = useState('');
    const [error, setError]       = useState('');
    const [loading, setLoading]   = useState(false);

    useEffect(() => {
        if (!inviteCode) return;
        if (user) { navigate(`/room/${inviteCode}`); return; }
        getRoomByCode(inviteCode)
            .then((res) => setRoom(res.data))
            .catch(() => setError('유효하지 않은 초대 링크입니다.'));
    }, [inviteCode, user, navigate]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim() || !inviteCode) return setError('닉네임을 입력해주세요.');
        setLoading(true);
        try {
            let sessionId = localStorage.getItem('bingo_session');
            if (!sessionId) {
                sessionId = uuidv4();
                localStorage.setItem('bingo_session', sessionId);
            }
            const res = await joinAsGuest(inviteCode, nickname.trim(), sessionId);
            const myPlayer = res.data.players.find((p) => p.nickname === nickname.trim());
            if (myPlayer) {
                sessionStorage.setItem('bingo_playerId', String(myPlayer.playerId));
                sessionStorage.setItem('bingo_nickname', nickname.trim());
            }
            navigate(`/room/${inviteCode}`);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } | string } })?.response?.data;
            if (typeof msg === 'object') setError(msg?.error ?? '입장 실패');
            else setError(msg ?? '입장 실패');
        } finally {
            setLoading(false);
        }
    };

    if (error && !room) {
        return (
            <div className="page-center">
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
                    <h2 style={{ color: 'var(--accent)', marginBottom: 8 }}>입장 불가</h2>
                    <p style={{ color: 'var(--text-2)' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-center">
            <div style={{ width: '100%', maxWidth: 420 }} className="animate-fadeInUp">
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{ fontSize: 56, marginBottom: 12 }}>🎯</div>
                    <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>빙고 게임 초대</h1>
                    {room && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                            <p style={{ color: 'var(--text-2)', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{room.hostNickname}</span>님의 방
                            </p>
                            <span className="badge badge-primary">주제: {room.topic}</span>
                            <p style={{ color: 'var(--text-2)', fontSize: '0.82rem' }}>
                                {room.players.length}/{room.maxPlayers}명 참가 중
                            </p>
                        </div>
                    )}
                </div>

                <div className="card-elevated" style={{ padding: 32 }}>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: 6 }}>닉네임 입력</h2>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: 24 }}>
                        게임에서 사용할 닉네임을 입력하세요.
                    </p>
                    <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <input
                            className="input"
                            placeholder="닉네임 (최대 10자)"
                            value={nickname}
                            onChange={(e) => { setNickname(e.target.value.slice(0, 10)); setError(''); }}
                            autoFocus
                        />
                        {error && <p className="error-text">⚠ {error}</p>}
                        <button className="btn btn-primary" type="submit" disabled={loading || !nickname.trim()}>
                            {loading ? '입장 중...' : '🎮 게임 입장'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: '0.8rem', marginTop: 20 }}>
                    로그인 없이도 참여할 수 있습니다.
                </p>
            </div>
        </div>
    );
}