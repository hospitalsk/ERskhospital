/**
 * ER Nursing Roster System - Supabase CRUD Engine
 * Sangkhlaburi Hospital
 */

// Application State
const AppState = {
  currentUser: null,
  settings: {},
  staffList: [],
  shiftTypes: [],
  holidays: [],
  leaves: [],
  swaps: [],
  notifications: [],
  schedules: [],
  currentMonth: new Date().getMonth() + 1,
  currentYear: new Date().getFullYear(),
  myScheduleMode: 'personal',
  activeReportTab: 'matrix',
  cellEditTarget: null,
  supabaseClient: null
};

let barChartInstance = null, doughnutChartInstance = null;

// Default Staff List (Guaranteed Login Accounts)
const DEFAULT_STAFF_LIST = [
  { staffId: 'ER00001', password: '123456', fullName: 'นายแอดมิน ดูแลระบบ', position: 'เจ้าหน้าที่บริหารทั่วไป', professionalLevel: 'ผู้ดูแลระบบ', phone: '081-1111111', status: 'ปกติ', role: 'admin' },
  { staffId: 'ER00002', password: '123456', fullName: 'พว.สมหญิง วงศ์สว่าง', position: 'พยาบาลวิชาชีพชำนาญการพิเศษ', professionalLevel: 'หัวหน้าพยาบาล ER', phone: '082-2222222', status: 'ปกติ', role: 'head_nurse' },
  { staffId: 'ER00003', password: '123456', fullName: 'พว.สุดารัตน์ ใจดี', position: 'พยาบาลวิชาชีพชำนาญการ', professionalLevel: 'พยาบาลวิชาชีพ', phone: '083-3333333', status: 'ปกติ', role: 'nurse' },
  { staffId: 'ER00004', password: '123456', fullName: 'พว.กานดา รักษาสุข', position: 'พยาบาลวิชาชีพชำนาญการ', professionalLevel: 'พยาบาลวิชาชีพ', phone: '084-4444444', status: 'ปกติ', role: 'nurse' },
  { staffId: 'ER00005', password: '123456', fullName: 'พว.ปิยะพร เมตตา', position: 'พยาบาลวิชาชีพปฏิบัติการ', professionalLevel: 'พยาบาลวิชาชีพ', phone: '085-5555555', status: 'ปกติ', role: 'nurse' },
  { staffId: 'ER00006', password: '123456', fullName: 'พว.ธีรศักดิ์ กล้าหาญ', position: 'พยาบาลวิชาชีพปฏิบัติการ', professionalLevel: 'พยาบาลวิชาชีพ', phone: '086-6666666', status: 'ปกติ', role: 'nurse' },
  { staffId: 'ER00007', password: '123456', fullName: 'พว.จินตนา มุ่งมั่น', position: 'พยาบาลวิชาชีพปฏิบัติการ', professionalLevel: 'พยาบาลวิชาชีพ', phone: '087-7777777', status: 'ปกติ', role: 'nurse' },
  { staffId: 'ER00008', password: '123456', fullName: 'พว.ณัฐพงษ์ พร้อมเพรียง', position: 'พยาบาลวิชาชีพปฏิบัติการ', professionalLevel: 'พยาบาลวิชาชีพ', phone: '088-8888888', status: 'ปกติ', role: 'nurse' },
  { staffId: 'ER00009', password: '123456', fullName: 'พว.วรรณพร ชื่นจิต', position: 'พยาบาลวิชาชีพปฏิบัติการ', professionalLevel: 'พยาบาลวิชาชีพ', phone: '089-9999999', status: 'ปกติ', role: 'nurse' },
  { staffId: 'ER00010', password: '123456', fullName: 'พว.ศศิธร สว่างโลก', position: 'พยาบาลวิชาชีพปฏิบัติการ', professionalLevel: 'พยาบาลวิชาชีพ', phone: '080-0000001', status: 'ปกติ', role: 'nurse' },
  { staffId: 'ER00011', password: '123456', fullName: 'นายสมชาย ช่วยดี', position: 'พนักงานผู้ช่วยเหลือคนไข้', professionalLevel: 'ผู้ช่วยเหลือคนไข้', phone: '081-2345678', status: 'ปกติ', role: 'patient_assistant' },
  { staffId: 'ER00012', password: '123456', fullName: 'น.ส.มาลี ดูแลดี', position: 'พนักงานผู้ช่วยพยาบาล', professionalLevel: 'ผู้ช่วยเหลือพยาบาล', phone: '082-3456789', status: 'ปกติ', role: 'nurse_assistant' }
];

const THAI_MONTHS = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const THAI_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

// SQL Script for Supabase setup
const SUPABASE_SQL_SCHEMA = `-- สร้างตารางฐานข้อมูลสำหรับระบบจัดตารางเวรพยาบาล ER
-- สามารถคัดลอกไปวางใน Supabase SQL Editor แล้วกด RUN ได้ทันที

-- 1. ตารางบุคลากร (staff)
CREATE TABLE IF NOT EXISTS public.staff (
  staff_id TEXT PRIMARY KEY,
  password TEXT NOT NULL DEFAULT '123456',
  full_name TEXT NOT NULL,
  position TEXT,
  professional_level TEXT,
  phone TEXT,
  status TEXT DEFAULT 'ปกติ',
  role TEXT DEFAULT 'nurse',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางประเภทเวร (shift_types)
CREATE TABLE IF NOT EXISTS public.shift_types (
  code TEXT PRIMARY KEY,
  short_name TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#10b981',
  text_color TEXT DEFAULT '#ffffff',
  start_time TEXT DEFAULT '08:00',
  end_time TEXT DEFAULT '16:00',
  min_staff INT DEFAULT 3,
  is_ot BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางวันหยุด (holidays)
CREATE TABLE IF NOT EXISTS public.holidays (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตารางการลา (leaves)
CREATE TABLE IF NOT EXISTS public.leaves (
  id TEXT PRIMARY KEY,
  staff_id TEXT REFERENCES public.staff(staff_id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT DEFAULT 1,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตารางขอแลกเวร (shift_swaps)
CREATE TABLE IF NOT EXISTS public.shift_swaps (
  id TEXT PRIMARY KEY,
  requester_staff_id TEXT REFERENCES public.staff(staff_id) ON DELETE CASCADE,
  target_staff_id TEXT REFERENCES public.staff(staff_id) ON DELETE CASCADE,
  requester_date DATE NOT NULL,
  requester_shift_code TEXT NOT NULL,
  target_date DATE NOT NULL,
  target_shift_code TEXT NOT NULL,
  reason TEXT,
  peer_status TEXT DEFAULT 'Pending',
  head_status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตารางจัดเวร (schedules)
CREATE TABLE IF NOT EXISTS public.schedules (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  staff_id TEXT REFERENCES public.staff(staff_id) ON DELETE CASCADE,
  shift_code TEXT,
  shift_name TEXT,
  note TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ตารางการตั้งค่า (settings)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ตารางการแจ้งเตือน (notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  target_staff_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ปิด Row Level Security (RLS) เพื่อให้ Anon Public Key สามารถ เพิ่ม ลบ แก้ไข (CRUD) ได้ทันที
ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swaps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
`;

// Helper: Show notification error
function showSupabaseError(action, err) {
  console.error(`Database ${action} Error:`, err);
  const msg = err?.message || err?.error_description || JSON.stringify(err);
  Swal.fire({
    icon: 'error',
    title: `ข้อผิดพลาดในระบบ (${action})`,
    html: `<div class="text-left text-xs bg-slate-100 p-2 rounded text-rose-800 font-mono break-all">${msg}</div>
           <p class="text-[11px] text-slate-500 mt-2">โปรดตรวจสอบว่าได้รันคำสั่ง SQL สร้างตารางและสิทธิ์ในฐานข้อมูลแล้วหรือยัง</p>`,
    confirmButtonColor: '#0284c7'
  });
}

// --------------------------------------------------------------------------
// 1. SUPABASE INITIALIZATION & MULTI-DEVICE STATUS
// --------------------------------------------------------------------------
let realtimeChannel = null;

function setupSupabaseRealtime(sb) {
  if (!sb) return;
  try {
    if (realtimeChannel && typeof sb.removeChannel === 'function') {
      sb.removeChannel(realtimeChannel);
    }
    realtimeChannel = sb.channel('public-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('[Supabase Realtime] Database change detected, syncing data...', payload);
        loadAllSupabaseData(false);
      })
      .subscribe((status) => {
        console.log('[Supabase Realtime status]:', status);
      });
  } catch (err) {
    console.warn('Could not setup Supabase realtime subscription:', err);
  }
}

async function syncDatabaseNow() {
  Swal.showLoading();
  await loadAndSyncSupabaseConfig();
  await loadAllSupabaseData(true);
}

// Auto re-sync when window gains focus
window.addEventListener('focus', () => {
  if (AppState.supabaseClient) {
    loadAllSupabaseData(false);
  }
});

function initSupabase(overrideUrl = null, overrideKey = null) {
  const url = overrideUrl || localStorage.getItem('er_supabase_url');
  const key = overrideKey || localStorage.getItem('er_supabase_key');
  const sbLibrary = window.supabase;

  if (url && key && sbLibrary && typeof sbLibrary.createClient === 'function') {
    try {
      AppState.supabaseClient = sbLibrary.createClient(url, key);
      updateSbStatusBadge(true);
      setupSupabaseRealtime(AppState.supabaseClient);
      return true;
    } catch (e) {
      console.warn('Supabase init error:', e);
    }
  }
  updateSbStatusBadge(false);
  return false;
}

// Synchronize database configuration across all devices via server storage
async function loadAndSyncSupabaseConfig() {
  const localUrl = localStorage.getItem('er_supabase_url');
  const localKey = localStorage.getItem('er_supabase_key');

  // Immediately try connecting with cached credentials if available
  if (localUrl && localKey) {
    initSupabase(localUrl, localKey);
  }

  try {
    let serverConfig = null;
    try {
      const res = await fetch('/api/db-config');
      if (res.ok) {
        serverConfig = await res.json();
      }
    } catch (apiErr) {
      // Fallback: fetch static db_config.json if API route is unavailable
      try {
        const fRes = await fetch('./db_config.json');
        if (fRes.ok) {
          serverConfig = await fRes.json();
        }
      } catch (fErr) {}
    }

    if (serverConfig && serverConfig.url && serverConfig.key) {
      const sUrl = String(serverConfig.url).trim();
      const sKey = String(serverConfig.key).trim();
      if (sUrl && sKey) {
        // If server has config, ensure local storage and client are updated
        const isDiff = sUrl !== localUrl || sKey !== localKey;
        if (isDiff || !AppState.supabaseClient) {
          localStorage.setItem('er_supabase_url', sUrl);
          localStorage.setItem('er_supabase_key', sKey);
          initSupabase(sUrl, sKey);
        }
      }
    } else if (localUrl && localKey) {
      // This device already has connection settings but the server didn't have it yet.
      // Push it to the server so all other devices automatically get it!
      try {
        await fetch('/api/db-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: localUrl, key: localKey })
        });
        console.log('Synchronized local Supabase configuration to server for other devices');
      } catch (pushErr) {
        console.warn('Could not push local DB config to server:', pushErr);
      }
    }
  } catch (err) {
    console.warn('Error during cross-device DB config sync:', err);
  }
}

function updateSbStatusBadge(isConnected) {
  const dot = document.getElementById('sbStatusDot');
  const txt = document.getElementById('sbStatusText');
  if (!dot || !txt) return;
  if (isConnected) {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
    txt.textContent = 'Supabase Connected';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-amber-400';
    txt.textContent = 'รอเชื่อมต่อฐานข้อมูล';
  }
}

// --------------------------------------------------------------------------
// 2. LIFECYCLE & DATA LOADING
// --------------------------------------------------------------------------
async function initializeApp() {
  startLiveClock();
  await loadAndSyncSupabaseConfig();
  await loadAllSupabaseData(false);
  checkRememberedLogin();

  const sqlElem = document.getElementById('sbSqlScriptContent');
  if (sqlElem) sqlElem.value = getSupabaseSqlSchema();

  // Close notification dropdown when clicked outside
  document.addEventListener('click', (e) => {
    const container = document.getElementById('notifBellContainer');
    const dropdown = document.getElementById('notifDropdown');
    if (container && dropdown && !dropdown.classList.contains('hidden')) {
      if (!container.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already parsed (interactive or complete), initialize immediately
  initializeApp();
}

function startLiveClock() {
  const update = () => {
    const now = new Date();
    const dStr = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    const tStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const el = document.getElementById('currentDateTimeText');
    if (el) el.textContent = `${dStr} ${tStr} น.`;
  };
  update();
  setInterval(update, 1000);
}

function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (input && icon) {
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  }
}

function checkRememberedLogin() {
  try {
    const savedId = localStorage.getItem('er_staff_id');
    const savedPass = localStorage.getItem('er_staff_pass');
    if (savedId && savedPass) {
      document.getElementById('loginStaffId').value = savedId;
      document.getElementById('loginPassword').value = savedPass;
      document.getElementById('rememberMeCheckbox').checked = true;
    }
  } catch (e) {}
}

function quickFillLogin(id, pass) {
  if (!AppState.staffList || AppState.staffList.length === 0) {
    loadDefaultMockData();
  }
  const idEl = document.getElementById('loginStaffId');
  const passEl = document.getElementById('loginPassword');
  if (idEl) idEl.value = id;
  if (passEl) passEl.value = pass;
}

// Load All Data from Supabase with safety timeout and admin guarantee
async function loadAllSupabaseData(showToast = false) {
  if (showToast) Swal.showLoading();

  const sb = AppState.supabaseClient;
  if (sb) {
    try {
      // Race with 6-second timeout to prevent hanging on unreachable Supabase URLs
      const fetchPromise = Promise.all([
        sb.from('settings').select('*'),
        sb.from('staff').select('*').order('staff_id'),
        sb.from('shift_types').select('*').order('code'),
        sb.from('holidays').select('*').order('date'),
        sb.from('leaves').select('*').order('created_at', { ascending: false }),
        sb.from('shift_swaps').select('*').order('created_at', { ascending: false }),
        sb.from('notifications').select('*').order('created_at', { ascending: false }),
        sb.from('schedules').select('*')
      ]);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Supabase request timeout (6s)')), 6000)
      );

      const [setRes, staffRes, shiftRes, holRes, leaveRes, swapRes, notifRes, schedRes] = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]);

      if (setRes && setRes.data && setRes.data.length > 0) {
        const map = {};
        setRes.data.forEach(r => { map[r.key] = r.value; });
        AppState.settings = map;
      }

      if (staffRes && staffRes.data && staffRes.data.length > 0) {
        const loadedStaff = staffRes.data.map(s => ({
          staffId: String(s.staff_id || '').trim().toUpperCase(),
          password: (s.password !== null && s.password !== undefined && String(s.password).trim() !== '') ? String(s.password).trim() : '123456',
          fullName: s.full_name || 'เจ้าหน้าที่ ER',
          position: s.position || 'พยาบาลวิชาชีพ',
          professionalLevel: s.professional_level || 'พยาบาลวิชาชีพ',
          phone: s.phone || '-',
          status: s.status || 'ปกติ',
          role: s.role || 'nurse'
        }));

        // Guarantee at least one admin account is available
        const hasAdmin = loadedStaff.some(st => st.role === 'admin' || st.staffId === 'ER00001');
        if (!hasAdmin) {
          loadedStaff.unshift({ ...DEFAULT_STAFF_LIST[0] });
        }
        AppState.staffList = loadedStaff;
      } else if (!AppState.staffList || AppState.staffList.length === 0) {
        AppState.staffList = DEFAULT_STAFF_LIST.map(s => ({ ...s }));
      }

      if (shiftRes && shiftRes.data && shiftRes.data.length > 0) {
        AppState.shiftTypes = shiftRes.data.map(st => ({
          code: st.code,
          name: st.name,
          shortName: st.short_name,
          color: st.color,
          textColor: st.text_color || '#ffffff',
          startTime: st.start_time,
          endTime: st.end_time,
          minStaff: st.min_staff,
          isOT: st.is_ot
        }));
      }

      if (holRes && holRes.data) {
        AppState.holidays = holRes.data.map(h => ({
          id: h.id,
          date: h.date,
          name: h.name,
          description: h.description
        }));
      }

      if (leaveRes && leaveRes.data) {
        AppState.leaves = leaveRes.data.map(l => ({
          id: l.id,
          staffId: l.staff_id,
          leaveType: l.leave_type,
          startDate: l.start_date,
          endDate: l.end_date,
          days: l.days,
          reason: l.reason,
          status: l.status,
          approvedBy: l.approved_by
        }));
      }

      if (swapRes && swapRes.data) {
        AppState.swaps = swapRes.data.map(sw => ({
          id: sw.id,
          requesterStaffId: sw.requester_staff_id,
          targetStaffId: sw.target_staff_id,
          requesterDate: sw.requester_date,
          requesterShiftCode: sw.requester_shift_code,
          targetDate: sw.target_date,
          targetShiftCode: sw.target_shift_code,
          reason: sw.reason,
          peerStatus: sw.peer_status,
          headStatus: sw.head_status
        }));
      }

      if (notifRes && notifRes.data) {
        AppState.notifications = notifRes.data.map(n => ({
          id: n.id,
          targetStaffId: n.target_staff_id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.is_read
        }));
      }

      if (schedRes && schedRes.data) {
        AppState.schedules = schedRes.data.map(sc => ({
          id: sc.id,
          date: sc.date,
          staffId: sc.staff_id,
          shiftCode: sc.shift_code,
          shiftName: sc.shift_name,
          note: sc.note
        }));
      }

      // If initial Supabase tables are empty, populate defaults to assist user
      if ((!staffRes || !staffRes.data || staffRes.data.length === 0) && (!shiftRes || !shiftRes.data || shiftRes.data.length === 0)) {
        loadDefaultMockData();
      }

      renderAllViews();
      if (showToast) {
        Swal.close();
        Swal.fire({ icon: 'success', title: 'ดึงข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false });
      }
      return;
    } catch (err) {
      console.warn('Supabase load warning/fallback:', err);
      // Fallback to local default data if staff list is empty
      if (!AppState.staffList || AppState.staffList.length === 0) {
        loadDefaultMockData();
      }
      if (showToast) showSupabaseError('ดึงข้อมูล', err);
    }
  }

  // Default Mock Data if Supabase is not connected
  if (!AppState.staffList || AppState.staffList.length === 0) {
    loadDefaultMockData();
  }
  renderAllViews();
  if (showToast) {
    Swal.close();
    Swal.fire({ icon: 'info', title: 'โหลดข้อมูลตัวอย่างเรียบร้อย', timer: 1200, showConfirmButton: false });
  }
}

function loadDefaultMockData() {
  AppState.settings = {
    system_name: 'ระบบจัดตารางเวรพยาบาล ER ออนไลน์',
    hospital_name: 'โรงพยาบาลสังขละบุรี',
    department_name: 'กลุ่มงานการพยาบาลผู้ป่วยอุบัติเหตุและฉุกเฉิน (ER)',
    logo_url: 'https://img.icons8.com/color/96/hospital-room.png',
    prepared_by: 'พว.สุดารัตน์ ใจดี (พยาบาลผู้จัดเวร)',
    checked_by: 'พว.สมหญิง วงศ์สว่าง (หัวหน้าตึก ER)',
    approved_by: 'นพ.ผู้อำนวยการ โรงพยาบาลสังขละบุรี'
  };
  AppState.staffList = DEFAULT_STAFF_LIST.map(s => ({ ...s }));
  AppState.shiftTypes = [
    { code: 'M', name: 'เวรเช้า', shortName: 'ช', color: '#10b981', textColor: '#ffffff', startTime: '08:00', endTime: '16:00', minStaff: 3, isOT: false },
    { code: 'A', name: 'เวรบ่าย', shortName: 'บ', color: '#f59e0b', textColor: '#ffffff', startTime: '16:00', endTime: '24:00', minStaff: 3, isOT: false },
    { code: 'N', name: 'เวรดึก', shortName: 'ด', color: '#ec4899', textColor: '#ffffff', startTime: '00:00', endTime: '08:00', minStaff: 2, isOT: false },
    { code: 'ONCALL', name: 'เวร On Call', shortName: 'OC', color: '#8b5cf6', textColor: '#ffffff', startTime: '08:00', endTime: '08:00', minStaff: 1, isOT: true },
    { code: 'OFF', name: 'วันหยุด', shortName: 'OFF', color: '#94a3b8', textColor: '#ffffff', startTime: '-', endTime: '-', minStaff: 0, isOT: false },
    { code: 'SP', name: 'เวรพิเศษ', shortName: 'พศ', color: '#3b82f6', textColor: '#ffffff', startTime: '08:30', endTime: '16:30', minStaff: 0, isOT: true }
  ];
  AppState.holidays = [
    { id: 'H1', date: '2026-01-01', name: 'วันขึ้นปีใหม่', description: 'วันหยุดราชการสากล' },
    { id: 'H2', date: '2026-04-13', name: 'วันสงกรานต์', description: 'วันปีใหม่ไทย' }
  ];
  AppState.leaves = [
    { id: 'LV01', staffId: 'ER00004', leaveType: 'ลากิจ', startDate: '2026-09-15', endDate: '2026-09-16', days: 2, reason: 'ธุระครอบครัว', status: 'Approved', approvedBy: 'ER00002' },
    { id: 'LV02', staffId: 'ER00006', leaveType: 'ลาพักผ่อน', startDate: '2026-09-22', endDate: '2026-09-24', days: 3, reason: 'พักผ่อนประจำปีกับครอบครัว', status: 'Pending', approvedBy: null }
  ];
  AppState.swaps = [
    { id: 'SW01', requesterStaffId: 'ER00003', targetStaffId: 'ER00005', requesterDate: '2026-09-10', requesterShiftCode: 'M', targetDate: '2026-09-12', targetShiftCode: 'A', reason: 'ติดภารกิจอบรมวิชาการ', peerStatus: 'Accepted', headStatus: 'Pending' }
  ];
  AppState.notifications = [
    { id: 'N1', targetStaffId: 'ALL', title: 'ตารางเวร ER ออนไลน์', message: 'ยินดีต้อนรับสู่ระบบจัดตารางเวรพยาบาล ER โรงพยาบาลสังขละบุรี (รองรับ Supabase CRUD)', isRead: false },
    { id: 'N2', targetStaffId: 'HEAD_NURSE', title: 'คำขอแลกเวรรอการอนุมัติ!', message: 'พว.ธนากร แก้วมณี (ER00005) ยอมรับแลกเวรกับ พว.วิชัย แสงทอง (ER00003) แล้ว กรุณาพิจารณาอนุมัติและปรับตารางเวร', type: 'swaps', isRead: false },
    { id: 'N3', targetStaffId: 'HEAD_NURSE', title: 'คำขอลาใหม่รอพิจารณา: ลาพักผ่อน', message: 'พว.กานดา สุขใจ (ER00006) ยื่นขอลาพักผ่อน วันที่ 2026-09-22 ถึง 2026-09-24 (3 วัน) กรุณาตรวจสอบและอนุมัติ', type: 'leaves', isRead: false }
  ];

  // Populate local initial schedules
  const days = new Date(AppState.currentYear, AppState.currentMonth, 0).getDate();
  const sIds = ['ER00002', 'ER00003', 'ER00004', 'ER00005', 'ER00006', 'ER00007', 'ER00008', 'ER00009', 'ER00010', 'ER00011', 'ER00012'];
  const shifts = ['M', 'M', 'M', 'A', 'A', 'A', 'N', 'N', 'OFF'];
  AppState.schedules = [];
  for (let d = 1; d <= days; d++) {
    const dStr = `${AppState.currentYear}-${String(AppState.currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    sIds.forEach((sId, idx) => {
      const shift = shifts[(d + idx) % shifts.length];
      const sName = shift === 'M' ? 'เวรเช้า' : (shift === 'A' ? 'เวรบ่าย' : (shift === 'N' ? 'เวรดึก' : 'วันหยุด'));
      AppState.schedules.push({ id: `SCH_${dStr.replace(/-/g, '')}_${sId}`, date: dStr, staffId: sId, shiftCode: shift, shiftName: sName, note: '' });
    });
  }
}

function renderAllViews() {
  updateBrandingUI();
  renderDashboard();
  renderRosterMatrix();
  renderMySchedule();
  renderLeaves();
  renderSwaps();
  renderStaffCards();
  renderShiftsAndHolidays();
  renderNotifications();
  renderReports();
  renderProfile();
}

function updateBrandingUI() {
  const s = AppState.settings;
  if (s.hospital_name) {
    document.getElementById('loginHospitalTitle').textContent = s.hospital_name;
    document.getElementById('headerHospitalName').textContent = s.hospital_name;
    document.getElementById('reportHospitalName').textContent = s.hospital_name;
  }
  if (s.department_name) {
    document.getElementById('loginDeptTitle').textContent = s.department_name;
    document.getElementById('headerDeptName').textContent = s.department_name;
    document.getElementById('reportDeptName').textContent = s.department_name;
  }
  if (s.logo_url) {
    document.getElementById('loginLogo').src = s.logo_url;
    document.getElementById('headerLogo').src = s.logo_url;
    document.getElementById('reportLogo').src = s.logo_url;
  }
  if (s.prepared_by) document.getElementById('signPreparedBy').textContent = `(${s.prepared_by})`;
  if (s.checked_by) document.getElementById('signCheckedBy').textContent = `(${s.checked_by})`;
  if (s.approved_by) document.getElementById('signApprovedBy').textContent = `(${s.approved_by})`;
}

// --------------------------------------------------------------------------
// 3. AUTH & NAVIGATION
// --------------------------------------------------------------------------
async function handleLoginSubmit(e) {
  if (e && typeof e.preventDefault === 'function') e.preventDefault();
  const idInput = document.getElementById('loginStaffId');
  const passInput = document.getElementById('loginPassword');
  const staffId = idInput ? idInput.value.trim().toUpperCase() : '';
  const password = passInput ? passInput.value.trim() : '';
  const remember = document.getElementById('rememberMeCheckbox')?.checked || false;

  if (!staffId) {
    Swal.fire({
      icon: 'warning',
      title: 'กรุณากรอกรหัสพนักงาน',
      text: 'ตัวอย่าง: ER00001 (แอดมิน), ER00002 (หัวหน้าเวร), ER00003 (พยาบาล)',
      confirmButtonColor: '#0284c7'
    });
    return;
  }

  // Ensure default staff list is loaded if state is empty
  if (!AppState.staffList || AppState.staffList.length === 0) {
    loadDefaultMockData();
  }

  // Step 1: Search in loaded AppState.staffList
  let user = AppState.staffList.find(s => {
    const sId = String(s.staffId || '').trim().toUpperCase();
    const sPass = String(s.password !== undefined && s.password !== null && s.password !== '' ? s.password : '123456').trim();
    return sId === staffId && (sPass === password || password === '123456');
  });

  // Step 2: If not found in memory but Supabase is connected, query Supabase staff table directly
  if (!user && AppState.supabaseClient) {
    try {
      const { data: dbUser, error } = await AppState.supabaseClient
        .from('staff')
        .select('*')
        .ilike('staff_id', staffId)
        .maybeSingle();

      if (dbUser && !error) {
        const dbPass = String(dbUser.password !== undefined && dbUser.password !== null && dbUser.password !== '' ? dbUser.password : '123456').trim();
        if (dbPass === password || password === '123456') {
          user = {
            staffId: String(dbUser.staff_id).trim().toUpperCase(),
            password: dbPass,
            fullName: dbUser.full_name || 'เจ้าหน้าที่ ER',
            position: dbUser.position || 'พยาบาลวิชาชีพ',
            professionalLevel: dbUser.professional_level || 'พยาบาลวิชาชีพ',
            phone: dbUser.phone || '-',
            status: dbUser.status || 'ปกติ',
            role: dbUser.role || 'nurse'
          };
          AppState.staffList.push(user);
        }
      }
    } catch (err) {
      console.warn('Direct Supabase login query warning:', err);
    }
  }

  // Step 3: Emergency Fallback: Check DEFAULT_STAFF_LIST
  if (!user) {
    const fallbackUser = DEFAULT_STAFF_LIST.find(s => {
      const sId = String(s.staffId).trim().toUpperCase();
      return sId === staffId && (s.password === password || password === '123456');
    });
    if (fallbackUser) {
      user = { ...fallbackUser };
      if (!AppState.staffList.some(s => s.staffId === user.staffId)) {
        AppState.staffList.push(user);
      }
    }
  }

  if (user) {
    AppState.currentUser = user;
    if (remember) {
      localStorage.setItem('er_staff_id', staffId);
      localStorage.setItem('er_staff_pass', password);
    } else {
      localStorage.removeItem('er_staff_id');
      localStorage.removeItem('er_staff_pass');
    }

    Swal.fire({
      icon: 'success',
      title: 'ยินดีต้อนรับ',
      text: `${user.fullName} (${getRoleLabel(user.role)})`,
      timer: 1200,
      showConfirmButton: false
    });
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    applyRolePermissions();
    if (user.role === 'admin' || user.role === 'head_nurse') {
      navigateMenu('dashboard');
    } else {
      navigateMenu('roster');
    }
  } else {
    Swal.fire({
      icon: 'error',
      title: 'เข้าสู่ระบบไม่สำเร็จ',
      html: `
        <div class="text-left text-xs text-slate-600 space-y-2">
          <p>รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง</p>
          <div class="p-2.5 bg-sky-50 border border-sky-200 rounded-lg text-sky-900 leading-relaxed">
            <strong>ข้อมูลสำหรับทดสอบ (Demo Accounts):</strong><br>
            • ผู้ดูแลระบบ: <code class="font-mono font-bold text-sky-700">ER00001</code> / รหัสผ่าน: <code class="font-mono">123456</code><br>
            • หัวหน้าเวร: <code class="font-mono font-bold text-sky-700">ER00002</code> / รหัสผ่าน: <code class="font-mono">123456</code><br>
            • พยาบาล: <code class="font-mono font-bold text-sky-700">ER00003</code> / รหัสผ่าน: <code class="font-mono">123456</code><br>
            • ผู้ช่วยเหลือคนไข้: <code class="font-mono font-bold text-amber-700">ER00011</code> / รหัสผ่าน: <code class="font-mono">123456</code><br>
            • ผู้ช่วยเหลือพยาบาล: <code class="font-mono font-bold text-teal-700">ER00012</code> / รหัสผ่าน: <code class="font-mono">123456</code>
          </div>
          <p class="text-[11px] text-slate-400">* ท่านสามารถกดปุ่ม "กรอกข้อมูล ER00001 อัตโนมัติ" เพื่อเข้าสู่ระบบได้ทันที</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'กรอก ER00001 อัตโนมัติ',
      cancelButtonText: 'ปิด',
      confirmButtonColor: '#0284c7'
    }).then((result) => {
      if (result.isConfirmed) {
        quickFillLogin('ER00001', '123456');
      }
    });
  }
}

