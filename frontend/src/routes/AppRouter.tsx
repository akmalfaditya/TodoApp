import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { TodosPage } from '../features/todos/pages/TodosPage';
import { AdminUsersPage } from '../features/admin/pages/AdminUsersPage';
import { NotFoundPage } from './NotFoundPage';

export const routes: RouteObject[] = [
  // Public Auth Routes
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
    ],
  },

  // Protected App Routes
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <TodosPage />,
      },
      {
        path: '/admin/users',
        element: (
          <ProtectedRoute requiredRole="Admin">
            <AdminUsersPage />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // Catch-all 404 Route
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export const appRouter = createBrowserRouter(routes);

export default appRouter;
