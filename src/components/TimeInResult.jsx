import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const chime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.0015;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => { o.stop(); ctx.close(); }, 180);
  } catch (e) { /* ignore */ }
};

const TimeInResult = ({ result }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => { chime(); }, []);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!result) return null;
  const at = new Date(result.session?.timeIn || result.timeIn || Date.now());
  const displayTime = at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  // compute duration since timeIn
  const durationMs = new Date(now) - at;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 p-4 bg-white/6 rounded-lg text-center ring-1 ring-white/10 ring-inset">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.05 }}>
        <CheckCircle className="mx-auto text-green-300 w-16 h-16" />
      </motion.div>
      <div className="text-2xl font-semibold text-white mt-2">Time In Recorded</div>
      <div className="text-sm text-white/80">You entered at {displayTime}</div>
      <div className="mt-2 text-sm text-cream/80">Purpose: {result.session?.purpose || result.purpose}</div>
      <div className="mt-2 text-white/80">Session active: {minutes}m {seconds}s</div>
      <div className="inline-block mt-3 px-3 py-1 rounded-full bg-green-800 text-white text-xs">Session Active</div>
    </motion.div>
  );
};

export default TimeInResult;
