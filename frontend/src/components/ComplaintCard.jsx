import { ArrowUpRight, CalendarDays, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { dateLabel } from '../lib/config.js';
import { useCatalog } from '../context/CatalogContext.jsx';

export default function ComplaintCard({ complaint }) {
  const { categoryName } = useCatalog();
  return <Link to={`/complaints/${complaint._id}`} className="complaint-card">
    <div className="complaint-top"><span className="ticket-id">{complaint.ticketId || 'Complaint'}</span><StatusBadge status={complaint.status}/></div>
    <div className="complaint-title-row"><h3>{complaint.title}</h3><ArrowUpRight size={18}/></div>
    <p className="complaint-summary">{complaint.description}</p>
    <div className="complaint-meta">
      <span><Tag size={14}/>{categoryName(complaint.category)}</span>
      {complaint.location && <span><MapPin size={14}/>{complaint.location}</span>}
      <span><CalendarDays size={14}/>{dateLabel(complaint.createdAt)}</span>
    </div>
    <div className="chip-row"><span className={`priority-chip priority-${complaint.priority || 'medium'}`}>{complaint.priority || 'medium'} priority</span>{complaint.confidential && <span className="privacy-chip">Confidential</span>}</div>
  </Link>;
}
