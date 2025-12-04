import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

import StudentIDCard from '../components/StudentIDCard';
import RecorderPanel from '../components/RecorderPanel';
import VisitHistory from '../components/VisitHistory';
import ActiveSessionBanner from '../components/ActiveSessionBanner';
import DarkModeToggle from '../components/DarkModeToggle';
import { cleanScannerString } from '../utils/scannerSanitizer';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const DEVICE_ID = 'kiosk-1';

export default function StudentPortal() {
  // UI & system states
  const [ariaMessage, setAriaMessage] = useState('');

  // Student data states
  const [student, setStudent] = useState(null);
  const [restricted, setRestricted] = useState(false);
  const [needsPurpose, setNeedsPurpose] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [recent, setRecent] = useState([]);
  const [recentPage, setRecentPage] = useState(1);
  const [recentTotalPages, setRecentTotalPages] = useState(1);

  // Results
  const [timeInResult, setTimeInResult] = useState(null);
  const [timeOutResult, setTimeOutResult] = useState(null);

  /* ---------------------------------------------
   * Reset UI before processing a new scan
   * ------------------------------------------- */
  const resetState = () => {
    setStudent(null);
    setRestricted(false);
    setNeedsPurpose(false);
    setTimeInResult(null);
    setTimeOutResult(null);
  };

  /* ---------------------------------------------
   * Fetch student visit history
   * ------------------------------------------- */
  const fetchHistory = async (studentId) => {
    try {
      const res = await fetch(`${API}/api/students/${studentId}/history`);
      if (!res || !res.ok) {
        const txt = res ? await res.text().catch(() => '') : '';
        console.warn('History fetch failed', res && res.status, txt);
        setHistory([]);
        return;
      }
      const data = await res.json();
      // API may return an array, or an object { visits, page, ... }
      const visits = Array.isArray(data) ? data : (Array.isArray(data.visits) ? data.visits : []);
      setHistory(visits.slice(0, 5)); // Show latest 5
    } catch (err) {
      console.warn('History fetch failed', err && err.message ? err.message : err);
      setHistory([]);
    }
  };

  const fetchRecent = async (page = 1, limit = 10) => {
    try {
      const res = await fetch(`${API}/api/attendance/recent?page=${page}&limit=${limit}`);
      const data = await res.json();
      // API returns { visits, page, limit, total, totalPages, hasMore }
      setRecent(data.visits || []);
      setRecentPage(data.page || page);
      setRecentTotalPages(data.totalPages || 1);
    } catch (err) {
      console.warn('Recent visits fetch failed', err);
    }
  };

  // Fetch recent visits on mount so the panel shows recent visitors even before a scan
  useEffect(() => {
    fetchRecent(1, 10);
  }, []);

  /* ---------------------------------------------
   * Handle QR Scan
   * ------------------------------------------- */
  const handleScan = async (code) => {
    console.debug('[SCAN]', code);
    resetState();
    // Use shared sanitizer utility

    // Some scanners may send a JS/JSON-like payload (e.g. {id: '...', studentNo: '...'})
    // Attempt to parse JSON out of the scanned string and prefer the studentNo or id as the qr value.
    let qrPayload = code;
    if (typeof code === 'string') {
      const raw = cleanScannerString(code);
      const s = raw.trim();
      // Quick detection: starts with { and ends with } -> try parse
      if (s.startsWith('{') && s.endsWith('}')) {
        try {
          // Replace single quotes with double for naive JSON-like strings
          const normalized = s.replace(/(['"])??([a-zA-Z0-9_]+)\1??\s*:/g, '"$2":').replace(/'/g, '"');
          const parsed = JSON.parse(normalized);
          // Prefer studentNo if available, otherwise id, otherwise use entire JSON string
          qrPayload = parsed.studentNo || parsed.id || JSON.stringify(parsed);
          console.debug('[SCAN] parsed payload ->', parsed, 'using qr:', qrPayload);
        } catch (err) {
          console.debug('[SCAN] could not parse scanned JSON-like payload', err);
          qrPayload = s;
        }
      } else {
        qrPayload = s;
      }
    }

    try {
      const res = await fetch(`${API}/api/attendance/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr: qrPayload })
      });

      const data = await res.json();
      if (!res.ok) throw data;

      setStudent(data.student || null);
      setActiveSession(data.activeSession || null);

      // Restriction check
      if (data.allowed === false) {
        setRestricted(true);
        setAriaMessage('You are not allowed to enter the library.');
        return;
      }

      /* ------------ NEXT ACTIONS BASED ON ACTION TYPE ------------ */

      // User needs to Time In with purpose
      if (data.action === 'TIME_IN') {
        setNeedsPurpose(true);
        setAriaMessage('Please choose your purpose of visit.');
        return;
      }

      // Auto Time Out
      if (data.action === 'TIME_OUT') {
        await autoTimeOut(data);
        return;
      }

      // Default – display student info & fetch visit history
      if (data.student) {
        setAriaMessage(
          `Student identified: ${data.student.lastName}, ${data.student.firstName}.`
        );
        fetchHistory(data.student._id);
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
  };

  /* ---------------------------------------------
   * Auto Time-Out Handling
   * ------------------------------------------- */
  const autoTimeOut = async (data) => {
    try {
      const res = await fetch(`${API}/api/attendance/time-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: data.student._id,
          sessionId: data.activeSession._id
        })
      });

      const outData = await res.json();
      setTimeOutResult(outData);

      const timestamp = new Date(
        outData.session?.timeOutAt || outData.timeOutAt || Date.now()
      );

      setAriaMessage(
        `Time Out recorded at ${timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}. Thank you for visiting the library.`
      );

      fetchHistory(data.student._id);
      fetchRecent(10);
    } catch (err) {
      console.error('Auto time-out failed:', err);
    }
  };

  /* ---------------------------------------------
   * Confirm Purpose → Time In
   * ------------------------------------------- */
  const confirmPurpose = async (purpose) => {
    if (!student) return;

    try {
      const res = await fetch(`${API}/api/attendance/time-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student._id,
          purpose,
          deviceId: DEVICE_ID
        })
      });

      const data = await res.json();
      setTimeInResult(data);
      setNeedsPurpose(false);
      setActiveSession(data.session || null);

      // ARIA message
      const timestamp = new Date(
        data.session?.timeInAt || data.timeInAt || Date.now()
      );

      setAriaMessage(
        `Time In recorded at ${timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}. Purpose: ${data.session?.purpose || purpose}.`
      );

      fetchHistory(student._id);
      fetchRecent(10);
    } catch (err) {
      console.error('Time-in error:', err);
    }
  };

  /* ---------------------------------------------
   * RENDER UI
   * ------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#047857] to-[#F3C324] text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg">
              <span className="text-[#F6F5E3]">FastNCeano</span>
              <span className="ml-3 text-[#FDC823] text-2xl md:text-3xl font-semibold">
                Library Portal
              </span>
            </h1>
            <p className="mt-1 text-sm text-cream/80">
              Scan your QR to log visits — fast, secure, and effortless.
            </p>
          </div>

          <DarkModeToggle />
        </header>

        {/* Screen Reader Live Announcements */}
        <div aria-live="polite" role="status" className="sr-only">
          {ariaMessage}
        </div>

        {/* MAIN GRID */}
        <main className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PANEL */}
          <section className="lg:col-span-8 bg-gradient-to-b from-[#064e5b] via-[#0f7a4a] to-[#052e22] backdrop-blur-xl rounded-3xl p-8 shadow-xl text-white">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col items-center justify-center w-full gap-6 py-10">
                {/* ID Card (top) */}
                <div className="flex justify-center">
                  <StudentIDCard
                    student={student}
                    timeIn={activeSession?.timeInAt || activeSession?.timeIn || (history && history[0] ? history[0].timeIn : null)}
                    timeOut={(history && history[0] ? history[0].timeOut : null)}
                  />
                </div>

                <p className="text-cream/70 text-center max-w-lg">
                  Place your card or scan at the kiosk. The kiosk detects most desktop scanners automatically.
                </p>
              </div>
            </motion.div>

            {/* RESTRICTION ALERT */}
            {restricted && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-4 p-4 bg-red-700/20 border border-red-600 rounded-xl"
              >
                <div className="flex items-center gap-3 text-red-100">
                  <AlertTriangle />
                  <div>
                    <div className="font-semibold">Entry Restricted</div>
                    <div className="text-sm">
                      Please contact the library for assistance.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Student info moved to ID card; hide duplicate info here */}

            {/* PurposeSelector is rendered inside the ID card when needed */}

            {/* Results moved into the recorder area above */}
          </section>

          {/* RIGHT PANEL */}
            <aside className="lg:col-span-4 bg-gradient-to-b from-[#064e3b] via-[#0f7a4a] to-[#052e22] backdrop-blur-xl rounded-3xl p-3 shadow-lg flex flex-col gap-4 text-white">
            {/* Recorder container */}
            <RecorderPanel
              needsPurpose={needsPurpose}
              confirmPurpose={confirmPurpose}
              cancelPurpose={() => setNeedsPurpose(false)}
              handleScan={handleScan}
              focusEnabled={!needsPurpose}
              timeInResult={timeInResult}
              timeOutResult={timeOutResult}
            />

            {activeSession && <ActiveSessionBanner session={activeSession} />}
            {/* If a student is selected show their history, otherwise show recent visits across all students */}
            {student ? (
              <VisitHistory visits={history} student={student} title="Recent Visits" />
            ) : (
              <div>
                <VisitHistory visits={recent.filter(r => !r.timeOut)} title="Recent Time‑Ins" />
                <div className="my-3" />
                <VisitHistory visits={recent.filter(r => r.timeOut)} title="Recent Time‑Outs" dateField="timeOut" />

                <div className="flex items-center justify-between mt-3">
                  <button
                    disabled={recentPage <= 1}
                    onClick={() => fetchRecent(Math.max(1, recentPage - 1), 10)}
                    className={`px-3 py-1 rounded-md bg-white/5 text-cream ${recentPage <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'}`}>
                    ← Prev
                  </button>

                  <div className="text-sm text-cream/80">Page {recentPage} / {recentTotalPages}</div>

                  <button
                    disabled={recentPage >= recentTotalPages}
                    onClick={() => fetchRecent(Math.min(recentTotalPages, recentPage + 1), 10)}
                    className={`px-3 py-1 rounded-md bg-white/5 text-cream ${recentPage >= recentTotalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/10'}`}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}
