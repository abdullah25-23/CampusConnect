import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// Protected images require an Authorization header; <img src=...> alone cannot send it.
export default function EvidenceImage({ complaintId }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let current = true;
    let objectUrl;
    api.getBlob(`/api/complaints/${complaintId}/evidence`).then(blob => {
      objectUrl = URL.createObjectURL(blob);
      if (current) setUrl(objectUrl);
      else URL.revokeObjectURL(objectUrl);
    }).catch(e => { if (current) setError(e.message); });
    return () => { current = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [complaintId]);
  if (error) return <p className="muted-small">Image unavailable: {error}</p>;
  if (!url) return <p className="muted-small">Loading supporting photo…</p>;
  return <div className="evidence-frame"><img src={url} alt="Supporting evidence uploaded with complaint" /></div>;
}
