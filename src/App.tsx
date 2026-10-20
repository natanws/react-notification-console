import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { NotificationDetailPage } from './pages/NotificationDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SendNotificationPage } from './pages/SendNotificationPage';

export default function App() {
  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="brand">
          Notification Console
        </Link>
        <nav className="nav">
          <NavLink to="/" end>
            Notifications
          </NavLink>
          <NavLink to="/send">Send test</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<NotificationsPage />} />
          <Route path="/notifications/:id" element={<NotificationDetailPage />} />
          <Route path="/send" element={<SendNotificationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
