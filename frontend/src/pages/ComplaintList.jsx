import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CirclePlus, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { STATUSES } from '../lib/config.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import ComplaintCard from '../components/ComplaintCard.jsx';
import { EmptyState, ErrorBanner, Loading, PageHeader } from '../components/Ui.jsx';

export default function ComplaintList() {
  const { user } = useAuth();
  const { categories, departments } = useCatalog();
  const [filters, setFilters] = useState({ search: '', status: '', category: '', department: '', priority: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isStudent = user.role === 'student';

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
      setLoading(true); setError('');
      try { const data = await api.get(`/api/complaints?${params.toString()}`); if (active) setResult(data); }
      catch (err) { if (active) setError(err.message); }
      finally { if (active) setLoading(false); }
    }, filters.search ? 240 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [filters, page]);

  function change(key, value) { setFilters(prev => ({ ...prev, [key]: value })); setPage(1); }
  function reset() { setFilters({ search: '', status: '', category: '', department: '', priority: '' }); setPage(1); }

  return <>
    <PageHeader eyebrow="COMPLAINT CENTER" title={isStudent ? 'My complaints' : 'Manage complaints'} description={isStudent ? 'All your submitted issues and their latest updates.' : 'Review, filter and resolve issues in your workspace.'} action={isStudent && <Link to="/complaints/new" className="btn btn-primary"><CirclePlus size={18}/> New complaint</Link>} />
    <section className="surface-card list-panel">
      <div className="filters-header"><div><h2>All complaints</h2><p>{result?.pagination?.total ?? 0} records</p></div><span className="filter-label"><Filter size={16}/> FILTERS</span></div>
      <div className="filter-grid"><label className="searchbox"><Search size={18}/><input aria-label="Search complaints" placeholder="Search title, description, ticket ID…" value={filters.search} onChange={e => change('search', e.target.value)}/></label>
        <select aria-label="Filter by status" value={filters.status} onChange={e => change('status', e.target.value)}><option value="">All statuses</option>{STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select>
        <select aria-label="Filter by category" value={filters.category} onChange={e => change('category', e.target.value)}><option value="">All categories</option>{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
        <select aria-label="Filter by priority" value={filters.priority || ''} onChange={e => change('priority', e.target.value)}><option value="">All priorities</option>{['low','medium','high'].map(p => <option key={p} value={p}>{p[0].toUpperCase()+p.slice(1)}</option>)}</select>
        {user.role === 'super_admin' && <select aria-label="Filter by department" value={filters.department} onChange={e => change('department', e.target.value)}><option value="">All departments</option>{departments.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select>}
      </div>
      <ErrorBanner message={error}/>
      {loading ? <Loading/> : !result?.complaints?.length ? <EmptyState title="No matching complaints" description="Try adjusting your filters or create the first complaint." link={isStudent ? '/complaints/new' : undefined}/> : <div className="complaint-grid">{result.complaints.map(complaint => <ComplaintCard key={complaint._id} complaint={complaint}/>)}</div>}
      {!!result?.pagination?.pages && result.pagination.pages > 1 && <div className="pagination"><span>Page {page} of {result.pagination.pages}</span><div><button className="btn btn-outline btn-small" disabled={page === 1} onClick={() => setPage(p => p-1)}><ChevronLeft size={17}/> Previous</button><button className="btn btn-outline btn-small" disabled={page >= result.pagination.pages} onClick={() => setPage(p => p+1)}>Next <ChevronRight size={17}/></button></div></div>}
    </section>
  </>;
}