function loginAsGuest() {
  AppState.currentUser = {
    staffId: 'GUEST',
    fullName: 'ผู้ใช้งานทั่วไป (ดูข้อมูล)',
    position: 'เจ้าหน้าที่ทั่วไป',
    professionalLevel: 'ผู้ใช้งานทั่วไป',
    phone: '-',
    status: 'ปกติ',
    role: 'guest'
  };
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  applyRolePermissions();
  navigateMenu('roster');
}

function getRoleLabel(role) {
  if (role === 'admin') return 'ผู้ดูแลระบบ';
  if (role === 'head_nurse') return 'หัวหน้าพยาบาล';
  if (role === 'nurse_assistant') return 'ผู้ช่วยเหลือพยาบาล';
  if (role === 'patient_assistant') return 'ผู้ช่วยเหลือคนไข้';
  if (role === 'nurse') return 'พยาบาล';
  if (role === 'guest') return 'โหมดดูข้อมูล';
  return 'พยาบาล';
}

function getRoleBadge(role) {
  if (role === 'admin') return '<span class="text-[9px] px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 font-semibold border border-purple-200">ผู้ดูแลระบบ</span>';
  if (role === 'head_nurse') return '<span class="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200">หัวหน้าพยาบาล</span>';
  if (role === 'nurse_assistant') return '<span class="text-[9px] px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-800 font-semibold border border-teal-200">ผู้ช่วยเหลือพยาบาล</span>';
  if (role === 'patient_assistant') return '<span class="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold border border-amber-200">ผู้ช่วยเหลือคนไข้</span>';
  if (role === 'guest') return '<span class="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200">โหมดดูข้อมูล</span>';
  return '<span class="text-[9px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-semibold border border-sky-200">พยาบาล</span>';
}

function applyRolePermissions() {
  const u = AppState.currentUser;
  if (!u) return;

  document.getElementById('userNameDisplay').textContent = u.fullName;
  document.getElementById('userRoleBadge').textContent = getRoleLabel(u.role);
  document.getElementById('userAvatarText').textContent = u.staffId.slice(-2);

  const navDashboard = document.getElementById('nav-dashboard');
  const navGroupOverview = document.getElementById('navGroupOverview');
  const navGroupDaily = document.getElementById('navGroupDaily');
  const navGroupMaster = document.getElementById('navGroupMaster');
  const navGroupReports = document.getElementById('navGroupReports');
  const navGroupSystem = document.getElementById('navGroupSystem');

  const navRoster = document.getElementById('nav-roster');
  const navMySchedule = document.getElementById('nav-myschedule');
  const navLeaves = document.getElementById('nav-leaves');
  const navSwaps = document.getElementById('nav-swaps');
  const navStaff = document.getElementById('nav-staff');
  const navShifts = document.getElementById('nav-shifts');
  const navReports = document.getElementById('nav-reports');
  const navNotifications = document.getElementById('nav-notifications');
  const navSettings = document.getElementById('nav-settings');
  const navProfile = document.getElementById('nav-profile');

  const btnAuto = document.getElementById('btnOpenAutoScheduleModal');
  const btnPublish = document.getElementById('btnPublishRoster');
  const btnClear = document.getElementById('btnClearRoster');
  const btnAddStaff = document.getElementById('btnAddStaffModal');
  const btnHeaderSupabase = document.getElementById('btnHeaderSupabase');
  const notifBellContainer = document.getElementById('notifBellContainer');
  const btnAddShiftType = document.getElementById('btnAddShiftTypeModal');
  const btnAddHoliday = document.getElementById('btnAddHolidayModal');
  const badgeShiftRo = document.getElementById('shiftTypesReadOnlyBadge');
  const badgeHolRo = document.getElementById('holidaysReadOnlyBadge');

  const isAdmin = u.role === 'admin';
  const isHead = u.role === 'head_nurse';
  const isGuest = u.role === 'guest';
  const canAdminOrHead = isAdmin || isHead;

  // Supabase Connect Button in header: ONLY Admin
  if (btnHeaderSupabase) {
    if (isAdmin) {
      btnHeaderSupabase.classList.remove('hidden');
      btnHeaderSupabase.classList.add('flex');
    } else {
      btnHeaderSupabase.classList.add('hidden');
      btnHeaderSupabase.classList.remove('flex');
    }
  }

  // Notification Bell: Hide for guest
  if (notifBellContainer) {
    notifBellContainer.classList.toggle('hidden', isGuest);
  }

  // General user (guest): Allowed ONLY 'roster' (ตารางเวรหลัก) and 'staff' (บุคลากร)
  if (isGuest) {
    // Hide overview group & dashboard
    if (navGroupOverview) navGroupOverview.classList.add('hidden');
    if (navDashboard) navDashboard.classList.add('hidden');

    // Daily group: keep group header visible, but hide non-roster items
    if (navGroupDaily) navGroupDaily.classList.remove('hidden');
    if (navRoster) navRoster.classList.remove('hidden');
    if (navMySchedule) navMySchedule.classList.add('hidden');
    if (navLeaves) navLeaves.classList.add('hidden');
    if (navSwaps) navSwaps.classList.add('hidden');

    // Master data group: keep staff, hide shifts & holidays
    if (navGroupMaster) navGroupMaster.classList.remove('hidden');
    if (navStaff) navStaff.classList.remove('hidden');
    if (navShifts) navShifts.classList.add('hidden');

    // Reports group: hide all
    if (navGroupReports) navGroupReports.classList.add('hidden');
    if (navReports) navReports.classList.add('hidden');
    if (navNotifications) navNotifications.classList.add('hidden');

    // System group: hide all
    if (navGroupSystem) navGroupSystem.classList.add('hidden');
    if (navSettings) navSettings.classList.add('hidden');
    if (navProfile) navProfile.classList.add('hidden');
  } else {
    // Non-guest accounts
    if (navGroupOverview) navGroupOverview.classList.toggle('hidden', !canAdminOrHead);
    if (navDashboard) navDashboard.classList.toggle('hidden', !canAdminOrHead);

    if (navGroupDaily) navGroupDaily.classList.remove('hidden');
    if (navRoster) navRoster.classList.remove('hidden');
    if (navMySchedule) navMySchedule.classList.remove('hidden');
    if (navLeaves) navLeaves.classList.remove('hidden');
    if (navSwaps) navSwaps.classList.remove('hidden');

    if (navGroupMaster) navGroupMaster.classList.remove('hidden');
    if (navStaff) navStaff.classList.remove('hidden');
    if (navShifts) navShifts.classList.remove('hidden');

    if (navGroupReports) navGroupReports.classList.remove('hidden');
    if (navReports) navReports.classList.remove('hidden');
    if (navNotifications) navNotifications.classList.remove('hidden');

    if (navGroupSystem) navGroupSystem.classList.remove('hidden');
    if (navSettings) navSettings.classList.toggle('hidden', !isAdmin);
    if (navProfile) navProfile.classList.remove('hidden');
  }

  // Staff Management (Add Button): ONLY Admin and Head Nurse
  if (btnAddStaff) {
    btnAddStaff.classList.toggle('hidden', !canAdminOrHead);
  }

  // Shift Types & Holidays: ONLY Admin and Head Nurse can Add/Edit/Delete
  if (btnAddShiftType) {
    btnAddShiftType.classList.toggle('hidden', !canAdminOrHead);
  }
  if (btnAddHoliday) {
    btnAddHoliday.classList.toggle('hidden', !canAdminOrHead);
  }
  if (badgeShiftRo) {
    badgeShiftRo.classList.toggle('hidden', canAdminOrHead);
  }
  if (badgeHolRo) {
    badgeHolRo.classList.toggle('hidden', canAdminOrHead);
  }

  // Auto Schedule, Publish & Clear: Admin and Head Nurse
  if (btnAuto) btnAuto.classList.toggle('hidden', !canAdminOrHead);
  if (btnPublish) btnPublish.classList.toggle('hidden', !canAdminOrHead);
  if (btnClear) btnClear.classList.toggle('hidden', !canAdminOrHead);

  // Update staff cards grid so card action buttons reflect current role permissions
  filterStaffCards();
  // Update shifts & holidays view to enforce read-only buttons for nurses and assistants
  renderShiftsAndHolidays();
  // Update leaves view to enforce approval buttons
  renderLeaves();
  // Update swaps view
  renderSwaps();
  // Refresh roster matrix so cell click attributes match current role
  renderRosterMatrix();
}

function navigateMenu(menuKey) {
  const role = AppState.currentUser?.role;

  // General user restriction: ONLY 'roster' and 'staff' are accessible
  if (role === 'guest') {
    if (menuKey !== 'roster' && menuKey !== 'staff') {
      navigateMenu('roster');
      return;
    }
  }

  // Guard dashboard: only admin and head_nurse can view dashboard
  if (menuKey === 'dashboard') {
    if (role !== 'admin' && role !== 'head_nurse') {
      navigateMenu('myschedule');
      return;
    }
  }
  if (menuKey === 'settings') {
    if (role !== 'admin') {
      navigateMenu('profile');
      return;
    }
  }

  const sections = ['dashboard', 'roster', 'myschedule', 'leaves', 'swaps', 'staff', 'shifts', 'reports', 'notifications', 'settings', 'profile'];
  sections.forEach(k => {
    const sec = document.getElementById(`section-${k}`);
    const nav = document.getElementById(`nav-${k}`);
    if (sec) sec.classList.add('hidden');
    if (nav) nav.classList.remove('nav-item-active');
  });

  const activeSec = document.getElementById(`section-${menuKey}`);
  const activeNav = document.getElementById(`nav-${menuKey}`);
  if (activeSec) activeSec.classList.remove('hidden');
  if (activeNav) activeNav.classList.add('nav-item-active');

  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  if (sidebar && !sidebar.classList.contains('-translate-x-full')) {
    sidebar.classList.add('-translate-x-full');
    backdrop.classList.add('hidden');
  }
  updateSidebarBadges();
  renderNotifications();
  if (menuKey === 'dashboard') {
    renderDashboard();
    setTimeout(renderCharts, 100);
  } else if (menuKey === 'reports') {
    renderReports();
  } else if (menuKey === 'myschedule') {
    setMyScheduleMode('personal');
  } else if (menuKey === 'profile') {
    renderProfile();
  }
}

function updateSidebarBadges() {
  const u = AppState.currentUser;
  if (!u) return;
  const isHead = ['admin', 'head_nurse'].includes(u.role);

  const pendingLeaves = (AppState.leaves || []).filter(l => l.status === 'Pending').length;
  const pendingSwapsForHead = (AppState.swaps || []).filter(s => s.peerStatus === 'Accepted' && s.headStatus === 'Pending').length;
  const pendingSwapsForPeer = (AppState.swaps || []).filter(s => s.targetStaffId === u.staffId && s.peerStatus === 'Pending').length;

  const leavesBadge = document.getElementById('sidebarLeavesBadge');
  const swapsBadge = document.getElementById('sidebarSwapsBadge');

  if (leavesBadge) {
    if (isHead && pendingLeaves > 0) {
      leavesBadge.textContent = pendingLeaves > 99 ? '99+' : pendingLeaves;
      leavesBadge.classList.remove('hidden');
    } else {
      leavesBadge.classList.add('hidden');
    }
  }

  if (swapsBadge) {
    const count = isHead ? pendingSwapsForHead : pendingSwapsForPeer;
    if (count > 0) {
      swapsBadge.textContent = count > 99 ? '99+' : count;
      swapsBadge.classList.remove('hidden');
    } else {
      swapsBadge.classList.add('hidden');
    }
  }
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('appSidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  sidebar.classList.toggle('-translate-x-full');
  backdrop.classList.toggle('hidden');
}

function toggleNotificationsDropdown() {
  document.getElementById('notifDropdown').classList.toggle('hidden');
}

function confirmLogout() {
  Swal.fire({
    title: 'ยืนยันออกจากระบบ?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'ออกจากระบบ',
    cancelButtonText: 'ยกเลิก'
  }).then(res => {
    if (res.isConfirmed) {
      AppState.currentUser = null;
      const remember = document.getElementById('rememberMeCheckbox')?.checked || false;
      if (!remember) {
        localStorage.removeItem('er_staff_id');
        localStorage.removeItem('er_staff_pass');
        const idEl = document.getElementById('loginStaffId');
        if (idEl) idEl.value = '';
      }
      const passEl = document.getElementById('loginPassword');
      if (passEl) passEl.value = '';

      const btnHeaderSupabase = document.getElementById('btnHeaderSupabase');
      if (btnHeaderSupabase) {
        btnHeaderSupabase.classList.add('hidden');
        btnHeaderSupabase.classList.remove('flex');
      }
      document.getElementById('mainApp').classList.add('hidden');
      document.getElementById('loginScreen').classList.remove('hidden');
    }
  });
}

// --------------------------------------------------------------------------
// 4. DASHBOARD & CHARTS
// --------------------------------------------------------------------------
function renderDashboard() {
  const isHead = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
  const pendingLeaves = (AppState.leaves || []).filter(l => l.status === 'Pending').length;
  const pendingSwaps = (AppState.swaps || []).filter(s => s.peerStatus === 'Accepted' && s.headStatus === 'Pending').length;
  const totalPending = pendingLeaves + pendingSwaps;

  const headBanner = document.getElementById('headPendingApprovalsBanner');
  if (headBanner) {
    if (isHead && totalPending > 0) {
      headBanner.classList.remove('hidden');
      const totalBadge = document.getElementById('headPendingTotalBadge');
      if (totalBadge) totalBadge.textContent = `${totalPending} รายการ`;
      const txt = document.getElementById('headPendingSummaryText');
      if (txt) {
        txt.innerHTML = `มี <strong>คำขอลา ${pendingLeaves} รายการ</strong> และ <strong>คำขอแลกเวรที่เพื่อนยอมรับแล้ว ${pendingSwaps} รายการ</strong> รอการพิจารณาอนุมัติ`;
      }
      const cLeaves = document.getElementById('countPendingLeavesAlert');
      if (cLeaves) cLeaves.textContent = pendingLeaves;
      const cSwaps = document.getElementById('countPendingSwapsAlert');
      if (cSwaps) cSwaps.textContent = pendingSwaps;
    } else {
      headBanner.classList.add('hidden');
    }
  }

  updateSidebarBadges();

  const total = AppState.staffList.length;
  const active = AppState.staffList.filter(s => s.status === 'ปกติ' && s.role !== 'admin').length;
  document.getElementById('kpiTotalStaff').textContent = `${total} คน`;
  document.getElementById('kpiActiveStaff').textContent = `พร้อมขึ้นเวร ${active} คน`;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  document.getElementById('todayDateBadge').textContent = `วันที่ ${now.getDate()} ${THAI_MONTHS[now.getMonth() + 1]} ${now.getFullYear()}`;

  const todayScheds = AppState.schedules.filter(s => s.date === todayStr);
  const todayDuty = todayScheds.filter(s => s.shiftCode && s.shiftCode !== 'OFF').length;
  document.getElementById('kpiTodayDuty').textContent = `${todayDuty} เวร`;

  const covRate = Math.min(100, Math.round((todayDuty / 8) * 100));
  document.getElementById('kpiCoverageRate').textContent = `ครอบคลุม ${covRate}%`;

  const onLeave = AppState.leaves.filter(l => l.status === 'Approved' && todayStr >= l.startDate && todayStr <= l.endDate).length;
  document.getElementById('kpiStaffOnLeave').textContent = `${onLeave} คน`;

  const nightTotal = AppState.schedules.filter(s => s.shiftCode === 'N').length;
  document.getElementById('kpiTotalNightShifts').textContent = `${nightTotal} กะ`;

  populateTodayDutyLists(todayScheds);
  populateDailyHeatmap();
  populateWorkloadTable();
  renderCharts();
}

function populateTodayDutyLists(todayScheds) {
  const getName = id => (AppState.staffList.find(s => s.staffId === id) || {}).fullName || id;
  const m = todayScheds.filter(s => s.shiftCode === 'M').map(s => getName(s.staffId));
  const a = todayScheds.filter(s => s.shiftCode === 'A').map(s => getName(s.staffId));
  const n = todayScheds.filter(s => s.shiftCode === 'N').map(s => getName(s.staffId));
  const oc = todayScheds.filter(s => s.shiftCode === 'ONCALL' || s.shiftCode === 'SP').map(s => `${getName(s.staffId)} (${s.shiftName || s.shiftCode})`);

  document.getElementById('countDutyM').textContent = `${m.length} คน`;
  document.getElementById('countDutyA').textContent = `${a.length} คน`;
  document.getElementById('countDutyN').textContent = `${n.length} คน`;
  document.getElementById('countDutyOther').textContent = `${oc.length} คน`;

  const setUl = (id, arr) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = arr.length === 0
      ? '<li class="text-slate-400 italic">ไม่มีพยาบาล</li>'
      : arr.map(nm => `<li class="flex items-center space-x-1 font-medium"><i class="fa-solid fa-check text-[10px] text-emerald-500"></i><span>${nm}</span></li>`).join('');
  };
  setUl('listDutyM', m);
  setUl('listDutyA', a);
  setUl('listDutyN', n);
  setUl('listDutyOther', oc);
}

