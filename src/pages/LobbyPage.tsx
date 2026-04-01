import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../api/room';
import { useAuth } from '../context/AuthContext';

export default function LobbyPage() {
    const [topic, setTopic]     = useState('');
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);
    const { user, logout }      = useAuth();
    const navigate              = useNavigate();

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return setError('주제를 입력해주세요.');
        setLoading(true);
        try {
            const res = await createRoom(topic.trim());
            const { inviteCode } = res.data;
            sessionStorage.setItem('bingo_inviteCode', inviteCode);
            navigate(`/room/${inviteCode}`);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } | string } })?.response?.data;
            if (typeof msg === 'object') setError(msg?.error ?? '방 생성 실패');
            else setError(msg ?? '방 생성 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-center">
            <div style={{ width: '100%', maxWidth: 480 }} className="animate-fadeInUp">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
                    <div>
                        <h1 style={{ fontSize: '2rem' }}>🎯 빙고</h1>
                        <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginTop: 4 }}>
                            안녕하세요,{' '}
                            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{user?.nickname}</span>님!
                        </p>
                    </div>
                    <button className="btn btn-ghost" onClick={logout} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        로그아웃
                    </button>
                </div>

                {/* Create Card */}
                <div className="card-elevated" style={{ padding: 36, marginBottom: 20 }}>
                    <div style={{ marginBottom: 28 }}>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: 6 }}>새 게임 만들기</h2>
                        <p style={{ color: 'var(--text-2)', fontSize: '0.88rem' }}>
                            방을 만들고 친구들을 초대해서 빙고 게임을 시작하세요.
                        </p>
                    </div>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label className="form-label">빙고 주제</label>
                            <input
                                className="input"
                                placeholder="예: 좋아하는 음식, 여행지, 드라마 제목..."
                                value={topic}
                                onChange={(e) => { setTopic(e.target.value); setError(''); }}
                                maxLength={50}
                            />
                            <span style={{ color: 'var(--text-2)', fontSize: '0.78rem', alignSelf: 'flex-end' }}>
                {topic.length}/50
              </span>
                        </div>
                        {error && <p className="error-text">⚠ {error}</p>}
                        <button className="btn btn-primary" type="submit" disabled={loading}>
                            {loading ? '생성 중...' : '🎮 방 만들기'}
                        </button>
                    </form>
                </div>

                {/* Info */}
                <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginBottom: 12, letterSpacing: '0.05em' }}>
                        게임 안내
                    </h3>
                    {([
                        ['👥', '최대 4명까지 참여 가능'],
                        ['🔗', '초대 링크로 로그인 없이 참여 가능'],
                        ['📝', '5×5 빙고판에 주제에 맞는 단어 입력'],
                        ['🏆', '5빙고를 가장 먼저 달성하면 승리'],
                        ['⏰', '하루에 최대 5번 참여 가능'],
                    ] as [string, string][]).map(([icon, text]) => (
                        <div
                            key={text}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '7px 0', borderBottom: '1px solid var(--border)',
                                fontSize: '0.88rem', color: 'var(--text-2)',
                            }}
                        >
                            <span>{icon}</span><span>{text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}