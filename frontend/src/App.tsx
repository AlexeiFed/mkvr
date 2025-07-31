/**
 * @file: App.tsx
 * @description: Главный компонент приложения
 * @dependencies: React, React Router, MUI, Redux
 * @created: 2024-07-06
 */

import React, { useEffect } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store';
import { fetchCurrentUser } from './store/authSlice';
import type { RootState } from './store';
import ChildLayout from './components/child/ChildLayout';
import ChildHome from './components/child/ChildHome';
import Dashboard from './components/Dashboard';
import AuthContainer from './components/auth/AuthContainer';
import MainLayout from './components/common/MainLayout';
import OrdersContainer from './components/orders/OrdersContainer';
import ServicesContainer from './components/services/ServicesContainer';
import SchoolsContainer from './components/schools/SchoolsContainer';
import WorkshopsContainer from './components/workshops/WorkshopsContainer';
import WorkshopDetails from './components/workshops/WorkshopDetails';
import UsersContainer from './components/users/UsersContainer';
import ChatContainer from './components/chat/ChatContainer';
import ExecutorDashboard from './components/executor/ExecutorDashboard';
import ExecutorWorkshopDetails from './components/executor/ExecutorWorkshopDetails';

// Компонент для перенаправления по ролям
const RoleBasedRedirect: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'child':
      return <Navigate to="/child" replace />;
    case 'parent':
      return <Navigate to="/parent" replace />;
    case 'executor':
      return <Navigate to="/executor" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Защищенный роут с проверкой роли
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const dispatch = useDispatch();
  const { token, user, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token && !user) {
      // @ts-expect-error временно для thunk
      dispatch(fetchCurrentUser());
    }
  }, [token, user, dispatch]);

  // Показываем загрузку при проверке аутентификации
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        Загрузка...
      </div>
    );
  }

  return (
    <Routes>
      {/* Публичные роуты */}
      <Route path="/login" element={<AuthContainer />} />

      {/* Главная страница с перенаправлением по ролям */}
      <Route path="/" element={<RoleBasedRedirect />} />

      {/* Админ панель */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/orders/*" element={<OrdersContainer />} />
                <Route path="/services/*" element={<ServicesContainer />} />
                <Route path="/schools/*" element={<SchoolsContainer />} />
                <Route path="/workshops" element={<WorkshopsContainer />} />
                <Route path="/workshops/:id" element={<WorkshopDetails />} />
                <Route path="/users/*" element={<UsersContainer />} />
                <Route path="/chat/*" element={<ChatContainer />} />
                <Route path="/settings/*" element={<div>Настройки (будет реализовано)</div>} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Детская панель */}
      <Route
        path="/child/*"
        element={
          <ProtectedRoute allowedRoles={['child']}>
            <ChildLayout>
              <Routes>
                <Route path="/" element={<ChildHome />} />
                <Route path="/workshops/*" element={<div>Мастер-классы (будет реализовано)</div>} />
                <Route path="/profile/*" element={<div>Профиль (будет реализовано)</div>} />
              </Routes>
            </ChildLayout>
          </ProtectedRoute>
        }
      />

      {/* Родительская панель (будет реализована) */}
      <Route
        path="/parent/*"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <div>Родительская панель (будет реализована)</div>
          </ProtectedRoute>
        }
      />

      {/* Панель исполнителя */}
      <Route
        path="/executor/*"
        element={
          <ProtectedRoute allowedRoles={['executor']}>
            <MainLayout>
              <Routes>
                <Route path="/" element={<ExecutorDashboard />} />
                <Route path="/workshops/:id" element={<ExecutorWorkshopDetails />} />
                <Route path="/profile/*" element={<div>Профиль (будет реализовано)</div>} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback для несуществующих роутов */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
