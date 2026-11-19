import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCheck, CirclePlus, Clock3, ClipboardList, Hourglass, TrendingUp } from 'lucide-react';
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { STATUSES, dateLabel } from '../lib/config.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { ErrorBanner, Loading, PageHeader, StatCard, EmptyState } from '../components/Ui.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { categoryName } = useCatalog();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const isStudent = user.role === 'student';
  useEffect(() => {
    let live = true;
    api.get('/api/dashboard/stats').then(data => { if (live) setStats(data); })
      .catch(err => { if (live) setError(err.message); });
    return () => { live = false; };
  }, []);

  const statusData = STATUSES.map(s => ({ name: s.label, value: stats?.byStatus?.[s.value] || 0, color: s.color }));
  const chartData = statusData.some(item => item.value > 0) ? statusData : [{ name: 'No complaints', value: 1, color: '#E9EFEB' }];
  const firstName = user.name?.split(' ')[0] || 'there';

  return <>
    <PageHeader eyebrow="YOUR WORKSPACE" title={`Hello, ${firstName} 👋`} description={isStudent ? 'Stay informed about the issues that matter to you.' : 'Here’s the latest on your campus service requests.'} action={isStudent && <Link to="/complaints/new" className="btn btn-primary"><CirclePlus size={18}/> Raise a complaint</Link>} />
    <div className="welcome-banner"><div><span className="banner-label">CAMPUSCONNECT · BIIT</span><h2>{isStudent ? 'A better campus begins with your voice.' : 'Every resolved issue makes a difference.'}</h2><p>{isStudent ? 'Report concerns, track progress and see real change in one place.' : 'Keep response times down and students informed with transparent updates.'}</p><Link to={isStudent ? '/complaints' : '/analytics'} className="banner-link">{isStudent ? 'View my complaints' : 'View detailed analytics'} <ArrowRight size={17}/></Link></div><div className="banner-art" aria-hidden="true"><div className="art-ring"><CheckCheck size={78} strokeWidth={1.35}/></div></div></div>
    <ErrorBanner message={error}/>
    {!stats ? (!error && <Loading/>) : <>
      <div className="stat-grid">
        <StatCard icon={ClipboardList} label="Total complaints" value={stats.total} sub="Across your workspace"/>
        <StatCard icon={Clock3} label="Pending" value={stats.byStatus.pending} sub="Awaiting review" tint="amber"/>
        <StatCard icon={Hourglass} label="In progress" value={stats.byStatus.in_progress} sub="Being handled" tint="blue"/>
        <StatCard icon={CheckCheck} label="Resolved" value={stats.byStatus.resolved} sub="Successfully addressed" tint="green"/>
      </div>
      <div className="dashboard-grid">
        <section className="surface-card"><div className="section-header"><div><p className="eyebrow">AT A GLANCE</p><h2>Complaint status</h2></div><span className="muted-small">Live breakdown</span></div>
          <div className="donut-layout"><div className="chart-ring"><ResponsiveContainer width="100%" height={215}><PieChart><Pie data={chartData} dataKey="value" innerRadius={66} outerRadius={90} strokeWidth={4} stroke="#fff">{chartData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="chart-center"><strong>{stats.total}</strong><span>total</span></div></div><div className="chart-legend">{statusData.map(d => <div key={d.name} className="legend-row"><span><i style={{ background: d.color }}/>{d.name}</span><strong>{d.value}</strong></div>)}</div></div>
        </section>
        <section className="surface-card"><div className="section-header"><div><p className="eyebrow">LATEST ACTIVITY</p><h2>Recent complaints</h2></div><Link className="text-link" to="/complaints">View all <ArrowRight size={16}/></Link></div>
          {stats.recent?.length ? <div className="recent-list">{stats.recent.map(item => <Link key={item._id} to={`/complaints/${item._id}`} className="recent-item"><span className="recent-icon"><ClipboardList size={19}/></span><span className="recent-info"><strong>{item.title}</strong><small>{item.ticketId} · {categoryName(item.category)} · {dateLabel(item.createdAt)}</small></span><StatusBadge status={item.status}/></Link>)}</div> : <EmptyState title="No complaints yet" description={isStudent ? 'Start by reporting an issue on campus.' : 'Complaints assigned to you will appear here.'} link={isStudent ? '/complaints/new' : undefined} linkText="Submit complaint"/>}
        </section>
      </div>
      {!isStudent && <section className="surface-card departments-preview"><div className="section-header"><div><p className="eyebrow">SERVICE PERFORMANCE</p><h2>Departments overview</h2></div><Link to="/analytics" className="text-link">Detailed report <ArrowRight size={16}/></Link></div><div className="department-bars">{stats.byDepartment?.map(item => <div key={item.department} className="department-bar-row"><span>{item.label}</span><div className="track"><div className="fill" style={{ width: `${stats.total ? item.count / stats.total * 100 : 0}%` }}/></div><strong>{item.count}</strong></div>)}</div></section>}
    </>}
  </>;
}
