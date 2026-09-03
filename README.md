# 🎡 Comsan Random Wheel (Next.js App Router)

> เว็บแอปพลิเคชันวงล้อสุ่มความน่าจะเป็น (Weighted & Equal Random Wheel) โครงสร้าง **Next.js 14 (App Router) + React + TypeScript + Modern CSS** พร้อมระบบ Server Production Ready (Standalone Output & Docker) ออกแบบตามเอกลักษณ์ของ **Comsan Design Language** (Vibrant Orange `#FF6B00` + Ultra-Bright Candy Pop Palette)

---

## 🌟 จุดเด่นและฟีเจอร์หลัก (Key Features)

### 1. ⚡ Next.js App Router & Full Feature Parity
- **Next.js 14 App Router**: สถาปัตยกรรมระดับองค์กร รองรับ SSR/SSG, Static Optimization, และ Client-side Transitions
- **Clean Route Structure**:
  - `/wheel` (หรือ `/`): หน้าวงล้อสุ่มหลัก (Wheel Canvas + Item Editor)
  - `/history`: หน้าประวัติและสถิติการสุ่ม 10 ครั้งล่าสุด
- **Production Server Standalone Output**: บิลด์เป็น Standalone Server ขนาดกะทัดรัด พร้อมรันบน Node.js, Vercel, Docker, AWS, Google Cloud Run

### 2. 🎯 Canvas Engine & Web Audio Sound FX
- **High-DPI Crisp Canvas Rendering**: วงล้อคมชัดทุกหน้าจอ (Retina Display / 4K)
- **Quartic Ease-Out Deceleration**: แอนิเมชันการหมุนและชะลอความเร็วนุ่มนวล สมจริง
- **Realistic Procedural Web Audio FX**: สังเคราะห์เสียงคลิก Ticking และเสียงฉลองชัยชนะผ่าน Web Audio API โดยไม่ต้องพึ่งพาไฟล์เสียงภายนอก
- **Confetti Particle Celebration**: พลุกระดาษฉลองหลากสีสันสดใส
- **Multi-Touch & Tap to Spin**: แตะที่ตัววงล้อ, โลโก้ตรงกลาง (Center Hub) หรือกดปุ่มหมุนเพื่อสุ่มได้ทันที

### 3. 🎛️ ระบบจัดการความน่าจะเป็น (Probability Modes)
- **โหมดเท่ากัน (Simple Equal Mode - ค่าเริ่มต้น)**:
  - หน้าจอคลีนตา ซ่อนช่องกรอกเปอร์เซ็นต์
  - ระบบคำนวณและแบ่งโอกาสเท่ากันทุกช่อง ($100 / N$ %) ให้อัตโนมัติทุกครั้งที่เพิ่มหรือลบรายการ
- **โหมดกำหนดโอกาสเอง (Custom Weighted Mode)**:
  - เปิดใช้งานในการตั้งค่า เพื่อพิมพ์กำหนด % โอกาสของแต่ละรายการได้อย่างอิสระ
  - มีแถบตรวจสอบผลรวม 100% พร้อมปุ่ม **"แบ่งเท่า"** และ **"ปรับ 100%"** อัตโนมัติ

### 4. 🤫 ระบบสั่งผลลับ (Secret Bias Hotkey)
- **สั่งผลลัพธ์ล่วงหน้าได้อย่างแนบเนียน**: ผู้ควบคุมสามารถกดปุ่มตัวเลข **`1` ถึง `9`** บนคีย์บอร์ดก่อนกดหมุน เพื่อล็อกให้ผลลัพธ์ตกที่รายการลำดับที่ 1-9 ตามต้องการ
- **Auto-Reset**: รีเซ็ตกลับเป็นโหมดสุ่มปกติทันทีที่วงล้อเริ่มหมุน
- **Cancel Hotkey**: กดปุ่ม **`0`** หรือ **`Escape`** เพื่อยกเลิกคำสั่งลับ

### 5. ⚙️ การตั้งค่าขั้นสูง (Settings Modal)
- **ซ่อนเปอร์เซ็นต์บนวงล้อ**: ซ่อนตัวเลขโอกาส `(%)` ออกจากวงล้อ ให้แสดงเฉพาะชื่อรายการ
- **ขนาดช่องบนวงล้อเท่ากันทุกช่อง**: แสดงขนาดความกว้างของทุกช่องบนวงล้อเท่ากัน ($360^\circ / N$) แม้ % โอกาสจะไม่เท่ากัน (คำนวณผลตาม % จริง 100%)
- **ลบตัวเลือกที่สุ่มได้ออก (Remove Winner)**: ตัดรายการที่ชนะออกจากวงล้ออัตโนมัติ
- **ปรับระยะเวลาการหมุน**: ตั้งค่าความเร็วได้ตั้งแต่ `2.0s` ถึง `10.0s` ผ่านสไลเดอร์บางเฉียบ 6px
- **เปิด/ปิดเสียงเอฟเฟกต์ & พลุกระดาษ**

