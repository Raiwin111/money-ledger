# Money Ledger

Offline-first, bilingual (Thai/English) income-expense PWA with yearly summaries, digital clock, multi-currency support, light/dark themes, and category management.

![Money Ledger Screenshot](https://via.placeholder.com/600x400/123f3c/ffffff?text=Money+Ledger)

## เกี่ยวกับโปรเจกต์

**Money Ledger** เป็นแอปพลิเคชั่นบันทึกรายรับรายจ่ายแบบออฟไลน์ (Offline-first) ที่สร้างขึ้นเพื่อช่วยให้ผู้ใช้จัดการเงินได้ง่ายขึ้น โดยมีฟีเจอร์หลักดังนี้:

- บันทึกครบครัน (CRUD) รายรับและรายจ่าย
- ปฏิทินดิจิทัลแสดงวันที่และเวลา
- สรุปยอดรวมรายปี มีการแบ่งย่อยตามเดือนและหมวดหมู่
- รองรับหลายสกุลเงิน (มากกว่า 10 สกุล)
- เรียกใช้งานได้ทั้งภาษาไทยและอังกฤษ เปลี่ยนได้ทันที
- โหมดแสง (Light) และโหมดมืด (Dark) เก็บการตั้งค่าไว้ได้
- ทำงานได้ทั้งมือถือและคอมพิวเตอร์ รองรับ PWA

## คุณลักษณะหลัก

### การบันทึกข้อมูล
- เพิ่ม/แก้ไล/ลบรายรับ/รายจ่าย
- ระบุจำนวนเงิน เงินสด สกุลเงินต่างประเทศ
- เลือกหมวดหมู่ (เช่น อาหาร เดินทาง ที่พัก)
- เพิ่มหมายเหตุประกอบ

### การแสดงผล
- **หน้าหลัก (Dashboard)**: ยอดรวมรายรับ/รายจ่าย/คงเหลือ
- **สรุปปี**: ยอดรวมทั้งปี มีกราฟแบ่งตาม 12 เดือน
- **รายการ**: ดูรายการทั้งหมด แฟิลเตอร์ตามวันที่ ประเภท หมวดหมู่
- **สรุปตามหมวด**: ยอดรวมแต่ละหมวดหมู่

### การตั้งค่า
- **ภาษา**: สลับระหว่างไทยและอังกฤษ
- **ธีม**: โหมดแสง (Light) / มืด (Dark)
- **สกุลเงิน**: เลือกแสดงผลเป็น THB, USD, EUR หรืออื่นๆ อีก 12 สกุล
- **อัตราแลกเปลี่ยน**: แก้ไขอัตราเงินเปลี่ยนแต่ละสกุลได้
- **สำรองข้อมูล**: Export เป็น CSV หรือ JSON กลับคืนได้

### การทำงานออฟไลน์
- เก็บข้อมูลใน **IndexedDB** เป็นหลัก
- หากไม่มีอินเทอร์เน็ตข้อม้ายังคงอยู่ครบ
- บังคับใช้ **Service Worker** ช่วย cache ไฟล์ไว้

## การใช้งาน

### ข้อกำหนดเบื้องต้น
- เบราว์เซอร์รุ่นใหม่ (Chrome 80+/Firefox 78+/Safari 14+)
- อุปกรณ์: มือถือ, แท็บเล็ต, คอมพิวเตอร์

### การรันบนเครื่องของคุณ

```bash
# 1. เข้าโฟลเดอร์แอป
cd offline-web-app

# 2. เริ่ม server ปรับภูมิภาคไทย
python -m http.server 4173 --bind 127.0.0.1

# 3. เปิดเบราว์เซอร์
# ไปที่ http://localhost:4173/
```

### การติดตั้งเป็นแอปบนมือถือ

**Android (Chrome):**
1. เปิดเว็บไซต์ → กดปุ่มสามบรรทัด → "ติดตั้งแอป"
2. หรือที่ `chrome://apps/` → "เพิ่มแอป"

**iOS (Safari):**
1. เปิดเว็บ → กด "Share" (ลูกศรขึ้น) → "Add to Home Screen"

### การ Deploy ขึ้นเว็บ (เพื่อแจกจ่าย)

**Netlify (แนะนำ):**
1. เข้า https://netlify.com/drop
2. **ลาก-วาง** โฟลเดอร์ `offline-web-app` ลงไป
3. รอสักครู่ จะได้ URL แบบ `https://your-name.netlify.app`
4. PWA จะทำงานครบรูปแบบ (มี Service Worker, Manifest)

**Vercel:**
1. เข้า https://vercel.com/new
2. **Import Git Project** หรือ drag & drop
3. กด Deploy

### การใช้งานจริง

1. **เข้าแอป** แล้วเลือกภาษา Thai หรือ English
2. กดปุ่ม "เพิ่มรายการ" (FAB หรือDrawer)
3. กรอกข้อมูล: ประเภท เงินจำนวน เงินสด/สกุลเงิน หมวดหมู่ วันที่ เวลา หมายเหตุ
4. กด "บันทึก" ข้อมูลจะถูกบันทึกลงในเบราว์เซอร์
5. เข้า **หน้าสรุปปี** เพื่อดูภาพรวมยอดรวม
6. เข้า **ตั้งค่า** เพื่อเปลี่ยนภาษา/ธีม/อัตราแลกเปลี่ยน

## เทคโนโลยี

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS)
- **Storage**: IndexedDB (primary) + localStorage (fallback)
- **Service Worker**: Cache-first strategy (money-ledger-v3)
- **Manifest**: PWA manifest with icons and shortcuts
- **Design**: Calm "daily passbook" theme - deep teal shell, warm stone ground, paper surfaces
- **Bilingual**: Thai/English dictionaries in `js/i18n.js`
- **Responsive**: Drawer layout <1024px, desktop sidebar ≥1024px

## โคร STRUCTURE

```
offline-web-app/
├── index.html           # แอป shell หลัก
├── styles.css           # ระบบโทเคน ธีม ตอบสนอง
├── app.js             # ลอจิกทั้งหมด (IIFE)
├── js/
│   ├── i18n.js        # พจนานุกรมไทย/อังกฤษ
│   ├── db.js          # IndexedDB + localStorage
│   └── ... 
├── icons/             # ไอคอน PWA (5 ไฟล์)
├── manifest.json      # แมนิเฟสต์ PWA
├── sw.js              # Service Worker
└── start.cmd          # คำสั่งรัน server งูพายthon
```

## การสนับสนุน

- รายงานบั๊ก: ส่งปัญหาที่ GitHub Issues
- คำถาม: ติดต่อผ่านอีเมลหรือช่องทางที่เกี่ยวข้อง
- โปรเจกต์นี้สร้างขึ้นเพื่อใช้งานส่วนตัว/องค์กร สามารถแก้ไขใช้ได้ฟรี

---

*Money Ledger - ใบรับจำนองเงินออนไลน์ ฉบับปี 2026*