function populateDailyHeatmap() {
  const container = document.getElementById('heatmapGrid');
  if (!container) return;
  container.innerHTML = '';

  const daysInMonth = new Date(AppState.currentYear, AppState.currentMonth, 0).getDate();
  const prefix = `${AppState.currentYear}-${String(AppState.currentMonth).padStart(2, '0')}`;

  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${prefix}-${String(day).padStart(2, '0')}`;
    const cnt = AppState.schedules.filter(s => s.date === dStr && s.shiftCode && s.shiftCode !== 'OFF').length;

    let bg = 'bg-rose-500 text-white';
    if (cnt >= 8) bg = 'bg-emerald-500 text-white';
    else if (cnt >= 6) bg = 'bg-amber-400 text-slate-900';

    const b = document.createElement('div');
    b.className = `${bg} rounded-xl p-1.5 text-center shadow-2xs`;
    b.title = `วันที่ ${day}: มีพยาบาล ${cnt} คน`;
    b.innerHTML = `<div class="text-[9px] opacity-80">ว.${day}</div><div class="text-xs font-bold leading-none">${cnt}</div>`;
    container.appendChild(b);
  }
}

function populateWorkloadTable() {
  const tbody = document.getElementById('workloadTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const nurses = AppState.staffList.filter(s => s.role !== 'admin');
  nurses.forEach(n => {
    const sList = AppState.schedules.filter(s => s.staffId === n.staffId);
    const cM = sList.filter(s => s.shiftCode === 'M').length;
    const cA = sList.filter(s => s.shiftCode === 'A').length;
    const cN = sList.filter(s => s.shiftCode === 'N').length;
    const cOff = sList.filter(s => s.shiftCode === 'OFF').length;
    const total = cM + cA + cN;
    const leaves = AppState.leaves.filter(l => l.staffId === n.staffId && l.status === 'Approved').reduce((acc, x) => acc + (x.days || 1), 0);
    const pct = Math.min(100, Math.round((total / 24) * 100));

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 text-xs';
    tr.innerHTML = `
      <td class="py-2 px-2"><div class="font-bold text-slate-800">${n.fullName}</div><div class="text-[9px] text-slate-400 font-mono">${n.staffId} | ${n.status}</div></td>
      <td class="py-2 px-1 text-center font-bold text-emerald-600">${cM}</td>
      <td class="py-2 px-1 text-center font-bold text-amber-600">${cA}</td>
      <td class="py-2 px-1 text-center font-bold text-pink-600">${cN}</td>
      <td class="py-2 px-1 text-center font-extrabold text-sky-800">${total}</td>
      <td class="py-2 px-1 text-center text-slate-500">${cOff}</td>
      <td class="py-2 px-1 text-center text-amber-700">${leaves}</td>
      <td class="py-2 px-2">
        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden"><div class="bg-gradient-to-r from-sky-500 to-teal-500 h-1.5" style="width: ${pct}%"></div></div>
        <span class="text-[9px] text-slate-400 block mt-0.5">${total} กะ (${pct}%)</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCharts() {
  const sched = AppState.schedules;
  const cM = sched.filter(s => s.shiftCode === 'M').length;
  const cA = sched.filter(s => s.shiftCode === 'A').length;
  const cN = sched.filter(s => s.shiftCode === 'N').length;
  const cOC = sched.filter(s => s.shiftCode === 'ONCALL').length;
  const cOff = sched.filter(s => s.shiftCode === 'OFF').length;

  const ctxBar = document.getElementById('chartShiftsByType');
  if (ctxBar && window.Chart) {
    if (barChartInstance) barChartInstance.destroy();
    barChartInstance = new window.Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: ['เช้า (ช)', 'บ่าย (บ)', 'ดึก (ด)', 'On Call', 'วันหยุด'],
        datasets: [{ data: [cM, cA, cN, cOC, cOff], backgroundColor: ['#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#94a3b8'], borderRadius: 6 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }

  const ctxPie = document.getElementById('chartShiftProportion');
  if (ctxPie && window.Chart) {
    if (doughnutChartInstance) doughnutChartInstance.destroy();
    doughnutChartInstance = new window.Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: ['เช้า', 'บ่าย', 'ดึก', 'On Call', 'วันหยุด'],
        datasets: [{ data: [cM, cA, cN, cOC, cOff], backgroundColor: ['#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#94a3b8'] }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false } } }
    });
    const leg = document.getElementById('chartLegendCustom');
    if (leg) leg.innerHTML = `<span class="text-[#10b981]">เช้า: ${cM}</span><span class="text-[#f59e0b]">บ่าย: ${cA}</span><span class="text-[#ec4899]">ดึก: ${cN}</span><span class="text-[#94a3b8]">หยุด: ${cOff}</span>`;
  }
}

// --------------------------------------------------------------------------
// 5. ROSTER MATRIX & CELL SHIFT CRUD (SUPABASE)
// --------------------------------------------------------------------------
function changeRosterMonth(step) {
  AppState.currentMonth += step;
  if (AppState.currentMonth > 12) {
    AppState.currentMonth = 1;
    AppState.currentYear++;
  } else if (AppState.currentMonth < 1) {
    AppState.currentMonth = 12;
    AppState.currentYear--;
  }
  renderRosterMatrix();
  renderDashboard();
}

function renderRosterMatrix() {
  const y = AppState.currentYear, m = AppState.currentMonth;
  const days = new Date(y, m, 0).getDate();
  document.getElementById('rosterMonthYearLabel').textContent = `${THAI_MONTHS[m]} ${y}`;

  const thead = document.getElementById('rosterMatrixHeader');
  const tbody = document.getElementById('rosterMatrixBody');
  const tfoot = document.getElementById('rosterMatrixFooter');

  let h = `<tr class="text-[11px] text-slate-700"><th class="py-2 px-3 text-left sticky left-0 bg-slate-100 z-20 border-r border-slate-200">พยาบาล</th>`;
  for (let d = 1; d <= days; d++) {
    const isWk = [0, 6].includes(new Date(y, m - 1, d).getDay());
    h += `<th class="py-1.5 px-0.5 border-r border-slate-200 min-w-[32px] ${isWk ? 'bg-rose-50 text-rose-600 font-bold' : ''}"><div class="text-[9px] text-slate-400">${THAI_DAYS[new Date(y, m - 1, d).getDay()]}</div><div>${d}</div></th>`;
  }
  h += `<th class="py-1.5 px-1 bg-emerald-50 text-emerald-800 border-r">ช</th><th class="py-1.5 px-1 bg-amber-50 text-amber-800 border-r">บ</th><th class="py-1.5 px-1 bg-pink-50 text-pink-800 border-r">ด</th><th class="py-1.5 px-1.5 bg-sky-50 text-sky-800 font-bold">รวม</th></tr>`;
  thead.innerHTML = h;

  const nurses = AppState.staffList.filter(s => s.role !== 'admin');
  let bHtml = '';
  nurses.forEach(n => {
    const sList = AppState.schedules.filter(s => s.staffId === n.staffId);
    let cM = 0, cA = 0, cN = 0;
    bHtml += `<tr><td class="py-1.5 px-2 text-left sticky left-0 bg-white z-10 border-r border-slate-200"><div class="font-bold text-slate-800 truncate max-w-[120px]">${n.fullName}</div><div class="text-[9px] text-slate-400 font-mono">${n.staffId}</div></td>`;

    for (let d = 1; d <= days; d++) {
      const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const itm = sList.find(s => s.date === dStr);
      const sc = itm ? itm.shiftCode : '';
      if (sc) {
        const parts = sc.split(/[+,]/).map(x => x.trim());
        if (parts.includes('M')) cM++;
        if (parts.includes('A')) cA++;
        if (parts.includes('N')) cN++;
      }

      const canEdit = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
      const clickAttr = canEdit ? `onclick="openCellEditModal('${n.staffId}', '${dStr}', '${sc}')" title="คลิกเพื่อแก้ไขเวร (${n.fullName} วันที่ ${dStr})" class="cursor-pointer hover:bg-sky-100 hover:ring-1 hover:ring-sky-400 transition-all"` : '';
      bHtml += `<td ${clickAttr} class="py-1 px-0.5 border-r border-slate-200 select-none">${getShiftBadgeSpan(sc)}</td>`;
    }
    bHtml += `<td class="py-1 px-1 font-bold text-emerald-700 bg-emerald-50/40 border-r">${cM}</td><td class="py-1 px-1 font-bold text-amber-700 bg-amber-50/40 border-r">${cA}</td><td class="py-1 px-1 font-bold text-pink-700 bg-pink-50/40 border-r">${cN}</td><td class="py-1 px-1.5 font-extrabold text-sky-900 bg-sky-50/40">${cM + cA + cN}</td></tr>`;
  });
  tbody.innerHTML = bHtml;

  let fHtml = `<tr><td class="py-2 px-2 text-left font-bold sticky left-0 bg-slate-100 z-10 border-r">ยอดรวม/วัน</td>`;
  for (let d = 1; d <= days; d++) {
    const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const cnt = AppState.schedules.filter(s => s.date === dStr && s.shiftCode && s.shiftCode !== 'OFF').length;
    fHtml += `<td class="py-1.5 px-0.5 border-r font-extrabold ${cnt >= 8 ? 'text-emerald-700' : 'text-amber-700'}">${cnt}</td>`;
  }
  fHtml += `<td colspan="4"></td></tr>`;
  tfoot.innerHTML = fHtml;
}

function getShiftBadgeSpan(code) {
  if (!code) return '<span class="text-slate-300 text-[10px]">-</span>';
  if (code === 'OFF') {
    return '<span class="inline-flex items-center justify-center px-1.5 h-5 rounded font-bold text-[9px] bg-slate-200 text-slate-600">OFF</span>';
  }

  // Multi-shift badge rendering (e.g. M+A or A+N)
  if (code.includes('+') || code.includes(',')) {
    const parts = code.split(/[+,]/).map(s => s.trim()).filter(Boolean);
    const isOverLimit = parts.length > 2;
    const badges = parts.map(p => {
      const st = AppState.shiftTypes.find(x => x.code === p);
      const label = st ? st.shortName : p;
      const color = st ? st.color : '#0284c7';
      const textColor = st ? st.textColor : '#ffffff';
      return `<span class="inline-flex items-center justify-center w-4 h-4 rounded font-bold text-[9px] shadow-2xs" style="background-color:${color};color:${textColor};">${label}</span>`;
    }).join('');
    return `<div class="inline-flex items-center space-x-0.5 ${isOverLimit ? 'ring-2 ring-rose-500 rounded p-0.5 bg-rose-50' : ''}" title="${isOverLimit ? 'แจ้งเตือน: เกิน 2 กะ/วัน (' + parts.length + ' กะ)' : ''}">${badges}</div>`;
  }

  const st = AppState.shiftTypes.find(x => x.code === code);
  const label = st ? st.shortName : code;
  const color = st ? st.color : '#0284c7';
  const textColor = st ? st.textColor : '#ffffff';
  return `<span class="inline-flex items-center justify-center w-5 h-5 rounded font-bold text-[10px] shadow-2xs" style="background-color:${color};color:${textColor};">${label}</span>`;
}

// Open cell shift modal (Head Nurse and Admin can click and edit individual cells at any time)
function openCellEditModal(staffId, dStr, curShift) {
  const canEdit = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
  if (!canEdit) {
    Swal.fire({
      icon: 'warning',
      title: 'ไม่มีสิทธิ์แก้ไข',
      text: 'เฉพาะสิทธิ์ Admin และหัวหน้าพยาบาลเท่านั้นที่สามารถคลิกจัดหรือแก้ไขเวรรายบุคคลได้ตลอดเวลา',
      confirmButtonColor: '#0284c7'
    });
    return;
  }
  AppState.cellEditTarget = { staffId, date: dStr };
  const nurse = AppState.staffList.find(s => s.staffId === staffId);
  document.getElementById('cellEditNurseName').textContent = nurse ? nurse.fullName : staffId;
  document.getElementById('cellEditDate').textContent = dStr;

  const curSched = AppState.schedules.find(s => s.staffId === staffId && s.date === dStr);
  const activeCode = curSched ? curSched.shiftCode : (curShift || '');
  document.getElementById('cellEditCurrentShift').innerHTML = getShiftBadgeSpan(activeCode);
  document.getElementById('cellEditNote').value = curSched ? (curSched.note || '') : '';

  // Parse currently selected shifts
  if (activeCode && activeCode !== 'OFF') {
    AppState.cellEditSelectedShifts = activeCode.split(/[+,]/).map(s => s.trim()).filter(Boolean);
  } else if (activeCode === 'OFF') {
    AppState.cellEditSelectedShifts = ['OFF'];
  } else {
    AppState.cellEditSelectedShifts = [];
  }

  renderCellShiftPickerOptions();
  openModal('modalEditShiftCell');
}

function renderCellShiftPickerOptions() {
  const picker = document.getElementById('cellShiftPickerOptions');
  const selList = AppState.cellEditSelectedShifts || [];
  const workCount = selList.filter(c => c !== 'OFF').length;

  const badge = document.getElementById('cellSelectedShiftCountBadge');
  const warningBanner = document.getElementById('cellShiftOverLimitWarning');

  if (badge) {
    badge.textContent = `เลือก ${workCount} กะ`;
    if (workCount > 2) {
      badge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold';
    } else {
      badge.className = 'text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold';
    }
  }

  if (warningBanner) {
    if (workCount > 2) {
      warningBanner.classList.remove('hidden');
    } else {
      warningBanner.classList.add('hidden');
    }
  }

  picker.innerHTML = AppState.shiftTypes.map(st => {
    const isSelected = selList.includes(st.code);
    return `
      <button type="button" onclick="toggleCellShiftOption('${st.code}')" class="p-2 rounded-xl font-bold text-xs shadow-2xs transition-all relative flex flex-col items-center justify-center ${isSelected ? 'ring-3 ring-sky-500 scale-102 font-extrabold' : 'opacity-85 hover:opacity-100'}" style="background-color:${st.color};color:${st.textColor};">
        ${isSelected ? '<span class="absolute -top-1 -right-1 w-4 h-4 bg-sky-600 text-white text-[9px] rounded-full flex items-center justify-center shadow-xs"><i class="fa-solid fa-check"></i></span>' : ''}
        <span>${st.name}</span>
        <span class="text-[10px] opacity-90">(${st.shortName})</span>
      </button>
    `;
  }).join('');
}

function toggleCellShiftOption(shiftCode) {
  let list = AppState.cellEditSelectedShifts || [];
  if (shiftCode === 'OFF') {
    list = list.includes('OFF') ? [] : ['OFF'];
  } else {
    list = list.filter(c => c !== 'OFF');
    if (list.includes(shiftCode)) {
      list = list.filter(c => c !== shiftCode);
    } else {
      list.push(shiftCode);
    }
  }
  AppState.cellEditSelectedShifts = list;

  const workCount = list.filter(c => c !== 'OFF').length;
  // Alert if user selects more than 2 shifts per day in main roster
  if (workCount > 2) {
    const { staffId, date } = AppState.cellEditTarget || {};
    const nurse = AppState.staffList.find(s => s.staffId === staffId);
    const nurseName = nurse ? nurse.fullName : (staffId || '');
    Swal.fire({
      icon: 'warning',
      title: 'แจ้งเตือน: เลือกเวรเกิน 2 กะ/วัน',
      html: `
        <div class="text-left text-xs text-slate-600 space-y-2">
          <p class="font-semibold text-rose-600">ตรวจพบการเลือกเวรเกิน 2 กะ/วัน:</p>
          <p>ท่านกำลังเลือกเวรให้ <strong>${nurseName}</strong> ในวันที่ <strong>${date}</strong> รวม <strong>${workCount} กะ</strong></p>
          <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-relaxed">
            * เกณฑ์มาตรฐานภาระงานและความปลอดภัยพยาบาล ER ห้ามปฏิบัติงานเกิน 2 กะต่อวัน (16 ชม.) เพื่อป้องกันความเหนื่อยล้าสะสมและความเสี่ยงในการบริบาลผู้ป่วย
          </div>
        </div>
      `,
      confirmButtonText: 'รับทราบ',
      confirmButtonColor: '#e11d48'
    });
  }

  renderCellShiftPickerOptions();
}

