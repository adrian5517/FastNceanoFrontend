import React from 'react';
import { User } from 'lucide-react';

export default function StudentIDCard({ student, timeIn, timeOut, className = '' }) {
  const fmt = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return isNaN(d) ? '-' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { return '-'; }
  };

  return (
    <div className={`w-full max-w-md mx-auto p-6 rounded-2xl bg-white/6 backdrop-blur-lg border border-white/10 shadow-xl ${className}`}>
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 rounded-lg overflow-hidden bg-white/6 flex items-center justify-center border border-white/10">
          {student && student.photo ? (
            <img src={student.photo} alt={`${student.firstName} ${student.lastName}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/8">
              <User className="w-10 h-10 text-cream/90" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="text-2xl font-bold text-cream">{student ? `${student.lastName}, ${student.firstName}` : 'Awaiting Scan'}</div>
          <div className="text-sm text-cream/80 mt-1">{student ? `${student.course || student.strand || ''} • ${student.level || ''}` : 'Place your ID or scan to begin'}</div>
          {student && (
            <div className="mt-3 text-xs text-cream/70">Student No: <span className="font-mono ml-2 text-cream/90">{student.studentNo}</span></div>
          )}
        </div>
      </div>

      <div className="mt-4 w-full">
        <div className="flex gap-3">
          <div className="flex-1 p-3 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 text-center text-sm font-semibold text-white shadow-inner">
            <div>Time In</div>
            <div className="text-xs mt-1">{fmt(timeIn)}</div>
          </div>
          <div className="flex-1 p-3 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-center text-sm font-semibold text-[#15280D] shadow-inner">
            <div>Time Out</div>
            <div className="text-xs mt-1">{fmt(timeOut)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
