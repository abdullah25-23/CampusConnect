import { useEffect, useState } from 'react';
import { Building2, FolderPlus, ShieldPlus, ShieldCheck, Users } from 'lucide-react';
import { api } from '../lib/api.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { ErrorBanner, Loading, PageHeader } from '../components/Ui.jsx';

const emptyDepartment = { name: '' };
const emptyCategory = { label: '', department: '' };
const emptyAdmin = { name: '', email: '', password: '', department: '' };

export default function AdminManagement() {
  const { refresh: refreshCatalog } = useCatalog();
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [departmentForm, setDepartmentForm] = useState(emptyDepartment);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [adminForm, setAdminForm] = useState(emptyAdmin);
  const [tab, setTab] = useState('departments');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function reload() {
    const [d, c, a] = await Promise.all([
      api.get('/api/admin/departments'),
      api.get('/api/admin/categories'),
      api.get('/api/admin/department-admins'),
    ]);
    setDepartments(d.departments); setCategories(c.categories); setAdmins(a.admins);
    await refreshCatalog();
  }
  useEffect(() => {
    let active = true;
    Promise.all([api.get('/api/admin/departments'), api.get('/api/admin/categories'), api.get('/api/admin/department-admins')])
      .then(([d,c,a]) => { if (active) { setDepartments(d.departments); setCategories(c.categories); setAdmins(a.admins); } })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function run(action, success) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); await reload(); setNotice(success); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  const activeDepartments = departments.filter(d => d.active);
  const departmentLabel = key => departments.find(d => d.key === key)?.name || key;

  return <>
    <PageHeader eyebrow="SUPER ADMIN" title="Campus management" description="Manage departments, complaint categories and department administrator access from one place." />
    <div className="info-panel"><ShieldCheck size={19}/><span>All changes are protected by server-side Super Admin authorization. Existing complaints remain in the database.</span></div>
    <ErrorBanner message={error}/>
    {notice && <div className="alert success">{notice}</div>}
    {loading ? <Loading /> : <>
      <div className="management-tabs" role="tablist" aria-label="Management section">
        {[['departments','Departments',Building2], ['categories','Categories',FolderPlus], ['admins','Administrators',Users]].map(([key,label,Icon]) =>
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'selected' : ''} onClick={() => { setTab(key); setError(''); setNotice(''); }}><Icon size={17}/>{label}</button>
        )}
      </div>
      {tab === 'departments' && <div className="management-layout">
        <section className="surface-card"><div className="section-header"><div><p className="eyebrow">NEW DEPARTMENT</p><h2>Add a campus department</h2></div><Building2 size={22}/></div>
          <form className="form-stack" onSubmit={e => { e.preventDefault(); run(() => api.post('/api/admin/departments', departmentForm), 'Department created successfully.'); setDepartmentForm(emptyDepartment); }}>
            <label className="field"><span>Department name</span><input required minLength={2} maxLength={100} value={departmentForm.name} onChange={e => setDepartmentForm({ name: e.target.value })} placeholder="e.g. Transport Administration"/></label>
            <button type="submit" className="btn btn-primary" disabled={busy}>Add department</button>
          </form>
        </section>
        <section className="surface-card"><div className="section-header"><div><p className="eyebrow">DEPARTMENT DIRECTORY</p><h2>All departments ({departments.length})</h2></div></div>
          <div className="management-list">{departments.map(d => <div className="management-row" key={d._id}><div><strong>{d.name}</strong><small>{d.key} · {d.active ? 'Active' : 'Inactive'}</small></div><button type="button" className="btn btn-outline btn-small" disabled={busy} onClick={() => run(() => api.patch(`/api/admin/departments/${d._id}`, { active: !d.active }), 'Department status updated.')}>{d.active ? 'Deactivate' : 'Activate'}</button></div>)}</div>
        </section>
      </div>}
      {tab === 'categories' && <div className="management-layout">
        <section className="surface-card"><div className="section-header"><div><p className="eyebrow">NEW COMPLAINT CATEGORY</p><h2>Add a student complaint option</h2></div><FolderPlus size={22}/></div>
          <form className="form-stack" onSubmit={e => { e.preventDefault(); run(() => api.post('/api/admin/categories', categoryForm), 'Category created. It now appears in the student complaint form.'); setCategoryForm(emptyCategory); }}>
            <label className="field"><span>Category name</span><input required minLength={2} maxLength={100} value={categoryForm.label} onChange={e => setCategoryForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Bus Scheduling" /></label>
            <label className="field"><span>Route to department</span><select required value={categoryForm.department} onChange={e => setCategoryForm(f => ({ ...f, department: e.target.value }))}><option value="">Choose a department</option>{activeDepartments.map(d => <option key={d.key} value={d.key}>{d.name}</option>)}</select></label>
            <button type="submit" className="btn btn-primary" disabled={busy}>Add category</button>
          </form>
        </section>
        <section className="surface-card"><div className="section-header"><div><p className="eyebrow">AVAILABLE CATEGORIES</p><h2>Complaint categories ({categories.length})</h2></div></div>
          <div className="management-list">{categories.map(c => <div className="management-row" key={c._id}><div><strong>{c.label}</strong><small>{departmentLabel(c.department)} · {c.active ? 'Active' : 'Inactive'}</small></div><button type="button" className="btn btn-outline btn-small" disabled={busy} onClick={() => run(() => api.patch(`/api/admin/categories/${c._id}`, { active: !c.active }), 'Category status updated.')}>{c.active ? 'Deactivate' : 'Activate'}</button></div>)}</div>
        </section>
      </div>}
      {tab === 'admins' && <div className="management-layout">
        <section className="surface-card"><div className="section-header"><div><p className="eyebrow">ADMINISTRATOR ACCESS</p><h2>Create a department admin</h2></div><ShieldPlus size={22}/></div>
          <form className="form-stack" onSubmit={e => { e.preventDefault(); run(() => api.post('/api/admin/department-admins', adminForm), 'Department administrator created.'); setAdminForm(emptyAdmin); }}>
            <label className="field"><span>Full name</span><input required minLength={2} value={adminForm.name} onChange={e => setAdminForm(f => ({ ...f, name: e.target.value }))}/></label>
            <label className="field"><span>Email</span><input required type="email" value={adminForm.email} onChange={e => setAdminForm(f => ({ ...f, email: e.target.value }))}/></label>
            <label className="field"><span>Initial password (at least 10 characters)</span><input required type="password" minLength={10} value={adminForm.password} onChange={e => setAdminForm(f => ({ ...f, password: e.target.value }))}/></label>
            <label className="field"><span>Department</span><select required value={adminForm.department} onChange={e => setAdminForm(f => ({ ...f, department: e.target.value }))}><option value="">Choose a department</option>{activeDepartments.map(d => <option key={d.key} value={d.key}>{d.name}</option>)}</select></label>
            <button type="submit" className="btn btn-primary" disabled={busy}>Create administrator</button>
          </form>
        </section>
        <section className="surface-card"><div className="section-header"><div><p className="eyebrow">AUTHORIZED PEOPLE</p><h2>Department admins ({admins.length})</h2></div></div>
          <div className="management-list">{admins.map(a => <div className="management-row admin-row" key={a._id}>
            <div><strong>{a.name}</strong><small>{a.email}</small><small>{a.active ? 'Active account' : 'Disabled account'}</small></div>
            <div className="admin-row-actions"><select aria-label={`Department for ${a.name}`} value={a.department} disabled={busy || !a.active} onChange={e => run(() => api.patch(`/api/admin/department-admins/${a._id}`, { department: e.target.value }), 'Administrator department changed.')}>
              {departments.map(d => <option key={d.key} value={d.key} disabled={!d.active}>{d.name}</option>)}
            </select><button type="button" className="btn btn-outline btn-small" disabled={busy} onClick={() => run(() => api.patch(`/api/admin/department-admins/${a._id}`, { active: !a.active }), 'Administrator account updated.')}>{a.active ? 'Disable' : 'Enable'}</button></div>
          </div>)}</div>
        </section>
      </div>}
    </>}
  </>;
}
