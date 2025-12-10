import { useEffect, useMemo, useState } from "react";
import Fuse from 'fuse.js';
import { motion } from "framer-motion";
import StyledSelect from "./components/StyledSelect";
import {
  Users, QrCode, Clock, AlertTriangle,
  Activity, ChartLine, Database, Edit, MoreHorizontal,
  LogOut, Menu, X, Settings, Download, Filter,
  Search, Calendar, ArrowUpRight, ArrowDownRight,
  Eye, UserCheck, UserX, Printer
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// API base for frontend requests (module-level to satisfy lint and avoid TDZ issues)
const API_BASE = process.env.REACT_APP_API_URL || 'https://fastnceanobackend.onrender.com';

/* -------------------- Animations -------------------- */
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" }
  }
};

/* -------------------- UI Helpers -------------------- */
const SectionCard = ({ children, className = "" }) => (
  <motion.div
    variants={itemVariants}
    className={`bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] ${className}`}
  >
    {children}
  </motion.div>
);

const StatCard = ({ title, value, icon: Icon, trend, trendUp, color, delay = 0 }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ scale: 1.02, y: -2 }}
    className="relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] min-h-[140px]"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {typeof trend === "number" && (
        <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {trend}%
        </div>
      )}
    </div>
    <div>
      <p className="text-sm text-white/60 mb-1">{title}</p>
      <motion.p
        className="text-4xl font-bold text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: delay + 0.2 }}
      >
        {value}
      </motion.p>
    </div>
  </motion.div>
);

