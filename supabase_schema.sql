-- ==============================================================================
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

COMMENT ON TABLE public.staff IS 'ข้อมูลบุคลากรพยาบาลและเจ้าหน้าที่';

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

COMMENT ON TABLE public.shift_types IS 'ข้อมูลประเภทเวรและเกณฑ์ขั้นต่ำ';

-- 3. ตารางวันหยุดราชการ / นักขัตฤกษ์ (holidays)
CREATE TABLE IF NOT EXISTS public.holidays (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.holidays IS 'ข้อมูลวันหยุดราชการและวันหยุดนักขัตฤกษ์';

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

COMMENT ON TABLE public.leaves IS 'ข้อมูลการขอลาและการอนุมัติการลา';

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

COMMENT ON TABLE public.shift_swaps IS 'ข้อมูลการขอแลกเวรและการอนุมัติ 2 ขั้นตอน';

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

COMMENT ON TABLE public.schedules IS 'ข้อมูลตารางเวรปฏิบัติงานรายวัน';

-- สร้าง Index เพื่อให้การค้นหาตารางเวรทำได้รวดเร็ว
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_staff ON public.schedules(staff_id);

-- 7. ตารางการตั้งค่าระบบ (settings)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.settings IS 'ข้อมูลการตั้งค่าระบบและโรงพยาบาล';

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

COMMENT ON TABLE public.notifications IS 'ข้อมูลการแจ้งเตือนผู้ใช้งาน';

-- ==============================================================================
-- กำหนดสิทธิ์การเข้าถึง (Row Level Security - RLS)
-- เพื่อให้ Anon Key (Public Key) จากหน้าเว็บสามารถ เพิ่ม, ลบ, แก้ไข (CRUD) ได้
-- ==============================================================================
ALTER TABLE public.staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swaps DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- ข้อมูลเริ่มต้น (Initial Seed Data)
-- สามารถรันส่วนนี้เพื่อให้มีข้อมูลพร้อมใช้งานทันที
-- ==============================================================================

-- 1. เพิ่มข้อมูลการตั้งค่าเริ่มต้น
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

-- 2. เพิ่มประเภทเวรเริ่มต้น
INSERT INTO public.shift_types (code, short_name, name, color, text_color, start_time, end_time, min_staff, is_ot) VALUES
  ('M', 'ช', 'เวรเช้า', '#10b981', '#ffffff', '08:00', '16:00', 3, false),
  ('A', 'บ', 'เวรบ่าย', '#f59e0b', '#ffffff', '16:00', '24:00', 3, false),
  ('N', 'ด', 'เวรดึก', '#ec4899', '#ffffff', '00:00', '08:00', 2, false),
  ('ONCALL', 'OC', 'เวร On Call', '#8b5cf6', '#ffffff', '08:00', '08:00', 1, true),
  ('OFF', 'OFF', 'วันหยุด', '#94a3b8', '#ffffff', '-', '-', 0, false),
  ('SP', 'พศ', 'เวรพิเศษ', '#3b82f6', '#ffffff', '08:30', '16:30', 0, true)
ON CONFLICT (code) DO NOTHING;

-- 3. เพิ่มบุคลากรตัวอย่าง (รหัสผ่านเริ่มต้น 123456)
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

-- 4. เพิ่มวันหยุดราชการตัวอย่าง
INSERT INTO public.holidays (id, date, name, description) VALUES
  ('H1', '2026-01-01', 'วันขึ้นปีใหม่', 'วันหยุดราชการสากล'),
  ('H2', '2026-04-13', 'วันสงกรานต์', 'วันปีใหม่ไทย'),
  ('H3', '2026-05-01', 'วันแรงงานแห่งชาติ', 'วันหยุดผู้ใช้แรงงาน')
ON CONFLICT (id) DO NOTHING;

-- 5. เพิ่มการแจ้งเตือนต้อนรับ
INSERT INTO public.notifications (id, target_staff_id, title, message, type, is_read) VALUES
  ('N_INIT', 'ALL', 'ยินดีต้อนรับสู่ระบบตารางเวร ER', 'ระบบเชื่อมต่อฐานข้อมูล Supabase เรียบร้อยแล้ว พร้อมใช้งานการจัดเวรและ CRUD', 'info', false)
ON CONFLICT (id) DO NOTHING;
