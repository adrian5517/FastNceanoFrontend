import React from 'react';
import { User } from 'lucide-react';

const StudentInfoCard = ({ student }) => {
  if (!student) return null;
  return (
    <div className="mt-6 p-4 bg-white/8 rounded-lg border border-white/10 flex items-center gap-4">
      <div className="w-20 h-20 bg-white/10 rounded-md overflow-hidden flex items-center justify-center">
        {student.photo ? (
          <img src={student.photo} alt={`Photo of ${student.firstName}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/6">
            <User className="w-8 h-8 text-cream/90" />
          </div>
        )}
      </div>
      <div>
        <div className="text-lg font-semibold text-cream">{student.lastName}, {student.firstName} {student.middleInitial ? student.middleInitial + '.' : ''} {student.suffix || ''}</div>
        <div className="text-sm text-cream/80">{student.course || student.strand || ''} • {student.level || student.department || ''}</div>
      </div>
    </div>
  );
};

export default StudentInfoCard;
