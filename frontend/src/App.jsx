import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppShell from './components/AppShell.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ComplaintList from './pages/ComplaintList.jsx';
import NewComplaint from './pages/NewComplaint.jsx';
import ComplaintDetails from './pages/ComplaintDetails.jsx';
import Analytics from './pages/Analytics.jsx';
import AdminManagement from './pages/AdminManagement.jsx';

function ProtectedArea() {
  const { user, loading } = useAuth();
  if (loading) return <div className="boot-screen"><div className="spinner"/> Loading CampusConnect…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}

function StudentOnly({ children }) {
  const { user } = useAuth();
  return user?.role === 'student' ? children : <Navigate to="/dashboard" replace />;
}

function SuperAdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role === 'super_admin' ? children : <Navigate to="/dashboard" replace />;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role !== 'student' ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<ProtectedArea />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/complaints" element={<ComplaintList />} />
        <Route path="/complaints/new" element={<StudentOnly><NewComplaint /></StudentOnly>} />
        <Route path="/complaints/:id" element={<ComplaintDetails />} />
        <Route path="/analytics" element={<AdminOnly><Analytics /></AdminOnly>} />
        <Route path="/admin/manage" element={<SuperAdminOnly><AdminManagement /></SuperAdminOnly>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
