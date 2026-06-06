# ⚔️ Chaos Chess — Roguelike Chess Game

> **เกมหมากรุกบนเว็บที่ผสมผสานระบบกฎแบบสุ่ม (Roguelike) เข้ากับหมากรุกมาตรฐาน — ทุกๆ 5 เทิร์น กฎพิเศษใหม่จะถูกสุ่มเข้ามาเปลี่ยนจังหวะของเกม!**

---

## 1. 📋 ภาพรวมโปรเจกต์ (Project Overview)

**Chaos Chess** เป็นเกมหมากรุกรูปแบบใหม่ที่เล่นได้บนเว็บเบราว์เซอร์ แกนหลักของเกมยังคงเป็นหมากรุกมาตรฐาน (Standard Chess) ทุกประการ — แต่มี **จุดเปลี่ยนสำคัญ**: ทุกๆ 5 เทิร์น ระบบจะสุ่ม **"กฎพิเศษ (Special Rule)"** ขึ้นมา 1 กฎ ซึ่งอาจเปลี่ยนวิธีเดินตัวหมาก, เปลี่ยนกลไกการกิน, หรือเพิ่มความสามารถพิเศษที่ไม่มีในหมากรุกปกติ

กฎพิเศษเหล่านี้จะ **สะสมเพิ่มขึ้นเรื่อยๆ** ตลอดเกม ทำให้ยิ่งเล่นนานยิ่งวุ่นวาย จนต้องปรับกลยุทธ์ตลอดเวลา — นี่คือเสน่ห์ของ Chaos Chess!

### 🎯 คอนเซ็ปต์หลัก

| หัวข้อ | รายละเอียด |
|--------|------------|
| **ประเภทเกม** | Turn-based Strategy / Board Game |
| **แนวเกม** | หมากรุกมาตรฐาน + กฎสุ่มแบบ Roguelike |
| **ผู้เล่น** | 2 คน (Local — ผลัดเทิร์นกันบนเครื่องเดียว) |
| **จุดเด่น** | ทุก 5 เทิร์น ระบบสุ่มกฎพิเศษเข้ามาเปลี่ยนเกม |
| **กฎพิเศษ** | 8 กฎ — ครอบคลุมการเดิน, การกิน และความสามารถพิเศษ |

---

## 2. 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
My-chess-game/
├── index.html                 # HTML entry point (SEO-optimized)
├── package.json               # Dependencies & scripts
├── vite.config.js             # Vite + Tailwind CSS v4 + React config
├── eslint.config.js           # ESLint configuration
├── public/                    # Static assets
│
└── src/
    ├── main.jsx               # React DOM render entry
    ├── App.jsx                # Boardgame.io Client + Layout ประกอบ UI ทั้งหมด
    ├── index.css              # Global styles (Tailwind CSS v4 + Dark Glassmorphism Theme)
    │
    ├── components/            # ─── UI Components ───
    │   ├── Board.jsx          # กระดาน 8×8 พร้อม Drag & Drop และ Click-to-Move
    │   ├── Square.jsx         # ช่องกระดานแต่ละช่อง (ไฮไลท์, valid moves, ระเบิด)
    │   ├── Piece.jsx          # ตัวหมาก Unicode พร้อม react-dnd drag
    │   ├── RuleCard.jsx       # แสดงรายการกฎพิเศษที่ active อยู่
    │   ├── TurnCounter.jsx    # แสดงเทิร์นปัจจุบัน + countdown ถึงกฎถัดไป
    │   ├── NewRulePopup.jsx   # ป๊อปอัพ dramatic เมื่อสุ่มได้กฎใหม่
    │   └── GameStatus.jsx     # สถานะเกม, ตัวหมากที่โดนกิน, ประวัติการเดิน
    │
    ├── game/                  # ─── Game Logic (Boardgame.io) ───
    │   ├── Game.js            # Game config หลัก (setup, moves, phases, endIf)
    │   ├── RulesEngine.js     # ระบบจัดการกฎพิเศษ (สุ่ม, ใช้งาน, ตรวจสอบ)
    │   └── rulePool.js        # คลังกฎพิเศษทั้ง 8 กฎ
    │
    └── utils/                 # ─── Helper Functions ───
        └── chessHelpers.js    # Wrapper API สำหรับ chess.js