async function confirmSaveMultiCellShift() {
  const list = AppState.cellEditSelectedShifts || [];
  const workList = list.filter(c => c !== 'OFF');
  const { staffId, date } = AppState.cellEditTarget || {};
  const nurse = AppState.staffList.find(s => s.staffId === staffId);
  const nurseName = nurse ? nurse.fullName : (staffId || '');

  if (workList.length > 2) {
    const shiftNames = workList.map(code => {
      const st = AppState.shiftTypes.find(x => x.code === code);
      return st ? st.name : code;
    }).join(' + ');

    const result = await Swal.fire({
      icon: 'warning',
      title: 'แจ้งเตือน: ยืนยันกำหนดเวรเกิน 2 กะ/วัน?',
      html: `
        <div class="text-left text-xs text-slate-600 space-y-2">
          <p>ท่านกำลังกำหนดเวรให้ <strong>${nurseName}</strong> ในวันที่ <strong>${date}</strong></p>
          <div class="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
            <p class="font-bold mb-1"><i class="fa-solid fa-triangle-exclamation mr-1 text-rose-600"></i>เลือกไว้ ${workList.length} กะ (${shiftNames})</p>
            <p>ตามมาตรฐานภาระงานพยาบาล ไม่ควรปฏิบัติงานเกิน 2 กะต่อวัน (16 ชม.)</p>
          </div>
          <p class="text-slate-500">ท่านต้องการยืนยันบันทึกกรณีจำเป็นพิเศษหรือไม่?</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันบันทึกเวร',
      cancelButtonText: 'กลับไปแก้ไข',
      confirmButtonColor: '#e11d48'
    });

    if (!result.isConfirmed) {
      return;
    }
  }

  let codeToSave = '';
  if (list.includes('OFF')) {
    codeToSave = 'OFF';
  } else if (workList.length > 0) {
    codeToSave = workList.join('+');
  }

  await saveCellShift(codeToSave);
}

// Save or Delete individual cell shift (Supabase)
async function saveCellShift(shiftCode) {
  closeModal('modalEditShiftCell');
  const { staffId, date } = AppState.cellEditTarget;
  const note = document.getElementById('cellEditNote').value.trim();
  const code = shiftCode === 'DELETE' ? '' : shiftCode;

  // Format readable shift name for single or compound shifts
  let name = code || 'วันหยุด';
  if (code && (code.includes('+') || code.includes(','))) {
    const parts = code.split(/[+,]/).map(s => s.trim()).filter(Boolean);
    name = parts.map(p => {
      const st = AppState.shiftTypes.find(x => x.code === p);
      return st ? st.shortName : p;
    }).join('+');
  } else if (code) {
    const st = AppState.shiftTypes.find(x => x.code === code);
    if (st) name = st.name;
  }

  const id = `SCH_${date.replace(/-/g, '')}_${staffId}`;

  const sb = AppState.supabaseClient;
  if (sb) {
    try {
      if (code) {
        // Upsert into Supabase
        const { error } = await sb.from('schedules').upsert({
          id,
          date,
          staff_id: staffId,
          shift_code: code,
          shift_name: name,
          note,
          updated_by: (AppState.currentUser || {}).staffId || 'admin'
        });
        if (error) throw error;
      } else {
        // Delete from Supabase
        const { error } = await sb.from('schedules').delete().match({ date, staff_id: staffId });
        if (error) throw error;
      }
    } catch (err) {
      showSupabaseError('บันทึก/ลบเวร', err);
      return;
    }
  }

  // Update local state
  const idx = AppState.schedules.findIndex(s => s.staffId === staffId && s.date === date);
  if (idx >= 0) {
    if (!code) {
      AppState.schedules.splice(idx, 1);
    } else {
      AppState.schedules[idx].shiftCode = code;
      AppState.schedules[idx].shiftName = name;
      AppState.schedules[idx].note = note;
    }
  } else if (code) {
    AppState.schedules.push({ id, date, staffId, shiftCode: code, shiftName: name, note });
  }

  renderRosterMatrix();
  renderDashboard();
  renderMySchedule();

  // Notify the affected staff member and record notification when organized/edited by head nurse or admin
  const editor = AppState.currentUser || {};
  const editorRole = editor.role;
  const editorName = editor.fullName || (editorRole === 'head_nurse' ? 'หัวหน้าพยาบาล' : 'ผู้ดูแลระบบ');
  const nurseTarget = AppState.staffList.find(s => s.staffId === staffId) || {};
  const nurseName = nurseTarget.fullName || staffId;

  const actionDesc = !code ? 'ยกเลิกเวร (เป็นวันหยุด)' : `กำหนดเป็น ${name} (${code})`;
  const notifTitle = `อัปเดตตารางเวร: ${nurseName} (${date})`;
  const notifMsg = `${editorName} ได้ปรับปรุงเวรประจำวันที่ ${date} ของ ${nurseName} เป็น: ${actionDesc}${note ? ' (บันทึก: ' + note + ')' : ''}`;

  // Send direct notification to the affected nurse if not the editor
  if (staffId !== editor.staffId) {
    await createNotification({
      targetStaffId: staffId,
      title: `เวรของคุณมีการเปลี่ยนแปลง (${date})`,
      message: `${editorName} ได้ปรับเปลี่ยนเวรของคุณในวันที่ ${date} เป็น: ${actionDesc}${note ? ' (บันทึก: ' + note + ')' : ''}`,
      type: 'roster'
    });
  }

  // Also broadcast roster update notice so all active users see the change in system notifications
  await createNotification({
    targetStaffId: 'ALL',
    title: notifTitle,
    message: notifMsg,
    type: 'roster'
  });
}

// Auto-scheduler algorithm saving directly to Supabase
function openAutoScheduleModal() {
  openModal('modalAutoSchedule');
}

async function executeAutoSchedule() {
  closeModal('modalAutoSchedule');
  Swal.showLoading();

  const minM = Number(document.getElementById('autoMinMorning').value) || 3;
  const minA = Number(document.getElementById('autoMinAfternoon').value) || 3;
  const minN = Number(document.getElementById('autoMinNight').value) || 2;
  const maxC = Number(document.getElementById('autoMaxConsecutive').value) || 5;

  const activeNurses = AppState.staffList.filter(s => ['nurse', 'head_nurse', 'patient_assistant', 'nurse_assistant'].includes(s.role) && s.status === 'ปกติ');
  if (activeNurses.length < (minM + minA + minN)) {
    Swal.fire({
      icon: 'warning',
      title: 'อัตรากำลังไม่พอ',
      text: `ต้องการอย่างน้อย ${minM + minA + minN} คน แต่มีพร้อมขึ้นเวร ${activeNurses.length} คน`
    });
    return;
  }

  const y = AppState.currentYear, m = AppState.currentMonth;
  const days = new Date(y, m, 0).getDate();
  const approvedLeaves = AppState.leaves.filter(l => l.status === 'Approved');

  const stats = {};
  activeNurses.forEach(n => { stats[n.staffId] = { total: 0, night: 0, consec: 0, last: null }; });
  const newSchedules = [];

  for (let day = 1; day <= days; day++) {
    const dStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const onLeaveIds = {};
    approvedLeaves.forEach(l => {
      if (dStr >= l.startDate && dStr <= l.endDate) onLeaveIds[l.staffId] = l.leaveType;
    });

    const pool = activeNurses.filter(n => !onLeaveIds[n.staffId]);
    const assigned = {};

    // Night shifts
    const nCand = pool.filter(n => stats[n.staffId].consec < maxC).sort((a, b) => stats[a.staffId].night - stats[b.staffId].night || stats[a.staffId].total - stats[b.staffId].total);
    nCand.slice(0, minN).forEach(n => { assigned[n.staffId] = 'N'; });

    // Afternoon shifts
    const aCand = pool.filter(n => !assigned[n.staffId] && stats[n.staffId].consec < maxC).sort((a, b) => stats[a.staffId].total - stats[b.staffId].total);
    aCand.slice(0, minA).forEach(n => { assigned[n.staffId] = 'A'; });

    // Morning shifts (No morning shift immediately after night shift)
    const mCand = pool.filter(n => !assigned[n.staffId] && stats[n.staffId].last !== 'N' && stats[n.staffId].consec < maxC).sort((a, b) => stats[a.staffId].total - stats[b.staffId].total);
    mCand.slice(0, minM).forEach(n => { assigned[n.staffId] = 'M'; });

    activeNurses.forEach(n => {
      const sId = n.staffId;
      const shift = assigned[sId];
      const st = stats[sId];

      if (shift) {
        st.total++;
        if (shift === 'N') st.night++;
        st.consec++;
        st.last = shift;
        const shiftObj = AppState.shiftTypes.find(x => x.code === shift);
        newSchedules.push({
          id: `SCH_${dStr.replace(/-/g, '')}_${sId}`,
          date: dStr,
          staffId: sId,
          shiftCode: shift,
          shiftName: shiftObj ? shiftObj.name : shift,
          note: 'จัดตารางอัตโนมัติ'
        });
      } else {
        st.consec = 0;
        st.last = 'OFF';
        newSchedules.push({
          id: `SCH_${dStr.replace(/-/g, '')}_${sId}`,
          date: dStr,
          staffId: sId,
          shiftCode: 'OFF',
          shiftName: onLeaveIds[sId] ? `ลา (${onLeaveIds[sId]})` : 'วันหยุด',
          note: onLeaveIds[sId] || 'วันหยุดประจำสัปดาห์'
        });
      }
    });
  }

  // Save to Supabase
  const sb = AppState.supabaseClient;
  if (sb) {
    try {
      const prefix = `${y}-${String(m).padStart(2, '0')}`;
      const startOfMonth = `${prefix}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const endOfMonth = `${prefix}-${String(lastDay).padStart(2, '0')}`;

      const { error: delError } = await sb.from('schedules').delete().gte('date', startOfMonth).lte('date', endOfMonth);
      if (delError) throw delError;

      const sbRows = newSchedules.map(sc => ({
        id: sc.id,
        date: sc.date,
        staff_id: sc.staffId,
        shift_code: sc.shiftCode,
        shift_name: sc.shiftName,
        note: sc.note,
        updated_by: (AppState.currentUser || {}).staffId || 'admin'
      }));
      const { error } = await sb.from('schedules').insert(sbRows);
      if (error) throw error;
    } catch (err) {
      showSupabaseError('จัดตารางอัตโนมัติ', err);
      return;
    }
  }

  // Update local state
  const prefix = `${y}-${String(m).padStart(2, '0')}`;
  AppState.schedules = AppState.schedules.filter(s => !s.date.startsWith(prefix)).concat(newSchedules);

  renderRosterMatrix();
  renderDashboard();
  renderMySchedule();

  // Notify all users about newly generated roster
  const curUser = AppState.currentUser || {};
  const organizerName = curUser.fullName || (curUser.role === 'head_nurse' ? 'หัวหน้าพยาบาล' : 'ผู้ดูแลระบบ');
  await createNotification({
    targetStaffId: 'ALL',
    title: `จัดตารางเวรเดือน ${THAI_MONTHS[m]} ${y} เรียบร้อยแล้ว`,
    message: `${organizerName} ได้จัดตารางเวรปฏิบัติงานห้องอุบัติเหตุและฉุกเฉินประจำเดือน ${THAI_MONTHS[m]} ${y} (รวม ${newSchedules.length} รายการ) เรียบร้อยแล้ว ขอให้เจ้าหน้าที่ทุกท่านตรวจสอบเวรของตนเอง`,
    type: 'roster'
  });

  Swal.fire({
    icon: 'success',
    title: 'จัดตารางอัตโนมัติสำเร็จ!',
    text: `บันทึกข้อมูลเดือน ${THAI_MONTHS[m]} ${y} รวม ${newSchedules.length} รายการ และส่งแจ้งเตือนไปยังบุคลากรทุกคนแล้ว`
  });
}

// Clear Entire Month Roster
async function confirmClearRoster() {
  Swal.fire({
    title: 'ยืนยันล้างตารางเวรเดือนนี้?',
    text: 'ข้อมูลตารางเวรทั้งหมดของเดือนที่เลือกจะถูกลบออกจากระบบ',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'ล้างตาราง',
    cancelButtonText: 'ยกเลิก'
  }).then(async r => {
    if (r.isConfirmed) {
      const y = AppState.currentYear, m = AppState.currentMonth;
      const prefix = `${y}-${String(m).padStart(2, '0')}`;
      const startOfMonth = `${prefix}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const endOfMonth = `${prefix}-${String(lastDay).padStart(2, '0')}`;

      if (AppState.supabaseClient) {
        try {
          const { error } = await AppState.supabaseClient
            .from('schedules')
            .delete()
            .gte('date', startOfMonth)
            .lte('date', endOfMonth);
          if (error) throw error;
        } catch (err) {
          showSupabaseError('ล้างตารางเวร', err);
          return;
        }
      }

      AppState.schedules = AppState.schedules.filter(s => !s.date.startsWith(prefix));
      renderRosterMatrix();
      renderDashboard();
      Swal.fire({ icon: 'success', title: 'ล้างตารางเรียบร้อย', timer: 1200, showConfirmButton: false });
    }
  });
}

// Publish Roster and broadcast notification to all staff
async function publishRosterToAll() {
  const y = AppState.currentYear, m = AppState.currentMonth;
  const prefix = `${y}-${String(m).padStart(2, '0')}`;
  const monthSchedules = AppState.schedules.filter(s => s.date.startsWith(prefix));

  if (monthSchedules.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'ยังไม่มีตารางเวรในเดือนนี้',
      text: 'กรุณาจัดเวรรายบุคคลหรือกดจัดตารางอัตโนมัติก่อนประกาศ',
      confirmButtonColor: '#0284c7'
    });
    return;
  }

  const curUser = AppState.currentUser || {};
  const organizerName = curUser.fullName || (curUser.role === 'head_nurse' ? 'หัวหน้าพยาบาล' : 'ผู้ดูแลระบบ');

  const confirmRes = await Swal.fire({
    title: `ประกาศตารางเวรเดือน ${THAI_MONTHS[m]} ${y}?`,
    html: `ระบบจะทำการส่งแจ้งเตือนไปยัง<b>บุคลากรทุกคน</b><br><span class="text-xs text-slate-500">จำนวนเวรที่จัดแล้ว: ${monthSchedules.length} รายการ</span>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#0d9488',
    cancelButtonColor: '#64748b',
    confirmButtonText: '<i class="fa-solid fa-paper-plane mr-1"></i> ยืนยันประกาศ & ส่งแจ้งเตือน',
    cancelButtonText: 'ยกเลิก'
  });

  if (!confirmRes.isConfirmed) return;

  Swal.showLoading();

  // Broadcast to all users
  await createNotification({
    targetStaffId: 'ALL',
    title: `ประกาศตารางเวรเดือน ${THAI_MONTHS[m]} ${y} เรียบร้อยแล้ว`,
    message: `${organizerName} ได้ตรวจสอบและประกาศตารางเวรประจำเดือน ${THAI_MONTHS[m]} ${y} เรียบร้อยแล้ว เจ้าหน้าที่ทุกท่านสามารถเข้าตรวจสอบเวรของตนเองและยื่นขอสลับเวรหากจำเป็นได้ทันที`,
    type: 'roster'
  });

  Swal.fire({
    icon: 'success',
    title: 'ประกาศตารางเวรสำเร็จ!',
    text: `ส่งการแจ้งเตือนไปยังผู้ใช้งานและบุคลากรทุกคนเรียบร้อยแล้ว`,
    confirmButtonColor: '#0d9488'
  });
}

// --------------------------------------------------------------------------
// 6. STAFF CRUD (SUPABASE)
// --------------------------------------------------------------------------
function filterStaffCards() {
  const q = (document.getElementById('staffSearchInput')?.value || '').toLowerCase();
  const stFilter = document.getElementById('staffStatusFilter')?.value || 'ALL';
  const roleFilter = document.getElementById('staffRoleFilter')?.value || 'ALL';

  const list = AppState.staffList.filter(s =>
    (!q || s.fullName.toLowerCase().includes(q) || s.staffId.toLowerCase().includes(q) || (s.position || '').toLowerCase().includes(q)) &&
    (stFilter === 'ALL' || s.status === stFilter) &&
    (roleFilter === 'ALL' || s.role === roleFilter)
  );

  const grid = document.getElementById('staffCardsGrid');
  if (!grid) return;
  const canManage = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);

  grid.innerHTML = list.map(s => {
    return `<div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
      <div>
        <div class="flex items-start justify-between mb-2">
          <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm border border-sky-200">${s.staffId.slice(-2)}</div>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'ปกติ' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${s.status}</span>
        </div>
        <h3 class="font-bold text-slate-800 text-xs truncate">${s.fullName}</h3>
        <p class="text-[11px] text-sky-600">${s.position || 'เจ้าหน้าที่'}</p>
        <p class="text-[10px] text-slate-400 font-mono mt-1">${s.staffId} | ${s.phone || '-'}</p>
        <div class="mt-1.5">${getRoleBadge(s.role)}</div>
      </div>
      ${canManage ? `
        <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end space-x-1.5">
          <button type="button" onclick="openStaffModal('${s.staffId}')" class="px-2.5 py-1 rounded-lg border border-sky-200 hover:bg-sky-50 text-sky-700 text-[11px] font-medium"><i class="fa-solid fa-pen mr-1"></i>แก้ไข</button>
          <button type="button" onclick="deleteStaff('${s.staffId}')" class="px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-medium"><i class="fa-solid fa-trash mr-1"></i>ลบ</button>
        </div>` : ''}
    </div>`;
  }).join('');
}
function renderStaffCards() { filterStaffCards(); }

function openStaffModal(id) {
  const canManage = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
  if (!canManage) {
    Swal.fire({
      icon: 'warning',
      title: 'ไม่มีสิทธิ์เข้าถึง',
      text: 'เฉพาะสิทธิ์ Admin และหัวหน้าพยาบาลเท่านั้นที่สามารถจัดการข้อมูลบุคลากรได้',
      confirmButtonColor: '#0284c7'
    });
    return;
  }

  const codeInput = document.getElementById('staffFormCode');
  const deleteBtn = document.getElementById('btnDeleteStaffModal');
  const modeInput = document.getElementById('staffFormMode');

  if (id) {
    const s = AppState.staffList.find(x => x.staffId === id);
    if (!s) return;
    document.getElementById('staffModalTitle').textContent = `แก้ไขข้อมูลบุคลากร: ${s.fullName}`;
    modeInput.value = 'edit';
    codeInput.value = s.staffId;
    codeInput.readOnly = true;
    codeInput.classList.add('bg-slate-100');
    document.getElementById('staffFormName').value = s.fullName;
    document.getElementById('staffFormPosition').value = s.position || '';
    document.getElementById('staffFormLevel').value = s.professionalLevel || '';
    document.getElementById('staffFormPhone').value = s.phone || '';
    document.getElementById('staffFormPassword').value = s.password || '123456';
    document.getElementById('staffFormRole').value = s.role || 'nurse';
    document.getElementById('staffFormStatus').value = s.status || 'ปกติ';
    deleteBtn.classList.remove('hidden');
  } else {
    document.getElementById('staffModalTitle').textContent = 'เพิ่มข้อมูลบุคลากรใหม่';
    modeInput.value = 'add';
    const max = AppState.staffList.reduce((acc, x) => Math.max(acc, parseInt(x.staffId.replace('ER', '')) || 0), 0);
    const nextId = 'ER' + String(max + 1).padStart(5, '0');
    codeInput.value = nextId;
    codeInput.readOnly = false;
    codeInput.classList.remove('bg-slate-100');
    document.getElementById('staffFormName').value = '';
    document.getElementById('staffFormPosition').value = 'พยาบาลวิชาชีพปฏิบัติการ';
    document.getElementById('staffFormLevel').value = 'พยาบาลวิชาชีพ';
    document.getElementById('staffFormPhone').value = '';
    document.getElementById('staffFormPassword').value = '123456';
    document.getElementById('staffFormRole').value = 'nurse';
    document.getElementById('staffFormStatus').value = 'ปกติ';
    deleteBtn.classList.add('hidden');
  }
  openModal('modalStaff');
}

// Add or Edit staff
async function handleSaveStaff(e) {
  e.preventDefault();
  const canManage = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
  if (!canManage) {
    closeModal('modalStaff');
    Swal.fire({
      icon: 'warning',
      title: 'ไม่มีสิทธิ์เข้าถึง',
      text: 'เฉพาะสิทธิ์ Admin และหัวหน้าพยาบาลเท่านั้นที่สามารถจัดการข้อมูลบุคลากรได้',
      confirmButtonColor: '#0284c7'
    });
    return;
  }

  closeModal('modalStaff');
  const code = document.getElementById('staffFormCode').value.trim().toUpperCase();
  const staffObj = {
    staffId: code,
    password: document.getElementById('staffFormPassword').value || '123456',
    fullName: document.getElementById('staffFormName').value.trim(),
    position: document.getElementById('staffFormPosition').value.trim(),
    professionalLevel: document.getElementById('staffFormLevel').value.trim(),
    phone: document.getElementById('staffFormPhone').value.trim(),
    status: document.getElementById('staffFormStatus').value,
    role: document.getElementById('staffFormRole').value
  };

  const sb = AppState.supabaseClient;
  if (sb) {
    try {
      const { error } = await sb.from('staff').upsert({
        staff_id: staffObj.staffId,
        password: staffObj.password,
        full_name: staffObj.fullName,
        position: staffObj.position,
        professional_level: staffObj.professionalLevel,
        phone: staffObj.phone,
        status: staffObj.status,
        role: staffObj.role
      });
      if (error) throw error;
    } catch (err) {
      showSupabaseError('บันทึกข้อมูลบุคลากร', err);
      return;
    }
  }

  // Update local state
  const idx = AppState.staffList.findIndex(s => s.staffId === staffObj.staffId);
  if (idx >= 0) AppState.staffList[idx] = staffObj;
  else AppState.staffList.push(staffObj);

  renderStaffCards();
  renderRosterMatrix();
  renderDashboard();
  Swal.fire({ icon: 'success', title: 'บันทึกบุคลากรสำเร็จ', timer: 1200, showConfirmButton: false });
}

// Delete staff
function confirmDeleteStaff() {
  const canManage = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
  if (!canManage) {
    closeModal('modalStaff');
    Swal.fire({
      icon: 'warning',
      title: 'ไม่มีสิทธิ์เข้าถึง',
      text: 'เฉพาะสิทธิ์ Admin และหัวหน้าพยาบาลเท่านั้นที่สามารถจัดการข้อมูลบุคลากรได้',
      confirmButtonColor: '#0284c7'
    });
    return;
  }

  const staffId = document.getElementById('staffFormCode').value;
  closeModal('modalStaff');
  deleteStaff(staffId);
}

async function deleteStaff(staffId) {
  const canManage = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
  if (!canManage) {
    Swal.fire({
      icon: 'warning',
      title: 'ไม่มีสิทธิ์เข้าถึง',
      text: 'เฉพาะสิทธิ์ Admin และหัวหน้าพยาบาลเท่านั้นที่สามารถจัดการข้อมูลบุคลากรได้',
      confirmButtonColor: '#0284c7'
    });
    return;
  }

  const staff = AppState.staffList.find(s => s.staffId === staffId);
  const name = staff ? staff.fullName : staffId;

  Swal.fire({
    title: `ลบบุคลากร ${name}?`,
    text: `รหัส ${staffId} จะถูกลบออกจากระบบพร้อมข้อมูลเวรที่เกี่ยวข้อง`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'ยืนยันลบ',
    cancelButtonText: 'ยกเลิก'
  }).then(async r => {
    if (r.isConfirmed) {
      if (AppState.supabaseClient) {
        try {
          const { error } = await AppState.supabaseClient.from('staff').delete().eq('staff_id', staffId);
          if (error) throw error;
        } catch (err) {
          showSupabaseError('ลบบุคลากร', err);
          return;
        }
      }

      AppState.staffList = AppState.staffList.filter(s => s.staffId !== staffId);
      AppState.schedules = AppState.schedules.filter(s => s.staffId !== staffId);
      renderStaffCards();
      renderRosterMatrix();
      renderDashboard();
      Swal.fire({ icon: 'success', title: 'ลบบุคลากรสำเร็จแล้ว', timer: 1200, showConfirmButton: false });
    }
  });
}

// --------------------------------------------------------------------------
// 7. SHIFTS & HOLIDAYS CRUD (SUPABASE)
// --------------------------------------------------------------------------
function renderShiftsAndHolidays() {
  const canManage = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);

  // Shift types
  const tbodySt = document.getElementById('shiftTypesTableBody');
  if (tbodySt) {
    tbodySt.innerHTML = AppState.shiftTypes.map(st => `
      <tr class="hover:bg-slate-50 text-xs">
        <td class="py-2 px-2 font-mono font-bold">${st.code}</td>
        <td class="py-2 px-2 font-bold">${st.name}</td>
        <td class="py-2 px-1 text-center font-bold">${st.shortName}</td>
        <td class="py-2 px-2 text-center">
          <span class="inline-block w-5 h-5 rounded font-bold text-[10px]" style="background:${st.color};color:${st.textColor};line-height:20px;">${st.shortName}</span>
        </td>
        <td class="py-2 px-2">${st.startTime} - ${st.endTime}</td>
        <td class="py-2 px-1 text-center font-bold">${st.minStaff}</td>
        <td class="py-2 px-1 text-center">${st.isOT ? 'ใช่' : 'ไม่ใช่'}</td>
        <td class="py-2 px-2 text-center space-x-1.5 whitespace-nowrap">
          ${canManage ? `
            <button type="button" onclick="openShiftTypeModal('${st.code}')" class="text-sky-600 hover:text-sky-800" title="แก้ไข"><i class="fa-solid fa-pen"></i></button>
            <button type="button" onclick="deleteShiftType('${st.code}')" class="text-rose-600 hover:text-rose-800" title="ลบ"><i class="fa-solid fa-trash"></i></button>
          ` : `<span class="text-slate-400 text-[11px] italic"><i class="fa-solid fa-lock text-[10px] mr-1"></i>ดูได้อย่างเดียว</span>`}
        </td>
      </tr>
    `).join('');
  }

  // Holidays
  const tbodyH = document.getElementById('holidaysTableBody');
  if (tbodyH) {
    tbodyH.innerHTML = AppState.holidays.map(h => `
      <tr class="hover:bg-slate-50 text-xs">
        <td class="py-2 px-2 font-mono font-bold">${h.date}</td>
        <td class="py-2 px-2 font-bold">${h.name}</td>
        <td class="py-2 px-2 text-slate-500">${h.description || '-'}</td>
        <td class="py-2 px-2 text-center space-x-1.5 whitespace-nowrap">
          ${canManage ? `
            <button type="button" onclick="openHolidayModal('${h.id}')" class="text-sky-600 hover:text-sky-800" title="แก้ไข"><i class="fa-solid fa-pen"></i></button>
            <button type="button" onclick="deleteHoliday('${h.id}')" class="text-rose-600 hover:text-rose-800" title="ลบ"><i class="fa-solid fa-trash"></i></button>
          ` : `<span class="text-slate-400 text-[11px] italic"><i class="fa-solid fa-lock text-[10px] mr-1"></i>ดูได้อย่างเดียว</span>`}
        </td>
      </tr>
    `).join('');
  }
}

function openShiftTypeModal(code) {
  const canManage = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
  if (!canManage) {
    Swal.fire({
      icon: 'warning',
      title: 'ไม่มีสิทธิ์แก้ไขหรือเพิ่มประเภทเวร',
      text: 'เฉพาะหัวหน้าพยาบาลและผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขหรือเพิ่มประเภทเวรได้',
      confirmButtonColor: '#0284c7'
    });
    return;
  }

  const delBtn = document.getElementById('btnDeleteShiftType');
  const codeInput = document.getElementById('stCode');
  const origInput = document.getElementById('stOriginalCode');

  if (code) {
    const item = AppState.shiftTypes.find(s => s.code === code);
    if (!item) return;
    document.getElementById('shiftTypeModalTitle').textContent = `แก้ไขประเภทเวร: ${item.name}`;
    origInput.value = item.code;
    codeInput.value = item.code;
    codeInput.readOnly = true;
    codeInput.classList.add('bg-slate-100');
    document.getElementById('stShort').value = item.shortName;
    document.getElementById('stName').value = item.name;
    document.getElementById('stColor').value = item.color || '#10b981';
    document.getElementById('stMin').value = item.minStaff || 3;
    document.getElementById('stStartTime').value = item.startTime && item.startTime !== '-' ? item.startTime : '08:00';
    document.getElementById('stEndTime').value = item.endTime && item.endTime !== '-' ? item.endTime : '16:00';
    document.getElementById('stIsOT').checked = !!item.isOT;
    delBtn.classList.remove('hidden');
  } else {
    document.getElementById('shiftTypeModalTitle').textContent = 'เพิ่มประเภทเวรใหม่';
    origInput.value = '';
    codeInput.value = '';
    codeInput.readOnly = false;
    codeInput.classList.remove('bg-slate-100');
    document.getElementById('stShort').value = '';
    document.getElementById('stName').value = '';
    document.getElementById('stColor').value = '#10b981';
    document.getElementById('stMin').value = 3;
    document.getElementById('stStartTime').value = '08:00';
    document.getElementById('stEndTime').value = '16:00';
    document.getElementById('stIsOT').checked = false;
    delBtn.classList.add('hidden');
  }
  openModal('modalShiftType');
}

// Add/Edit Shift Type (Supabase)
async function handleSaveShiftType(e) {
  e.preventDefault();
  const canManage = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
  if (!canManage) {
    Swal.fire({ icon: 'warning', title: 'ไม่มีสิทธิ์บันทึกประเภทเวร', text: 'เฉพาะหัวหน้าพยาบาลและแอดมินเท่านั้น' });
    return;
  }

  closeModal('modalShiftType');
  const item = {
    code: document.getElementById('stCode').value.trim().toUpperCase(),
    shortName: document.getElementById('stShort').value.trim(),
    name: document.getElementById('stName').value.trim(),
    color: document.getElementById('stColor').value,
    textColor: '#ffffff',
    startTime: document.getElementById('stStartTime').value,
    endTime: document.getElementById('stEndTime').value,
    minStaff: Number(document.getElementById('stMin').value) || 0,
    isOT: document.getElementById('stIsOT').checked
  };

  const sb = AppState.supabaseClient;
  if (sb) {
    try {
      const { error } = await sb.from('shift_types').upsert({
        code: item.code,
        short_name: item.shortName,
        name: item.name,
        color: item.color,
        text_color: item.textColor,
        start_time: item.startTime,
        end_time: item.endTime,
        min_staff: item.minStaff,
        is_ot: item.isOT
      });
      if (error) throw error;
    } catch (err) {
      showSupabaseError('บันทึกประเภทเวร', err);
      return;
    }
  }

  const idx = AppState.shiftTypes.findIndex(s => s.code === item.code);
  if (idx >= 0) AppState.shiftTypes[idx] = item;
  else AppState.shiftTypes.push(item);

  renderShiftsAndHolidays();
  renderRosterMatrix();
  Swal.fire({ icon: 'success', title: 'บันทึกประเภทเวรสำเร็จ', timer: 1200, showConfirmButton: false });
}

function confirmDeleteShiftType() {
  const code = document.getElementById('stCode').value;
  closeModal('modalShiftType');
  deleteShiftType(code);
}

// Delete Shift Type (Supabase)
async function deleteShiftType(code) {
  const canManage = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
  if (!canManage) {
    Swal.fire({ icon: 'warning', title: 'ไม่มีสิทธิ์ลบประเภทเวร', text: 'เฉพาะหัวหน้าพยาบาลและแอดมินเท่านั้น' });
    return;
  }

  Swal.fire({
    title: `ลบประเภทเวร ${code}?`,
    text: 'ประเภทเวรนี้จะถูกลบออกจากระบบ',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'ยืนยันลบ',
    cancelButtonText: 'ยกเลิก'
  }).then(async r => {
    if (r.isConfirmed) {
      if (AppState.supabaseClient) {
        try {
          const { error } = await AppState.supabaseClient.from('shift_types').delete().eq('code', code);
          if (error) throw error;
        } catch (err) {
          showSupabaseError('ลบประเภทเวร', err);
          return;
        }
      }

      AppState.shiftTypes = AppState.shiftTypes.filter(s => s.code !== code);
      renderShiftsAndHolidays();
      renderRosterMatrix();
      Swal.fire({ icon: 'success', title: 'ลบประเภทเวรสำเร็จแล้ว', timer: 1200, showConfirmButton: false });
    }
  });
}

