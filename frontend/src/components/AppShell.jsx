import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, Settings2, ChevronRight, CirclePlus, LayoutDashboard, ListChecks, LogOut, Menu, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { roleName } from '../lib/config.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import Brand from './Brand.jsx';

export default function AppShell() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { departmentName } = useCatalog();
  const navigate = useNavigate();
  const isStudent = user?.role === 'student';
  const items = [
    { to: '/dashboard', title: 'Overview', icon: LayoutDashboard },
    { to: '/complaints', title: isStudent ? 'My complaints' : 'Manage complaints', icon: ListChecks },
    ...(isStudent ? [{ to: '/complaints/new', title: 'New complaint', icon: CirclePlus }] : [{ to: '/analytics', title: 'Analytics', icon: BarChart3 }]),
    ...(user?.role === 'super_admin' ? [{ to: '/admin/manage', title: 'Campus management', icon: Settings2 }] : []),
  ];

  function logout() { signOut(); navigate('/login', { replace: true }); }
  function navigation() { return items.map(({ to, title, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
    <Icon size={19}/><span>{title}</span><ChevronRight size={16} className="side-chevron"/>
  </NavLink>); }

  return <div className="app-layout">
    {open && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setOpen(false)}/>}
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand"><Brand/><button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setOpen(false)}><X size={20}/></button></div>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Main navigation">{navigation()}</nav>
      <div className="sidebar-bottom">
        <div className="campus-note"><ShieldCheck size={19}/><p><strong>A safer campus starts here.</strong><span>Every voice deserves to be heard.</span></p></div>
        <button className="logout-link" onClick={logout}><LogOut size={18}/> Sign out</button>
      </div>
    </aside>
    <div className="app-main">
      <header className="topbar">
        <div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={21}/></button><span className="topbar-label">BIIT / CampusConnect</span></div>
        <div className="topbar-right"><span className="today-pill"><span className="live-dot"/> Campus services</span><div className="user-chip"><div className="avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div><div className="user-meta"><strong>{user?.name}</strong><span>{user?.role === 'department_admin' ? departmentName(user.department) : roleName(user?.role)}</span></div></div></div>
      </header>
      <main className="content"><Outlet /></main>
      <footer className="page-footer">© {new Date().getFullYear()} CampusConnect · Barani Institute of Information Technology <span>Built for a better campus</span></footer>
    </div>
  </div>;
}
