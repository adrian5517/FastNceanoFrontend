import React from 'react';
import { Clock } from 'lucide-react';

function formatVisitorName(visitor, fallbackStudent, rawName) {
  // Prefer structured visitor object
  if (visitor && visitor.lastName && visitor.firstName) {
    const mi = visitor.middleInitial || visitor.middleName ? (` ${String(visitor.middleInitial || (visitor.middleName || '').charAt(0)).replace(/\.?$/, '.')}`) : '';
    const suffix = visitor.suffix ? ` ${visitor.suffix}` : '';
    return `${visitor.lastName}, ${visitor.firstName}${mi}${suffix}`;
  }

  if (fallbackStudent && fallbackStudent.lastName && fallbackStudent.firstName) {
    const mi = fallbackStudent.middleInitial || fallbackStudent.middleName ? (` ${String(fallbackStudent.middleInitial || (fallbackStudent.middleName || '').charAt(0)).replace(/\.?$/, '.')}`) : '';
    const suffix = fallbackStudent.suffix ? ` ${fallbackStudent.suffix}` : '';
    return `${fallbackStudent.lastName}, ${fallbackStudent.firstName}${mi}${suffix}`;
  }

  if (rawName) return rawName;
  return null;
}

function initialsFromName(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const VisitHistory = ({ visits = [], student = null, dateField = 'timeIn', title = 'Recent Visits' }) => {
  return (
    <div>
      <div className="font-semibold text-cream mb-2">{title}</div>
      {visits.length === 0 && <div className="text-sm text-cream/70">No recent visits</div>}
      <div className="space-y-2 mt-2">
        {visits.map((v, idx) => {
          const timeIn = v.timeIn || v.timeInAt || v.timeInAtRaw || null;
          const timeOut = v.timeOut || v.timeOutAt || null;
          const chosen = dateField === 'timeOut' ? (timeOut || timeIn) : (timeIn || timeOut);
          const inDate = chosen ? new Date(chosen) : null;
          const dateLabel = inDate && !isNaN(inDate)
            ? `${inDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })} • ${inDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'Unknown date';

          // Resolve visitor object and name
          const visitStudent = v.student || null;
          const visitorRawName = v.visitorName || v.name || null;
          const visitorName = formatVisitorName(visitStudent, student, visitorRawName);

          // Resolve photo: visit-level student.photo, visit.photo, fallback to passed student.photo
          const photo = (visitStudent && visitStudent.photo) || v.photo || (student && student.photo) || null;

          return (
            <div key={v._id || v.id || idx} className="p-2 bg-white/6 rounded-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                {photo ? (
                  <img src={photo} alt={visitorName ? `${visitorName} photo` : 'visitor photo'} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center text-sm font-semibold text-cream/90 border border-white/10">
                    {initialsFromName(visitorRawName || (visitStudent && `${visitStudent.firstName} ${visitStudent.lastName}`) || (student && `${student.firstName} ${student.lastName}`))}
                  </div>
                )}

                <div>
                  <div className="text-sm font-medium text-cream">{visitorName || 'Unknown Visitor'}</div>
                  <div className="text-xs text-cream/80">{v.purpose || '—'}</div>
                </div>
              </div>

              <div className="text-xs text-cream/80 text-right">
                <div>{dateLabel}</div>
                <div className="mt-1">{timeOut ? 'OUT' : 'IN'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VisitHistory;