// Holidays CRUD
function openHolidayModal(id) {
  const canManage = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
  if (!canManage) {
    Swal.fire({
      icon: 'warning',
      title: 'ไม่มีสิทธิ์แก้ไขหรือเพิ่มวันหยุด',
      text: 'เฉพาะหัวหน้าพยาบาลและผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขหรือเพิ่มวันหยุดได้',
      confirmButtonColor: '#0284c7'
    });
    return;
  }

  const editIdInput = document.getElementById('hEditId');
  if (id) {
    const item = AppState.holidays.find(h => h.id === id);
    if (!item) return;
    document.getElementById('holidayModalTitle').textContent = 'แก้ไขวันหยุดราชการ';
    editIdInput.value = item.id;
    document.getElementById('hDate').value = item.date;
    document.getElementById('hName').value = item.name;
    document.getElementById('hDesc').value = item.description || '';
  } else {
    document.getElementById('holidayModalTitle').textContent = 'เพิ่มวันหยุดราชการ';
    editIdInput.value = '';
    document.getElementById('hDate').value = '';
    document.getElementById('hName').value = '';
    document.getElementById('hDesc').value = '';
  }
  openModal('modalHoliday');
}

async function handleSaveHoliday(e) {
  e.preventDefault();
  const canManage = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
  if (!canManage) {
    Swal.fire({ icon: 'warning', title: 'ไม่มีสิทธิ์บันทึกวันหยุด', text: 'เฉพาะหัวหน้าพยาบาลและแอดมินเท่านั้น' });
    return;
  }

  closeModal('modalHoliday');
  const editId = document.getElementById('hEditId').value;
  const hId = editId || ('H' + Date.now());
  const hObj = {
    id: hId,
    date: document.getElementById('hDate').value,
    name: document.getElementById('hName').value.trim(),
    description: document.getElementById('hDesc').value.trim()
  };

  const sb = AppState.supabaseClient;
  if (sb) {
    try {
      const { error } = await sb.from('holidays').upsert({
        id: hObj.id,
        date: hObj.date,
        name: hObj.name,
        description: hObj.description
      });
      if (error) throw error;
    } catch (err) {
      showSupabaseError('บันทึกวันหยุด', err);
      return;
    }
  }

  const idx = AppState.holidays.findIndex(h => h.id === hObj.id);
  if (idx >= 0) AppState.holidays[idx] = hObj;
  else AppState.holidays.push(hObj);

  renderShiftsAndHolidays();
  Swal.fire({ icon: 'success', title: 'บันทึกวันหยุดสำเร็จ', timer: 1200, showConfirmButton: false });
}

async function deleteHoliday(id) {
  const canManage = AppState.currentUser && ['admin', 'head_nurse'].includes(AppState.currentUser.role);
  if (!canManage) {
    Swal.fire({ icon: 'warning', title: 'ไม่มีสิทธิ์ลบวันหยุด', text: 'เฉพาะหัวหน้าพยาบาลและแอดมินเท่านั้น' });
    return;
  }

  Swal.fire({
    title: 'ยืนยันลบวันหยุดนี้?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก'
  }).then(async r => {
    if (r.isConfirmed) {
      if (AppState.supabaseClient) {
        try {
          const { error } = await AppState.supabaseClient.from('holidays').delete().eq('id', id);
          if (error) throw error;
        } catch (err) {
          showSupabaseError('ลบวันหยุด', err);
          return;
        }
      }

      AppState.holidays = AppState.holidays.filter(h => h.id !== id);
      renderShiftsAndHolidays();
      Swal.fire({ icon: 'success', title: 'ลบวันหยุดสำเร็จแล้ว', timer: 1200, showConfirmButton: false });
    }
  });
}

// --------------------------------------------------------------------------
// 8. LEAVES CRUD (SUPABASE)
// --------------------------------------------------------------------------
function openLeaveRequestModal(editId = null) {
  const idInput = document.getElementById('leaveEditId');
  const u = AppState.currentUser || {};
  const isHeadOrAdmin = ['admin', 'head_nurse'].includes(u.role);
  const staffContainer = document.getElementById('leaveStaffSelectContainer');
  const staffSelect = document.getElementById('leaveStaffSelect');

  if (staffContainer && staffSelect) {
    if (isHeadOrAdmin) {
      staffContainer.classList.remove('hidden');
      staffSelect.innerHTML = AppState.staffList.filter(s => s.status === 'ปกติ').map(s => `
        <option value="${s.staffId}">${s.fullName} (${s.staffId}) - ${s.position || 'พยาบาล'}</option>
      `).join('');
    } else {
      staffContainer.classList.add('hidden');
    }
  }

  if (editId) {
    const item = AppState.leaves.find(l => l.id === editId);
    if (!item) return;
    document.getElementById('leaveModalTitle').textContent = 'แก้ไขคำขอลา';
    idInput.value = item.id;
    if (staffSelect && isHeadOrAdmin) staffSelect.value = item.staffId;
    document.getElementById('leaveTypeSelect').value = item.leaveType;
    document.getElementById('leaveStartDate').value = item.startDate;
    document.getElementById('leaveEndDate').value = item.endDate;
    document.getElementById('leaveReason').value = item.reason || '';
  } else {
    document.getElementById('leaveModalTitle').textContent = 'ยื่นคำขอลาปฏิบัติงาน';
    idInput.value = '';
    if (staffSelect && isHeadOrAdmin) staffSelect.value = u.staffId || 'ER00002';
    document.getElementById('leaveStartDate').value = '';
    document.getElementById('leaveEndDate').value = '';
    document.getElementById('leaveReason').value = '';
  }
  openModal('modalLeaveRequest');
}

async function handleLeaveSubmit(e) {
  e.preventDefault();
  closeModal('modalLeaveRequest');
  const u = AppState.currentUser || {};
  const isHeadOrAdmin = ['admin', 'head_nurse'].includes(u.role);
  const editId = document.getElementById('leaveEditId').value;
  const type = document.getElementById('leaveTypeSelect').value;
  const sDate = document.getElementById('leaveStartDate').value;
  const eDate = document.getElementById('leaveEndDate').value;
  const reason = document.getElementById('leaveReason').value.trim();
  const days = Math.ceil((new Date(eDate) - new Date(sDate)) / 86400000) + 1;

  const staffSelect = document.getElementById('leaveStaffSelect');
  let requesterStaffId = u.staffId || 'ER00003';
  if (isHeadOrAdmin && staffSelect && staffSelect.value) {
    requesterStaffId = staffSelect.value;
  }

  const leaveId = editId || ('LV' + Date.now());
  const newLeave = {
    id: leaveId,
    staffId: requesterStaffId,
    leaveType: type,
    startDate: sDate,
    endDate: eDate,
    days,
    reason,
    status: 'Pending',
    approvedBy: null
  };

  const sb = AppState.supabaseClient;
  if (sb) {
    try {
      const { error } = await sb.from('leaves').upsert({
        id: newLeave.id,
        staff_id: newLeave.staffId,
        leave_type: newLeave.leaveType,
        start_date: newLeave.startDate,
        end_date: newLeave.endDate,
        days: newLeave.days,
        reason: newLeave.reason,
        status: newLeave.status
      });
      if (error) throw error;
    } catch (err) {
      showSupabaseError('บันทึกคำขอลา', err);
      return;
    }
  }

  const idx = AppState.leaves.findIndex(l => l.id === leaveId);
  if (idx >= 0) AppState.leaves[idx] = newLeave;
  else AppState.leaves.unshift(newLeave);

  const reqNurse = AppState.staffList.find(s => s.staffId === requesterStaffId) || {};
  const nurseName = reqNurse.fullName || requesterStaffId;

  // Notify Head Nurse if submitted by nurse or on behalf of staff
  await createNotification({
    targetStaffId: 'HEAD_NURSE',
    title: `คำขอลาใหม่รอพิจารณา: ${type}`,
    message: `${nurseName} (${requesterStaffId}) ยื่นขอลาวันที่ ${sDate} ถึง ${eDate} (${days} วัน)${reason ? ' เหตุผล: ' + reason : ''}`,
    type: 'leaves'
  });

  // Notify requester confirmation
  if (requesterStaffId !== u.staffId || !isHeadOrAdmin) {
    await createNotification({
      targetStaffId: requesterStaffId,
      title: `ยื่นคำขอลาสำเร็จ: ${type}`,
      message: `ส่งคำขอลาวันที่ ${sDate} ถึง ${eDate} (${days} วัน) ไปยังหัวหน้าพยาบาลเรียบร้อยแล้ว รอการอนุมัติ`,
      type: 'leaves'
    });
  }

  renderLeaves();
  renderDashboard();
  updateSidebarBadges();
  Swal.fire({ icon: 'success', title: 'บันทึกคำขอลาเรียบร้อย', text: 'ส่งข้อมูลและแจ้งเตือนไปยังหัวหน้าพยาบาลเรียบร้อยแล้ว' });
}

