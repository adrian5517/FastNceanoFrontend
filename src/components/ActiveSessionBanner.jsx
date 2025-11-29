import React from 'react';
import { Clock } from 'lucide-react';

const ActiveSessionBanner = ({ session }) => {
  if (!session) return null;
  const inAt = new Date(session.timeInAt);
  return (
    <div className="p-3 bg-green-800/20 border border-green-700 rounded-md mb-3">
      <div className="text-sm font-semibold text-cream">You are currently inside the library.</div>
      <div className="text-xs text-cream/80">Time In: {inAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Purpose: {session.purpose}</div>
    </div>
  );
};

export default ActiveSessionBanner;
