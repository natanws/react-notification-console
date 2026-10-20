import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { NotificationsPage } from './pages/NotificationsPage';

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="brand">
          Notification Console
        </Link>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<NotificationsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
