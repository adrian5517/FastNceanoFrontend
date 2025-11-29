import React from "react";

export default function StudentTable({ students, rowIcons }) {
  return (
    <div className="overflow-x-auto rounded-xl shadow-lg backdrop-blur-lg bg-white/30 border border-ncf-blue/20">
      <table className="min-w-full divide-y divide-ncf-blue/20">
        <thead className="bg-ncf-blue/10">
          <tr>
            <th className="px-4 py-2 text-left">Student No</th>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Course</th>
            <th className="px-4 py-2 text-left">Level</th>
            <th className="px-4 py-2 text-left">Time In</th>
            <th className="px-4 py-2 text-left">Time Out</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-6 text-ncf-ink">No students timed in.</td>
            </tr>
          ) : (
            students.map((student, idx) => {
              const visit = student.visits?.[student.visits.length - 1] || {};
              return (
                <tr key={student._id || idx} className="hover:bg-ncf-blue/5 transition">
                  <td className="px-4 py-2 font-mono">{student.studentNo}</td>
                  <td className="px-4 py-2">{student.firstName} {student.lastName}</td>
                  <td className="px-4 py-2">{student.course}</td>
                  <td className="px-4 py-2">{student.level}</td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    {visit.timeIn ? new Date(visit.timeIn).toLocaleTimeString() : '-'}
                    {rowIcons?.in}
                  </td>
                  <td className="px-4 py-2 flex items-center gap-2">
                    {visit.timeOut ? new Date(visit.timeOut).toLocaleTimeString() : '-'}
                    {rowIcons?.out}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${visit.status === 'Timed In' ? 'bg-ncf-green/30 text-ncf-green' : 'bg-ncf-red/30 text-ncf-red'}`}>{visit.status || '-'}</span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