```

---

## 3. ✨ ฟีเจอร์หลัก (Key Features)

### 🎮 Core Chess

- **หมากรุกมาตรฐานครบถ้วน** — เดินตามกฎ FIDE ทุกประการ ตรวจสอบการเดินผ่าน chess.js
- **Pawn Promotion** — เบี้ยเลื่อนขั้นเป็น Queen / Rook / Bishop / Knight ผ่าน popup dialog
- **Check & Checkmate Detection** — ระบบตรวจจับรุก, รุกฆาต, เสมอ, Stalemate อัตโนมัติ
- **Move Validation** — ปฏิเสธการเดินผิดกฎทันที

### 🐉 Dynamic Rule Engine — ระบบกฎสุ่ม

ทุกๆ **5 เทิร์น** ระบบจะสุ่มกฎพิเศษ 1 กฎจากคลัง 8 กฎ เข้ามาในเกม:

| # | กฎ | ไอคอน | ประเภท | ผลกระทบ |
|---|-----|-------|--------|---------|
| 1 | **Reverse Pawns** | 🔄 | MOVEMENT | เบี้ยสามารถเดินถอยหลังได้ 1 ช่อง |
| 2 | **Explosive Captures** | 💥 | CAPTURE | เมื่อกินตัวหมาก ทุกตัวใน 3×3 รอบจุดนั้นจะถูกทำลาย (ยกเว้น King) |
| 3 | **Knight's Frenzy** | 🐴 | MOVEMENT | ม้าสามารถเดินได้ 2 ครั้งในเทิร์นเดียว |
| 4 | **Teleportation** | ✨ | SPECIAL | วาร์ปตัวหมากใดก็ได้ไปยังช่องว่างบนกระดาน (ใช้ 1 เทิร์น) |
| 5 | **Fortress King** | 🏰 | MOVEMENT | ราชาสามารถเดินแบบม้าได้ |
| 6 | **Shield Wall** | 🛡️ | CAPTURE | เบี้ยทั้งหมดไม่สามารถถูกกินได้ในเฟสนี้ |
| 7 | **Bishop Surge** | ⚡ | MOVEMENT | โคนสามารถเดินตรง 1 ช่องในแนวตั้ง/แนวนอนได้ |
| 8 | **Phantom Rook** | 👻 | MOVEMENT | เรือสามารถกระโดดข้ามตัวหมาก 1 ตัวในเส้นทางได้ |

> 💡 กฎพิเศษจะ **สะสมเพิ่มขึ้นเรื่อยๆ** — เกมจะยิ่งวุ่นวายมากขึ้นตามเวลา!

### 🖱️ การควบคุม

- **Click-to-Move** — คลิกเลือกตัวหมาก แล้วคลิกช่องปลายทาง
- **Drag & Drop** — ลากตัวหมากไปวางยังช่องที่ต้องการ (ใช้ react-dnd)
- **Valid Move Highlights** — แสดงจุดสีเขียวบนช่องที่เดินได้ (ปรับตามกฎพิเศษ)
- **Teleport Mode** — ปุ่ม toggle สำหรับเปิดโหมดวาร์ป (เมื่อกฎ Teleportation active)

### 🎨 UI/UX

- **Dark Glassmorphism Theme** — ธีมมืดสวยงามด้วย backdrop-blur และ gradient
- **Turn Counter + Progress Bar** — แสดงเทิร์นปัจจุบันและนับถอยหลังถึงกฎถัดไป
- **New Rule Popup** — ป๊อปอัพ dramatic พร้อม sparkle animation เมื่อได้กฎใหม่
- **Last Move Highlight** — ไฮไลท์ช่องที่เพิ่งเดินด้วยสีเหลือง
- **Explosion Animation** — เอฟเฟกต์เขย่ากระดานเมื่อเกิด Explosive Capture
- **Captured Pieces Display** — แสดงตัวหมากที่โดนกินของทั้งสองฝ่าย
- **Move History** — ประวัติการเดินล่าสุด (แสดง 20 ท่าสุดท้าย)
- **Responsive Design** — ปรับขนาดกระดานตามหน้าจอ (Desktop / Tablet / Mobile)

---

## 4. 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

| เทคโนโลยี | เวอร์ชัน | หน้าที่ |
|-----------|---------|--------|
| **React** | ^19.2.6 | Frontend framework (Functional Components + Hooks) |
| **Vite** | ^8.0.12 | Build tool & dev server — เร็ว, HMR |
| **Boardgame.io** | ^0.50.2 | Game state management — จัดการเทิร์น, moves, phases |
| **chess.js** | ^1.0.0-beta.8 | Core chess logic — ตรวจสอบการเดิน, FEN, check/checkmate |
| **react-dnd** | ^16.0.1 | Drag & Drop สำหรับลากตัวหมาก |
| **react-dnd-html5-backend** | ^16.0.1 | HTML5 backend สำหรับ react-dnd |
| **Tailwind CSS** | ^4.1.8 | Utility-first CSS framework (v4 — ใช้ `@import "tailwindcss"`) |
| **ESLint** | ^10.3.0 | Code quality & linting |

### 📐 Architecture Diagram

```
┌─────────────────────────────────────────────┐
│                  App.jsx                     │
│            (Boardgame.io Client)             │
├──────────┬──────────────┬───────────────────┤
│ Sidebar  │    Board     │     Sidebar       │
│          │              │                   │
│ Turn     │  Square[64]  │  GameStatus       │
│ Counter  │    └ Piece   │    ├ Status       │
│          │              │    ├ Captured     │
│ RuleCard │  + DnD Layer │    └ History      │
├──────────┴──────────────┴───────────────────┤
│              Game Logic Layer                │
│  ┌──────────┐ ┌─────────────┐ ┌──────────┐  │
│  │ Game.js  │ │RulesEngine  │ │ rulePool │  │
│  │(BGio)    │◄┤  .js        │◄┤   .js    │  │
│  └────┬─────┘ └─────────────┘ └──────────┘  │
│       │                                      │
│  ┌────▼──────────┐                           │
│  │  chess.js     │ Standard chess validation │
│  └───────────────┘                           │
└─────────────────────────────────────────────┘
```

---

## 5. 🚀 วิธีการติดตั้งและเริ่มใช้งาน (Installation and Setup)

### ความต้องการเบื้องต้น (Prerequisites)

- **Node.js** — เวอร์ชัน 18 ขึ้นไป
- **npm** — เวอร์ชัน 9 ขึ้นไป (มาพร้อมกับ Node.js)

### ขั้นตอนการติดตั้ง

```bash
# 1. Clone โปรเจกต์ (หรือดาวน์โหลด)
git clone <repository-url>
cd My-chess-game