/* Live Activity Row */
const ActivityRow = ({ activity, index, onClick }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
    className={`flex items-center gap-4 p-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className={`p-0 rounded-lg overflow-hidden w-12 h-12 flex items-center justify-center ${activity.type === 'IN' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
      {activity.photo ? (
        <img src={activity.photo} alt={activity.name} className="w-12 h-12 object-cover rounded-lg" />
      ) : (
        <div className={`p-2 rounded-lg ${activity.type === 'IN' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
          {activity.type === 'IN'
            ? <UserCheck className="w-5 h-5 text-green-400" />
            : <UserX className="w-5 h-5 text-red-400" />
          }
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-white font-medium truncate">{activity.name}</p>
      <p className="text-white/60 text-sm">{activity.level} • {activity.course}</p>
      <p className="text-white/50 text-xs mt-1">{activity.studentNo || '-'}</p>
    </div>
    <div className="text-right">
      <p className="text-white/80 text-sm">{activity.purpose}</p>
      <div className="flex items-center justify-end gap-2">
        <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${activity.type === 'IN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {activity.type === 'IN' ? 'Time In' : 'Time Out'}
        </span>
        <div className="text-right">
          <p className="text-white/50 text-xs">{activity.time}</p>
          {activity.durationMs != null && (
            <p className="text-white/40 text-[11px]">{formatDuration(activity.durationMs)}</p>
          )}
        </div>
      </div>
    </div>
    <div className={`px-3 py-1 rounded-full text-xs font-medium ${activity.status === 'OK' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
      {activity.status}
    </div>
  </motion.div>
);

function formatDuration(ms) {
  if (ms == null || ms <= 0) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes || !hours) parts.push(`${minutes}m`);
  return parts.join(' ');
}

/* Simple pill */
const Pill = ({ children, color = "bg-white/10 text-white/80", className = "" }) => (
  <span className={`px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 ${color} ${className}`}>{children}</span>
);

/* -------------------- Main Component -------------------- */
const AdminDashboard = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('activeTab') || 'overview';
    } catch (e) {
      return 'overview';
    }
  });

  const [stats, setStats] = useState({
    activeInside: 0,
    visitsToday: 0,
    uniqueVisitors: 0,
    avgStay: 0,
    deniedAttempts: 0,
    devicesOnline: 0,
    capacity: 150,
  });

  /* Live activities (populated from server) */
  const [activities, setActivities] = useState([]);
  // live clock for StatCard
  const [nowTime, setNowTime] = useState(() => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const t = setInterval(() => {
      setNowTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // API_BASE is declared at module scope near the top of this file

  /* -------- Mock data for Students / Attendance / Reports -------- */
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [attendance, setAttendance] = useState([]);

  const [reportRange, setReportRange] = useState("today"); // today | 7d | 30d
  const [attendancePage, setAttendancePage] = useState(1);
  const attendancePageSize = 6;
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editValues, setEditValues] = useState({ firstName: '', middleName: '', lastName: '', suffix: '', level: '', course: '', number: '' });
  // editPhotoPreview: data URL for preview; editPhotoFile: actual File object to upload
  const [editPhotoPreview, setEditPhotoPreview] = useState(null);
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [savingStudent, setSavingStudent] = useState(false);

  const openStudent = (s) => {
    // optimistic: set minimal selected student first, then fetch full details
    setSelectedStudent(s);
    setEditPhotoPreview(s.photo || null);
    setEditPhotoFile(null);
    setEditValues({ firstName: '', middleName: '', lastName: '', suffix: '', level: s.level || '', course: s.course || '', number: s.number || s.studentNo || '' });

    (async () => {
      try {
        const base = API_BASE;
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await fetch(`${base}/api/students/${s.id || s._id}`, { headers });
        if (!resp || !resp.ok) return;
        const data = await resp.json();
        setSelectedStudent({
          id: data._id || data.id,
          studentNo: data.studentNo,
          firstName: data.firstName,
          middleName: data.middleName,
          middleInitial: data.middleInitial,
          lastName: data.lastName,
          suffix: data.suffix,
          level: data.level,
          course: data.course,
          photo: data.photo,
          qrCode: data.qrCode,
        });
        setEditValues({ firstName: data.firstName || '', middleName: data.middleName || '', lastName: data.lastName || '', suffix: data.suffix || '', level: data.level || '', course: data.course || '', number: data.studentNo || '' });
        setEditPhotoPreview(data.photo || null);
        setEditPhotoFile(null);
      } catch (err) {
        console.error('Failed to fetch student details', err);
      }
    })();
  };
  // --- Show Student Visit History (grouped by day) ---
  const [showStudentHistoryModal, setShowStudentHistoryModal] = useState(false);
  const [historyStudent, setHistoryStudent] = useState(null);
  const [historyVisits, setHistoryVisits] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const openStudentHistory = async (studentId, displayName) => {
    setHistoryError(null);
    setHistoryVisits([]);
    setHistoryStudent({ id: studentId, name: displayName });
    setShowStudentHistoryModal(true);
    try {
      setHistoryLoading(true);
      const resp = await fetch(`${API_BASE}/api/students/${studentId}/history?limit=500`);
      if (!resp || !resp.ok) {
        const txt = resp ? await resp.text().catch(() => '') : '';
        throw new Error(txt || 'Failed to fetch history');
      }
      const body = await resp.json();
      const rows = Array.isArray(body.visits) ? body.visits : (body || []);
      const mapped = rows.map(r => {
        const timeIn = r.timeIn ? new Date(r.timeIn) : null;
        const timeOut = r.timeOut ? new Date(r.timeOut) : null;
        const latest = timeOut || timeIn || new Date();
        return {
          id: r._id || r.id,
          purpose: r.purpose || '',
          timeIn: timeIn ? timeIn.toISOString() : null,
          timeOut: timeOut ? timeOut.toISOString() : null,
          durationMs: (timeIn && timeOut) ? (timeOut - timeIn) : null,
          time: latest.toLocaleString(),
          status: r.status || 'OK',
        };
      });
      // sort newest first
      mapped.sort((a, b) => new Date(b.time) - new Date(a.time));
      setHistoryVisits(mapped);
    } catch (err) {
      console.error('openStudentHistory failed', err);
      setHistoryError(err && err.message ? String(err.message) : 'Unable to load history');
    } finally {
      setHistoryLoading(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');

  /* -------- Utilities -------- */
  // server-side export is used now; client CSV helper removed to avoid unused symbol

  // API base is declared above and used across hooks

  /* -------- Fetch live stats + recent visits (Overview) -------- */
  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/dashboard/monitor-stats`);
        if (resp && resp.ok) {
          const d = await resp.json();
          if (!mounted) return;
          setStats(prev => ({
            ...prev,
            activeInside: d.occupancy || prev.activeInside,
            visitsToday: d.totalVisitsToday || prev.visitsToday,
            // topPurposes can be provided by server as [{name,count}]
            topPurposes: Array.isArray(d.topPurposes) ? d.topPurposes : prev.topPurposes,
            // avgStay provided by server in minutes (float)
            avgStay: typeof d.avgStay === 'number' ? d.avgStay : prev.avgStay,
            // keep other stats as-is if server doesn't provide them
            capacity: prev.capacity,
          }));
        } else {
          // fallback to mock values
          setStats(prev => ({ ...prev }));
        }
      } catch (err) {
        console.debug('monitor-stats fetch failed, using mock', err);
      }
    };

    const fetchRecent = async () => {
      try {
        // request more items so the live feed better represents today's activity
        const resp = await fetch(`${API_BASE}/api/attendance/recent?limit=12`);
        if (!resp || !resp.ok) return;
        const body = await resp.json();
        if (!mounted) return;
        const rows = Array.isArray(body.visits) ? body.visits : [];
        // if server returned a total for today's visits, use it to keep stats consistent
        if (typeof body.total === 'number') {
          setStats(prev => ({ ...prev, visitsToday: body.total }));
        }
        // sort by latest event (timeOut preferred, else timeIn)
        rows.sort((a, b) => {
          const ta = a.timeOut ? new Date(a.timeOut) : new Date(a.timeIn || 0);
          const tb = b.timeOut ? new Date(b.timeOut) : new Date(b.timeIn || 0);
          return tb - ta; // newest first
        });
        const mapped = rows.map(r => {
          const student = r.student || {};
          const name = [student.lastName, student.firstName].filter(Boolean).join(', ') || (student.firstName ? `${student.firstName} ${student.lastName}` : 'Unknown');
          const latest = r.timeOut ? new Date(r.timeOut) : new Date(r.timeIn || Date.now());
          const timeIn = r.timeIn ? new Date(r.timeIn) : null;
          const timeOut = r.timeOut ? new Date(r.timeOut) : null;
          const durationMs = (timeIn && timeOut) ? (timeOut - timeIn) : null;
          return {
            name: name,
            studentNo: student.studentNo || '',
            studentId: (student._id || student.id) ? String(student._id || student.id) : null,
            photo: student.photo || null,
            level: student.level || '',
            course: student.course || '',
            purpose: r.purpose || '',
            time: latest.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: r.timeOut ? 'OUT' : 'IN',
            status: r.status || 'OK',
            timeIn: timeIn ? timeIn.toISOString() : null,
            timeOut: timeOut ? timeOut.toISOString() : null,
            durationMs
          };
        });
        // dedupe by studentId so the live feed shows unique users (keep first/latest occurrence)
        const seen = new Set();
        const unique = [];
        for (const m of mapped) {
          if (m.studentId) {
            if (!seen.has(m.studentId)) {
              seen.add(m.studentId);
              unique.push(m);
            }
          } else {
            unique.push(m);
          }
        }
        setActivities(unique);
      } catch (err) {
        console.debug('fetchRecent failed', err);
      }
    };

    fetchStats();
    fetchRecent();
    const interval = setInterval(() => {
      fetchStats();
      fetchRecent();
    }, 8000);

    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // -------- All Visits modal: fetch paginated visits for full view --------
  const fetchAllVisits = async (page = 1) => {
    if (allLoading) return;
    setAllError(null);
    try {
      setAllLoading(true);
      const resp = await fetch(`${API_BASE}/api/attendance/recent?page=${page}&limit=${allLimit}`);
      if (!resp || !resp.ok) return;
      const body = await resp.json();
      const rows = Array.isArray(body.visits) ? body.visits : [];
      // normalize with duration/time fields similar to activities mapping
      const mapped = rows.map(r => {
        const student = r.student || {};
        const timeIn = r.timeIn ? new Date(r.timeIn) : null;
        const timeOut = r.timeOut ? new Date(r.timeOut) : null;
        const latest = timeOut || timeIn || new Date();
        const durationMs = (timeIn && timeOut) ? (timeOut - timeIn) : null;
        return {
          _id: r._id || r.id,
          name: [student.lastName, student.firstName].filter(Boolean).join(', ') || (student.firstName ? `${student.firstName} ${student.lastName}` : 'Unknown'),
          studentNo: student.studentNo || '',
          studentId: (student._id || student.id) ? String(student._id || student.id) : null,
          photo: student.photo || null,
          level: student.level || '',
          course: student.course || '',
          purpose: r.purpose || '',
          deviceId: r.deviceId || '',
          kiosk: r.kiosk || '',
          notes: r.notes || '',
          timeIn: timeIn ? timeIn.toISOString() : null,
          timeOut: timeOut ? timeOut.toISOString() : null,
          durationMs,
          time: latest.toLocaleString(),
          status: r.status || 'OK'
        };
      });
      setAllVisits(prev => (page === 1 ? mapped : [...prev, ...mapped]));
      setAllHasMore(body.hasMore !== undefined ? body.hasMore : (mapped.length === allLimit));
      setAllPage(page);
    } catch (err) {
      console.error('fetchAllVisits failed', err);
      setAllError(err && err.message ? String(err.message) : 'Failed to load visits');
    } finally {
      setAllLoading(false);
    }
  };

  const handleOpenAll = () => {
    setAllVisits([]);
    setAllPage(1);
    setAllHasMore(true);
    setAllSearch('');
    setShowAllVisitsModal(true);
    fetchAllVisits(1);
  };

  const handleAllScroll = (e) => {
    const el = e.target;
    if (!allHasMore || allLoading) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      fetchAllVisits(allPage + 1);
    }
  };

  // Guard against division by zero / invalid capacity causing Infinity or NaN
  const _capacity = Number(stats.capacity) || 0;
  const rawOccupancy = _capacity > 0 ? ((Number(stats.activeInside) || 0) / _capacity) * 100 : 0;
  // Ensure finite and capped between 0 and 100 to avoid animating invalid values
  const occupancyPercentage = Number.isFinite(rawOccupancy) ? Math.max(0, Math.min(100, rawOccupancy)) : 0;
  const occupancyStatus =
    occupancyPercentage >= 90 ? "critical" :
      occupancyPercentage >= 70 ? "warning" : "safe";

  /* -------- Derived counts for Students / Reports -------- */
  const studentsSummary = useMemo(() => {
    const allowed = students.filter(s => s.allowed).length;
    const restricted = students.length - allowed;
    return { total: students.length, allowed, restricted };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = (searchQuery || '').trim();
    if (!q) return students;
    try {
      const fuse = new Fuse(students, {
        keys: ['name', 'number', 'course', 'department', 'level', 'section'],
        threshold: 0.35,
        ignoreLocation: true,
      });
      return fuse.search(q).map(r => r.item);
    } catch (e) {
      console.error('Fuse search error', e);
      return students;
    }
  }, [students, searchQuery]);

  const reportCounts = useMemo(() => {
    const totalVisits = attendance.length;
    const denies = attendance.filter(a => a.status === "DENIED").length;
    const outs = attendance.filter(a => a.status === "OUT").length;
    const ins = attendance.filter(a => a.status === "IN").length;
    const unique = new Set(attendance.map(a => a.number)).size;
    return { totalVisits, denies, outs, ins, unique };
  }, [attendance]);

  /* -------- Tab metadata -------- */
  const TAB_META = {
    overview: { title: "Overview Dashboard", sub: "Real-time library monitoring and analytics" },
    attendance: { title: "Attendance Logs", sub: "Search, filter, and export visits" },
    students: { title: "Students Directory", sub: "Manage student records and QR codes" },
    reports: { title: "Reports & Analytics", sub: "Trends, breakdowns, and exports" },
  };

  const navigate = useNavigate();

  // If there's no token, redirect to login to avoid actions that require auth
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // persist active tab so remounts or reloads keep the same view
  useEffect(() => {
    try {
      localStorage.setItem('activeTab', activeTab);
    } catch (e) {
      // ignore storage errors
    }
  }, [activeTab]);

  // Helper: format ISO date/time to short local time (e.g., 10:45 AM)
  const formatTimeShort = (iso) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '-';
    }
  };

  // Fetch today's attendance (populate attendance table)
  useEffect(() => {
    let mounted = true;
    const fetchTodayAttendance = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/attendance/recent?limit=200`);
        if (!resp || !resp.ok) return;
        const body = await resp.json();
        if (!mounted) return;
        const rows = Array.isArray(body.visits) ? body.visits : [];

        // Normalize Visit -> table row
        const mapped = rows.map(r => {
          const student = r.student || {};
          const timeIn = r.timeIn ? new Date(r.timeIn) : null;
          const timeOut = r.timeOut ? new Date(r.timeOut) : null;
          const durationMs = (timeIn && timeOut) ? (timeOut - timeIn) : null;
          const duration = durationMs ? `${Math.round(durationMs / 60000)}m` : null;
          return {
            id: r._id || r.id,
            date: timeIn ? timeIn.toISOString().split('T')[0] : (timeOut ? timeOut.toISOString().split('T')[0] : ''),
            name: [student.lastName, student.firstName].filter(Boolean).join(', ') || (student.firstName ? `${student.firstName} ${student.lastName}` : 'Unknown'),
            number: student.studentNo || '',
            course: student.course || '',
            level: student.level || '',
            purpose: r.purpose || '',
            in: timeIn ? formatTimeShort(timeIn.toISOString()) : '-',
            out: timeOut ? formatTimeShort(timeOut.toISOString()) : '-',
            duration,
            status: r.status || (timeOut ? 'OUT' : 'IN'),
            station: r.deviceId || r.kiosk || '',
          };
        });

        // sort by timeIn/timeOut desc
        mapped.sort((a, b) => {
          const ta = a.out !== '-' ? new Date(`${a.date}T${a.out}`) : (a.in !== '-' ? new Date(`${a.date}T${a.in}`) : new Date(0));
          const tb = b.out !== '-' ? new Date(`${b.date}T${b.out}`) : (b.in !== '-' ? new Date(`${b.date}T${b.in}`) : new Date(0));
          return tb - ta;
        });

        setAttendance(mapped);
      } catch (err) {
        console.debug('fetchTodayAttendance failed', err);
      }
    };

    // Fetch on mount and when switching to attendance tab
    if (activeTab === 'attendance' || true) fetchTodayAttendance();

    return () => { mounted = false; };
  }, [activeTab]);

  // Dev debug: log activeTab changes and expose a visible indicator in the UI
  useEffect(() => {
    console.info('[AdminDashboard] activeTab =', activeTab);
  }, [activeTab]);

  // Toast for brief notifications (error / success)
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  

  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsValues, setSettingsValues] = useState({ username: '', email: '', currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [showAllVisitsModal, setShowAllVisitsModal] = useState(false);
  const [allVisits, setAllVisits] = useState([]);
  const [allPage, setAllPage] = useState(1);
  const [allLimit] = useState(20);
  const [allHasMore, setAllHasMore] = useState(true);
  const [allLoading, setAllLoading] = useState(false);
  const [allError, setAllError] = useState(null);
  const [allSearch, setAllSearch] = useState('');
  // Actions modal for student row actions (view history, print ID/QR, edit)
  const [actionsModal, setActionsModal] = useState({ open: false, student: null });

  const openActionsModal = (student) => setActionsModal({ open: true, student });
  const closeActionsModal = () => setActionsModal({ open: false, student: null });
  const [expandedVisits, setExpandedVisits] = useState(new Set());
  const [regValues, setRegValues] = useState({ studentNo: '', firstName: '', middleName: '', lastName: '', suffix: '', course: '', level: '' });
  const [regResult, setRegResult] = useState(null); // holds created student with qrCode
  const [creating, setCreating] = useState(false);
  const [showRegQRPill, setShowRegQRPill] = useState(null);
  const [showRegQRModal, setShowRegQRModal] = useState(false);
  // regPhotoPreview: data URL for preview; regPhotoFile: actual File object to upload
  const [regPhotoPreview, setRegPhotoPreview] = useState(null);
  const [regPhotoFile, setRegPhotoFile] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [printingId, setPrintingId] = useState(null);

  // helper flags: whether selected level indicates Senior High (Grade 11/12)
  const isSeniorReg = (/(Grade\s*11|Grade\s*12)/i).test(regValues.level || '');
  const isSeniorEdit = (/(Grade\s*11|Grade\s*12)/i).test(editValues.level || '');

  // When opening the Register modal, prefill Student No by asking server for the next available number
  useEffect(() => {
    let mounted = true;
    const prefill = async () => {
      try {
        // only prefill if the field is empty
        if (!showRegisterModal) return;
        if (regValues.studentNo && regValues.studentNo.trim()) return;
        // use a lightweight fetch here so this effect doesn't depend on apiFetch or API_BASE
        const base = API_BASE;
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await fetch(`${base}/api/students/generateNo`, { headers });
        if (!resp || !resp.ok) return;
        const data = await resp.json();
        if (mounted && data && data.studentNo) {
          setRegValues(prev => ({ ...prev, studentNo: data.studentNo }));
        }
      } catch (err) {
        console.error('Prefill studentNo failed', err);
      }
    };
    prefill();
    return () => { mounted = false; };
  }, [showRegisterModal, regValues.studentNo]);

  // Close modals on Escape key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showRegisterModal) {
          setShowRegisterModal(false);
          setRegResult(null);
        }
        if (confirm.open) {
          setConfirm({ open: false, title: '', message: '', onConfirm: null });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showRegisterModal, confirm]);

  // Debug logs to help verify level-state when register modal or edit drawer open
  useEffect(() => {
    if (showRegisterModal) {
      try {
        // lightweight debug for developers
        // eslint-disable-next-line no-console
        console.debug('[Register modal] regValues.level=', regValues.level, 'isSeniorReg=', isSeniorReg);
      } catch (e) { }
    }
  }, [showRegisterModal, regValues.level, isSeniorReg]);

  useEffect(() => {
    if (selectedStudent) {
      try {
        // eslint-disable-next-line no-console
        console.debug('[Edit drawer] editValues.level=', editValues.level, 'isSeniorEdit=', isSeniorEdit);
      } catch (e) { }
    }
  }, [selectedStudent, editValues.level, isSeniorEdit]);

  // responsive detection for students directory view
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // `API_BASE` is declared earlier near the top of this component.

  // load students when entering the Students tab (or on mount)
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingStudents(true);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await fetch(`${API_BASE}/api/students`, { headers });
        if (!resp || !resp.ok) throw new Error('fetch failed');
        const data = await resp.json();
        if (!Array.isArray(data)) return;
        const mapped = data.map(s => {
          // Prefer middleInitial if provided by backend; otherwise derive from middleName
          const mi = s.middleInitial || (s.middleName ? (String(s.middleName).trim().charAt(0).toUpperCase() + '.') : '');
          const display = `${s.lastName || ''}${s.suffix ? ', ' + s.suffix : ''}${(s.lastName || '') ? ', ' : ''}${s.firstName || ''}${mi ? ' ' + mi : ''}`.replace(/, ,/g, ',').trim();
          return {
            id: s._id || s.id,
            name: display,
            number: s.studentNo || s.number || '',
            department: s.department || '',
            level: s.level || '',
            course: s.course || '',
            section: s.section || '',
            lastVisit: s.lastVisit || deriveLastVisit(s.visits, s.updatedAt),
            allowed: typeof s.allowed === 'boolean' ? s.allowed : true,
            totalVisits: Array.isArray(s.visits) ? s.visits.length : (s.totalVisits || 0),
            qrCode: s.qrCode || '',
            photo: s.photo || ''
          };
        });
        if (mounted) setStudents(mapped);
      } catch (err) {
        console.error('fetchStudents error', err);
        setToast({ message: 'Unable to load students', type: 'error' });
      } finally {
        if (mounted) setLoadingStudents(false);
      }
    };
    if (activeTab === 'students') load();
    return () => { mounted = false; };
  }, [activeTab]);

  // client-side logout helper (clears token + notifies app)
  const clientLogout = () => {
    try { localStorage.removeItem('token'); } catch (e) { /* ignore */ }
    if (onLogout) onLogout();
    navigate('/login');
  };

  // Helper: derive a readable last-visit string from a student's visits array
  const deriveLastVisit = (visits, updatedAt) => {
    if (!Array.isArray(visits) || visits.length === 0) return updatedAt || '';
    let latest = null;
    for (const v of visits) {
      const cand = v.timeOut || v.timeIn || v.time || v.updatedAt || v.createdAt || null;
      if (!cand) continue;
      const d = new Date(cand);
      if (isNaN(d)) continue;
      if (!latest || d > latest) latest = d;
    }
    return latest ? latest.toLocaleString() : (updatedAt || '');
  };

  // central fetch wrapper that attaches auth headers and handles 401 auto-logout
  const apiFetch = async (url, options = {}) => {
    try {
      options.headers = { ...(options.headers || {}), ...getAuthHeaders() };
      const resp = await fetch(url, options);
      if (resp.status === 401) {
        setToast({ message: 'Session expired — redirecting to login', type: 'error' });
        setTimeout(() => clientLogout(), 900);
        return { ok: false, status: 401 };
      }
      if (!resp.ok) {
        let text = '';
        try { text = await resp.text(); } catch (e) { /* ignore */ }
        setToast({ message: text || `Request failed (${resp.status})`, type: 'error' });
        return { ok: false, status: resp.status, text };
      }
      return resp;
    } catch (err) {
      console.error('apiFetch error', err);
      setToast({ message: 'Network error', type: 'error' });
      return { ok: false, error: err };
    }
  };

  // Update admin settings (username, email, password)
  const updateSettings = async () => {
    const { username, email, currentPassword, newPassword, confirmPassword } = settingsValues;
    if (!username || !email) {
      setToast({ message: 'Username and email are required', type: 'error' });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setToast({ message: 'New password and confirmation do not match', type: 'error' });
      return;
    }
    try {
      setSavingSettings(true);
      const body = { username, email };
      if (newPassword) body.newPassword = newPassword;
      if (currentPassword) body.currentPassword = currentPassword;
      const resp = await apiFetch(`${API_BASE}/api/admin/settings`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!resp || !resp.ok) return;
      setToast({ message: 'Settings updated', type: 'success' });
      setShowSettingsModal(false);
    } catch (err) {
      console.error('updateSettings error', err);
      setToast({ message: 'Unable to update settings', type: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

    const downloadStudentQR = async (studentId, filename) => {
      try {
        if (!studentId) {
          setToast({ message: 'Student id missing', type: 'error' });
          return;
        }
        const resp = await apiFetch(`${API_BASE}/api/students/${studentId}/qr`, { method: 'GET' });
        if (!resp || !resp.ok) return;
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `qr_${studentId}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('downloadStudentQR error', err);
        setToast({ message: 'Download failed', type: 'error' });
      }
    };

  const handleLogout = () => {
    setConfirm({
      open: true,
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            await apiFetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
          }
        } catch (err) {
          console.error('Logout request failed', err);
        }
        localStorage.removeItem('token');
        setConfirm({ open: false, title: '', message: '', onConfirm: null });
        if (onLogout) onLogout();
        navigate('/login');
      }
    });
  };

  // Fetch a single student (protected) and open the printable ID
  const fetchAndPrintStudent = async (studentId) => {
    try {
      setPrintingId(studentId);
      if (!studentId) {
        setToast({ message: 'Student id missing', type: 'error' });
        setPrintingId(null);
        return;
      }
      const resp = await apiFetch(`${API_BASE}/api/students/${studentId}`);
      if (!resp || !resp.ok) return;
      const student = await resp.json();
      // student should contain qrCode and photo (if available)
      printStudentID(student, student.photo || null);
    } catch (err) {
      console.error('fetchAndPrintStudent error', err);
      setToast({ message: 'Unable to fetch student', type: 'error' });
      setPrintingId(null);
    }
    finally {
      setPrintingId(null);
    }
  };

  const exportFromServer = async (date) => {
    try {
      const q = date ? `?date=${encodeURIComponent(date)}` : '';
      const resp = await apiFetch(`${API_BASE}/api/export/attendance${q}`);
      if (!resp || !resp.ok) return;
      const blob = await resp.blob();
      // try to get filename from header
      const cd = resp.headers.get('content-disposition') || '';
      let filename = 'attendance.csv';
      const match = cd.match(/filename\*=UTF-8''(.+)$|filename="?([^;"]+)"?/i);
      if (match) filename = decodeURIComponent(match[1] || match[2]);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error', err);
    }
  };

  // Render top purposes either from stats.topPurposes or computed from recent activities
  const renderTopPurposes = () => {
    if (stats.topPurposes && stats.topPurposes.length) {
      return stats.topPurposes.slice(0,4).map((p, idx) => (
        <div key={p.name || idx} className="mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80">{p.name}</span>
            <span className="text-sm font-medium text-white">{p.count}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-1">
            <div style={{ width: `${Math.min(100, (p.count / Math.max(1, stats.visitsToday || 1)) * 100)}%` }} className={`h-full ${['bg-blue-500','bg-green-500','bg-purple-500','bg-amber-500'][idx] || 'bg-sky-500'} rounded-full`} />
          </div>
        </div>
      ));
    }
    if (activities && activities.length) {
      const counts = activities.reduce((acc, a) => { if (!a.purpose) return acc; acc[a.purpose] = (acc[a.purpose] || 0) + 1; return acc; }, {});
      const arr = Object.keys(counts).map(k => ({ name: k, count: counts[k] })).sort((x,y) => y.count - x.count).slice(0,4);
      return arr.map((p, idx) => (
        <div key={p.name || idx} className="mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/80">{p.name}</span>
            <span className="text-sm font-medium text-white">{p.count}</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden mt-1">
            <div style={{ width: `${Math.min(100, (p.count / Math.max(1, activities.length)) * 100)}%` }} className={`h-full ${['bg-blue-500','bg-green-500','bg-purple-500','bg-amber-500'][idx] || 'bg-sky-500'} rounded-full`} />
          </div>
        </div>
      ));
    }
    return <div className="text-sm text-white/60">No purpose data</div>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05220F] to-[#0E3A1A]">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/5 backdrop-blur-2xl border-b border-white/20">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD84A] via-[#F3C324] to-[#FFD84A] flex items-center justify-center shadow-lg">
                  <Database className="w-7 h-7 text-[#15280D]" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">FastNCeano</h1>
                  <p className="text-xs text-white/70">Admin Dashboard</p>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              {["Overview", "Attendance", "Students", "Reports"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${activeTab === tab.toLowerCase()
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setShowSettingsModal(true)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                <Settings className="w-5 h-5 text-white/80" />
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F3C324] hover:bg-[#FFD84A] text-[#15280D] font-medium transition-colors shadow-lg">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Dev Debug Indicator removed for spacing/clean UI */}

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* subtle radial gold highlight similar to login */}
          <div className="absolute inset-x-0 -top-8 pointer-events-none flex justify-center">
            <div className="w-72 h-32 bg-[radial-gradient(ellipse_at_center,#FFD84A33_0%,transparent_70%)]" />
          </div>
          {/* Header Section (dynamic) */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-4xl font-bold text-white mb-3">{TAB_META[activeTab].title}</h2>
              <p className="text-white/60">{TAB_META[activeTab].sub}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-xl border border-white/15">
                <Calendar className="w-4 h-4 text-white/70" />
                <span className="text-sm text-white/90">
                  {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
              </div>

              <button onClick={() => exportFromServer(new Date().toISOString().split('T')[0])} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#059669] text-white font-medium transition-colors">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>

              <button onClick={() => setShowRegisterModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#059669] text-white font-medium transition-colors">
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">Register Student</span>
              </button>

              {/* compact vertical badges for Students tab */}
              {activeTab === 'students' && (
                <div className="hidden md:flex flex-col items-end gap-3 ml-4">
                  <div className="px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-right">
                    <div className="text-sm text-white/80">Students</div>
                    <div className="text-2xl font-bold text-white">{studentsSummary.total}</div>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-right">
                    <div className="text-sm text-white/80">Allowed</div>
                    <div className="text-2xl font-bold text-white text-emerald-300">{studentsSummary.allowed}</div>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-right">
                    <div className="text-sm text-white/80">Restricted</div>
                    <div className="text-2xl font-bold text-white text-red-300">{studentsSummary.restricted}</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* -------------------- OVERVIEW TAB -------------------- */}
          <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
                {/* Key Metrics */}
                  <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <StatCard title="Active Inside" value={stats.activeInside} icon={Users} trend={5.2} trendUp={true} color="bg-green-500" delay={0} />
                <StatCard title="Visits Today" value={stats.visitsToday} icon={Activity} trend={12.3} trendUp={true} color="bg-blue-500" delay={0.06} />
                <StatCard title="Unique Visitors" value={stats.uniqueVisitors} icon={UserCheck} trend={8.1} trendUp={true} color="bg-purple-500" delay={0.12} />
                <StatCard title="Avg Stay (min)" value={stats.avgStay} icon={Clock} trend={2.4} trendUp={false} color="bg-amber-500" delay={0.18} />
                <StatCard title="Denied" value={stats.deniedAttempts} icon={AlertTriangle} color="bg-red-500" delay={0.24} />
                <StatCard title="Time Now" value={nowTime} icon={Clock} color="bg-sky-500" delay={0.3} />
              </motion.div>

              {/* Occupancy bar */}
              <SectionCard>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Current Occupancy</h3>
                    <p className="text-sm text-white/60">Capacity: {stats.activeInside} / {stats.capacity}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${occupancyStatus === "critical"
                    ? "bg-red-500/20 text-red-400"
                    : occupancyStatus === "warning"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-green-500/20 text-green-400"
                    }`}>
                    {occupancyPercentage.toFixed(1)}% Full
                  </div>
                </div>
                <div className="relative h-4 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${occupancyPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`absolute inset-y-0 left-0 rounded-full ${occupancyStatus === "critical"
                      ? "bg-gradient-to-r from-red-500 to-red-600"
                      : occupancyStatus === "warning"
                        ? "bg-gradient-to-r from-amber-500 to-amber-600"
                        : "bg-gradient-to-r from-green-500 to-green-600"
                      }`}
                  />
                </div>
              </SectionCard>

              {/* Live Activity + Quick Actions */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <SectionCard className="xl:col-span-2">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-green-400" />
                      <h3 className="text-xl font-semibold text-white">Live Activity</h3>
                      <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium animate-pulse">LIVE</span>
                    </div>
                    <div className="text-sm text-white/60">
                      Showing <span className="font-medium text-white">{activities.length}</span> of <span className="font-medium text-white">{stats.visitsToday}</span> visits today
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={handleOpenAll} className="px-3 py-2 rounded-xl bg-white/6 hover:bg-white/10 text-white text-sm font-medium">View All</button>
                      <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                        <Filter className="w-4 h-4 text-white/70" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {activities.map((activity, index) => (
                      <ActivityRow
                        key={index}
                        activity={activity}
                        index={index}
                        onClick={() => openStudentHistory(activity.studentId, activity.name)}
                      />
                    ))}
                  </div>
                </SectionCard>

                <SectionCard className="space-y-6">
                  {/* Top Purposes */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <ChartLine className="w-5 h-5 text-amber-400" />
                      Top Purposes
                    </h3>
                    <div className="space-y-3">
                      {renderTopPurposes()}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: QrCode, label: "Generate QR", color: "bg-blue-500", onClick: () => { setShowRegisterModal(true); } },
                        { icon: UserCheck, label: "Register", color: "bg-green-500", onClick: () => { setShowRegisterModal(true); } },
                        { icon: Download, label: "Export Data", color: "bg-purple-500", onClick: () => { exportFromServer(); } },
                        { icon: Eye, label: "View Reports", color: "bg-amber-500", onClick: () => { setActiveTab('reports'); } },
                      ].map((action, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={action.onClick}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                        >
                          <div className={`p-3 rounded-xl ${action.color} bg-opacity-20`}>
                            <action.icon className={`w-5 h-5 ${action.color.replace("bg-", "text-")}`} />
                          </div>
                          <span className="text-xs text-white/80 text-center">{action.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              </div>
          </div>

          {/* -------------------- ATTENDANCE TAB -------------------- */}
          <div style={{ display: activeTab === 'attendance' ? 'block' : 'none' }}>
                {/* Filters + Stats */}
                  <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <SectionCard className="lg:col-span-3 px-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/15">
                        <Search className="w-5 h-5 text-white/60" />
                        <input
                          className="bg-transparent text-white placeholder-white/60 outline-none w-64 md:w-96"
                          placeholder="Search name, student no., purpose…"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white/80 hover:bg-white/15">Purpose</button>
                      <button className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white/80 hover:bg-white/15">Department/Level</button>
                      <button
                        onClick={() => exportFromServer(new Date().toISOString().split('T')[0])}
                        className="px-3 py-2 rounded-xl bg-[#047857] hover:bg-[#059669] text-white"
                      >
                        <Download className="w-4 h-4 inline-block mr-2" />
                        Export CSV
                      </button>
                    </div>
                  </div>
                </SectionCard>

                <div className="grid grid-cols-2 gap-4">
                  <StatCard title="Today (IN)" value={reportCounts.ins} icon={UserCheck} color="bg-green-500" />
                  <StatCard title="Completed (OUT)" value={reportCounts.outs} icon={Clock} color="bg-blue-500" />
                </div>
              </motion.div>

              {/* Table */}
                <SectionCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Attendance — Today</h3>
                  <Pill>Rows: {attendance.length}</Pill>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-base">
                    <thead>
                        <tr className="text-white/70 border-b border-white/10">
                          <th className="px-4 py-3 text-left">Time In</th>
                          <th className="px-4 py-3 text-left">Time Out</th>
                          <th className="px-4 py-3 text-left">Name</th>
                          <th className="px-4 py-3 text-left">Student No.</th>
                          <th className="px-4 py-3 text-left">Grade</th>
                          <th className="px-4 py-3 text-left">Course</th>
                          <th className="px-4 py-3 text-left">Purpose</th>
                          <th className="px-4 py-3 text-left">Duration</th>
                          <th className="px-4 py-3 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                      {attendance.slice((attendancePage - 1) * attendancePageSize, attendancePage * attendancePageSize).map((row) => (
                        <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 text-white/90">
                          <td className="px-5 py-4">{row.in}</td>
                          <td className="px-5 py-4">{row.out ?? "-"}</td>
                          <td className="px-5 py-4">{row.name}</td>
                          <td className="px-5 py-4">{row.number}</td>
                          <td className="px-5 py-4 text-white/70">{row.level ?? '-'}</td>
                          <td className="px-5 py-4">{row.course}</td>
                          <td className="px-5 py-4">{row.purpose}</td>
                          <td className="px-5 py-4">{row.duration ?? "-"}</td>
                          <td className="px-5 py-4">
                            {row.status === "IN" && <Pill color="bg-green-500/20 text-green-400">IN</Pill>}
                            {row.status === "OUT" && <Pill color="bg-blue-500/20 text-blue-400">OUT</Pill>}
                            {row.status === "DENIED" && <Pill color="bg-red-500/20 text-red-400">DENIED</Pill>}
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* simple pagination */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-white/70">Showing {(attendancePage - 1) * attendancePageSize + 1} - {Math.min(attendancePage * attendancePageSize, attendance.length)} of {attendance.length}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAttendancePage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-lg bg-white/5 text-white/80">Prev</button>
                    <button onClick={() => setAttendancePage(p => Math.min(Math.ceil(attendance.length / attendancePageSize), p + 1))} className="px-3 py-1 rounded-lg bg-white/5 text-white/80">Next</button>
                  </div>
                </div>
              </SectionCard>
          </div>

          {/* -------------------- STUDENTS TAB -------------------- */}
          <div style={{ display: activeTab === 'students' ? 'block' : 'none' }}>
              <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <SectionCard className="lg:col-span-3">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/6 border border-white/10 shadow-sm w-full">
                      <Search className="w-5 h-5 text-white/70" />
                      <input
                        className="bg-transparent text-white placeholder-white/60 outline-none w-full"
                        placeholder="Search name, student no., course…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Search students"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      
                    </div>
                  </div>
                </SectionCard>

                {/* Register Modal trigger (mobile) */}
                {showRegisterModal && (
                  <div onClick={() => { setShowRegisterModal(false); }} className="fixed inset-0 z-[9999] flex items-center justify-center modal-backdrop-strong">
                    <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Register Student" className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <h4 className="text-lg font-semibold text-white mb-3">Register Student</h4>
                        <div className="grid grid-cols-1 gap-3">
                          <input autoFocus readOnly className="p-3 rounded-xl bg-white/10 text-white cursor-not-allowed" placeholder="Student No" value={regValues.studentNo} />
                        <div className="grid grid-cols-2 gap-3">
                          <input className="p-3 rounded-xl bg-white/10 text-white" placeholder="First name" value={regValues.firstName} onChange={e => setRegValues(prev => ({ ...prev, firstName: e.target.value }))} />
                          <input className="p-3 rounded-xl bg-white/10 text-white" placeholder="Last name" value={regValues.lastName} onChange={e => setRegValues(prev => ({ ...prev, lastName: e.target.value }))} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <input className="p-3 rounded-xl bg-white/10 text-white" placeholder="Middle name (optional)" value={regValues.middleName} onChange={e => setRegValues(prev => ({ ...prev, middleName: e.target.value }))} />
                          <input className="p-3 rounded-xl bg-white/10 text-white" placeholder="Suffix (Jr., III) (optional)" value={regValues.suffix} onChange={e => setRegValues(prev => ({ ...prev, suffix: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Level on the LEFT, Course on the RIGHT (swapped as requested) */}
                          <StyledSelect
                            id="reg-level"
                            options={
                              [
                                { value: 'Grade 11', label: 'Senior High School - Grade 11' },
                                { value: 'Grade 12', label: 'Senior High School - Grade 12' },
                                { value: 'College', label: 'College' },
                                { value: 'Other', label: 'Other' },
                              ]
                            }
                            value={regValues.level}
                            onChange={(v) => {
                              const norm = /Grade\s*11/i.test(v) ? 'Grade 11' : (/Grade\s*12/i.test(v) ? 'Grade 12' : v);
                              setRegValues(prev => ({ ...prev, level: norm, course: (['Grade 11','Grade 12'].includes(norm) ? '' : prev.course) }));
                            }}
                            placeholder="Select level"
                          />

                          {/* Course: show dropdown of SHS Tech-Voc / Sports when level is Grade 11/12, otherwise free text */}
                          {( /Grade\s*11|Grade\s*12/i ).test(regValues.level || '') ? (
                            <StyledSelect
                              id="reg-course"
                              options={[
                                { label: 'SHS Strands', options: [
                                  { value: 'STEM', label: 'STEM (Science, Technology, Engineering, Mathematics)' },
                                  { value: 'HUMSS', label: 'HUMSS (Humanities & Social Sciences)' },
                                  { value: 'ABM', label: 'ABM (Accountancy, Business, Management)' },
                                  { value: 'GAS', label: 'GAS (General Academic Strand)' },
                                  { value: 'TVL', label: 'TVL (Technical-Vocational-Livelihood)' },
                                  { value: 'Sports Track', label: 'Sports Track' }
                                ]}
                              ]}
                              value={regValues.course}
                              onChange={(v) => setRegValues(prev => ({ ...prev, course: v }))}
                              placeholder="Select strand / track"
                            />
                          ) : (
                            <input className="w-full text-left p-3 rounded-xl bg-black/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Course" value={regValues.course} onChange={e => setRegValues(prev => ({ ...prev, course: e.target.value }))} />
                          )}
                        </div>
                        {/* moved Create / Cancel actions below photo attachment for better layout */}

                        {/* Photo upload as part of registration fill-up */}
                        <div className="mt-4">
                          <label className="text-sm text-white/80 mb-2 block">Attach photo (optional)</label>
                          <div className="flex items-center gap-4">
                            <div className="w-24 h-28 bg-white/6 rounded-md overflow-hidden flex items-center justify-center border border-white/10">
                              {regPhotoPreview ? <img src={regPhotoPreview} alt="preview" className="w-full h-full object-cover" /> : <div className="text-white/60">No photo</div>}
                            </div>
                            <div className="flex-1">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const f = e.target.files && e.target.files[0];
                                  if (!f) return;
                                  setRegPhotoFile(f);
                                  const reader = new FileReader();
                                  reader.onload = () => setRegPhotoPreview(reader.result);
                                  reader.readAsDataURL(f);
                                }}
                                className="text-sm text-white/70"
                              />
                              <p className="text-xs text-white/60 mt-2">Attach a portrait to be printed on the student ID. Optional but recommended.</p>
                            </div>
                          </div>
                        </div>

                        {/* Create / Cancel actions placed after photo upload */}
                        <div className="flex items-center justify-end gap-3 mt-4">
                          <button onClick={() => { setShowRegisterModal(false); setRegResult(null); }} className="px-4 py-2 rounded-lg bg-white/10 text-white">Cancel</button>
                          {(() => {
                            const isSenior = ( /Grade\s*11|Grade\s*12/i ).test(regValues.level || '');
                            const canCreate = regValues.studentNo.trim() && regValues.firstName.trim() && regValues.lastName.trim() && regValues.level && (!isSenior || regValues.course);
                            return (
                              <button
                                disabled={!canCreate || creating}
                                onClick={async () => {
                                  try {
                                    setCreating(true);

                                    let resp;

                                    // If admin attached a File, send multipart/form-data to create the student and include the photo in one request.
                                    if (regPhotoFile) {
                                      const form = new FormData();
                                      // append all registration fields
                                      Object.keys(regValues).forEach(k => {
                                        const v = regValues[k];
                                        if (v !== undefined && v !== null) form.append(k, String(v));
                                      });
                                      form.append('photo', regPhotoFile);

                                      resp = await apiFetch(`${API_BASE}/api/students`, {
                                        method: 'POST',
                                        body: form
                                      });
                                    } else {
                                      // No file: fallback to JSON create
                                      resp = await apiFetch(`${API_BASE}/api/students`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(regValues)
                                      });
                                    }

                                    if (resp && resp.ok) {
                                      let created = await resp.json();
                                      setRegResult(created);
                                      // Build printed-style display: Lastname[, Suffix], Firstname M.
                                      const miNew = created.middleInitial || (created.middleName ? (String(created.middleName).trim().charAt(0).toUpperCase() + '.') : '');
                                      const displayName = `${created.lastName || ''}${created.suffix ? ', ' + created.suffix : ''}${(created.lastName || '') ? ', ' : ''}${created.firstName || ''}${miNew ? ' ' + miNew : ''}`.replace(/, ,/g, ',').trim();
                                      setStudents(prev => [{ id: created._id || created.id || created._id, name: displayName, number: created.studentNo, department: '', level: created.level || '', course: created.course || '', section: '', lastVisit: '', allowed: true, totalVisits: 0, qrCode: created.qrCode, photo: created.photo }, ...prev]);

                                      // If no file was included but admin provided an external URL as preview, save it
                                      if (!regPhotoFile && regPhotoPreview && /^https?:\/\//i.test(regPhotoPreview)) {
                                        try {
                                          const photoResp = await apiFetch(`${API_BASE}/api/students/${created._id || created.id}/photo`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ photo: regPhotoPreview })
                                          });
                                          if (photoResp && photoResp.ok) {
                                            const updated = await photoResp.json();
                                            created = updated;
                                            setRegResult(updated);
                                            setStudents(prev => prev.map(s => (s.id === (updated._id || updated.id) ? ({ ...s, photo: updated.photo }) : s)));
                                            setToast({ message: 'Photo saved', type: 'success' });
                                          }
                                        } catch (err) {
                                          console.error('Photo save failed', err);
                                        }
                                      }

                                      // show toast and transient pill to view QR
                                      setToast({ message: 'Student registered', type: 'success' });
                                      setShowRegQRPill(created);
                                      setShowRegQRModal(true);
                                      setTimeout(() => setShowRegQRPill(null), 8000);
                                    }
                                  } catch (err) {
                                    console.error('Registration failed', err);
                                    setToast({ message: 'Registration failed', type: 'error' });
                                  } finally {
                                    setCreating(false);
                                  }
                                }}
                                className={`px-4 py-2 rounded-lg ${(!canCreate || creating) ? 'bg-white/20 text-white/40 cursor-not-allowed' : 'bg-[#047857] text-white'}`}
                              >
                                {creating ? 'Creating…' : 'Create'}
                              </button>
                            );
                          })()}
                        </div>

                        {regResult && (
                          <div className="mt-4">
                            <h5 className="text-white font-medium mb-2">QR Code</h5>
                            <div className="bg-white/5 p-4 rounded-lg inline-block">
                              <img src={regResult.qrCode} alt="Student QR code" className="w-48 h-48 object-contain" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Transient pill that appears after registration to view QR */}
                {showRegQRPill && (
                  <div className="fixed top-6 right-6 z-[10000]">
                    <div className="flex items-center gap-3 bg-white/6 text-white px-4 py-2 rounded-full border border-white/10 shadow-lg">
                      <div className="text-sm">Student registered</div>
                      <button onClick={() => setShowRegQRModal(true)} className="px-3 py-1 rounded-full bg-[#047857] hover:bg-[#059669] text-white text-sm">View QR</button>
                      <button onClick={() => setShowRegQRPill(null)} className="ml-2 px-2 py-1 rounded-full bg-white/10 text-white/70">✕</button>
                    </div>
                  </div>
                )}

                {/* Small modal to show QR when pill clicked */}
                {showRegQRModal && showRegQRPill && (
                  <div onClick={() => { setShowRegQRModal(false); setShowRegQRPill(null); }} className="fixed inset-0 z-[10001] flex items-center justify-center modal-backdrop-strong">
                    <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-3">Student QR</h4>
                      <div className="flex flex-col items-center gap-3">
                        <img src={showRegQRPill.qrCode} alt="Student QR code" className="w-48 h-48 object-contain" />

                        {/* Photo upload for printing ID */}
                        <div className="w-full flex flex-col items-center gap-2">
                          <label className="text-sm text-white/80">Attach photo (optional)</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const f = e.target.files && e.target.files[0];
                              if (!f) return;
                              // keep File object for uploading
                              setRegPhotoFile(f);
                              // keep preview as data URL for immediate UI preview
                              const reader = new FileReader();
                              reader.onload = () => setRegPhotoPreview(reader.result);
                              reader.readAsDataURL(f);
                            }}
                            className="text-sm text-white/70"
                          />
                          {regPhotoPreview && <img src={regPhotoPreview} alt="Student portrait" className="w-24 h-28 object-cover rounded-md border border-white/10 mt-2" />}
                        </div>

                        <div className="flex items-center gap-2">
                          <button onClick={() => downloadStudentQR(showRegQRPill._id || showRegQRPill.id || showRegQRPill._id, `${showRegQRPill.studentNo || showRegQRPill.number}_qr.png`)} className="px-4 py-2 rounded-lg bg-[#F3C324] text-[#15280D]">Download</button>
                          <button onClick={() => { setShowRegQRModal(false); setShowRegQRPill(null); }} className="px-4 py-2 rounded-lg bg-white/10 text-white">Close</button>
                        </div>

                        {/* Print ID button opens a printable window with the designed ID */}
                        <div className="mt-2">
                          <button
                            onClick={() => {
                              const student = showRegQRPill;
                              const photo = regPhotoPreview;
                              printStudentID(student, photo);
                            }}
                            className="px-4 py-2 rounded-lg bg-emerald-600 text-white"
                          >
                            Print ID
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* stats moved to header for compact display */}
              </motion.div>

              <SectionCard>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">Directory</h3>
                  <div className="flex items-center gap-3">
                    <Pill>Rows: {students.length}</Pill>
                    <Pill className="bg-white/5 text-white/90">Compact</Pill>
                  </div>
                </div>

                  {loadingStudents && (
                    <div className="mb-4 text-white/70">Loading students…</div>
                  )}

                {/* Responsive: card-list on mobile, table on desktop */}
                {isMobile ? (
                  <div className="space-y-3">
                    {filteredStudents.map(s => (
                      <div key={s.id} className="bg-white/5 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md bg-white/6 flex items-center justify-center text-white font-bold">{(s.name || '').split(' ').map(n => n[0]).slice(0,2).join('')}</div>
                          <div>
                            <div className="text-white font-semibold">{s.name}</div>
                            <div className="text-sm text-white/70">{s.number} • {s.course}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => downloadStudentQR(s.id || s._id, `${s.number || s.studentNo}_qr.png`)} className="px-3 py-2 rounded-lg bg-white/6 text-white/80 flex items-center gap-2">
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button onClick={() => fetchAndPrintStudent(s.id || s._id)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                            {printingId === (s.id || s._id) ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Printer className="w-4 h-4" />}
                          </button>
                          <button onClick={() => openActionsModal(s)} className="px-2 py-2 rounded-lg bg-white/6 text-white/80">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-base">
                      <thead>
                        <tr className="text-white/60 border-b border-white/10">
                          <th className="px-4 py-3 text-left">Name</th>
                          <th className="px-4 py-3 text-left">Student No.</th>
                          <th className="px-4 py-3 text-left">Dept/Level</th>
                          <th className="px-4 py-3 text-left">Course/Section</th>
                          <th className="px-4 py-3 text-left">Last Visit</th>
                          <th className="px-4 py-3 text-left">Visits</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((s) => (
                          <tr key={s.id} className="border-b border-white/6 hover:bg-white/5 text-white/90">
                            <td className="px-5 py-4 font-medium text-white">{s.name}</td>
                            <td className="px-5 py-4 text-white/80">{s.number}</td>
                            <td className="px-5 py-4 text-white/70">{s.department} • {s.level}</td>
                            <td className="px-5 py-4 text-white/80">{s.course} • {s.section}</td>
                            <td className="px-5 py-4 text-white/70">{s.lastVisit}</td>
                            <td className="px-5 py-4 text-white/80">{s.totalVisits}</td>
                            <td className="px-5 py-4">
                              {s.allowed
                                ? <Pill color="bg-green-500/20 text-green-400">Allowed</Pill>
                                : <Pill color="bg-red-500/20 text-red-400">Restricted</Pill>}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center">
                                <button onClick={() => openActionsModal(s)} className="px-3 py-2 rounded-lg bg-white/6 border border-white/10 text-white/80 hover:bg-white/10 mr-2">Actions</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
          </div>

          {/* -------------------- REPORTS TAB -------------------- */}
          <div style={{ display: activeTab === 'reports' ? 'block' : 'none' }}>
              {/* Range Switch + KPIs */}
              <motion.div variants={containerVariants} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <SectionCard className="lg:col-span-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      {["today", "7d", "30d"].map(r => (
                        <button
                          key={r}
                          onClick={() => setReportRange(r)}
                          className={`px-3 py-2 rounded-xl font-medium ${reportRange === r
                            ? "bg-white/20 text-white"
                            : "bg-white/10 text-white/80 hover:bg-white/15"} border border-white/15`}
                        >
                          {r === "today" ? "Today" : r.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white/80 hover:bg-white/15">
                        <Filter className="w-4 h-4 inline-block mr-2" />
                        Filters
                      </button>
                      <button className="px-3 py-2 rounded-xl bg-[#047857] hover:bg-[#059669] text-white">
                        <Download className="w-4 h-4 inline-block mr-2" />
                        Export
                      </button>
                    </div>
                  </div>
                </SectionCard>

                <div className="grid grid-cols-2 gap-4">
                  <StatCard title="Total Visits" value={reportCounts.totalVisits} icon={Activity} color="bg-blue-500" />
                  <StatCard title="Unique Visitors" value={reportCounts.unique} icon={Users} color="bg-purple-500" />
                </div>
              </motion.div>

              {/* Purpose + Dept + Small Heatline */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <SectionCard className="xl:col-span-2">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <ChartLine className="w-5 h-5 text-amber-400" />
                    Purpose Breakdown (sample)
                  </h3>
                  <div className="space-y-4">
                    {[
                      { name: "Research", count: 45, color: "bg-blue-500" },
                      { name: "Study", count: 38, color: "bg-green-500" },
                      { name: "Borrow/Return", count: 28, color: "bg-purple-500" },
                      { name: "Group Study", count: 16, color: "bg-amber-500" },
                    ].map((row, idx) => (
                      <div key={row.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-white/80">{row.name}</span>
                          <span className="text-sm font-medium text-white">{row.count}</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(row.count / reportCounts.totalVisits) * 100}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 }}
                            className={`h-full ${row.color} rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard>
                  <h3 className="text-lg font-semibold text-white mb-4">Status Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">IN (current)</span>
                      <Pill color="bg-green-500/20 text-green-400">{reportCounts.ins}</Pill>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">OUT (completed)</span>
                      <Pill color="bg-blue-500/20 text-blue-400">{reportCounts.outs}</Pill>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">DENIED</span>
                      <Pill color="bg-red-500/20 text-red-400">{reportCounts.denies}</Pill>
                    </div>
                  </div>
                </SectionCard>
              </div>
              {/* View All Modal state + trigger */}

              {/* Mini “By Hour” bars (visual) */}
              <SectionCard>
                <h3 className="text-lg font-semibold text-white mb-4">Today — Visits by Hour (sample)</h3>
                <div className="grid grid-cols-12 gap-2">
                  {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((hr, idx) => {
                    const v = [2, 6, 12, 10, 7, 8, 9, 11, 5, 3, 2, 1][idx]; // mock
                    return (
                      <div key={hr} className="flex flex-col items-center gap-2">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${v * 8}px` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                          className="w-4 rounded-md bg-gradient-to-t from-green-600 to-green-400"
                          title={`${hr}:00 — ${v} visits`}
                        />
                        <span className="text-[10px] text-white/60">{hr}</span>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
          </div>
        </motion.div>
      </div>

        {/* View All Visits Modal */}
        {showAllVisitsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowAllVisitsModal(false)} />
            <div className="relative w-[95%] sm:w-[900px] max-h-[85vh] bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-6 z-60">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">All Visits</h3>
                  <p className="text-sm text-white/60">Paginated list of recent visits across all devices</p>
                </div>
                <div className="flex items-center gap-2">
                  <input value={allSearch} onChange={(e) => setAllSearch(e.target.value)} placeholder="Search name, student no, purpose..." className="px-3 py-2 rounded-xl bg-black/20 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  <button onClick={() => exportFromServer()} className="px-3 py-2 rounded-xl bg-[#047857] hover:bg-[#059669] text-white text-sm">Export</button>
                  <button onClick={() => setShowAllVisitsModal(false)} className="px-3 py-2 rounded-xl bg-white/6 hover:bg-white/10 text-white">Close</button>
                </div>
              </div>

              <div className="h-[60vh] overflow-y-auto p-1 custom-scrollbar" onScroll={handleAllScroll}>
                {allError && (
                  <div className="p-4 bg-red-600/10 border border-red-600/10 rounded-md text-red-200 mb-3">{allError}</div>
                )}
                {allVisits.length === 0 && !allLoading && !allError && (
                  <div className="p-6 text-white/70">No visits yet.</div>
                )}
                <div className="space-y-3">
                  {allVisits.filter(v => {
                    if (!allSearch) return true;
                    const q = allSearch.toLowerCase();
                    return (v.name && v.name.toLowerCase().includes(q)) || (v.studentNo && v.studentNo.toLowerCase().includes(q)) || (v.purpose && v.purpose.toLowerCase().includes(q));
                  }).map((v, idx) => {
                    const id = v._id || `${v.studentId}-${idx}`;
                    const expanded = expandedVisits.has(id);
                    return (
                      <div key={id} className="space-y-2">
                        <div onClick={() => {
                          // toggle expand
                          const next = new Set(expandedVisits);
                          if (expanded) next.delete(id); else next.add(id);
                          setExpandedVisits(next);
                        }} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/6">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white/6 overflow-hidden">
                            {v.photo ? (
                              <img src={v.photo} alt={v.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white/90 font-semibold">{(v.name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{v.name}</p>
                            <p className="text-white/60 text-sm">{v.level} • {v.course} • {v.studentNo || '-'}</p>
                            <p className="text-white/50 text-xs mt-1 truncate">{v.purpose}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/80 text-sm">{v.time}</p>
                            {v.durationMs != null && (
                              <p className="text-white/40 text-[11px]">{formatDuration(v.durationMs)}</p>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${v.status === 'OK' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {v.status}
                          </div>
                        </div>
                        {expanded && (
                          <div className="p-3 bg-white/3 rounded-lg border border-white/6 flex items-start justify-between gap-4">
                            <div className="text-sm text-white/70">
                              <div><strong className="text-white">Device:</strong> {v.deviceId || '—'}</div>
                              <div><strong className="text-white">Kiosk:</strong> {v.kiosk || '—'}</div>
                              <div className="mt-2"><strong className="text-white">Notes:</strong> <span className="text-white/80">{v.notes || '—'}</span></div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button onClick={(e) => { e.stopPropagation(); openStudent({ id: v.studentId, number: v.studentNo, level: v.level, course: v.course, photo: v.photo }); setShowAllVisitsModal(false); }} className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm">View Profile</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {allLoading && (
                    <div className="p-4 text-white/70">Loading...</div>
                  )}
                  {!allHasMore && allVisits.length > 0 && (
                    <div className="p-4 text-white/60 text-center">End of results</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings modal: change username, email, password */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowSettingsModal(false)} />
            <div className="relative w-[95%] sm:w-[520px] max-h-[90vh] bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-6 z-60 overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Admin Settings</h3>
                  <p className="text-sm text-white/60">Change username, email, or update password</p>
                </div>
                <div>
                  <button onClick={() => setShowSettingsModal(false)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10"><X className="w-4 h-4 text-white/80" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs text-white/70">Username</label>
                <input className="p-3 rounded-xl bg-black/30 text-white focus:outline-none" value={settingsValues.username} onChange={e => setSettingsValues(prev => ({ ...prev, username: e.target.value }))} />

                <label className="text-xs text-white/70">Email</label>
                <input className="p-3 rounded-xl bg-black/30 text-white focus:outline-none" value={settingsValues.email} onChange={e => setSettingsValues(prev => ({ ...prev, email: e.target.value }))} />

                <div className="text-sm text-white/60">To change password enter your current password and a new password below. Leave blank to keep current password.</div>
                <label className="text-xs text-white/70">Current Password</label>
                <input type="password" className="p-3 rounded-xl bg-black/30 text-white focus:outline-none" value={settingsValues.currentPassword} onChange={e => setSettingsValues(prev => ({ ...prev, currentPassword: e.target.value }))} />

                <label className="text-xs text-white/70">New Password</label>
                <input type="password" className="p-3 rounded-xl bg-black/30 text-white focus:outline-none" value={settingsValues.newPassword} onChange={e => setSettingsValues(prev => ({ ...prev, newPassword: e.target.value }))} />

                <label className="text-xs text-white/70">Confirm New Password</label>
                <input type="password" className="p-3 rounded-xl bg-black/30 text-white focus:outline-none" value={settingsValues.confirmPassword} onChange={e => setSettingsValues(prev => ({ ...prev, confirmPassword: e.target.value }))} />

                <div className="flex items-center justify-end gap-3 mt-2">
                  <button onClick={() => setShowSettingsModal(false)} className="px-4 py-2 rounded-lg bg-white/10 text-white">Cancel</button>
                  <button disabled={savingSettings} onClick={updateSettings} className={`px-4 py-2 rounded-lg ${savingSettings ? 'bg-white/20 text-white/40 cursor-not-allowed' : 'bg-[#047857] text-white'}`}>{savingSettings ? 'Saving…' : 'Save Changes'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions modal for student row operations (responsive grid of four choices) */}
        {actionsModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={closeActionsModal} />
            <div className="relative w-[95%] sm:w-[480px] max-h-[85vh] bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-6 z-60">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Actions — {actionsModal.student ? actionsModal.student.name : ''}</h3>
                  <p className="text-sm text-white/60">Choose an action for this student</p>
                </div>
                <div>
                  <button onClick={closeActionsModal} className="p-2 rounded-lg bg-white/5 hover:bg-white/10"><X className="w-4 h-4 text-white/80" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => { if (actionsModal.student) openStudentHistory(actionsModal.student.id || actionsModal.student._id, actionsModal.student.name); closeActionsModal(); }}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                >
                  <Activity className="w-6 h-6 text-amber-300" />
                  <span className="text-sm">View History</span>
                </button>

                <button
                  onClick={() => { if (actionsModal.student) fetchAndPrintStudent(actionsModal.student.id || actionsModal.student._id); closeActionsModal(); }}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-emerald-600 text-white"
                >
                  <Printer className="w-6 h-6" />
                  <span className="text-sm">Print ID</span>
                </button>

                <button
                  onClick={() => { if (actionsModal.student) downloadStudentQR(actionsModal.student.id || actionsModal.student._id, `${actionsModal.student.number || actionsModal.student.studentNo}_qr.png`); closeActionsModal(); }}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                >
                  <QrCode className="w-6 h-6 text-white/80" />
                  <span className="text-sm">Download QR</span>
                </button>

                <button
                  onClick={() => { if (actionsModal.student) openStudent(actionsModal.student); closeActionsModal(); }}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                >
                  <Edit className="w-6 h-6 text-white/80" />
                  <span className="text-sm">Edit Details</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student History Modal (grouped by day) */}
        {showStudentHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowStudentHistoryModal(false)} />
            <div className="relative w-[95%] sm:w-[760px] max-h-[85vh] bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-6 z-60">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{historyStudent ? historyStudent.name : 'Student'} — Activity History</h3>
                  <p className="text-sm text-white/60">Grouped by day. Click a visit for details.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowStudentHistoryModal(false)} className="px-3 py-2 rounded-xl bg-white/6 hover:bg-white/10 text-white">Close</button>
                </div>
              </div>

              <div className="h-[60vh] overflow-y-auto p-1 custom-scrollbar">
                {historyError && <div className="p-3 bg-red-600/10 rounded text-red-200">{historyError}</div>}
                {historyLoading && <div className="p-3 text-white/70">Loading history…</div>}
                {!historyLoading && historyVisits.length === 0 && <div className="p-4 text-white/70">No history available.</div>}

                {/* Group visits by date (YYYY-MM-DD) */}
                {Object.entries(historyVisits.reduce((acc, v) => {
                  const key = v.timeIn ? (new Date(v.timeIn)).toISOString().split('T')[0] : (v.time ? new Date(v.time).toISOString().split('T')[0] : 'Unknown');
                  (acc[key] = acc[key] || []).push(v);
                  return acc;
                }, {})).sort((a,b) => b[0].localeCompare(a[0])).map(([date, visits]) => ({ date, visits }))
                  .map(group => (
                    <div key={group.date} className="mb-4">
                      <h4 className="text-sm text-white/70 mb-2">{new Date(group.date).toLocaleDateString()}</h4>
                      <div className="space-y-2">
                        {group.visits.map(v => {
                          const id = v.id || v._id;
                          const expanded = expandedVisits.has(id);
                          return (
                            <div key={id} className="space-y-2">
                              <div onClick={() => {
                                const next = new Set(expandedVisits);
                                if (expanded) next.delete(id); else next.add(id);
                                setExpandedVisits(next);
                              }} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer border border-white/6">
                                <div>
                                  <p className="text-white font-medium">{v.purpose || 'Visit'}</p>
                                  <p className="text-white/60 text-sm">{v.timeIn ? new Date(v.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (v.time || '')} — {v.timeOut ? new Date(v.timeOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                                </div>
                                <div className="text-right">
                                  {v.durationMs != null && <p className="text-white/40 text-sm">{formatDuration(v.durationMs)}</p>}
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${v.status === 'OK' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{v.status}</div>
                                </div>
                              </div>
                              {expanded && (
                                <div className="p-3 bg-white/3 rounded text-white/80 border border-white/6 flex items-center justify-between">
                                  <div className="text-sm">
                                    <div><strong className="text-white">Device:</strong> {v.deviceId || '—'}</div>
                                    <div><strong className="text-white">Kiosk:</strong> {v.kiosk || '—'}</div>
                                    <div className="mt-1"><strong className="text-white">Notes:</strong> <span className="text-white/80">{v.notes || '—'}</span></div>
                                  </div>
                                  <div>
                                    <button onClick={(e) => { e.stopPropagation(); /* maybe future: open visit detail */ }} className="px-3 py-1 rounded-lg bg-white/6 text-white">Details</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Student Drawer */}
      {selectedStudent && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white/6 backdrop-blur-xl border-l border-white/10 p-6 z-50">
                <div className="flex items-start justify-between mb-4">
            <div className="w-full">
              <h3 className="text-lg font-semibold text-white mb-1">Edit Student</h3>
              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs text-white/70">Student No (readonly)</label>
                <input value={editValues.number} readOnly className="w-full text-left p-3 rounded-xl bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-not-allowed" />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-white/70">First name</label>
                    <input value={editValues.firstName} onChange={(e) => setEditValues(prev => ({ ...prev, firstName: e.target.value }))} className="w-full text-left p-3 rounded-xl bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs text-white/70">Middle name</label>
                    <input value={editValues.middleName} onChange={(e) => setEditValues(prev => ({ ...prev, middleName: e.target.value }))} className="w-full text-left p-3 rounded-xl bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs text-white/70">Suffix</label>
                    <input value={editValues.suffix} onChange={(e) => setEditValues(prev => ({ ...prev, suffix: e.target.value }))} placeholder="Jr., III (optional)" className="w-full text-left p-3 rounded-xl bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/70">Last name</label>
                    <input value={editValues.lastName} onChange={(e) => setEditValues(prev => ({ ...prev, lastName: e.target.value }))} className="w-full text-left p-3 rounded-xl bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs text-white/70">Level</label>
                    <StyledSelect
                      id="edit-level"
                      options={[
                        { value: 'Grade 11', label: 'Senior High School - Grade 11' },
                        { value: 'Grade 12', label: 'Senior High School - Grade 12' },
                        { value: 'College', label: 'College' },
                        { value: 'Other', label: 'Other' },
                      ]}
                      value={editValues.level}
                      onChange={(v) => {
                        const norm = /Grade\s*11/i.test(v) ? 'Grade 11' : (/Grade\s*12/i.test(v) ? 'Grade 12' : v);
                        setEditValues(prev => ({ ...prev, level: norm }));
                      }}
                      placeholder="Select level"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/70">Course / Strand</label>
                  <input value={editValues.course} onChange={(e) => setEditValues(prev => ({ ...prev, course: e.target.value }))} className="w-full text-left p-3 rounded-xl bg-black/30 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedStudent(null)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
              <X className="w-5 h-5 text-white/80" />
            </button>
          </div>
            <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <p className="text-white/70 text-sm">Last Visit</p>
              <p className="text-white mt-1">{selectedStudent.lastVisit}</p>
            </div>

            <div className="bg-white/5 p-4 rounded-lg">
              <label className="text-sm text-white/80 mb-2 block">Attach / Update Photo</label>
              <div className="flex items-start gap-4">
                <div className="w-24 h-28 bg-white/6 rounded-md overflow-hidden flex items-center justify-center border border-white/10">
                  {editPhotoPreview ? <img src={editPhotoPreview} alt="preview" className="w-full h-full object-cover" /> : <div className="text-white/60">No photo</div>}
                </div>
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    // keep file for upload and preview for UI
                    setEditPhotoFile(f);
                    const reader = new FileReader();
                    reader.onload = () => setEditPhotoPreview(reader.result);
                    reader.readAsDataURL(f);
                  }} className="text-white/80 mb-2" />
                  <div className="flex gap-2">
                    <button onClick={() => downloadStudentQR(selectedStudent.id || selectedStudent._id, `${selectedStudent.number || selectedStudent.studentNo}_qr.png`)} className="px-3 py-2 rounded-lg bg-[#F3C324] text-[#15280D] flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      <span className="hidden sm:inline">Download QR</span>
                    </button>
                    <button onClick={() => fetchAndPrintStudent(selectedStudent.id || selectedStudent._id)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      {printingId === (selectedStudent.id || selectedStudent._id) ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Printer className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3 py-2 rounded-lg bg-white/10" onClick={() => { setSelectedStudent(null); }}>Cancel</button>
                  <button
                disabled={savingStudent}
                onClick={async () => {
                  try {
                    setSavingStudent(true);
                    // Use explicit name fields from editValues
                    const firstName = (editValues.firstName || '').trim();
                    const middleName = (editValues.middleName || '').trim();
                    const suffix = (editValues.suffix || '').trim();
                    const lastName = (editValues.lastName || '').trim();
                    const body = { firstName, middleName, lastName, suffix, level: editValues.level, course: editValues.course };
                    const resp = await apiFetch(`${API_BASE}/api/students/${selectedStudent.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(body)
                    });
                    let updated = null;
                    if (resp && resp.ok) {
                      updated = await resp.json();
                      setToast({ message: 'Student updated', type: 'success' });
                    }
                    // If admin attached photo, upload it. Prefer File upload (multipart/form-data).
                    if (editPhotoFile) {
                      try {
                        const form = new FormData();
                        form.append('photo', editPhotoFile);
                        const photoResp = await apiFetch(`${API_BASE}/api/students/${selectedStudent.id}/photo`, {
                          method: 'POST',
                          body: form
                        });
                        if (photoResp && photoResp.ok) {
                          const withPhoto = await photoResp.json();
                          updated = withPhoto;
                          setToast({ message: 'Photo saved', type: 'success' });
                        } else {
                          setToast({ message: 'Photo upload failed', type: 'error' });
                        }
                      } catch (err) {
                        console.error('Photo upload failed', err);
                        setToast({ message: 'Photo upload failed', type: 'error' });
                      }
                    } else if (editPhotoPreview && /^https?:\/\//i.test(editPhotoPreview)) {
                      // support saving an external URL if present
                      try {
                        const photoResp = await apiFetch(`${API_BASE}/api/students/${selectedStudent.id}/photo`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ photo: editPhotoPreview })
                        });
                        if (photoResp && photoResp.ok) {
                          const withPhoto = await photoResp.json();
                          updated = withPhoto;
                          setToast({ message: 'Photo saved', type: 'success' });
                        }
                      } catch (err) {
                        console.error('Photo upload failed', err);
                        setToast({ message: 'Photo upload failed', type: 'error' });
                      }
                    }
                    if (updated) {
                      // Build printed-style display: Lastname[, Suffix], Firstname M.
                      const miUpdated = updated.middleInitial || (updated.middleName ? (String(updated.middleName).trim().charAt(0).toUpperCase() + '.') : '');
                      const mapped = {
                        id: updated._id || updated.id || selectedStudent.id,
                        name: `${updated.lastName || ''}${updated.suffix ? ', ' + updated.suffix : ''}${(updated.lastName || '') ? ', ' : ''}${updated.firstName || ''}${miUpdated ? ' ' + miUpdated : ''}`.replace(/, ,/g, ',').trim(),
                        number: updated.studentNo || selectedStudent.number,
                        department: updated.department || selectedStudent.department,
                        level: updated.level || editValues.level,
                        course: updated.course || editValues.course,
                        section: updated.section || selectedStudent.section,
                        lastVisit: selectedStudent.lastVisit,
                        allowed: typeof updated.allowed === 'boolean' ? updated.allowed : selectedStudent.allowed,
                        totalVisits: selectedStudent.totalVisits,
                        qrCode: updated.qrCode || selectedStudent.qrCode,
                        photo: updated.photo || editPhotoPreview || selectedStudent.photo
                      };
                      setSelectedStudent(mapped);
                      setStudents(prev => prev.map(s => (s.id === mapped.id ? mapped : s)));
                    }
                  } catch (err) {
                    console.error('Save student failed', err);
                    setToast({ message: 'Save failed', type: 'error' });
                  } finally {
                    setSavingStudent(false);
                  }
                }}
                className={`px-4 py-2 rounded-lg ${savingStudent ? 'bg-white/20 text-white/40 cursor-not-allowed' : 'bg-[#047857] text-white'}`}
              >
                {savingStudent ? 'Saving…' : 'Save Changes'}
              </button>

              <button
                onClick={() => {
                  const newAllowed = !selectedStudent.allowed;
                  setConfirm({
                    open: true,
                    title: `${newAllowed ? 'Allow' : 'Restrict'} Student`,
                    message: `Are you sure you want to ${newAllowed ? 'allow' : 'restrict'} ${selectedStudent.name}?`,
                    onConfirm: async () => {
                      try {
                        const resp = await apiFetch(`${API_BASE}/api/students/${selectedStudent.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ allowed: newAllowed })
                        });
                        if (resp && resp.ok) {
                          const updated = await resp.json();
                          setSelectedStudent(prev => ({ ...prev, ...updated }));
                          setStudents(prev => prev.map(s => (s.id === updated._id || s.id === updated.id) ? ({ ...s, ...updated }) : s));
                          setToast({ message: 'Student updated', type: 'success' });
                        }
                      } catch (err) {
                        console.error('Error updating student', err);
                      }
                      setConfirm({ open: false, title: '', message: '', onConfirm: null });
                    }
                  });
                }}
                className={`px-3 py-2 rounded-lg ${selectedStudent.allowed ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
              >
                {selectedStudent.allowed ? 'Restrict' : 'Allow'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* scrollbar styling */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
      `}</style>
      {/* Confirmation Modal */}
      {confirm.open && (
        <div onClick={() => setConfirm({ open: false, title: '', message: '', onConfirm: null })} className="fixed inset-0 z-[9999] flex items-center justify-center modal-backdrop-strong">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white/6 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-white mb-2">{confirm.title}</h4>
            <p className="text-white/70 mb-4">{confirm.message}</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setConfirm({ open: false, title: '', message: '', onConfirm: null })} className="px-4 py-2 rounded-lg bg-white/10 text-white">Cancel</button>
              <button onClick={() => { if (confirm.onConfirm) confirm.onConfirm(); }} className="px-4 py-2 rounded-lg bg-[#F3C324] text-[#15280D] font-semibold">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

// Print helper (placed after component export so it doesn't capture component scope)
function printStudentID(student, photoDataUrl) {
  if (!student) return;
  const { studentNo, firstName, middleName, lastName, suffix, level, course } = student;
  // Title-case the full name (auto capitalize)
  const titleCase = (s) => {
    if (!s) return '';
    return s.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };
  // Format as: Lastname[, Suffix] , Firstname [M.]
  const middleInitial = middleName ? (middleName.trim().charAt(0).toUpperCase() + '.') : '';
  const surname = (lastName || '').trim();
  const suffixPart = suffix ? ` ${suffix.trim()}` : '';
  const given = (firstName || '').trim();
  const fullName = titleCase(`${surname}${suffixPart}, ${given}${middleInitial ? ' ' + middleInitial : ''}`.trim());
  // ID card size: 52mm x 85.6mm
  const mmWidth = '52mm';
  const mmHeight = '85.6mm';

  const html = `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Student ID - ${studentNo}</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page { size: ${mmWidth} ${mmHeight}; margin: 0; }
      body { margin:0; padding:0; -webkit-print-color-adjust: exact; }
      .id-card { width: ${mmWidth}; height: ${mmHeight}; box-sizing: border-box; font-family: 'Poppins', system-ui, sans-serif; display: flex; align-items: stretch; }
      .id-front { flex:1; background: linear-gradient(180deg, #072612 0%, #0b2f18 100%); color: white; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04); box-sizing: border-box; position:relative; overflow:hidden; }
      /* Premium top border */
      .top-bar { position:absolute; left:0; right:0; top:0; height:38px; display:flex; align-items:center; justify-content:center; padding:0 10px; box-sizing:border-box; background: linear-gradient(90deg,#FFD84A,#F3C324); box-shadow: 0 2px 6px rgba(0,0,0,0.12); }
      /* center the logo absolutely so it remains centered regardless of other content */
      .top-bar .logo { position:absolute; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:8px; }
      .logo-mark { width:32px; height:32px; border-radius:6px; background: #15280D; color:#FFD84A; font-weight:700; display:flex; align-items:center; justify-content:center; font-size:16px; }
      .top-qr { width:36px; height:36px; background:white; padding:4px; border-radius:6px; display:flex; align-items:center; justify-content:center; }
      .id-header { display:flex; align-items:center; gap:8px; margin-top:46px; }
      .school { font-size:10px; opacity:0.95; color:#fff; }
      .fullname { margin-top:8px; font-size:14px; font-weight:700; text-transform:capitalize; }
      .meta { margin-top:6px; font-size:11px; opacity:0.95; }
      .photo-qr { display:flex; justify-content:space-between; align-items:center; margin-top:10px; }
      .photo { width:84px; height:100px; background:rgba(255,255,255,0.04); border:1px dashed rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; color:rgba(255,255,255,0.5); border-radius:6px; overflow:hidden; }
      .qr { width:84px; height:84px; background:white; padding:6px; border-radius:8px; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 6px rgba(0,0,0,0.12); }
      .small { font-size:10px; opacity:0.85; }
      .id-footer { margin-top:8px; display:flex; justify-content:space-between; align-items:center; font-size:10px; }
    </style>
  </head>
  <body>
    <div class="id-card">
      <div class="id-front">
        <div class="top-bar">
          <div class="logo"><div class="logo-mark">F</div><div style="line-height:1"> <div style="font-size:12px;font-weight:600;color:#15280D">FastNCeano</div><div style="font-size:9px;color:#15280D;opacity:0.85;margin-top:2px">Library Access</div> </div></div>
        </div>
        <div class="id-header">
          <div class="brand" style="display:none">F</div>
          <div>
            <div class="school">FastNCeano</div>
            <div class="small">Library Access ID</div>
          </div>
        </div>
        <div class="fullname">${escapeHtml(fullName)}</div>
        <div class="meta">ID: ${escapeHtml(studentNo || '')}</div>
        <div class="meta">${escapeHtml(level || '')} • ${escapeHtml(course || '')}</div>
        <div class="photo-qr">
          <div class="photo">${photoDataUrl ? `<img src="${photoDataUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;"/>` : 'Photo'}</div>
          <div class="qr">${student.qrCode ? `<img src="${student.qrCode}" style="width:100%;height:100%;object-fit:contain;" />` : ''}</div>
        </div>
        <div class="id-footer">
          <div class="small">Issued: ${new Date().toLocaleDateString()}</div>
          <div class="small">Signature</div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
  // wait for load then print
  w.focus();
  const t = setInterval(() => {
    if (w.document.readyState === 'complete') {
      clearInterval(t);
      w.print();
      // do not auto-close so user can verify; comment out if you prefer closing
      // w.close();
    }
  }, 200);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function (s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s];
  });
}
