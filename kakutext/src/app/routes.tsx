import { createBrowserRouter } from 'react-router-dom';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { NotFoundPage } from '@/features/workspace/NotFoundPage';
import { SettingsPage } from '@/features/workspace/SettingsPage';
import { WorkspacePage } from '@/features/workspace/WorkspacePage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <WorkspacePage />
      </RequireAuth>
    ),
  },
  {
    path: '/notes/:id',
    element: (
      <RequireAuth>
        <WorkspacePage />
      </RequireAuth>
    ),
  },
  {
    path: '/settings',
    element: (
      <RequireAuth>
        <SettingsPage />
      </RequireAuth>
    ),
  },
  { path: '*', element: <NotFoundPage /> },
]);