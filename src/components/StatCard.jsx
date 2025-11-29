import React from "react";

export default function StatCard({ icon: Icon, value, label, color }) {
  return (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur-xl border border-white/15 shadow-glass rounded-2xl px-6 py-4 min-w-[140px]">
      <Icon className={`mb-2 w-8 h-8 ${color}`} />
      <span className="text-2xl font-bold mb-1 text-ncf-ink">{value}</span>
      <span className="text-ncf-ink text-sm">{label}</span>
    </div>
  );
}