# 2. ติดตั้ง dependencies
npm install

# 3. เริ่ม development server
npm run dev
```

เปิดเบราว์เซอร์แล้วไปที่ **http://localhost:5173/** — เกมพร้อมเล่นทันที! 🎉

### คำสั่งอื่นๆ

```bash
# Build สำหรับ production
npm run build

# Preview production build
npm run preview

# ตรวจสอบ code quality
npm run lint
```

### 🎮 วิธีเล่น

1. **White เดินก่อน** — คลิกหรือลากตัวหมากขาวไปช่องที่ต้องการ
2. **ผลัดเทิร์น** — หลังจากเดินแล้ว จะเปลี่ยนเป็นฝ่ายดำอัตโนมัติ
3. **สังเกต Turn Counter** — จะนับถอยหลังถึงกฎพิเศษถัดไป
4. **ทุกๆ 5 เทิร์น** — จะมีป๊อปอัพแสดงกฎใหม่ที่สุ่มได้ อ่านให้เข้าใจแล้วกด "Got it!"
5. **ปรับกลยุทธ์** — กฎพิเศษจะเปลี่ยน valid moves บนกระดานทันที ใช้ให้เป็นประโยชน์!
6. **ชนะ** — รุกฆาตฝ่ายตรงข้าม หรือบังคับให้เสมอ

---

<p align="center">
  <strong>⚔️ May chaos be ever in your favor! ⚔️</strong>
</p>
