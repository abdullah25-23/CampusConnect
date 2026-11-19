import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, BarChart3, CheckCheck, Clock3, ClipboardList, TrendingUp } from 'lucide-react';
import { api } from '../lib/api.js';
import { STATUSES } from '../lib/config.js';
import { ErrorBanner, Loading, PageHeader, StatCard } from '../components/Ui.jsx';

const COLORS = ['#0C774A', '#5D9E7B', '#CEAB65', '#7DAEAE'];
export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; api.get('/api/dashboard/stats').then(d => { if (active) setData(d); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, []);

  const byStatus = STATUSES.map(s => ({ name: s.label, count: data?.byStatus?.[s.value] || 0, color: s.color }));
  const byDepartment = (data?.byDepartment || []).map(d => ({ name: d.label || d.department, count: d.count }));
  const byCategory = (data?.byCategory || []).map(d => ({ name: d.label, count: d.count }));
  const priorityData = ['high', 'medium', 'low'].map(p => ({ name: p.charAt(0).toUpperCase() + p.slice(1), count: data?.byPriority?.[p] || 0 }));
  const trendData = (data?.last7Days || []).map(d => ({ day: d.date.slice(5), count: d.count }));

  return <>
    <PageHeader eyebrow="DATA & INSIGHTS" title="Campus analytics" description="Live complaint trends, priorities, recurring issues and departmental performance."/>
    <ErrorBanner message={error}/>
    {!data ? (!error && <Loading />) : <>
      <div className="stat-grid"><StatCard icon={ClipboardList} label="Total complaints" value={data.total}/><StatCard icon={CheckCheck} label="Resolved" value={data.byStatus.resolved}/><StatCard icon={TrendingUp} label="Resolution rate" value={`${data.resolutionRate}%`}/><StatCard icon={Clock3} label="Average resolution" value={data.avgResolutionHours === null ? '—' : `${data.avgResolutionHours}h`} tint="blue"/></div>
      <div className="stat-grid secondary-stats"><StatCard icon={AlertTriangle} label="High-priority issues" value={data.byPriority?.high || 0} tint="amber"/><StatCard icon={Clock3} label="Open more than 7 days" value={data.openOlderThan7Days || 0}/><StatCard icon={BarChart3} label="In progress" value={data.byStatus.in_progress} tint="blue"/><StatCard icon={ClipboardList} label="Rejected" value={data.byStatus.rejected}/></div>
      <div className="analytics-grid">
        <section className="surface-card chart-card"><div className="section-header"><div><p className="eyebrow">DEPARTMENT ACTIVITY</p><h2>Complaints by department</h2></div></div><div className="visual-chart"><ResponsiveContainer width="100%" height={285}><BarChart data={byDepartment} margin={{ top: 10, right: 8, left: -20, bottom: 36 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7EEE8"/><XAxis dataKey="name" angle={-18} textAnchor="end" height={65} tick={{ fontSize: 10, fill: '#7A8981' }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#7A8981' }} axisLine={false} tickLine={false}/><Tooltip cursor={{ fill: '#F3F7F3' }}/><Bar dataKey="count" name="Complaints" fill="#0C774A" radius={[6, 6, 0, 0]} barSize={36}/></BarChart></ResponsiveContainer></div></section>
        <section className="surface-card chart-card"><div className="section-header"><div><p className="eyebrow">ISSUE BREAKDOWN</p><h2>Complaints by status</h2></div></div><div className="visual-chart"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={byStatus.some(v => v.count) ? byStatus : [{ name:'No complaints', count: 1, color:'#E7EEE8' }]} dataKey="count" nameKey="name" outerRadius={93} innerRadius={55} paddingAngle={2}>{(byStatus.some(v => v.count) ? byStatus : [{ color:'#E7EEE8' }]).map((s, i) => <Cell key={i} fill={s.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div><div className="compact-legend">{byStatus.map(s => <span key={s.name}><i style={{ background: s.color }}/>{s.name}: <strong>{s.count}</strong></span>)}</div></section>
      </div>
      <div className="analytics-grid">
        <section className="surface-card chart-card"><div className="section-header"><div><p className="eyebrow">LAST SEVEN DAYS</p><h2>Complaint volume trend</h2></div></div><div className="visual-chart"><ResponsiveContainer width="100%" height={245}><LineChart data={trendData} margin={{ top: 8, right: 12, left: -20, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7EEE8"/><XAxis dataKey="day" tick={{ fontSize: 11, fill: '#7A8981' }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#7A8981' }} axisLine={false} tickLine={false}/><Tooltip/><Line type="monotone" dataKey="count" name="Complaints" stroke="#0C774A" strokeWidth={3} dot={{ fill:'#0C774A', r:4 }}/></LineChart></ResponsiveContainer></div></section>
        <section className="surface-card chart-card"><div className="section-header"><div><p className="eyebrow">SMART TRIAGE</p><h2>Issue priority mix</h2></div></div><div className="visual-chart"><ResponsiveContainer width="100%" height={245}><BarChart data={priorityData} margin={{ top: 8, right: 12, left: -20, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7EEE8"/><XAxis dataKey="name" tick={{ fontSize: 11, fill: '#7A8981' }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#7A8981' }} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="count" name="Complaints" radius={[6,6,0,0]} barSize={50}>{priorityData.map((p,i) => <Cell key={p.name} fill={['#D58B36','#3A8E65','#78AD9E'][i]}/>)}</Bar></BarChart></ResponsiveContainer></div></section>
      </div>
      <div className="analytics-grid">
        <section className="surface-card chart-card"><div className="section-header"><div><p className="eyebrow">WHERE HELP IS NEEDED</p><h2>Category comparison</h2></div></div><div className="category-comparison">{byCategory.map((c, i) => <div className="comparison-row" key={c.name}><div><strong>{c.name}</strong><span>{c.count} {c.count === 1 ? 'complaint' : 'complaints'}</span></div><div className="track"><div className="fill" style={{ background: COLORS[i % COLORS.length], width: `${data.total ? Math.max(0, c.count / data.total * 100) : 0}%` }}/></div></div>)}</div></section>
        <section className="surface-card chart-card"><div className="section-header"><div><p className="eyebrow">RECURRING LOCATIONS</p><h2>Campus issue hotspots</h2></div></div>{data.hotspots?.length ? <div className="hotspot-list">{data.hotspots.map((h,i) => <div className="hotspot-row" key={h.location}><span>{i+1}</span><strong>{h.location}</strong><small>{h.count} issue{h.count !== 1 ? 's' : ''}</small></div>)}</div> : <p className="soft-empty">Location trends will appear as students submit complaints with location details.</p>}</section>
      </div>
    </>}
  </>;
}
