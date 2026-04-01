// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { login as apiLogin, signup as apiSignup } from '../api/auth';
// import { useAuth } from '../context/AuthContext';
//
// type Mode = 'login' | 'signup';
//
// interface FormState {
//     username: string;
//     password: string;
//     nickname: string;
// }
//
// export default function LoginPage() {
//     const [mode, setMode]       = useState<Mode>('login');
//     const [form, setForm]       = useState<FormState>({ username: '', password: '', nickname: '' });
//     const [error, setError]     = useState('');
//     const [loading, setLoading] = useState(false);
//     const { login }             = useAuth();
//     const navigate              = useNavigate();
//
//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
//         setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
//
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setError('');
//         setLoading(true);
//         try {
//             if (mode === 'signup') {
//                 await apiSignup(form);
//                 setMode('login');
//                 setForm((prev) => ({ ...prev, nickname: '' }));
//             } else {
//                 const res = await apiLogin({ username: form.username, password: form.password });
//                 login(res.data);
//                 navigate('/lobby');
//             }
//         } catch (err: unknown) {
//             const msg =
//                 (err as { response?: { data?: { error?: string } | string } })?.response?.data;
//             if (typeof msg === 'object') setError(msg?.error ?? '오류가 발생했습니다.');
//             else setError(msg ?? '오류가 발생했습니다.');
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     return (
//         <div className="page-center">
//             <div style={{ width: '100%', maxWidth: 420 }} className="animate-fadeInUp">
//                 {/* Logo */}
//                 <div style={{ textAlign: 'center', marginBottom: 40 }}>
//                     <div style={{
//                         display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
//                         width: 72, height: 72, borderRadius: 20,
//                         background: 'linear-gradient(135deg, var(--primary), #a78bfa)',
//                         boxShadow: 'var(--glow)', marginBottom: 16, fontSize: 32,
//                     }}>🎯</div>
//                     <h1 style={{ fontSize: '2.4rem', lineHeight: 1 }}>빙고!</h1>
//                     <p style={{ color: 'var(--text-2)', marginTop: 8, fontSize: '0.9rem' }}>
//                         친구들과 함께하는 실시간 빙고 게임
//                     </p>
//                 </div>
//
//                 {/* Tab */}
//                 <div style={{
//                     display: 'flex', background: 'var(--bg-card)', borderRadius: 'var(--radius)',
//                     padding: 4, marginBottom: 24, border: '1px solid var(--border)',
//                 }}>
//                     {(['login', 'signup'] as Mode[]).map((m) => (
//                         <button
//                             key={m}
//                             type="button"
//                             onClick={() => { setMode(m); setError(''); }}
//                             style={{
//                                 flex: 1, padding: 10, border: 'none', borderRadius: 8,
//                                 fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 600,
//                                 cursor: 'pointer', transition: 'all 0.2s',
//                                 background: mode === m ? 'var(--primary)' : 'transparent',
//                                 color:      mode === m ? '#fff' : 'var(--text-2)',
//                                 boxShadow:  mode === m ? '0 2px 8px rgba(108,99,255,0.4)' : 'none',
//                             }}
//                         >
//                             {m === 'login' ? '로그인' : '회원가입'}
//                         </button>
//                     ))}
//                 </div>
//
//                 {/* Form */}
//                 <div className="card" style={{ padding: 28 }}>
//                     <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
//                         {mode === 'signup' && (
//                             <div className="form-group">
//                                 <label className="form-label">닉네임</label>
//                                 <input
//                                     className="input" name="nickname" placeholder="게임에서 사용할 닉네임"
//                                     value={form.nickname} onChange={handleChange} required
//                                 />
//                             </div>
//                         )}
//                         <div className="form-group">
//                             <label className="form-label">아이디</label>
//                             <input
//                                 className="input" name="username" placeholder="아이디 입력"
//                                 value={form.username} onChange={handleChange} required autoComplete="username"
//                             />
//                         </div>
//                         <div className="form-group">
//                             <label className="form-label">비밀번호</label>
//                             <input
//                                 className="input" type="password" name="password" placeholder="비밀번호 입력"
//                                 value={form.password} onChange={handleChange} required autoComplete="current-password"
//                             />
//                         </div>
//                         {error && <p className="error-text">⚠ {error}</p>}
//                         <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
//                             {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
//                         </button>
//                     </form>
//                 </div>
//
//                 <p style={{ textAlign: 'center', color: 'var(--text-2)', fontSize: '0.82rem', marginTop: 20 }}>
//                     빙고 게임은 하루에 최대 5번까지 참여할 수 있습니다.
//                 </p>
//             </div>
//         </div>
//     );
// }

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';

interface FormState {
    username: string;
    password: string;
}

export default function LoginPage() {
    const [form, setForm]       = useState<FormState>({ username: '', password: '' });
    const [error, setError]     = useState('');
    const [loading, setLoading] = useState(false);
    const { login }             = useAuth();
    const navigate              = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await apiLogin(form);
            login(res.data);
            navigate('/lobby');
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { error?: string } | string } })?.response?.data;
            if (typeof msg === 'object') setError(msg?.error ?? '아이디 또는 비밀번호가 올바르지 않습니다.');
            else setError(msg ?? '아이디 또는 비밀번호가 올바르지 않습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-center">
            <div style={{ width: '100%', maxWidth: 400 }} className="animate-fadeInUp">

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 44 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 76, height: 76, borderRadius: 22,
                        background: 'linear-gradient(135deg, var(--primary), #a78bfa)',
                        boxShadow: 'var(--glow)', marginBottom: 18, fontSize: 34,
                    }}>
                        🎯
                    </div>
                    <h1 style={{ fontSize: '2.6rem', lineHeight: 1, marginBottom: 10 }}>빙고!</h1>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.92rem' }}>
                        친구들과 함께하는 실시간 빙고 게임
                    </p>
                </div>

                {/* Login Card */}
                <div className="card-elevated" style={{ padding: 32 }}>
                    <h2 style={{ fontSize: '1.15rem', marginBottom: 24 }}>방장 로그인</h2>

                    <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-group">
                            <label className="form-label">아이디</label>
                            <input
                                className="input"
                                name="username"
                                placeholder="아이디 입력"
                                value={form.username}
                                onChange={handleChange}
                                required
                                autoComplete="off"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">비밀번호</label>
                            <input
                                className="input"
                                type="password"
                                name="password"
                                placeholder="비밀번호 입력"
                                value={form.password}
                                onChange={handleChange}
                                required
                                autoComplete="off"
                            />
                        </div>

                        {error && <p className="error-text">⚠ {error}</p>}

                        <button
                            className="btn btn-primary"
                            type="submit"
                            disabled={loading}
                            style={{ marginTop: 4, padding: '13px' }}
                        >
                            {loading ? '로그인 중...' : '로그인'}
                        </button>
                    </form>
                </div>

                {/* Guest guide */}
                <div className="card" style={{ padding: 18, marginTop: 16, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        🔗 참가자는 방장에게 <b style={{ color: 'var(--accent-gold)' }}>초대 링크</b>를 받아 입장하세요.<br />
                        로그인 없이 닉네임만으로 참여할 수 있습니다.
                    </p>
                </div>

            </div>
        </div>
    );
}