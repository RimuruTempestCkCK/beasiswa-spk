import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Routes, Route } from 'react-router';
import MainLayout from './Layout/MainLayout';
import AppMain from './Layout/AppMain';
import LoginPage from './features/auth/LoginPage';
import { fetchMe } from './features/auth/authSlice';

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth?.token) || localStorage.getItem('access_token');
  const user = useSelector((s) => s.auth?.user);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchMe());
    }
  }, [token, user, dispatch]);

  if (!token) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <MainLayout>
      <AppMain />
    </MainLayout>
  );
}
