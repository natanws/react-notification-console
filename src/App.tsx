import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { NotificationDetailPage } from './pages/NotificationDetailPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SendNotificationPage } from './pages/SendNotificationPage';

export default function App() {
  return (
    <div className="app">
      {import.meta.env.VITE_DEMO === 'true' && (
        <p className="demo-banner" role="note">
          Demo mode: the API is simulated in your browser and resets on reload. Recipients
          containing &quot;fail&quot; act like a broken receiver until you retry them.
        </p>
      )}
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