### 6. 📜 ระบบประวัติและสถิติ (History & Analytics)
- บันทึกผลการสุ่ม 10 ครั้งล่าสุด พร้อมเวลาและเปอร์เซ็นต์โอกาส
- แถบสรุปสถิติผลลัพธ์ (Summary Stat Badges) เช่น `A x4 (40%)`
- ปุ่มล้างประวัติการสุ่ม

### 7. ⌨️ คีย์ลัดอัจฉริยะ (Keyboard Shortcuts)
| คีย์ลัด | คำอธิบายการทำงาน |
|---|---|
| **`Ctrl + Enter`** / **`Cmd + Enter`** | สั่งหมุนวงล้อทันที (ใช้งานได้ทุกที่ แม้กำลังพิมพ์ข้อความ) |
| **`Spacebar`** / **`Enter`** | สั่งหมุนวงล้อ (เมื่อไม่ได้โฟกัสอยู่ในช่องกรอกข้อความ) |
| **`1` – `9`** | สั่งผลลัพธ์ลับ (Secret Bias) ให้รอบถัดไปตกที่รายการลำดับที่ 1-9 |
| **`0`** / **`Escape`** | ยกเลิกคำสั่งผลลัพธ์ลับ |
| **`Enter` (ในช่องชื่อ)** | สลับโฟกัสไปยังช่องพิมพ์รายการถัดไป |

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
comsan-wheel/
├── public/
│   └── comsan-icon.svg             # ไอคอนแบรนด์ Comsan
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root Layout (Google Prompt Font, Context)
│   │   ├── page.tsx                # Home Page (Redirect to /wheel)
│   │   ├── wheel/page.tsx          # Wheel View Route (/wheel)
│   │   ├── history/page.tsx        # History View Route (/history)
│   │   └── globals.css             # Comsan Design System, 4px Scrollbars
│   ├── components/
│   │   ├── Header.tsx              # Header Bar, Navigation, Sound, Help, Settings
│   │   ├── Wheel/
│   │   │   ├── WheelCanvas.tsx     # High-DPI Canvas, Rotation Physics, Hub, Pointer
│   │   │   ├── EmptyState.tsx      # Empty Items View
│   │   │   └── ConfettiCanvas.tsx  # Confetti Celebration System
│   │   ├── Editor/
│   │   │   ├── EditorColumn.tsx    # List Toolbar, Quick Actions, Spin Button
│   │   │   ├── ItemRow.tsx         # Drag-drop Row, Inline Inputs, Color Dot
│   │   │   └── ColorPickerPopover.tsx # 16 Candy Pop Colors Popover
│   │   ├── Modals/
│   │   │   ├── ResultModal.tsx     # Winner Announcement Modal
│   │   │   ├── SettingsModal.tsx   # Settings Controls & Sliders
│   │   │   └── HelpModal.tsx       # User Guide Modal (Settings-matched UI)
│   │   └── History/
│   │       └── HistoryView.tsx     # 10 Recent Spins & Summary Badges
│   ├── context/
│   │   └── WheelContext.tsx        # Global State, LocalStorage Sync, Secret Bias & Hotkeys
│   └── lib/
│       ├── types.ts                # TypeScript Interfaces
│       ├── constants.ts            # Palette, Defaults & Storage Keys
│       └── sound.ts                # Web Audio API Sound Generator
├── Dockerfile                      # Multi-stage Production Dockerfile
├── .dockerignore                   # Docker ignore rules
├── docker-compose.yml              # Docker Compose setup
├── next.config.mjs                 # Next.js Standalone Configuration
├── tsconfig.json                   # TypeScript Config
├── package.json                    # Project Dependencies
└── README.md                       # Project Documentation
```

---

## 🚀 วิธีการรันใช้งานและขึ้น Production Server (Getting Started & Deployment)

### 💻 1. การรันสำหรับ Development
```bash
# ติดตั้ง dependencies
npm install

# รัน Development Server (เปิด http://localhost:3000)
npm run dev
```

### 🏗️ 2. การ Build สำหรับ Production
```bash
# สั่ง Build โค้ด Next.js
npm run build

# รัน Production Server
npm start
```

### 🐳 3. การ Deploy ด้วย Docker & Docker Compose (พร้อมขึ้น Server ทันที)
```bash
# สร้างและรัน Container ด้วย Docker Compose
docker compose up -d --build

# ตรวจสอบสถานะ
docker ps
```
เมื่อรันเสร็จสิ้น สามารถเปิดใช้งานได้ที่ `http://<SERVER_IP>:3000` ทันที!

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Core**: React 18, TypeScript, HTML5 2D Canvas API
- **Audio Engine**: Web Audio API (Zero external audio assets)
- **Styling**: Modern CSS3 (CSS Variables, Flexbox, CSS Grid, Glassmorphism Backdrop Blur, Thin 4px Scrollbars)
- **State & Storage**: React Context + LocalStorage API
- **Containerization**: Docker (Multi-stage Node.js Alpine Standalone)

---

## 📄 ลิขสิทธิ์ (License)

พัฒนาขึ้นเพื่อการใช้งานสุ่มผลลัพธ์ กิจกรรม สตรีมมิ่ง และการเรียนการสอน (Inspired by Comsan)