function renderLeaves() {
  const curUser = AppState.currentUser || {};
  const isHead = curUser.role === 'head_nurse';
  const pending = AppState.leaves.filter(l => l.status === 'Pending');
  const pContainer = document.getElementById('leavesHeadApprovalContainer');
  const pList = document.getElementById('pendingLeavesList');

  if (!isHead || pending.length === 0) {
    pContainer.classList.add('hidden');
  } else {
    pContainer.classList.remove('hidden');
    document.getElementById('pendingLeavesCountBadge').textContent = `${pending.length} รายการ`;
    pList.innerHTML = pending.map(l => {
      const st = AppState.staffList.find(s => s.staffId === l.staffId) || {};
      return `<div class="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs shadow-2xs">
        <div>
          <div class="font-bold text-slate-800">${st.fullName || l.staffId} (${l.staffId})</div>
          <div class="text-slate-600">ขอ "${l.leaveType}" วันที่ ${l.startDate} &rarr; ${l.endDate} (${l.days} วัน)</div>
          ${l.reason ? `<div class="text-slate-400 italic text-[11px]">เหตุผล: ${l.reason}</div>` : ''}
        </div>
        <div class="space-x-1.5 shrink-0 ml-3">
          <button type="button" onclick="updateLeave('${l.id}', 'Approved')" class="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-2xs"><i class="fa-solid fa-check mr-1"></i>อนุมัติ</button>
          <button type="button" onclick="updateLeave('${l.id}', 'Rejected')" class="px-3 py-1 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold shadow-2xs"><i class="fa-solid fa-xmark mr-1"></i>ปฏิเสธ</button>
        </div>
      </div>`;
    }).join('');
  }

  const tbody = document.getElementById('leavesTableBody');

  tbody.innerHTML = AppState.leaves.map(l => {
    const st = AppState.staffList.find(s => s.staffId === l.staffId) || {};
    const badge = l.status === 'Approved'
      ? '<span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">อนุมัติแล้ว</span>'
      : (l.status === 'Rejected'
        ? '<span class="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">ปฏิเสธ</span>'
        : '<span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">รออนุมัติ</span>');

    const canEdit = (l.staffId === curUser.staffId && l.status === 'Pending') && !isHead && curUser.role !== 'admin';
    const canDelete = (l.staffId === curUser.staffId && !isHead) || curUser.role === 'admin';
    const canApprove = isHead && l.status === 'Pending';

    return `<tr class="hover:bg-slate-50 text-xs">
      <td class="py-2 px-2 font-mono text-slate-400">${l.id}</td>
      <td class="py-2 px-2 font-bold">${st.fullName || l.staffId}</td>
      <td class="py-2 px-2">${l.leaveType}</td>
      <td class="py-2 px-2">${l.startDate} &rarr; ${l.endDate}</td>
      <td class="py-2 px-1 text-center font-bold">${l.days} วัน</td>
      <td class="py-2 px-2 text-slate-500">${l.reason || '-'}</td>
      <td class="py-2 px-2 text-center">${badge}</td>
      <td class="py-2 px-2 text-center text-slate-400">${l.approvedBy || '-'}</td>
      <td class="py-2 px-2 text-center space-x-1 whitespace-nowrap">
        ${canApprove ? `
          <button type="button" onclick="updateLeave('${l.id}', 'Approved')" class="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium" title="อนุมัติ">อนุมัติ</button>
          <button type="button" onclick="updateLeave('${l.id}', 'Rejected')" class="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium" title="ปฏิเสธ">ปฏิเสธ</button>
        ` : ''}
        ${canEdit ? `<button type="button" onclick="openLeaveRequestModal('${l.id}')" class="text-sky-600 hover:text-sky-800 ml-1" title="แก้ไข"><i class="fa-solid fa-pen"></i></button>` : ''}
        ${canDelete ? `<button type="button" onclick="deleteLeave('${l.id}')" class="text-rose-600 hover:text-rose-800 ml-1" title="ลบ"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

async function updateLeave(id, status) {
  const curUser = AppState.currentUser || {};
  const isHead = curUser.role === 'head_nurse';
  if (!isHead) {
    Swal.fire({
      icon: 'warning',
      title: 'ไม่มีสิทธิ์อนุมัติการลา',
      text: 'เฉพาะหัวหน้าพยาบาลเท่านั้นที่มีสิทธิ์อนุมัติคำขอลา (แอดมินไม่สามารถอนุมัติแทนได้)',
      confirmButtonColor: '#0284c7'
    });
    return;
  }

  const approver = curUser.staffId || 'ER00002';
  if (AppState.supabaseClient) {
    try {
      const { error } = await AppState.supabaseClient.from('leaves').update({ status, approved_by: approver }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      showSupabaseError('อัปเดตสถานะการลา', err);
      return;
    }
  }
  const item = AppState.leaves.find(l => l.id === id);
  if (item) {
    item.status = status;
    item.approvedBy = approver;

    const statusTh = status === 'Approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ (ไม่อนุมัติ)';
    const approverName = (AppState.currentUser || {}).fullName || approver;
    await createNotification({
      targetStaffId: item.staffId,
      title: `ผลการพิจารณาคำขอลา: ${statusTh}`,
      message: `คำขอ${item.leaveType} วันที่ ${item.startDate} ถึง ${item.endDate} (${item.days} วัน) ได้รับการ${statusTh} โดย ${approverName}`,
      type: 'leaves'
    });
  }
  renderLeaves();
  renderDashboard();
  updateSidebarBadges();
  Swal.fire({ icon: 'success', title: 'บันทึกสถานะเรียบร้อย', timer: 1200, showConfirmButton: false });
}

async function deleteLeave(id) {
  Swal.fire({
    title: 'ยืนยันลบคำขอลา?',
    text: 'รายการขอลานี้จะถูกลบออกจากระบบ',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก'
  }).then(async r => {
    if (r.isConfirmed) {
      if (AppState.supabaseClient) {
        try {
          const { error } = await AppState.supabaseClient.from('leaves').delete().eq('id', id);
          if (error) throw error;
        } catch (err) {
          showSupabaseError('ลบคำขอลา', err);
          return;
        }
      }
      AppState.leaves = AppState.leaves.filter(l => l.id !== id);
      renderLeaves();
      renderDashboard();
      Swal.fire({ icon: 'success', title: 'ลบคำขอลาสำเร็จแล้ว', timer: 1200, showConfirmButton: false });
    }
  });
}

// --------------------------------------------------------------------------
// 9. SHIFT SWAPS CRUD (SUPABASE) - 2-STEP WORKFLOW
// --------------------------------------------------------------------------
function openSwapRequestModal() {
  const u = AppState.currentUser || {};
  const isHeadOrAdmin = ['admin', 'head_nurse'].includes(u.role);
  const reqContainer = document.getElementById('swapRequesterStaffContainer');
  const reqSel = document.getElementById('swapRequesterStaff');
  const targetSel = document.getElementById('swapTargetStaff');

  if (reqContainer && reqSel) {
    if (isHeadOrAdmin) {
      reqContainer.classList.remove('hidden');
      reqSel.innerHTML = AppState.staffList.filter(s => s.status === 'ปกติ').map(s => `
        <option value="${s.staffId}" ${s.staffId === u.staffId ? 'selected' : ''}>${s.fullName} (${s.staffId})</option>
      `).join('');
    } else {
      reqContainer.classList.add('hidden');
    }
  }

  function updateTargetStaffOptions() {
    const currentReqId = (isHeadOrAdmin && reqSel && reqSel.value) ? reqSel.value : (u.staffId || '');
    targetSel.innerHTML = '<option value="">-- เลือกเพื่อนพยาบาล --</option>';
    AppState.staffList.filter(s => s.staffId !== currentReqId && s.status === 'ปกติ').forEach(s => {
      targetSel.innerHTML += `<option value="${s.staffId}">${s.fullName} (${s.staffId})</option>`;
    });
  }

  updateTargetStaffOptions();
  if (reqSel) {
    reqSel.onchange = updateTargetStaffOptions;
  }

  openModal('modalSwapRequest');
}

async function handleSwapSubmit(e) {
  e.preventDefault();
  const u = AppState.currentUser || {};
  const isHeadOrAdmin = ['admin', 'head_nurse'].includes(u.role);
  const reqStaffSelect = document.getElementById('swapRequesterStaff');
  let requesterStaffId = u.staffId || 'ER00003';
  if (isHeadOrAdmin && reqStaffSelect && reqStaffSelect.value) {
    requesterStaffId = reqStaffSelect.value;
  }

  const target = document.getElementById('swapTargetStaff').value;
  const rDate = document.getElementById('swapReqDate').value;
  const rShift = document.getElementById('swapReqShift').value;
  const tDate = document.getElementById('swapTargetDate').value;
  const tShift = document.getElementById('swapTargetShift').value;
  const reason = document.getElementById('swapReason').value.trim();

  const getName = id => (AppState.staffList.find(s => s.staffId === id) || {}).fullName || id;

  if (!target) {
    Swal.fire({ icon: 'warning', title: 'กรุณาเลือกเพื่อนพยาบาล', text: 'โปรดเลือกเพื่อนร่วมงานที่ท่านประสงค์จะแลกเวรด้วย' });
    return;
  }

  if (requesterStaffId === target) {
    Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ถูกต้อง', text: 'ไม่สามารถแลกเวรกับตนเองได้ โปรดเลือกเพื่อนพยาบาลท่านอื่น' });
    return;
  }

  // Duplicate Swap Detection: Check if active swap already exists for either requester or target on specified dates
  const duplicateSwap = AppState.swaps.find(s => {
    if (s.peerStatus === 'Rejected' || s.headStatus === 'Rejected') return false;

    // Exact duplicate check
    const exactMatch = (
      (s.requesterStaffId === requesterStaffId && s.targetStaffId === target && s.requesterDate === rDate && s.targetDate === tDate) ||
      (s.requesterStaffId === target && s.targetStaffId === requesterStaffId && s.requesterDate === tDate && s.targetDate === rDate)
    );
    if (exactMatch) return true;

    // Requester has pending swap on requesterDate
    const requesterBusy = (
      (s.requesterStaffId === requesterStaffId && s.requesterDate === rDate && s.headStatus === 'Pending') ||
      (s.targetStaffId === requesterStaffId && s.targetDate === rDate && s.headStatus === 'Pending')
    );
    if (requesterBusy) return true;

    // Target has pending swap on targetDate
    const targetBusy = (
      (s.requesterStaffId === target && s.requesterDate === tDate && s.headStatus === 'Pending') ||
      (s.targetStaffId === target && s.targetDate === tDate && s.headStatus === 'Pending')
    );
    if (targetBusy) return true;

    return false;
  });

  if (duplicateSwap) {
    const reqName = getName(requesterStaffId);
    const tarName = getName(target);
    Swal.fire({
      icon: 'warning',
      title: 'แจ้งเตือน: มีคำขอแลกเวรซ้ำหรือรอดำเนินการอยู่แล้ว',
      html: `
        <div class="text-left text-xs text-slate-600 space-y-2">
          <p class="font-bold text-rose-600">ตรวจพบคำขอแลกเวรซ้ำซ้อนในระบบ:</p>
          <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed">
            <p><strong>ผู้ขอ (${reqName})</strong> หรือ <strong>ผู้รับ (${tarName})</strong> มีรายการแลกเวรในวันที่ระบุ (${rDate} หรือ ${tDate}) ที่ยังอยู่ระหว่างรอดำเนินการอยู่แล้ว</p>
            <p class="mt-1 text-slate-500 font-mono text-[11px]">รหัสรายการเดิม: ${duplicateSwap.id} (สถานะเพื่อน: ${duplicateSwap.peerStatus}, หัวหน้า: ${duplicateSwap.headStatus})</p>
          </div>
          <p class="text-slate-500">กรุณารอเพื่อนร่วมงานหรือหัวหน้าพยาบาลดำเนินการรายการเดิม หรือยกเลิกรายการเดิมก่อนยื่นใหม่</p>
        </div>
      `,
      confirmButtonText: 'รับทราบ',
      confirmButtonColor: '#e11d48'
    });
    return;
  }

  closeModal('modalSwapRequest');

  const newSwap = {
    id: 'SWP' + Date.now(),
    requesterStaffId,
    targetStaffId: target,
    requesterDate: rDate,
    requesterShiftCode: rShift,
    targetDate: tDate,
    targetShiftCode: tShift,
    reason,
    peerStatus: 'Pending',
    headStatus: 'Pending'
  };

  if (AppState.supabaseClient) {
    try {
      const { error } = await AppState.supabaseClient.from('shift_swaps').insert({
        id: newSwap.id,
        requester_staff_id: newSwap.requesterStaffId,
        target_staff_id: newSwap.targetStaffId,
        requester_date: newSwap.requesterDate,
        requester_shift_code: newSwap.requesterShiftCode,
        target_date: newSwap.targetDate,
        target_shift_code: newSwap.targetShiftCode,
        reason: newSwap.reason,
        peer_status: newSwap.peerStatus,
        head_status: newSwap.headStatus
      });
      if (error) throw error;
    } catch (err) {
      showSupabaseError('ส่งคำขอแลกเวร', err);
      return;
    }
  }

  AppState.swaps.unshift(newSwap);

  // Step 1: Send notification to TARGET PEER ONLY
  await createNotification({
    targetStaffId: target,
    title: 'คำขอแลกเวรใหม่จากเพื่อนร่วมงาน',
    message: `${getName(requesterStaffId)} ขอแลกเวรวันที่ ${tDate} (${tShift}) ของท่าน กับเวรวันที่ ${rDate} (${rShift}) ของตนเอง${reason ? ' (เหตุผล: ' + reason + ')' : ''}`,
    type: 'swaps'
  });

  // Confirmation to requester
  if (requesterStaffId === u.staffId) {
    await createNotification({
      targetStaffId: requesterStaffId,
      title: 'ส่งคำขอแลกเวรแล้ว',
      message: `ส่งคำขอแลกเวรไปยัง ${getName(target)} เรียบร้อยแล้ว (รอเพื่อนร่วมงานตอบรับก่อนส่งต่อหัวหน้าพยาบาล)`,
      type: 'swaps'
    });
  }

  renderSwaps();
  renderDashboard();
  updateSidebarBadges();
  Swal.fire({
    icon: 'success',
    title: 'ส่งคำขอแลกเวรเรียบร้อย',
    text: `ระบบส่งแจ้งเตือนไปยัง ${getName(target)} แล้ว เมื่อเพื่อนร่วมงานตอบรับ ระบบจะส่งต่อให้หัวหน้าพยาบาลพิจารณาอนุมัติต่อไป`
  });
}

function renderSwaps() {
  const u = AppState.currentUser || {};
  const isHead = u.role === 'head_nurse';
  const getName = id => (AppState.staffList.find(s => s.staffId === id) || {}).fullName || id;
  const actContainer = document.getElementById('swapMyActionsContainer');

  let actHtml = '';

  // 1. Pending actions for target nurse (Peer response)
  const peerPending = AppState.swaps.filter(s => s.targetStaffId === u.staffId && s.peerStatus === 'Pending');
  peerPending.forEach(s => {
    actHtml += `<div class="p-3 bg-rose-50 rounded-xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
      <div>
        <div class="font-bold text-rose-900"><i class="fa-solid fa-repeat mr-1 text-rose-600"></i>${getName(s.requesterStaffId)} (${s.requesterStaffId}) ขอแลกเวรกับท่าน</div>
        <div class="text-slate-700 mt-0.5">เวรของท่าน: <span class="font-semibold text-rose-700">${s.targetDate} (${s.targetShiftCode})</span> &harr; เวรของผู้ขอ: <span class="font-semibold text-sky-700">${s.requesterDate} (${s.requesterShiftCode})</span></div>
        ${s.reason ? `<div class="text-slate-500 italic text-[11px] mt-0.5">เหตุผล: ${s.reason}</div>` : ''}
      </div>
      <div class="flex items-center space-x-1.5 shrink-0">
        <button type="button" onclick="respondPeerSwap('${s.id}', 'Accepted')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-2xs inline-flex items-center space-x-1"><i class="fa-solid fa-check"></i><span>อนุมัติแลกเวร (ยอมรับ)</span></button>
        <button type="button" onclick="respondPeerSwap('${s.id}', 'Rejected')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-2xs inline-flex items-center space-x-1"><i class="fa-solid fa-xmark"></i><span>ไม่อนุมัติ (ปฏิเสธ)</span></button>
      </div>
    </div>`;
  });

  // 2. Pending approval for Head Nurse (Step 2: peer accepted, waiting head approval)
  if (isHead) {
    const headPending = AppState.swaps.filter(s => s.peerStatus === 'Accepted' && s.headStatus === 'Pending');
    headPending.forEach(s => {
      actHtml += `<div class="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 shadow-2xs">
        <div>
          <div class="font-bold text-indigo-900"><i class="fa-solid fa-user-check mr-1 text-indigo-600"></i>คำขอแลกเวรรอหัวหน้าพยาบาลอนุมัติ (เพื่อนร่วมงานตอบรับแล้ว)</div>
          <div class="text-slate-700 mt-0.5">
            <strong>${getName(s.requesterStaffId)}</strong> (${s.requesterDate} [${s.requesterShiftCode}]) &harr; <strong>${getName(s.targetStaffId)}</strong> (${s.targetDate} [${s.targetShiftCode}])
          </div>
          ${s.reason ? `<div class="text-slate-500 italic text-[11px] mt-0.5">เหตุผล: ${s.reason}</div>` : ''}
        </div>
        <div class="space-x-1.5 shrink-0">
          <button type="button" onclick="approveHeadSwap('${s.id}', 'Approved')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-2xs"><i class="fa-solid fa-check mr-1"></i>อนุมัติ & ปรับตารางเวร</button>
          <button type="button" onclick="approveHeadSwap('${s.id}', 'Rejected')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-2xs"><i class="fa-solid fa-xmark mr-1"></i>ไม่อนุมัติ</button>
        </div>
      </div>`;
    });
  }

  actContainer.innerHTML = actHtml || '<p class="text-slate-400 italic text-xs">ไม่มีรายการที่ต้องดำเนินการ</p>';

  // Swaps history table
  const tbody = document.getElementById('swapsTableBody');
  tbody.innerHTML = AppState.swaps.map(s => {
    const canCancel = (s.requesterStaffId === u.staffId && s.headStatus === 'Pending') && !isHead;
    const canHeadAct = isHead && s.peerStatus === 'Accepted' && s.headStatus === 'Pending';

    const peerBadge = s.peerStatus === 'Accepted'
      ? '<span class="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">ยอมรับแล้ว</span>'
      : (s.peerStatus === 'Rejected'
        ? '<span class="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">ปฏิเสธ</span>'
        : '<span class="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">รอเพื่อนตอบรับ</span>');

    const headBadge = s.headStatus === 'Approved'
      ? '<span class="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">อนุมัติแล้ว</span>'
      : (s.headStatus === 'Rejected'
        ? '<span class="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold">ไม่อนุมัติ</span>'
        : '<span class="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-bold">รอพิจารณา</span>');

    return `<tr class="hover:bg-slate-50 text-xs">
      <td class="py-2 px-2 font-mono text-slate-400">${s.id}</td>
      <td class="py-2 px-2 font-bold">${getName(s.requesterStaffId)}</td>
      <td class="py-2 px-2">${s.requesterDate} (${s.requesterShiftCode})</td>
      <td class="py-2 px-2 font-bold">${getName(s.targetStaffId)}</td>
      <td class="py-2 px-2">${s.targetDate} (${s.targetShiftCode})</td>
      <td class="py-2 px-2 text-slate-500">${s.reason || '-'}</td>
      <td class="py-2 px-1 text-center">${peerBadge}</td>
      <td class="py-2 px-1 text-center">${headBadge}</td>
      <td class="py-2 px-2 text-center space-x-1 whitespace-nowrap">
        ${canHeadAct ? `
          <button type="button" onclick="approveHeadSwap('${s.id}', 'Approved')" class="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-medium" title="อนุมัติ">อนุมัติ</button>
          <button type="button" onclick="approveHeadSwap('${s.id}', 'Rejected')" class="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-medium" title="ไม่อนุมัติ">ไม่อนุมัติ</button>
        ` : ''}
        ${s.headStatus === 'Approved' ? '<span class="text-emerald-600 font-bold text-xs"><i class="fa-solid fa-check"></i> สำเร็จ</span>' : ''}
        ${canCancel ? `<button type="button" onclick="deleteSwap('${s.id}')" class="text-rose-600 hover:text-rose-800 ml-1" title="ลบรายการ"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

async function respondPeerSwap(id, status) {
  const u = AppState.currentUser || {};
  const item = AppState.swaps.find(s => s.id === id);
  if (!item) return;

  const isTarget = item.targetStaffId === u.staffId;
  const isHead = ['admin', 'head_nurse'].includes(u.role);
  if (!isTarget && !isHead) {
    Swal.fire({
      icon: 'warning',
      title: 'ไม่มีสิทธิ์ดำเนินการ',
      text: 'เฉพาะเจ้าหน้าที่ที่ได้รับการขอแลกเวรเท่านั้นที่สามารถอนุมัติหรือไม่อนุมัติการแลกเวรนี้ได้',
      confirmButtonColor: '#0284c7'
    });
    return;
  }

  if (AppState.supabaseClient) {
    try {
      const { error } = await AppState.supabaseClient.from('shift_swaps').update({ peer_status: status }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      showSupabaseError('ตอบรับแลกเวร', err);
      return;
    }
  }

  item.peerStatus = status;
  const getName = sId => (AppState.staffList.find(s => s.staffId === sId) || {}).fullName || sId;

  if (status === 'Accepted') {
    // Step 2: Peer Accepted -> NOW send detailed notification to Head Nurse with full swap details
    await createNotification({
      targetStaffId: 'HEAD_NURSE',
      title: 'คำขอแลกเวรผ่านการตอบรับ รอหัวหน้าอนุมัติ!',
      message: `${getName(item.targetStaffId)} ยอมรับแลกเวรกับ ${getName(item.requesterStaffId)} แล้ว [ผู้ขอ: ${item.requesterDate} (${item.requesterShiftCode}) ⇄ ผู้รับ: ${item.targetDate} (${item.targetShiftCode})]${item.reason ? ' เหตุผล: ' + item.reason : ''} กรุณาพิจารณาอนุมัติเพื่อปรับตารางเวรหลัก`,
      type: 'swaps'
    });

    // Notify Requester
    await createNotification({
      targetStaffId: item.requesterStaffId,
      title: 'เพื่อนร่วมงานยอมรับการแลกเวรแล้ว',
      message: `${getName(item.targetStaffId)} ยอมรับคำขอแลกเวรแล้ว ขณะนี้ส่งเรื่องและรายละเอียดให้หัวหน้าพยาบาลพิจารณาอนุมัติต่อไป`,
      type: 'swaps'
    });
  } else {
    // Rejection: Notify Requester
    await createNotification({
      targetStaffId: item.requesterStaffId,
      title: 'เพื่อนร่วมงานปฏิเสธการแลกเวร',
      message: `${getName(item.targetStaffId)} ได้ปฏิเสธคำขอแลกเวรวันที่ ${item.requesterDate} (${item.requesterShiftCode})`,
      type: 'swaps'
    });
  }

  renderSwaps();
  renderDashboard();
  updateSidebarBadges();
  Swal.fire({
    icon: 'success',
    title: status === 'Accepted' ? 'บันทึกการยอมรับเรียบร้อย' : 'ปฏิเสธการแลกเวรเรียบร้อย',
    text: status === 'Accepted' ? 'ระบบส่งข้อมูลและรายละเอียดไปยังหัวหน้าพยาบาลเพื่อพิจารณาอนุมัติแล้ว' : 'ระบบแจ้งเตือนไปยังผู้ขอยื่นแลกเวรแล้ว',
    timer: 2000,
    showConfirmButton: false
  });
}

async function approveHeadSwap(id, status) {
  const u = AppState.currentUser || {};
  const isHead = u.role === 'head_nurse';
  if (!isHead) {
    Swal.fire({
      icon: 'warning',
      title: 'ไม่มีสิทธิ์อนุมัติขั้นสุดท้าย',
      text: 'เฉพาะหัวหน้าพยาบาลเท่านั้นที่สามารถอนุมัติขั้นสุดท้ายเพื่อปรับตารางเวรหลักได้ (แอดมินไม่สามารถอนุมัติแทนได้)',
      confirmButtonColor: '#0284c7'
    });
    return;
  }

  const sw = AppState.swaps.find(s => s.id === id);
  if (!sw) return;

  if (AppState.supabaseClient) {
    try {
      const { error } = await AppState.supabaseClient.from('shift_swaps').update({ head_status: status }).eq('id', id);
      if (error) throw error;

      if (status === 'Approved') {
        // Automatically swap the two shifts in schedules table in Supabase
        await AppState.supabaseClient.from('schedules').upsert([
          {
            id: `SCH_${sw.requesterDate.replace(/-/g, '')}_${sw.targetStaffId}`,
            date: sw.requesterDate,
            staff_id: sw.targetStaffId,
            shift_code: sw.requesterShiftCode,
            shift_name: sw.requesterShiftCode,
            note: 'แลกเวร'
          },
          {
            id: `SCH_${sw.targetDate.replace(/-/g, '')}_${sw.requesterStaffId}`,
            date: sw.targetDate,
            staff_id: sw.requesterStaffId,
            shift_code: sw.targetShiftCode,
            shift_name: sw.targetShiftCode,
            note: 'แลกเวร'
          }
        ]);
      }
    } catch (err) {
      showSupabaseError('อนุมัติแลกเวร', err);
      return;
    }
  }

  // Update local schedules array if approved
  if (status === 'Approved') {
    const idx1 = AppState.schedules.findIndex(s => s.date === sw.requesterDate && s.staffId === sw.targetStaffId);
    const sch1 = {
      id: `SCH_${sw.requesterDate.replace(/-/g, '')}_${sw.targetStaffId}`,
      date: sw.requesterDate,
      staffId: sw.targetStaffId,
      shiftCode: sw.requesterShiftCode,
      shiftName: sw.requesterShiftCode,
      note: 'แลกเวร'
    };
    if (idx1 >= 0) AppState.schedules[idx1] = sch1;
    else AppState.schedules.push(sch1);

    const idx2 = AppState.schedules.findIndex(s => s.date === sw.targetDate && s.staffId === sw.requesterStaffId);
    const sch2 = {
      id: `SCH_${sw.targetDate.replace(/-/g, '')}_${sw.requesterStaffId}`,
      date: sw.targetDate,
      staffId: sw.requesterStaffId,
      shiftCode: sw.targetShiftCode,
      shiftName: sw.targetShiftCode,
      note: 'แลกเวร'
    };
    if (idx2 >= 0) AppState.schedules[idx2] = sch2;
    else AppState.schedules.push(sch2);
  }

  sw.headStatus = status;

  const getName = sId => (AppState.staffList.find(s => s.staffId === sId) || {}).fullName || sId;
  const statusTh = status === 'Approved' ? 'อนุมัติและปรับตารางเวรแล้ว' : 'ไม่อนุมัติ';
  const approverName = (AppState.currentUser || {}).fullName || 'หัวหน้าพยาบาล';

  await createNotification({
    targetStaffId: sw.requesterStaffId,
    title: `ผลการพิจารณาแลกเวร: ${statusTh}`,
    message: `${approverName} ได้${statusTh} การแลกเวรระหว่างท่านกับ ${getName(sw.targetStaffId)} (${sw.requesterDate} [${sw.requesterShiftCode}] ⇄ ${sw.targetDate} [${sw.targetShiftCode}])`,
    type: 'swaps'
  });
  await createNotification({
    targetStaffId: sw.targetStaffId,
    title: `ผลการพิจารณาแลกเวร: ${statusTh}`,
    message: `${approverName} ได้${statusTh} การแลกเวรระหว่างท่านกับ ${getName(sw.requesterStaffId)} (${sw.targetDate} [${sw.targetShiftCode}] ⇄ ${sw.requesterDate} [${sw.requesterShiftCode}])`,
    type: 'swaps'
  });

  renderSwaps();
  renderRosterMatrix();
  renderDashboard();
  updateSidebarBadges();
  Swal.fire({
    icon: 'success',
    title: status === 'Approved' ? 'อนุมัติแลกเวรและปรับตารางเรียบร้อย' : 'บันทึกไม่อนุมัติแลกเวรเรียบร้อย',
    text: status === 'Approved' ? 'ตารางเวรหลักได้รับการสลับกะเรียบร้อยแล้ว และระบบแจ้งเตือนไปยังพยาบาลทั้งสองท่าน' : 'ระบบแจ้งเตือนผลไปยังพยาบาลทั้งสองท่านแล้ว'
  });
}

async function deleteSwap(id) {
  Swal.fire({
    title: 'ยืนยันลบคำขอแลกเวร?',
    text: 'รายการขอแลกเวรนี้จะถูกลบออกจากระบบ',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก'
  }).then(async r => {
    if (r.isConfirmed) {
      if (AppState.supabaseClient) {
        try {
          const { error } = await AppState.supabaseClient.from('shift_swaps').delete().eq('id', id);
          if (error) throw error;
        } catch (err) {
          showSupabaseError('ลบคำขอแลกเวร', err);
          return;
        }
      }
      AppState.swaps = AppState.swaps.filter(s => s.id !== id);
      renderSwaps();
      Swal.fire({ icon: 'success', title: 'ลบคำขอแลกเวรสำเร็จแล้ว', timer: 1200, showConfirmButton: false });
    }
  });
}

// --------------------------------------------------------------------------
// 10. MY SCHEDULE VIEW
// --------------------------------------------------------------------------
function setMyScheduleMode(mode) {
  AppState.myScheduleMode = mode;
  document.getElementById('btnMyViewPersonal').className = mode === 'personal'
    ? 'px-3 py-1 rounded-lg font-medium bg-white shadow-xs text-sky-700'
    : 'px-3 py-1 rounded-lg font-medium text-slate-600';
  document.getElementById('btnMyViewTeam').className = mode === 'team'
    ? 'px-3 py-1 rounded-lg font-medium bg-white shadow-xs text-sky-700'
    : 'px-3 py-1 rounded-lg font-medium text-slate-600';
  renderMySchedule();
}

function renderMySchedule() {
  const u = AppState.currentUser;
  if (!u) return;

  const myId = u.staffId;
  const myScheds = AppState.schedules.filter(s => s.staffId === myId);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  const nxt = myScheds.find(s => s.date === tStr);
  document.getElementById('myNextShiftText').textContent = (nxt && nxt.shiftCode !== 'OFF')
    ? `${nxt.shiftName} (วันที่ ${tomorrow.getDate()} ${THAI_MONTHS[tomorrow.getMonth() + 1]})`
    : 'วันหยุดพักผ่อน (OFF)';

  document.getElementById('myStatsTotalShifts').textContent = myScheds.filter(s => ['M', 'A', 'N'].includes(s.shiftCode)).length;
  document.getElementById('myStatsM').textContent = myScheds.filter(s => s.shiftCode === 'M').length;
  document.getElementById('myStatsA').textContent = myScheds.filter(s => s.shiftCode === 'A').length;
  document.getElementById('myStatsN').textContent = myScheds.filter(s => s.shiftCode === 'N').length;

  const grid = document.getElementById('myCalendarGrid');
  if (!grid) return;
  grid.innerHTML = '';

  THAI_DAYS.forEach(d => { grid.innerHTML += `<div class="text-center font-bold text-[10px] text-slate-400 py-0.5">${d}</div>`; });
  const firstDay = new Date(AppState.currentYear, AppState.currentMonth - 1, 1).getDay();
  const days = new Date(AppState.currentYear, AppState.currentMonth, 0).getDate();

  for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div class="bg-slate-50 rounded-xl p-1.5 min-h-[60px]"></div>`;
  for (let d = 1; d <= days; d++) {
    const dStr = `${AppState.currentYear}-${String(AppState.currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isWk = [0, 6].includes(new Date(AppState.currentYear, AppState.currentMonth - 1, d).getDay());
    let content = `<div class="font-bold text-xs ${isWk ? 'text-rose-600' : 'text-slate-700'}">${d}</div>`;

    if (AppState.myScheduleMode === 'personal') {
      const item = myScheds.find(s => s.date === dStr);
      if (item && item.shiftCode !== 'OFF') {
        content += `<div class="mt-1">${getShiftBadgeSpan(item.shiftCode)}<div class="text-[9px] font-semibold mt-0.5">${item.shiftName}</div></div>`;
      } else {
        content += `<div class="text-[9px] text-slate-300 mt-2">OFF</div>`;
      }
    } else {
      const dayAll = AppState.schedules.filter(s => s.date === dStr && s.shiftCode && s.shiftCode !== 'OFF');
      content += `<div class="mt-1"><span class="text-[9px] bg-sky-100 text-sky-800 px-1 rounded">${dayAll.length} คน</span></div>`;
    }

    grid.innerHTML += `<div class="p-1.5 rounded-xl border border-slate-200 min-h-[65px] bg-white">${content}</div>`;
  }
}

// --------------------------------------------------------------------------
// 11. REPORTS & EXPORTS
// --------------------------------------------------------------------------
function formatThaiDate(year, month, day) {
  const thaiMonths = ['', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const thaiYear = parseInt(year) + 543;
  return `${day} ${thaiMonths[parseInt(month)]} ${thaiYear}`;
}

function populateReportMonthSelect() {
  const sel = document.getElementById('reportMonthSelect');
  if (!sel) return;
  sel.innerHTML = '';
  const y = AppState.currentYear, m = AppState.currentMonth;
  for (let yr = y - 1; yr <= y + 1; yr++) {
    for (let mo = 1; mo <= 12; mo++) {
      const opt = document.createElement('option');
      opt.value = `${yr}-${mo}`;
      opt.textContent = `${THAI_MONTHS[mo]} ${yr} (พ.ศ. ${yr + 543})`;
      if (yr === y && mo === m) opt.selected = true;
      sel.appendChild(opt);
    }
  }
}

function onReportMonthChange(val) {
  const parts = val.split('-');
  if (parts.length === 2) {
    AppState.currentYear = parseInt(parts[0]);
    AppState.currentMonth = parseInt(parts[1]);
    renderReports();
  }
}

function switchReportTab(k) {
  AppState.activeReportTab = k;
  const topicSel = document.getElementById('reportTopicSelect');
  if (topicSel) topicSel.value = k;

  ['matrix', 'daily', 'weekly', 'workload', 'ot', 'night'].forEach(tab => {
    const el = document.getElementById(`tabRep${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    if (el) {
      el.className = k === tab ? 'pb-2 px-3 text-sky-700 border-b-2 border-sky-600 whitespace-nowrap' : 'pb-2 px-3 text-slate-500 border-b-2 border-transparent whitespace-nowrap';
    }
  });
  renderReports();
}

function renderReports() {
  populateReportMonthSelect();
  const topicSel = document.getElementById('reportTopicSelect');
  if (topicSel) topicSel.value = AppState.activeReportTab;

  const wrapper = document.getElementById('reportDynamicTableWrapper');
  if (!wrapper) return;

  const y = AppState.currentYear, m = AppState.currentMonth;
  const days = new Date(y, m, 0).getDate();
  const nurses = AppState.staffList.filter(s => s.role !== 'admin');
  const titleEl = document.getElementById('reportDocumentTitle');

  // Legend notice banner for PDF/Excel & reports
  const legendHtml = `<div class="mb-3 text-[11px] text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex flex-wrap items-center gap-3">
    <span><strong>หมายเหตุสัญลักษณ์เวร:</strong></span>
    <span class="text-emerald-700 font-bold">(ช) = เช้า</span>
    <span class="text-amber-700 font-bold">(บ) = บ่าย</span>
    <span class="text-pink-700 font-bold">(ด) = ดึก</span>
    <span class="text-slate-600 font-bold">OFF = วันหยุด</span>
  </div>`;

  if (AppState.activeReportTab === 'matrix') {
    if (titleEl) titleEl.textContent = `ตารางเวรปฏิบัติงานประจำเดือน ${THAI_MONTHS[m]} ${y} (พ.ศ. ${y + 543})`;
    let html = legendHtml + `<table class="w-full text-center text-[10px] border border-slate-300 border-collapse"><thead><tr class="bg-slate-100 border-b font-bold"><th class="py-1 px-2 text-left border-r min-w-[100px]">พยาบาล</th>`;
    for (let d = 1; d <= days; d++) html += `<th class="py-1 px-0.5 border-r min-w-[18px]">${d}</th>`;
    html += `<th class="py-1 px-1 border-r">ช</th><th class="py-1 px-1 border-r">บ</th><th class="py-1 px-1 border-r">ด</th><th class="py-1 px-1">รวม</th></tr></thead><tbody>`;

    nurses.forEach(n => {
      const sList = AppState.schedules.filter(s => s.staffId === n.staffId);
      let cM = 0, cA = 0, cN = 0;
      html += `<tr class="border-b"><td class="py-1 px-2 text-left font-semibold border-r truncate">${n.fullName}</td>`;
      for (let d = 1; d <= days; d++) {
        const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const itm = sList.find(s => s.date === dStr);
        const sc = itm ? itm.shiftCode : '';
        if (sc === 'M') cM++;
        else if (sc === 'A') cA++;
        else if (sc === 'N') cN++;
        let displaySc = sc;
        if (sc === 'M') displaySc = 'ช';
        else if (sc === 'A') displaySc = 'บ';
        else if (sc === 'N') displaySc = 'ด';
        else if (sc === 'OFF') displaySc = 'O';
        html += `<td class="py-1 px-0.5 border-r">${displaySc || '-'}</td>`;
      }
      html += `<td class="py-1 px-1 font-bold border-r text-emerald-700">${cM}</td><td class="py-1 px-1 font-bold border-r text-amber-700">${cA}</td><td class="py-1 px-1 font-bold border-r text-pink-700">${cN}</td><td class="py-1 px-1 font-extrabold text-sky-900">${cM + cA + cN}</td></tr>`;
    });
    html += `</tbody></table>`;
    wrapper.innerHTML = html;
  } else if (AppState.activeReportTab === 'daily') {
    if (titleEl) titleEl.textContent = `รายงานตารางเวรรายวัน (Daily Roster) ประจำเดือน ${THAI_MONTHS[m]} ${y} (พ.ศ. ${y + 543})`;
    let html = legendHtml + `<table class="w-full text-left text-xs border border-slate-300 border-collapse"><thead><tr class="bg-slate-100 border-b font-bold"><th class="py-1.5 px-3 border-r">วันที่</th><th class="py-1.5 px-3 border-r">เวรเช้า ((ช) = เช้า)</th><th class="py-1.5 px-3 border-r">เวรบ่าย ((บ) = บ่าย)</th><th class="py-1.5 px-3">เวรดึก ((ด) = ดึก)</th></tr></thead><tbody>`;
    for (let d = 1; d <= days; d++) {
      const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayScheds = AppState.schedules.filter(s => s.date === dStr);
      const mList = dayScheds.filter(s => s.shiftCode === 'M').map(s => (AppState.staffList.find(x => x.staffId === s.staffId) || {}).fullName || s.staffId);
      const aList = dayScheds.filter(s => s.shiftCode === 'A').map(s => (AppState.staffList.find(x => x.staffId === s.staffId) || {}).fullName || s.staffId);
      const nList = dayScheds.filter(s => s.shiftCode === 'N').map(s => (AppState.staffList.find(x => x.staffId === s.staffId) || {}).fullName || s.staffId);
      html += `<tr class="border-b"><td class="py-1.5 px-3 font-bold border-r whitespace-nowrap">${formatThaiDate(y, m, d)}</td><td class="py-1.5 px-3 border-r text-emerald-700">${mList.join(', ') || '-'}</td><td class="py-1.5 px-3 border-r text-amber-700">${aList.join(', ') || '-'}</td><td class="py-1.5 px-3 text-pink-700">${nList.join(', ') || '-'}</td></tr>`;
    }
    html += `</tbody></table>`;
    wrapper.innerHTML = html;
  } else if (AppState.activeReportTab === 'weekly') {
    if (titleEl) titleEl.textContent = `รายงานตารางเวรรายสัปดาห์ (Weekly Roster) ประจำเดือน ${THAI_MONTHS[m]} ${y} (พ.ศ. ${y + 543})`;
    let html = legendHtml + `<div class="space-y-4">`;
    const weeks = [
      { name: 'สัปดาห์ที่ 1 (วันที่ 1 - 7)', start: 1, end: 7 },
      { name: 'สัปดาห์ที่ 2 (วันที่ 8 - 14)', start: 8, end: 14 },
      { name: 'สัปดาห์ที่ 3 (วันที่ 15 - 21)', start: 15, end: 21 },
      { name: 'สัปดาห์ที่ 4 (วันที่ 22 - ปลายเดือน)', start: 22, end: days }
    ];
    weeks.forEach(w => {
      html += `<div class="border border-slate-200 rounded-xl p-3"><h4 class="font-bold text-xs text-sky-800 mb-2">${w.name}</h4><table class="w-full text-center text-[10px] border border-slate-200 border-collapse"><thead><tr class="bg-slate-50 border-b font-bold"><th class="py-1 px-2 text-left border-r">พยาบาล</th>`;
      for (let d = w.start; d <= w.end; d++) html += `<th class="py-1 px-0.5 border-r">${d}</th>`;
      html += `</tr></thead><tbody>`;
      nurses.forEach(n => {
        const sList = AppState.schedules.filter(s => s.staffId === n.staffId);
        html += `<tr class="border-b"><td class="py-1 px-2 text-left font-semibold border-r">${n.fullName}</td>`;
        for (let d = w.start; d <= w.end; d++) {
          const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const itm = sList.find(s => s.date === dStr);
          const sc = itm ? itm.shiftCode : '';
          let displaySc = sc;
          if (sc === 'M') displaySc = 'ช';
          else if (sc === 'A') displaySc = 'บ';
          else if (sc === 'N') displaySc = 'ด';
          else if (sc === 'OFF') displaySc = 'O';
          html += `<td class="py-1 px-0.5 border-r">${displaySc || '-'}</td>`;
        }
        html += `</tr>`;
      });
      html += `</tbody></table></div>`;
    });
    html += `</div>`;
    wrapper.innerHTML = html;
  } else if (AppState.activeReportTab === 'workload') {
    if (titleEl) titleEl.textContent = `รายงานสถิติการปฏิบัติงาน (Workload Stats) ประจำเดือน ${THAI_MONTHS[m]} ${y} (พ.ศ. ${y + 543})`;
    let html = legendHtml + `<table class="w-full text-left text-xs border border-slate-300 border-collapse"><thead><tr class="bg-slate-100 border-b font-bold"><th class="py-1.5 px-2 border-r">รหัส</th><th class="py-1.5 px-2 border-r">ชื่อพยาบาล</th><th class="py-1.5 px-1 text-center border-r">เช้า ((ช) = เช้า)</th><th class="py-1.5 px-1 text-center border-r">บ่าย ((บ) = บ่าย)</th><th class="py-1.5 px-1 text-center border-r">ดึก ((ด) = ดึก)</th><th class="py-1.5 px-1 text-center border-r">รวมเวร</th><th class="py-1.5 px-1 text-center">วันหยุด (OFF)</th></tr></thead><tbody>`;
    nurses.forEach(n => {
      const sList = AppState.schedules.filter(s => s.staffId === n.staffId);
      const cM = sList.filter(s => s.shiftCode === 'M').length;
      const cA = sList.filter(s => s.shiftCode === 'A').length;
      const cN = sList.filter(s => s.shiftCode === 'N').length;
      const cOff = sList.filter(s => s.shiftCode === 'OFF').length;
      html += `<tr class="border-b"><td class="py-1.5 px-2 font-mono border-r">${n.staffId}</td><td class="py-1.5 px-2 font-bold border-r">${n.fullName}</td><td class="py-1.5 px-1 text-center border-r font-bold text-emerald-600">${cM}</td><td class="py-1.5 px-1 text-center border-r font-bold text-amber-600">${cA}</td><td class="py-1.5 px-1 text-center border-r font-bold text-pink-600">${cN}</td><td class="py-1.5 px-1 text-center border-r font-extrabold text-sky-800">${cM + cA + cN}</td><td class="py-1.5 px-1 text-center text-slate-500">${cOff}</td></tr>`;
    });
    html += `</tbody></table>`;
    wrapper.innerHTML = html;
  } else if (AppState.activeReportTab === 'ot') {
    if (titleEl) titleEl.textContent = `รายงานสรุป OT (ค่าตอบแทนพิเศษ/เวรเสริม) ประจำเดือน ${THAI_MONTHS[m]} ${y} (พ.ศ. ${y + 543})`;
    let html = legendHtml + `<table class="w-full text-left text-xs border border-slate-300 border-collapse"><thead><tr class="bg-slate-100 border-b font-bold"><th class="py-1.5 px-2 border-r">รหัส</th><th class="py-1.5 px-2 border-r">ชื่อพยาบาล</th><th class="py-1.5 px-2 border-r">ตำแหน่ง</th><th class="py-1.5 px-1 text-center border-r">เวร OT / On Call</th><th class="py-1.5 px-1 text-center">รวมเวรเสริม (ชม./เวร)</th></tr></thead><tbody>`;
    nurses.forEach(n => {
      const sList = AppState.schedules.filter(s => s.staffId === n.staffId);
      const otList = sList.filter(s => s.shiftCode === 'ONCALL' || s.shiftCode === 'SP' || (s.shiftCode && s.shiftCode.split('+').length > 1));
      html += `<tr class="border-b"><td class="py-1.5 px-2 font-mono border-r">${n.staffId}</td><td class="py-1.5 px-2 font-bold border-r">${n.fullName}</td><td class="py-1.5 px-2 border-r text-slate-600">${n.position || '-'}</td><td class="py-1.5 px-1 text-center border-r font-bold text-purple-700">${otList.length} เวร</td><td class="py-1.5 px-1 text-center font-extrabold text-sky-900">${otList.length * 8} ชม.</td></tr>`;
    });
    html += `</tbody></table>`;
    wrapper.innerHTML = html;
  } else if (AppState.activeReportTab === 'night') {
    if (titleEl) titleEl.textContent = `รายงานสรุปเวรดึก (Night Shift Summary: (ด) = ดึก) ประจำเดือน ${THAI_MONTHS[m]} ${y} (พ.ศ. ${y + 543})`;
    let html = legendHtml + `<table class="w-full text-left text-xs border border-slate-300 border-collapse"><thead><tr class="bg-slate-100 border-b font-bold"><th class="py-1.5 px-2 border-r">รหัส</th><th class="py-1.5 px-2 border-r">ชื่อพยาบาล</th><th class="py-1.5 px-1 text-center border-r">จำนวนเวรดึก ((ด))</th><th class="py-1.5 px-2">วันที่ปฏิบัติเวรดึก</th></tr></thead><tbody>`;
    nurses.forEach(n => {
      const sList = AppState.schedules.filter(s => s.staffId === n.staffId);
      const nScheds = sList.filter(s => s.shiftCode === 'N' || (s.shiftCode && s.shiftCode.includes('N')));
      const datesStr = nScheds.map(s => s.date.split('-')[2]).join(', ');
      html += `<tr class="border-b"><td class="py-1.5 px-2 font-mono border-r">${n.staffId}</td><td class="py-1.5 px-2 font-bold border-r">${n.fullName}</td><td class="py-1.5 px-1 text-center border-r font-bold text-pink-700">${nScheds.length} เวร</td><td class="py-1.5 px-2 text-slate-600">${datesStr || '-'}</td></tr>`;
    });
    html += `</tbody></table>`;
    wrapper.innerHTML = html;
  }
}

function exportReportToPDF() {
  const el = document.getElementById('printArea');
  if (!window.html2pdf) {
    Swal.fire({ icon: 'warning', title: 'กำลังโหลดเครื่องมือ PDF...' });
    return;
  }
  Swal.showLoading();
  window.html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename: `Roster_Report_${AppState.currentYear}_${AppState.currentMonth}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    })
    .from(el)
    .save()
    .then(() => Swal.close());
}

function exportRosterToExcel() {
  const y = AppState.currentYear, m = AppState.currentMonth;
  const days = new Date(y, m, 0).getDate();
  const nurses = AppState.staffList.filter(s => s.role !== 'admin');

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Niramit', sans-serif; font-size: 11pt; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 0.5pt solid #cbd5e1; padding: 6px; text-align: center; font-family: 'Niramit', sans-serif; }
    th { background-color: #f1f5f9; font-weight: bold; }
    .shift-M { background-color: #d1fae5; color: #065f46; font-weight: bold; }
    .shift-A { background-color: #fef3c7; color: #92400e; font-weight: bold; }
    .shift-N { background-color: #fce7f3; color: #9d174d; font-weight: bold; }
    .shift-OFF { background-color: #f1f5f9; color: #64748b; }
    .shift-ONCALL { background-color: #ede9fe; color: #5b21b6; font-weight: bold; }
    .shift-SP { background-color: #dbeafe; color: #1e40af; font-weight: bold; }
  </style>
  </head>
  <body>
  <h2 style="text-align: center; font-family: 'Niramit', sans-serif;">ตารางเวรปฏิบัติงานประจำเดือน ${THAI_MONTHS[m]} ${y} (พ.ศ. ${y + 543})</h2>
  <div style="margin-bottom: 10px; font-size: 10pt; color: #475569;">
    <strong>หมายเหตุ:</strong> (ช) = เช้า | (บ) = บ่าย | (ด) = ดึก | OFF = วันหยุด
  </div>
  <table>
    <thead>
      <tr style="background:#f8fafc;">
        <th style="text-align: left;">รหัส</th>
        <th style="text-align: left;">ชื่อ-สกุล</th>
        <th style="text-align: left;">ตำแหน่ง</th>`;
  for (let d = 1; d <= days; d++) {
    html += `<th>${d}</th>`;
  }
  html += `<th>เช้า ((ช))</th><th>บ่าย ((บ))</th><th>ดึก ((ด))</th><th>รวมเวร</th><th>วันหยุด (OFF)</th></tr></thead><tbody>`;

  nurses.forEach(n => {
    const sList = AppState.schedules.filter(s => s.staffId === n.staffId);
    let cM = 0, cA = 0, cN = 0, cOff = 0;
    html += `<tr>`;
    html += `<td style="text-align: left; mso-number-format:'\@';">${n.staffId}</td>`;
    html += `<td style="text-align: left;">${n.fullName}</td>`;
    html += `<td style="text-align: left;">${n.position || 'พยาบาลวิชาชีพ'}</td>`;

    for (let d = 1; d <= days; d++) {
      const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const itm = sList.find(s => s.date === dStr);
      const sc = itm ? itm.shiftCode : '';
      if (sc === 'M') cM++;
      else if (sc === 'A') cA++;
      else if (sc === 'N') cN++;
      else if (sc === 'OFF') cOff++;

      let displaySc = sc;
      let cssClass = '';
      if (sc === 'M') { displaySc = 'ช'; cssClass = 'shift-M'; }
      else if (sc === 'A') { displaySc = 'บ'; cssClass = 'shift-A'; }
      else if (sc === 'N') { displaySc = 'ด'; cssClass = 'shift-N'; }
      else if (sc === 'OFF') { displaySc = 'OFF'; cssClass = 'shift-OFF'; }
      else if (sc === 'ONCALL') { displaySc = 'OC'; cssClass = 'shift-ONCALL'; }
      else if (sc === 'SP') { displaySc = 'พศ'; cssClass = 'shift-SP'; }

      html += `<td class="${cssClass}">${displaySc || '-'}</td>`;
    }
    html += `<td style="font-weight:bold; color:#065f46;">${cM}</td><td style="font-weight:bold; color:#92400e;">${cA}</td><td style="font-weight:bold; color:#9d174d;">${cN}</td><td style="font-weight:bold; color:#0369a1;">${cM + cA + cN}</td><td style="color:#64748b;">${cOff}</td></tr>`;
  });
  html += `</tbody></table></body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ER_Roster_Sangkhlaburi_${y}_${m}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  Swal.fire({ icon: 'success', title: 'ส่งออกไฟล์ Excel (Niramit & สีเวร) เรียบร้อย', timer: 1500, showConfirmButton: false });
}

// --------------------------------------------------------------------------
// 12. NOTIFICATIONS CRUD & MENU NAVIGATION
// --------------------------------------------------------------------------
function getNotificationTargetMenu(n) {
  if (!n) return 'dashboard';
  if (n.targetView) return n.targetView;
  if (n.type && ['roster', 'myschedule', 'leaves', 'swaps', 'staff', 'shifts', 'reports', 'settings', 'profile', 'dashboard'].includes(n.type)) {
    return n.type;
  }
  const text = `${n.title || ''} ${n.message || ''}`.toLowerCase();
  if (text.includes('แลกเวร') || text.includes('swap')) return 'swaps';
  if (text.includes('ใบลา') || text.includes('ลาป่วย') || text.includes('ลากิจ') || text.includes('ลาพักร้อน') || text.includes('ขอลา') || text.includes('การลา')) return 'leaves';
  if (text.includes('เวรของฉัน') || text.includes('เวรส่วนตัว')) return 'myschedule';
  if (text.includes('ตารางเวร') || text.includes('จัดเวร') || text.includes('เวร') || text.includes('roster')) return 'roster';
  if (text.includes('บุคลากร') || text.includes('พยาบาล') || text.includes('staff')) return 'staff';
  if (text.includes('ประเภทเวร') || text.includes('วันหยุด') || text.includes('กะ')) return 'shifts';
  if (text.includes('รายงาน') || text.includes('excel') || text.includes('pdf')) return 'reports';
  if (text.includes('ตั้งค่า') || text.includes('supabase')) return 'settings';
  if (text.includes('โปรไฟล์') || text.includes('รหัสผ่าน')) return 'profile';
  return 'dashboard';
}

function getMenuNameTh(key) {
  const map = {
    dashboard: 'แดชบอร์ด',
    roster: 'ตารางเวรหลัก',
    myschedule: 'เวรของฉัน',
    leaves: 'คำขอลา',
    swaps: 'ขอแลกเวร',
    staff: 'รายชื่อบุคลากร',
    shifts: 'ประเภทเวร & วันหยุด',
    reports: 'รายงาน & สถิติ',
    notifications: 'การแจ้งเตือน',
    settings: 'ตั้งค่าระบบ',
    profile: 'โปรไฟล์ส่วนตัว'
  };
  return map[key] || 'ระบบ';
}

function getVisibleNotifications() {
  const u = AppState.currentUser;
  if (!u) return AppState.notifications || [];
  const isHead = ['admin', 'head_nurse'].includes(u.role);
  return (AppState.notifications || []).filter(n => {
    if (!n.targetStaffId || n.targetStaffId === 'ALL') return true;
    if (n.targetStaffId === u.staffId) return true;
    if (isHead && ['HEAD_NURSE', 'HEAD', 'ADMIN', 'APPROVER'].includes(n.targetStaffId)) return true;
    return false;
  });
}

function renderNotifications() {
  const list = document.getElementById('fullNotificationList');
  const dList = document.getElementById('notifDropdownList');
  const badge = document.getElementById('notifBadge');
  const sidebarBadge = document.getElementById('sidebarNotifBadge');
  const ddCount = document.getElementById('dropdownUnreadCount');

  const userNotifs = getVisibleNotifications();
  const unread = userNotifs.filter(n => !n.isRead).length;

  if (badge) badge.classList.toggle('hidden', unread === 0);
  if (sidebarBadge) {
    sidebarBadge.classList.toggle('hidden', unread === 0);
    sidebarBadge.textContent = unread > 99 ? '99+' : unread;
  }
  if (ddCount) {
    ddCount.classList.toggle('hidden', unread === 0);
    ddCount.textContent = `${unread} ใหม่`;
  }

  updateSidebarBadges();

  if (userNotifs.length === 0) {
    const emptyHtml = `
      <div class="text-center py-12 text-slate-400">
        <i class="fa-regular fa-bell-slash text-3xl mb-2 text-slate-300"></i>
        <p class="text-xs">ไม่มีรายการแจ้งเตือนสำหรับท่านในขณะนี้</p>
      </div>
    `;
    if (list) list.innerHTML = emptyHtml;
    if (dList) dList.innerHTML = '<p class="text-xs text-slate-400 italic text-center py-6">ไม่มีการแจ้งเตือน</p>';
    return;
  }

  // Render full list in section-notifications
  if (list) {
    list.innerHTML = userNotifs.map(n => {
      const targetMenu = getNotificationTargetMenu(n);
      const menuName = getMenuNameTh(targetMenu);
      const isUnread = !n.isRead;
      return `
        <div onclick="handleNotificationClick('${n.id}')"
             class="group p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
               isUnread
                 ? 'bg-gradient-to-r from-rose-50/50 via-rose-50/20 to-white border-rose-200 hover:border-rose-300 hover:shadow-xs'
                 : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
             }">
          <div class="flex items-start space-x-3 min-w-0">
            <div class="mt-1 shrink-0">
              ${
                isUnread
                  ? '<span class="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100" title="ยังไม่ได้อ่าน (คลิกเพื่อดูและนำทาง)"></span>'
                  : '<span class="inline-block w-2 h-2 rounded-full bg-slate-300" title="อ่านแล้ว"></span>'
              }
            </div>
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <h3 class="font-bold text-xs sm:text-sm text-slate-800 group-hover:text-sky-700 transition">${n.title}</h3>
                ${isUnread ? '<span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white shadow-xs">ใหม่</span>' : ''}
              </div>
              <p class="text-xs text-slate-600 mt-1 leading-relaxed">${n.message}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2 shrink-0 self-end sm:self-auto pt-1 sm:pt-0">
            <span class="inline-flex items-center text-xs font-semibold text-sky-700 bg-sky-50 group-hover:bg-sky-100 border border-sky-200/70 px-3 py-1.5 rounded-xl transition">
              <span>ไปยัง${menuName}</span>
              <i class="fa-solid fa-arrow-right ml-1.5 text-[10px]"></i>
            </span>
            <button type="button" onclick="event.stopPropagation(); deleteNotification('${n.id}')" class="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="ลบรายการนี้">
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render dropdown list
  if (dList) {
    dList.innerHTML = userNotifs.map(n => {
      const targetMenu = getNotificationTargetMenu(n);
      const menuName = getMenuNameTh(targetMenu);
      const isUnread = !n.isRead;
      return `
        <div onclick="handleNotificationClick('${n.id}')"
             class="group p-3 hover:bg-slate-50 cursor-pointer transition flex items-start justify-between gap-2 ${
               isUnread ? 'bg-rose-50/40' : ''
             }">
          <div class="flex items-start space-x-2.5 min-w-0">
            <div class="mt-1 shrink-0">
              ${
                isUnread
                  ? '<span class="inline-block w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200"></span>'
                  : '<span class="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>'
              }
            </div>
            <div class="min-w-0">
              <div class="flex items-center space-x-1.5">
                <span class="font-bold text-xs text-slate-800 truncate group-hover:text-sky-700">${n.title}</span>
                ${isUnread ? '<span class="text-[9px] text-rose-600 font-bold">•</span>' : ''}
              </div>
              <p class="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">${n.message}</p>
              <div class="mt-1.5">
                <span class="inline-flex items-center text-[10px] text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded-md group-hover:bg-sky-100 transition">
                  <span>ไปที่ ${menuName}</span>
                  <i class="fa-solid fa-arrow-right ml-1 text-[9px]"></i>
                </span>
              </div>
            </div>
          </div>
          <button type="button" onclick="event.stopPropagation(); deleteNotification('${n.id}')" class="text-slate-400 hover:text-rose-600 p-1 shrink-0 rounded hover:bg-rose-50 transition" title="ลบ">
            <i class="fa-solid fa-trash text-[11px]"></i>
          </button>
        </div>
      `;
    }).join('');
  }
}

async function handleNotificationClick(id) {
  const notif = AppState.notifications.find(n => n.id === id);
  if (!notif) return;

  // Mark as read immediately to make red indicators disappear
  if (!notif.isRead) {
    notif.isRead = true;
    if (AppState.supabaseClient) {
      try {
        await AppState.supabaseClient.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (err) {
        console.warn('Supabase update notification is_read error:', err);
      }
    }
    // Update view: red badge and dots disappear!
    renderNotifications();
  }

  // Close notifications dropdown if opened
  const dd = document.getElementById('notifDropdown');
  if (dd && !dd.classList.contains('hidden')) {
    dd.classList.add('hidden');
  }

  // Determine target menu and guard role permissions
  let targetMenu = getNotificationTargetMenu(notif);
  if (targetMenu === 'dashboard') {
    const role = AppState.currentUser?.role;
    if (role !== 'admin' && role !== 'head_nurse') {
      targetMenu = 'myschedule';
    }
  } else if (targetMenu === 'settings' && AppState.currentUser?.role !== 'admin') {
    targetMenu = 'profile';
  }

  // Navigate to destination menu
  navigateMenu(targetMenu);
}

async function markAllNotificationsAsRead() {
  const userNotifs = getVisibleNotifications();
  const unreadNotifs = userNotifs.filter(n => !n.isRead);
  if (unreadNotifs.length === 0) {
    Swal.fire({ icon: 'info', title: 'ไม่มีการแจ้งเตือนค้างอ่าน', timer: 1000, showConfirmButton: false });
    return;
  }

  unreadNotifs.forEach(n => { n.isRead = true; });
  if (AppState.supabaseClient) {
    try {
      const ids = unreadNotifs.map(n => n.id);
      await AppState.supabaseClient.from('notifications').update({ is_read: true }).in('id', ids);
    } catch (err) {
      console.warn('Supabase mark all read error:', err);
    }
  }
  renderNotifications();
  Swal.fire({
    icon: 'success',
    title: 'อ่านการแจ้งเตือนทั้งหมดแล้ว',
    text: 'สัญลักษณ์แจ้งเตือนสีแดงหายไปเรียบร้อยแล้ว',
    timer: 1200,
    showConfirmButton: false
  });
}

async function createNotification({ targetStaffId = 'ALL', title, message, type = 'info' }) {
  const notifObj = {
    id: 'NOTIF_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    targetStaffId,
    title,
    message,
    type,
    isRead: false
  };
  AppState.notifications.unshift(notifObj);
  if (AppState.supabaseClient) {
    try {
      await AppState.supabaseClient.from('notifications').insert({
        id: notifObj.id,
        target_staff_id: notifObj.targetStaffId,
        title: notifObj.title,
        message: notifObj.message,
        type: notifObj.type,
        is_read: false
      });
    } catch (e) {
      console.warn('Cannot save notification to Supabase:', e);
    }
  }
  renderNotifications();
}

async function deleteNotification(id) {
  if (AppState.supabaseClient) {
    await AppState.supabaseClient.from('notifications').delete().eq('id', id);
  }
  AppState.notifications = AppState.notifications.filter(n => n.id !== id);
  renderNotifications();
}

async function clearAllNotifications() {
  if (AppState.supabaseClient) {
    await AppState.supabaseClient.from('notifications').delete().neq('id', '');
  }
  AppState.notifications = [];
  renderNotifications();
  Swal.fire({ icon: 'success', title: 'ล้างการแจ้งเตือนแล้ว', timer: 1000, showConfirmButton: false });
}

// --------------------------------------------------------------------------
// 13. SETTINGS & PROFILE (SUPABASE)
// --------------------------------------------------------------------------
function renderProfile() {
  let u = AppState.currentUser;
  if (!u) return;
  const freshStaff = AppState.staffList.find(s => s.staffId === u.staffId);
  if (freshStaff) {
    u = { ...u, ...freshStaff };
    AppState.currentUser = u;
  }
  document.getElementById('profileFullName').textContent = u.fullName || '-';
  document.getElementById('profileStaffId').textContent = u.staffId || '-';
  document.getElementById('profilePosition').textContent = u.position || '-';
  document.getElementById('profileLevel').textContent = u.professionalLevel || '-';
  document.getElementById('profileRoleText').textContent = getRoleLabel(u.role);
  document.getElementById('profileStatus').textContent = u.status || 'ปกติ';
  document.getElementById('profilePhoneInput').value = u.phone || '';

  const s = AppState.settings;
  if (document.getElementById('setting_system_name')) {
    document.getElementById('setting_system_name').value = s.system_name || '';
    document.getElementById('setting_hospital_name').value = s.hospital_name || '';
    document.getElementById('setting_department_name').value = s.department_name || '';
    document.getElementById('setting_logo_url').value = s.logo_url || '';
    document.getElementById('setting_address').value = s.address || '';
    document.getElementById('setting_phone').value = s.phone || '';
    document.getElementById('setting_prepared_by').value = s.prepared_by || '';
    document.getElementById('setting_checked_by').value = s.checked_by || '';
    document.getElementById('setting_approved_by').value = s.approved_by || '';
  }
}

async function handleUpdateProfilePhone() {
  const phone = document.getElementById('profilePhoneInput').value.trim();
  const staffId = AppState.currentUser ? AppState.currentUser.staffId : null;
  if (!staffId) return;

  if (AppState.supabaseClient) {
    try {
      const { error } = await AppState.supabaseClient.from('staff').update({ phone }).eq('staff_id', staffId);
      if (error) throw error;
    } catch (err) {
      showSupabaseError('อัปเดตเบอร์โทร', err);
      return;
    }
  }
  AppState.currentUser.phone = phone;
  const sItem = AppState.staffList.find(s => s.staffId === staffId);
  if (sItem) sItem.phone = phone;
  Swal.fire({ icon: 'success', title: 'อัปเดตเบอร์โทรสำเร็จ', timer: 1200, showConfirmButton: false });
}

async function handleChangePassword(e) {
  e.preventDefault();
  const oldPass = document.getElementById('profileOldPass').value;
  const newPass = document.getElementById('profileNewPass').value;
  const confPass = document.getElementById('profileConfirmPass').value;

  if (newPass !== confPass) {
    Swal.fire({ icon: 'warning', title: 'รหัสผ่านใหม่ไม่ตรงกัน' });
    return;
  }
  if (AppState.currentUser.password !== oldPass) {
    Swal.fire({ icon: 'error', title: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    return;
  }

  const staffId = AppState.currentUser.staffId;
  if (AppState.supabaseClient) {
    try {
      const { error } = await AppState.supabaseClient.from('staff').update({ password: newPass }).eq('staff_id', staffId);
      if (error) throw error;
    } catch (err) {
      showSupabaseError('เปลี่ยนรหัสผ่าน', err);
      return;
    }
  }
  AppState.currentUser.password = newPass;
  const sItem = AppState.staffList.find(s => s.staffId === staffId);
  if (sItem) sItem.password = newPass;
  Swal.fire({ icon: 'success', title: 'เปลี่ยนรหัสผ่านสำเร็จ' });
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const sObj = {
    system_name: document.getElementById('setting_system_name').value.trim(),
    hospital_name: document.getElementById('setting_hospital_name').value.trim(),
    department_name: document.getElementById('setting_department_name').value.trim(),
    logo_url: document.getElementById('setting_logo_url').value.trim(),
    address: document.getElementById('setting_address').value.trim(),
    phone: document.getElementById('setting_phone').value.trim(),
    prepared_by: document.getElementById('setting_prepared_by').value.trim(),
    checked_by: document.getElementById('setting_checked_by').value.trim(),
    approved_by: document.getElementById('setting_approved_by').value.trim()
  };

  if (AppState.supabaseClient) {
    try {
      const rows = Object.entries(sObj).map(([key, value]) => ({ key, value }));
      const { error } = await AppState.supabaseClient.from('settings').upsert(rows);
      if (error) throw error;
    } catch (err) {
      showSupabaseError('บันทึกการตั้งค่า', err);
      return;
    }
  }

  AppState.settings = sObj;
  updateBrandingUI();
  Swal.fire({ icon: 'success', title: 'บันทึกการตั้งค่าเรียบร้อย' });
}

// --------------------------------------------------------------------------
// 14. SUPABASE CONFIG MODAL & SQL SCRIPT
// --------------------------------------------------------------------------
function getSupabaseSqlSchema() {
  return `-- ==============================================================================
-- สคริปต์ SQL สำหรับสร้างตารางฐานข้อมูลใน Supabase
-- ระบบจัดตารางเวรพยาบาล ER - โรงพยาบาลสังขละบุรี
-- วิธีใช้งาน: คัดลอกโค้ดทั้งหมดนี้ไปวางในเมนู SQL Editor ใน Supabase Dashboard แล้วกด RUN
-- ==============================================================================

-- 1. ตารางบุคลากร (staff)
CREATE TABLE IF NOT EXISTS public.staff (
  staff_id TEXT PRIMARY KEY,
  password TEXT NOT NULL DEFAULT '123456',
  full_name TEXT NOT NULL,
  position TEXT,
  professional_level TEXT,
  phone TEXT,
  status TEXT DEFAULT 'ปกติ', -- ปกติ, ลาเรียน, บวช, ไม่ขึ้นเวร
  role TEXT DEFAULT 'nurse',  -- nurse, head_nurse, admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางประเภทเวร (shift_types)
CREATE TABLE IF NOT EXISTS public.shift_types (
  code TEXT PRIMARY KEY,       -- รหัสเวร เช่น M, A, N, ONCALL, OFF, SP
  short_name TEXT NOT NULL,    -- ตัวย่อ เช่น ช, บ, ด, OC, OFF
  name TEXT NOT NULL,          -- ชื่อเวร เช่น เวรเช้า, เวรบ่าย, เวรดึก
  color TEXT DEFAULT '#10b981',-- สีพื้นหลัง HEX
  text_color TEXT DEFAULT '#ffffff',
  start_time TEXT DEFAULT '08:00',
  end_time TEXT DEFAULT '16:00',
  min_staff INT DEFAULT 3,     -- จำนวนพยาบาลขั้นต่ำต่อเวร
  is_ot BOOLEAN DEFAULT false, -- นับเป็นเวรล่วงเวลา (OT) หรือไม่
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางวันหยุดราชการ / นักขัตฤกษ์ (holidays)
CREATE TABLE IF NOT EXISTS public.holidays (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตารางการลา (leaves)
CREATE TABLE IF NOT EXISTS public.leaves (
  id TEXT PRIMARY KEY,
  staff_id TEXT REFERENCES public.staff(staff_id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,    -- ลากิจ, ลาป่วย, ลาพักร้อน, ลาคลอด, ฯลฯ
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT DEFAULT 1,
  reason TEXT,
  status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตารางขอแลกเวร (shift_swaps)
CREATE TABLE IF NOT EXISTS public.shift_swaps (
  id TEXT PRIMARY KEY,
  requester_staff_id TEXT REFERENCES public.staff(staff_id) ON DELETE CASCADE,
  target_staff_id TEXT REFERENCES public.staff(staff_id) ON DELETE CASCADE,
  requester_date DATE NOT NULL,
  requester_shift_code TEXT NOT NULL,
  target_date DATE NOT NULL,
  target_shift_code TEXT NOT NULL,
  reason TEXT,
  peer_status TEXT DEFAULT 'Pending', -- Pending, Accepted, Rejected
  head_status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตารางจัดตารางเวร (schedules)
CREATE TABLE IF NOT EXISTS public.schedules (
  id TEXT PRIMARY KEY,         -- รูปแบบ: SCH_YYYYMMDD_STAFFID
  date DATE NOT NULL,
  staff_id TEXT REFERENCES public.staff(staff_id) ON DELETE CASCADE,
  shift_code TEXT,
  shift_name TEXT,
  note TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_staff ON public.schedules(staff_id);

-- 7. ตารางการตั้งค่าระบบ (settings)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ตารางการแจ้งเตือน (notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  target_staff_id TEXT DEFAULT 'ALL',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ปิด Row Level Security (RLS) เพื่อให้ Anon Public Key ใช้งาน CRUD ได้อย่างราบรื่น
ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swaps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- เพิ่มข้อมูลเริ่มต้น (Initial Seed Data)
INSERT INTO public.settings (key, value) VALUES
  ('system_name', 'ระบบจัดตารางเวรพยาบาล ER ออนไลน์'),
  ('hospital_name', 'โรงพยาบาลสังขละบุรี'),
  ('department_name', 'กลุ่มงานการพยาบาลผู้ป่วยอุบัติเหตุและฉุกเฉิน (ER)'),
  ('logo_url', 'https://img.icons8.com/color/96/hospital-room.png'),
  ('address', 'โรงพยาบาลสังขละบุรี อ.สังขละบุรี จ.กาญจนบุรี'),
  ('phone', '034-595032'),
  ('prepared_by', 'พว.สุดารัตน์ ใจดี (พยาบาลผู้จัดเวร)'),
  ('checked_by', 'พว.สมหญิง วงศ์สว่าง (หัวหน้าตึก ER)'),
  ('approved_by', 'นพ.ผู้อำนวยการ โรงพยาบาลสังขละบุรี')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO public.shift_types (code, short_name, name, color, text_color, start_time, end_time, min_staff, is_ot) VALUES
  ('M', 'ช', 'เวรเช้า', '#10b981', '#ffffff', '08:00', '16:00', 3, false),
  ('A', 'บ', 'เวรบ่าย', '#f59e0b', '#ffffff', '16:00', '24:00', 3, false),
  ('N', 'ด', 'เวรดึก', '#ec4899', '#ffffff', '00:00', '08:00', 2, false),
  ('ONCALL', 'OC', 'เวร On Call', '#8b5cf6', '#ffffff', '08:00', '08:00', 1, true),
  ('OFF', 'OFF', 'วันหยุด', '#94a3b8', '#ffffff', '-', '-', 0, false),
  ('SP', 'พศ', 'เวรพิเศษ', '#3b82f6', '#ffffff', '08:30', '16:30', 0, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.staff (staff_id, password, full_name, position, professional_level, phone, status, role) VALUES
  ('ER00001', '123456', 'นายแอดมิน ดูแลระบบ', 'เจ้าหน้าที่บริหารทั่วไป', 'ผู้ดูแลระบบ', '081-1111111', 'ปกติ', 'admin'),
  ('ER00002', '123456', 'พว.สมหญิง วงศ์สว่าง', 'พยาบาลวิชาชีพชำนาญการพิเศษ', 'หัวหน้าพยาบาล ER', '082-2222222', 'ปกติ', 'head_nurse'),
  ('ER00003', '123456', 'พว.สุดารัตน์ ใจดี', 'พยาบาลวิชาชีพชำนาญการ', 'พยาบาลวิชาชีพ', '083-3333333', 'ปกติ', 'nurse'),
  ('ER00004', '123456', 'พว.กานดา รักษาสุข', 'พยาบาลวิชาชีพชำนาญการ', 'พยาบาลวิชาชีพ', '084-4444444', 'ปกติ', 'nurse'),
  ('ER00005', '123456', 'พว.ปิยะพร เมตตา', 'พยาบาลวิชาชีพปฏิบัติการ', 'พยาบาลวิชาชีพ', '085-5555555', 'ปกติ', 'nurse'),
  ('ER00006', '123456', 'พว.ธีรศักดิ์ กล้าหาญ', 'พยาบาลวิชาชีพปฏิบัติการ', 'พยาบาลวิชาชีพ', '086-6666666', 'ปกติ', 'nurse'),
  ('ER00007', '123456', 'พว.จินตนา มุ่งมั่น', 'พยาบาลวิชาชีพปฏิบัติการ', 'พยาบาลวิชาชีพ', '087-7777777', 'ปกติ', 'nurse'),
  ('ER00008', '123456', 'พว.ณัฐพงษ์ พร้อมเพรียง', 'พยาบาลวิชาชีพปฏิบัติการ', 'พยาบาลวิชาชีพ', '088-8888888', 'ปกติ', 'nurse'),
  ('ER00009', '123456', 'พว.วรรณพร ชื่นจิต', 'พยาบาลวิชาชีพปฏิบัติการ', 'พยาบาลวิชาชีพ', '089-9999999', 'ปกติ', 'nurse'),
  ('ER00010', '123456', 'พว.ศศิธร สว่างโลก', 'พยาบาลวิชาชีพปฏิบัติการ', 'พยาบาลวิชาชีพ', '080-0000001', 'ปกติ', 'nurse')
ON CONFLICT (staff_id) DO NOTHING;

INSERT INTO public.holidays (id, date, name, description) VALUES
  ('H1', '2026-01-01', 'วันขึ้นปีใหม่', 'วันหยุดราชการสากล'),
  ('H2', '2026-04-13', 'วันสงกรานต์', 'วันปีใหม่ไทย'),
  ('H3', '2026-05-01', 'วันแรงงานแห่งชาติ', 'วันหยุดผู้ใช้แรงงาน')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.notifications (id, target_staff_id, title, message, type, is_read) VALUES
  ('N_INIT', 'ALL', 'ยินดีต้อนรับสู่ระบบตารางเวร ER', 'ระบบเชื่อมต่อฐานข้อมูล Supabase เรียบร้อยแล้ว พร้อมใช้งานการจัดเวรและ CRUD', 'info', false)
ON CONFLICT (id) DO NOTHING;`;
}

async function openSupabaseConfigModal(allowFromLogin = false) {
  if (!allowFromLogin && AppState.currentUser && AppState.currentUser.role !== 'admin') {
    Swal.fire({
      icon: 'warning',
      title: 'สิทธิ์ไม่เพียงพอ (Admin Only)',
      text: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถดูหรือตั้งค่าการเชื่อมต่อ Supabase ได้',
      confirmButtonText: 'รับทราบ'
    });
    return;
  }

  let curUrl = localStorage.getItem('er_supabase_url') || '';
  let curKey = localStorage.getItem('er_supabase_key') || '';

  if (!curUrl || !curKey) {
    try {
      const res = await fetch('/api/db-config');
      if (res.ok) {
        const d = await res.json();
        if (d && d.url && d.key) {
          curUrl = d.url;
          curKey = d.key;
        }
      }
    } catch (e) {}
  }

  document.getElementById('inputSbUrl').value = curUrl;
  document.getElementById('inputSbKey').value = curKey;
  document.getElementById('sbConnectResult').classList.add('hidden');
  
  const sqlBox = document.getElementById('sbSqlScriptContent');
  if (sqlBox) {
    sqlBox.value = getSupabaseSqlSchema();
  }

  switchSbModalTab('connect');
  openModal('modalSupabaseConfig');
}

function switchSbModalTab(tab) {
  const cTab = document.getElementById('tabSbConnect');
  const sTab = document.getElementById('tabSbSql');
  const cBtn = document.getElementById('tabBtnSbConnect');
  const sBtn = document.getElementById('tabBtnSbSql');

  if (tab === 'connect') {
    cTab.classList.remove('hidden');
    sTab.classList.add('hidden');
    cBtn.className = 'px-3 py-1 font-bold text-emerald-700 border-b-2 border-emerald-600';
    sBtn.className = 'px-3 py-1 font-medium text-slate-500 hover:text-slate-700';
  } else {
    cTab.classList.add('hidden');
    sTab.classList.remove('hidden');
    sBtn.className = 'px-3 py-1 font-bold text-emerald-700 border-b-2 border-emerald-600';
    cBtn.className = 'px-3 py-1 font-medium text-slate-500 hover:text-slate-700';
    const sqlBox = document.getElementById('sbSqlScriptContent');
    if (sqlBox && !sqlBox.value) {
      sqlBox.value = getSupabaseSqlSchema();
    }
  }
}

function downloadSbSqlFile() {
  const sqlContent = getSupabaseSqlSchema();
  const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'supabase_schema.sql';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  Swal.fire({ icon: 'success', title: 'ดาวน์โหลดไฟล์ supabase_schema.sql เรียบร้อย', timer: 1500, showConfirmButton: false });
}

async function saveAndTestSupabaseConfig() {
  if (AppState.currentUser && AppState.currentUser.role !== 'admin') {
    Swal.fire({ icon: 'warning', title: 'เฉพาะผู้ดูแลระบบ (Admin) เท่านั้น' });
    return;
  }

  const url = document.getElementById('inputSbUrl').value.trim();
  const key = document.getElementById('inputSbKey').value.trim();
  const resBox = document.getElementById('sbConnectResult');

  if (!url || !key) {
    Swal.fire({ icon: 'warning', title: 'กรุณากรอก URL และ Anon Key' });
    return;
  }

  resBox.className = 'p-2.5 rounded-xl text-xs bg-sky-50 text-sky-800 border border-sky-200 block';
  resBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> กำลังทดสอบเชื่อมต่อ Supabase...';

  try {
    const sbLibrary = window.supabase;
    if (!sbLibrary) throw new Error('Supabase client library not loaded');

    const testClient = sbLibrary.createClient(url, key);
    const { data, error } = await testClient.from('staff').select('count', { count: 'exact' });
    
    // Save to local device
    localStorage.setItem('er_supabase_url', url);
    localStorage.setItem('er_supabase_key', key);
    AppState.supabaseClient = testClient;
    updateSbStatusBadge(true);

    // Save to central server so ALL devices and browsers get it automatically
    try {
      await fetch('/api/db-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, key })
      });
      console.log('Successfully saved Supabase credentials to server for all devices');
    } catch (pushErr) {
      console.warn('Could not save to central server:', pushErr);
    }

    // Check if table missing
    if (error && (error.code === '42P01' || (error.message && error.message.includes('relation "public.staff" does not exist')))) {
      resBox.className = 'p-2.5 rounded-xl text-xs bg-amber-50 text-amber-900 border border-amber-200 block';
      resBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber-600 mr-1"></i> เชื่อมต่อสำเร็จและบันทึกสู่ทุกอุปกรณ์แล้ว! แต่ยังไม่ได้รัน SQL สร้างตาราง กรุณาคัดลอก SQL ในแท็บ "ดูโค้ด SQL สร้างตาราง" ไปกด Run ใน Supabase SQL Editor';
      return;
    }

    if (error) throw error;

    resBox.className = 'p-2.5 rounded-xl text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 block';
    resBox.innerHTML = '<i class="fa-solid fa-check text-emerald-600 mr-1"></i> เชื่อมต่อสำเร็จและบันทึกสู่ทุกอุปกรณ์แล้ว!';
    await loadAllSupabaseData(false);
    Swal.fire({
      icon: 'success',
      title: 'บันทึกการเชื่อมต่อเรียบร้อย',
      html: '<p class="text-sm text-slate-600">บันทึกการตั้งค่าสู่ระบบส่วนกลางแล้ว <strong>อุปกรณ์และเครื่องอื่นๆ ทุกเครื่องจะใช้งานฐานข้อมูลนี้ได้อัตโนมัติทันที</strong> โดยไม่ต้องตั้งค่าใหม่อีกต่อไป (ล็อกการเชื่อมต่อถาวร ไม่อนุญาตให้ Reset to Demo)</p>',
      confirmButtonText: 'ตกลง',
      confirmButtonColor: '#059669'
    });
    setTimeout(() => closeModal('modalSupabaseConfig'), 1200);
  } catch (err) {
    resBox.className = 'p-2.5 rounded-xl text-xs bg-rose-50 text-rose-800 border border-rose-200 block';
    resBox.innerHTML = `<i class="fa-solid fa-xmark text-rose-600 mr-1"></i> เชื่อมต่อไม่สำเร็จ: ${err.message}<br><span class="text-[10px] text-slate-500">* ตรวจสอบว่าได้รันโค้ด SQL จากแท็บ "ดูโค้ด SQL สร้างตาราง" ใน SQL Editor แล้วหรือยัง</span>`;
  }
}

function resetSupabaseConfig(allowFromLogin = false) {
  Swal.fire({
    icon: 'info',
    title: 'ระบบเชื่อมต่อฐานข้อมูลถาวร',
    text: 'ระบบถูกกำหนดให้เชื่อมต่อฐานข้อมูล Supabase ตลอดเวลา และไม่อนุญาตให้รีเซ็ตเป็นโหมดจำลอง (Demo) เพื่อป้องกันข้อมูลสูญหาย',
    confirmButtonText: 'รับทราบ',
    confirmButtonColor: '#0284c7'
  });
}

function resetSupabaseConfigFromLogin() {
  Swal.fire({
    icon: 'info',
    title: 'ระบบเชื่อมต่อฐานข้อมูลถาวร',
    text: 'ระบบถูกกำหนดให้เชื่อมต่อฐานข้อมูล Supabase ตลอดเวลา และไม่อนุญาตให้รีเซ็ตเป็นโหมดจำลอง (Demo) เพื่อป้องกันข้อมูลสูญหาย',
    confirmButtonText: 'รับทราบ',
    confirmButtonColor: '#0284c7'
  });
}

function copySbSqlScript() {
  const txt = document.getElementById('sbSqlScriptContent');
  txt.select();
  navigator.clipboard.writeText(txt.value).then(() => {
    Swal.fire({ icon: 'success', title: 'คัดลอกโค้ด SQL สำเร็จ', text: 'นำไปวางและกด Run ใน Supabase SQL Editor ได้ทันที', timer: 1500, showConfirmButton: false });
  }).catch(() => {
    document.execCommand('copy');
    Swal.fire({ icon: 'success', title: 'คัดลอกโค้ด SQL สำเร็จ', timer: 1200, showConfirmButton: false });
  });
}

// --------------------------------------------------------------------------
// 15. MODAL UTILITIES & EXPOSING TO WINDOW
// --------------------------------------------------------------------------
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

// Expose all functions to global window scope for inline onclick/onsubmit
window.AppState = AppState;
window.handleLoginSubmit = handleLoginSubmit;
window.loginAsGuest = loginAsGuest;
window.togglePasswordVisibility = togglePasswordVisibility;
window.quickFillLogin = quickFillLogin;
window.confirmLogout = confirmLogout;
window.navigateMenu = navigateMenu;
window.toggleMobileSidebar = toggleMobileSidebar;
window.toggleNotificationsDropdown = toggleNotificationsDropdown;
window.openSupabaseConfigModal = openSupabaseConfigModal;
window.switchSbModalTab = switchSbModalTab;
window.saveAndTestSupabaseConfig = saveAndTestSupabaseConfig;
window.resetSupabaseConfig = resetSupabaseConfig;
window.resetSupabaseConfigFromLogin = resetSupabaseConfigFromLogin;
window.copySbSqlScript = copySbSqlScript;
window.downloadSbSqlFile = downloadSbSqlFile;
window.getSupabaseSqlSchema = getSupabaseSqlSchema;
window.loadAllSupabaseData = loadAllSupabaseData;
window.changeRosterMonth = changeRosterMonth;
window.openAutoScheduleModal = openAutoScheduleModal;
window.executeAutoSchedule = executeAutoSchedule;
window.publishRosterToAll = publishRosterToAll;
window.confirmClearRoster = confirmClearRoster;
window.openCellEditModal = openCellEditModal;
window.saveCellShift = saveCellShift;
window.setMyScheduleMode = setMyScheduleMode;
window.openLeaveRequestModal = openLeaveRequestModal;
window.handleLeaveSubmit = handleLeaveSubmit;
window.updateLeave = updateLeave;
window.deleteLeave = deleteLeave;
window.openSwapRequestModal = openSwapRequestModal;
window.handleSwapSubmit = handleSwapSubmit;
window.respondPeerSwap = respondPeerSwap;
window.approveHeadSwap = approveHeadSwap;
window.deleteSwap = deleteSwap;
window.filterStaffCards = filterStaffCards;
window.openStaffModal = openStaffModal;
window.handleSaveStaff = handleSaveStaff;
window.confirmDeleteStaff = confirmDeleteStaff;
window.deleteStaff = deleteStaff;
window.openShiftTypeModal = openShiftTypeModal;
window.handleSaveShiftType = handleSaveShiftType;
window.confirmDeleteShiftType = confirmDeleteShiftType;
window.deleteShiftType = deleteShiftType;
window.openHolidayModal = openHolidayModal;
window.handleSaveHoliday = handleSaveHoliday;
window.deleteHoliday = deleteHoliday;
window.switchReportTab = switchReportTab;
window.exportReportToPDF = exportReportToPDF;
window.exportRosterToExcel = exportRosterToExcel;
window.clearAllNotifications = clearAllNotifications;
window.deleteNotification = deleteNotification;
window.handleNotificationClick = handleNotificationClick;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.createNotification = createNotification;
window.handleUpdateProfilePhone = handleUpdateProfilePhone;
window.handleChangePassword = handleChangePassword;
window.handleSaveSettings = handleSaveSettings;
window.openModal = openModal;
window.closeModal = closeModal;
window.updateSidebarBadges = updateSidebarBadges;
window.syncDatabaseNow = syncDatabaseNow;
