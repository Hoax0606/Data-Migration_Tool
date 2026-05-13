import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppShell } from './layout/AppShell';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useSettingsStore } from './store/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // 테마를 document 에 반영 (Solution settings 의 Dark 토글이 즉시 동작)
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* 인증 필요한 라우트 */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/mapping" element={<PlaceholderPage title="Mapping" description="AS-IS → TO-BE 컬럼 매핑 정의" />} />
              <Route path="/versions" element={<PlaceholderPage title="Versions" description="매핑 스냅샷 버전 관리" />} />
              <Route path="/execution" element={<PlaceholderPage title="Execution" description="Run 실행·예약·진행상황·격리" />} />
              <Route path="/artifacts" element={<PlaceholderPage title="Artifacts" description="검증 리포트·매핑 스냅샷 export" />} />
              <Route path="/logs" element={<PlaceholderPage title="Log viewer" description="Audit log 조회·필터·검색·export" />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
