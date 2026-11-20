# Money Ledger

Offline-first, bilingual (Thai/English) income-expense PWA with yearly summaries, digital clock, multi-currency support, light/dark themes, and category management.

![Money Ledger Screenshot](https://via.placeholder.com/600x400/123f3c/ffffff?text=Money+Ledger)

## เกี่ยวกับโปรเจกต์

**Money Ledger** เป็นแอปพลิเคーションบันทึกรายรับรายจ่ายแบบออฟไลน์ (Offline-first) ที่สร้างขึ้นเพื่อช่วยให้ผู้ใช้จัดการเงินได้ง่ายขึ้น โดยมีฟีเจอร์หลักดังนี้:

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

## Screenshots

<div class="gallery" id="gallery">
  <!-- Screenshot 1: Dashboard -->
  <figure class="gallery-item" data-lightbox="screenshots" data-title="หน้าหลัก - Dashboard">
    <img src="https://via.placeholder.com/400x280/123f3c/ffffff?text=Dashboard" alt="หน้าหลัก Dashboard">
    <figcaption>หน้าหลัก - แสดงยอดรวมและรายการล่าสุด</figcaption>
  </figure>

  <!-- Screenshot 2: Yearly Summary -->
  <figure class="gallery-item" data-lightbox="screenshots" data-title="สรุปปี - Yearly Summary">
    <img src="https://via.placeholder.com/400x280/123f3c/ffffff?text=Summary" alt="สรุปปี">
    <figcaption>สรุปปี - ยอดรวมรายปีและกราฟแบ่งเดือน</figcaption>
  </figure>

  <!-- Screenshot 3: Transactions -->
  <figure class="gallery-item" data-lightbox="screenshots" data-title="รายการ - Transactions">
    <img src="https://via.placeholder.com/400x280/123f3c/ffffff?text=Transactions" alt="รายการ">
    <figcaption>รายการ - รายรับ/รายจ่ายทั้งหมด</figcaption>
  </figure>

  <!-- Screenshot 4: Categories -->
  <figure class="gallery-item" data-lightbox="screenshots" data-title="หมวดหมู่ - Categories">
    <img src="https://via.placeholder.com/400x280/123f3c/ffffff?text=Categories" alt="หมวดหมู่">
    <figcaption>หมวดหมู่ - จัดการหมวดหมู่รับ-จ่าย</figcaption>
  </figure>

  <!-- Screenshot 5: Settings -->
  <figure class="gallery-item" data-lightbox="screenshots" data-title="ตั้งค่า - Settings">
    <img src="https://via.placeholder.com/400x280/123f3c/ffffff?text=Settings" alt="ตั้งค่า">
    <figcaption>ตั้งค่า - ภาษา/ธีม/อัตราแลกเปลี่ยน</figcaption>
  </figure>
</div>

<style>
/* Lightbox Gallery Gallery */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.gallery-item {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
}

.gallery-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-item:hover img {
  transform: scale(1.05);
}

/* Lightbox Overlight */
.lightbox-overlay {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.95);
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.lightbox-overlay.active {
  display: flex;
}

.lightbox-content {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  position: relative;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.lightbox-close {
  position: absolute;
  top: 20px;
  right: 30px;
  color: #fff;
  font-size: 40px;
  font-weight: bold;
  cursor: pointer;
  transition: color 0.3s;
}

.lightbox-close:hover {
  color: #ff5f57;
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  width: 50px;
  height: 50px;
  margin-top: -25px;
  color: #fff;
  font-size: 28px;
  cursor: pointer;
  background: rgba(0,0,0,0.5);
  border-radius: 50%;
  line-height: 50px;
  text-align: center;
  z-index: 10001;
  user-select: none;
}

.lightbox-nav.prev { left: 30px; }
.lightbox-nav.next { right: 30px; }

/* Keyboard navigation */
.lightbox-overlay.active {
  overflow: auto;
}

.lightbox-overlay.active :focus {
  outline: none;
}
</style>

<script>
// Simple Lightbox Implementation
document.addEventListener('DOMContentLoaded', function() {
  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox-overlay';
  lightbox.innerHTML = `
    <div class="lightbox-content" id="lightbox-content"></div>
    <a class="lightbox-close" href="#" aria-label="Close">×</a>
    <a class="lightbox-nav prev" href="#" aria-label="Previous">←</a>
    <a class="lightbox-nav next" href="#" aria-label="Next">→</a>
  `;
  document.body.appendChild(lightbox);

  const gallery = document.getElementById('gallery');
  if (!gallery) return;

  const images = gallery.querySelectorAll('[data-lightbox]');
  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    const lightboxContent = document.getElementById('lightbox-content');
    const img = images[currentIndex];
    const largeImg = img.getAttribute('data-large') || img.src;
    const title = img.getAttribute('data-title') || '';

    lightboxContent.innerHTML = `
      <img src="${largeImg}" alt="${title}" loading="lazy">
      ${title ? `<figcaption>${title}</figcaption>` : ''}
    `;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close on ESC
    document.addEventListener('keydown', onKeydown);
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      openLightbox(currentIndex);
    }
    if (e.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % images.length;
      openLightbox(currentIndex);
    }
  }

  // Click images to open
  images.forEach((img, index) => {
    img.addEventListener('click', () => openLightbox(index));
  });

  // Click outside to close
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
      closeLightbox();
    }
  });

  // Nav buttons (we'll add these to HTML later, or just use keyboard)
  // For now, keyboard navigation only
});
</style>

## การใช้งานจริง

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
├── start.cmd          # คำสั่งรัน server งูพายthon
└── README.md          # เอกสารนี้
```

## การสนับสนุน

- รายงานบั๊ก: ส่งปัญหาที่ GitHub Issues
- คำถาม: ติดต่อผ่านอีเมลหรือช่องทางที่เกี่ยวข้อง
- โปรเจกต์นี้สร้างขึ้นเพื่อใช้งานส่วนตัว/องค์กร สามารถแก้ไขใช้ได้ฟรี

---

*Money Ledger - ใบรับจำนองเงินออนไลน์ ฉบับปี 2026*