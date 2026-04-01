import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/global.css';

import LoginPage       from './pages/LoginPage';
import LobbyPage       from './pages/LobbyPage';
import GuestJoinPage   from './pages/GuestJoinPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import WordInputPage   from './pages/WordInputPage';
import GamePage        from './pages/GamePage';

function PrivateRoute({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="page-center">
                <div className="spinner" />
            </div>
        );
    }
    return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
    return (
        <Routes>
            {/* 로그인 / 회원가입 */}
            <Route path="/login" element={<LoginPage />} />

            {/* 로비 — 로그인 필요 */}
            <Route
                path="/lobby"
                element={
                    <PrivateRoute>
                        <LobbyPage />
                    </PrivateRoute>
                }
            />

            {/* 초대 링크 — 비로그인 게스트 닉네임 입력 */}
            <Route path="/join/:inviteCode" element={<GuestJoinPage />} />

            {/* 대기실 — 로그인 유저 & 게스트 모두 */}
            <Route path="/room/:inviteCode" element={<WaitingRoomPage />} />

            {/* 단어 입력 */}
            <Route path="/word-input/:inviteCode" element={<WordInputPage />} />

            {/* 게임 진행 */}
            <Route path="/game/:inviteCode" element={<GamePage />} />

            {/* 기본 리다이렉트 */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}