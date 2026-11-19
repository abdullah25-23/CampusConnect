import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, CircleHelp, ImagePlus, LockKeyhole, Send, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { PageHeader, ErrorBanner } from '../components/Ui.jsx';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export default function NewComplaint() {
  const navigate = useNavigate();
  const { categories, loading } = useCatalog();
  const [form, setForm] = useState({ title: '', category: '', description: '', location: '', confidential: false });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chosen = categories.find(c => c.value === form.category);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function update(key, value) { setForm(current => ({ ...current, [key]: value })); }
  function selectImage(event) {
    setError('');
    const image = event.target.files?.[0];
    if (!image) { setFile(null); setPreview(''); return; }
    if (!['image/jpeg', 'image/png'].includes(image.type)) { setError('Only PNG or JPG images are supported.'); event.target.value = ''; return; }
    if (image.size > MAX_IMAGE_SIZE) { setError('Choose an image smaller than 5 MB.'); event.target.value = ''; return; }
    setFile(image); setPreview(URL.createObjectURL(image));
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const payload = new FormData();
      for (const [key, value] of Object.entries(form)) payload.append(key, String(value));
      if (file) payload.append('image', file);
      const data = await api.postForm('/api/complaints', payload);
      navigate(`/complaints/${data.complaint._id}`, { replace: true });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <>
    <Link className="back-link" to="/complaints"><ArrowLeft size={17}/> Back to complaints</Link>
    <PageHeader eyebrow="REPORT AN ISSUE" title="Raise a complaint" description="Tell us what's going on. We'll connect you to the right department."/>
    <div className="form-layout">
      <section className="surface-card form-card">
        <div className="section-header"><div><p className="eyebrow">COMPLAINT DETAILS</p><h2>Tell us about the issue</h2></div><span className="step-pill">01 / 01</span></div>
        <form className="form-stack" onSubmit={submit}>
          <label className="field"><span>Complaint title <b>*</b></span><input placeholder="e.g. Wi-Fi not working in Computer Lab 2" minLength={5} maxLength={150} required value={form.title} onChange={e => update('title', e.target.value)}/></label>
          <label className="field"><span>Category <b>*</b></span><select required value={form.category} onChange={e => update('category', e.target.value)} disabled={loading}><option value="">{loading ? 'Loading categories…' : 'Choose a category'}</option>{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
          {chosen && <div className="routing-note"><CheckCircle2 size={19}/><span>Automatically routed to <strong>{chosen.departmentName}</strong></span></div>}
          <label className="field"><span>Description <b>*</b></span><textarea rows={5} minLength={10} maxLength={5000} placeholder="Describe the issue and what needs attention…" required value={form.description} onChange={e => update('description', e.target.value)}/><small>Clear descriptions help administrators resolve complaints faster.</small></label>
          <label className="field"><span>Location <span className="optional">(optional)</span></span><input placeholder="e.g. Second floor, Lab 2" maxLength={150} value={form.location} onChange={e => update('location', e.target.value)}/></label>
          <div className="evidence-upload">
            <div className="evidence-upload-head"><ImagePlus size={22}/><div><strong>Supporting photo (optional)</strong><small>Upload PNG or JPG, maximum 5 MB</small></div></div>
            <input type="file" accept="image/png,image/jpeg,.jpg,.jpeg,.png" onChange={selectImage} aria-label="Attach supporting photo" />
            {preview && <div className="image-preview"><img src={preview} alt="Selected supporting evidence preview"/><button type="button" className="btn btn-outline btn-small" onClick={() => { setFile(null); setPreview(''); }}>Remove image</button></div>}
          </div>
          <label className="confidential-option"><input type="checkbox" checked={form.confidential} onChange={e => update('confidential', e.target.checked)}/><span><strong><LockKeyhole size={16}/> Submit confidentially</strong><small>Your identity is hidden from department administrators but remains visible to the Super Admin. Avoid including identifying details in text or photos.</small></span></label>
          <div className="routing-note"><ShieldCheck size={19}/><span>Priority is automatically suggested from your description and can be reviewed by administrators.</span></div>
          <ErrorBanner message={error}/>
          <div className="form-actions"><Link to="/complaints" className="btn btn-outline">Cancel</Link><button disabled={busy || loading} className="btn btn-primary" type="submit">{busy ? 'Submitting…' : 'Submit complaint'} <Send size={17}/></button></div>
        </form>
      </section>
      <aside className="form-side"><div className="tips-card"><span className="tips-icon"><CircleHelp size={25}/></span><h3>What happens next?</h3><div className="tips-step"><span>01</span><p><strong>Submit your complaint</strong><small>Choose a category and add details.</small></p></div><div className="tips-step"><span>02</span><p><strong>Automatic routing</strong><small>Your issue is assigned to the correct department with a priority recommendation.</small></p></div><div className="tips-step"><span>03</span><p><strong>Track progress</strong><small>Follow a dated timeline of status changes and admin remarks.</small></p></div></div><div className="privacy-note"><ShieldCheck size={19}/><p>Your images are stored with your complaint and only accessible to authorized viewers.</p></div></aside>
    </div>
  </>;
}
