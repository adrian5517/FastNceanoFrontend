import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, UserX } from 'lucide-react';

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return '' }
}

function formatDuration(ms) {
  if (!ms || ms <= 0) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes || !hours) parts.push(`${minutes}m`);
  return parts.join(' ');
}

const ActivityRow = ({ activity, index }) => {
  const student = activity.student || {};
  const type = activity.type || (activity.timeOut ? 'OUT' : 'IN');
  const photo = student.photo || null;
  const name = `${student.lastName || ''}${student.firstName ? ', ' + student.firstName : ''}`.trim() || (student.firstName || student.lastName) || activity.name || 'Unknown';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`flex items-center gap-4 p-3 rounded-lg bg-white/3 border border-white/6`}
    >
      <div className={`w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center ${type === 'IN' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
        {photo ? (
          <img src={photo} alt={name} className="w-12 h-12 object-cover rounded-lg" />
        ) : (
          <div className={`p-2 rounded-lg ${type === 'IN' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {type === 'IN' ? <UserCheck className="w-5 h-5 text-green-400" /> : <UserX className="w-5 h-5 text-red-400" />}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-white/60 truncate">{student.level || activity.level || ''} {student.course ? '• ' + student.course : ''}</p>
        <p className="text-[11px] text-white/50 mt-1">{student.studentNo || activity.studentNo || '-'}</p>
      </div>

      <div className="text-right">
        <p className="text-sm text-white/80">{activity.purpose || '-'}</p>
        <div className="text-right mt-1 text-xs text-white/50">
          <div>{formatTime(activity.timeIn || activity.time || activity.createdAt)}</div>
          {activity.durationMs != null && (
            <div className="text-white/40 text-[11px]">{formatDuration(activity.durationMs)}</div>
          )}
        </div>
        </div>

        {/* Action badge: Time In / Time Out */}
          <div className="ml-3">
            {(() => {
              const actionLabel = (type === 'IN' || (!type && activity.timeIn && !activity.timeOut)) ? 'Time In' : 'Time Out';
              const isIn = actionLabel === 'Time In';
              return (
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${isIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {actionLabel}
                </div>
              );
            })()}
              </div>
            </motion.div>
  );
};

export default function LiveActivityPanel({ activities = [] , title = 'Live Activity'}) {
  return (
    <section className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-cream">{title}</h3>
        <div className="text-xs text-cream/60">Live</div>
      </div>
      <div className="grid gap-2">
        {activities.length === 0 && (
          <div className="text-sm text-cream/60">No recent activity</div>
        )}
        {activities.slice(0,6).map((a, i) => (
          <ActivityRow key={a._id || i} activity={a} index={i} />
        ))}
      </div>
    </section>
  );
}
