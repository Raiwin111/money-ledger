/* =========================================================
   Money Ledger — bilingual copy and formatters
   Thai and English are equal citizens. Dates in Thai use the
   Buddhist Era; amounts use tabular, locale-aware formatting.
   ========================================================= */

(function () {
  "use strict";

  var STORAGE_KEY = "ledger.lang";
  var SUPPORTED = ["th", "en"];

  var MONTHS = {
    th: [
      "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
      "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
    ],
    en: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
  };

  var MONTHS_SHORT = {
    th: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  };

  var WEEKDAYS = {
    th: ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"],
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  };

  var WEEKDAYS_SHORT = {
    th: ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  };

  var DICT = {
    th: {
      "app.name": "สมุดรายรับรายจ่าย",
      "app.tagline": "บันทึกเงินในเครื่องคุณ",

      "nav.dashboard": "ภาพรวม",
      "nav.transactions": "รายการ",
      "nav.summary": "สรุปปี",
      "nav.categories": "หมวดหมู่",
      "nav.settings": "ตั้งค่า",
      "nav.expense": "รายจ่าย",
      "nav.income": "รายรับ",
      "nav.addCategory": "เพิ่มหมวดหมู่",
      "nav.openMenu": "เปิดเมนู",
      "nav.closeMenu": "ปิดเมนู",
      "top.add": "เพิ่มรายการ",
      "top.language": "เปลี่ยนภาษา",
      "top.theme": "เปลี่ยนโทนสี",
      "top.themeLight": "โหมดสว่าง",
      "top.themeDark": "โหมดมืด",
      "clock.timezone": "เวลาไทย (ICT)",
      "clock.label": "นาฬิกา",

      "sidebar.categories": "หมวดหมู่",
      "sidebar.manage": "จัดการ",
      "sidebar.noCategories": "ยังไม่มีหมวดหมู่",
      "sidebar.addFirst": "เพิ่มหมวดหมู่แรก",
      "sidebar.showAll": "ดูทั้งหมด",
      "sidebar.expenseCount": "{count} หมวด",
      "sidebar.incomeCount": "{count} หมวด",
      "sidebar.countOne": "1 หมวด",

      "dashboard.title": "ภาพรวม",
      "dashboard.subtitle": "ดูรายรับ รายจ่าย และยอดคงเหลือของปีที่เลือก",
      "dashboard.year": "ปี",
      "dashboard.currency": "สกุลเงินที่แสดง",
      "dashboard.income": "รายรับ",
      "dashboard.expense": "รายจ่าย",
      "dashboard.balance": "คงเหลือ",
      "dashboard.monthly": "รายเดือน",
      "dashboard.monthlyHint": "ยอดรวมแต่ละเดือนในปีที่เลือก",
      "dashboard.byCategory": "ตามหมวดหมู่",
      "dashboard.breakdownHint": "สัดส่วนรายจ่ายและรายรับในปีนี้",
      "dashboard.recent": "รายการล่าสุด",
      "dashboard.recentHint": "รายการล่าสุดในปีที่เลือก",
      "dashboard.viewAll": "ดูทั้งหมด",
      "dashboard.viewSummary": "ดูสรุปปี",
      "dashboard.emptyTitle": "ยังไม่มีรายการในปีนี้",
      "dashboard.emptyBody": "เริ่มบันทึกรายรับหรือรายจ่ายรายการแรกได้เลย ข้อมูลจะถูกเก็บไว้ในเครื่องนี้เท่านั้น",
      "dashboard.emptyAction": "เพิ่มรายการแรก",
      "dashboard.convertedNote": "แปลงเป็น {currency} ตามอัตราที่ตั้งไว้",
      "dashboard.currentMonth": "เดือนนี้",
      "dashboard.noExpense": "ยังไม่มีรายจ่ายในปีนี้",
      "dashboard.noIncome": "ยังไม่มีรายรับในปีนี้",
      "dashboard.proportion": "สัดส่วนรายรับและรายจ่าย",
      "dashboard.incomeShort": "รับ",
      "dashboard.expenseShort": "จ่าย",
      "dashboard.balanceShort": "คงเหลือ",
      "dashboard.entries": "{count} รายการ",
      "dashboard.entriesOne": "1 รายการ",
      "dashboard.yearTotal": "รวมทั้งปี",
      "dashboard.current": "เดือนปัจจุบัน",

      "tx.title": "รายการ",
      "tx.subtitle": "ค้นหา กรอง และแก้ไขรายการทั้งหมด",
      "tx.add": "เพิ่มรายการ",
      "tx.addTitle": "เพิ่มรายการ",
      "tx.editTitle": "แก้ไขรายการ",
      "tx.delete": "ลบรายการ",
      "tx.type": "ประเภท",
      "tx.income": "รายรับ",
      "tx.expense": "รายจ่าย",
      "tx.amount": "จำนวนเงิน",
      "tx.currency": "สกุลเงิน",
      "tx.category": "หมวดหมู่",
      "tx.date": "วันที่",
      "tx.time": "เวลา",
      "tx.note": "โน้ต",
      "tx.notePlaceholder": "เช่น มื้อเที่ยงกับเพื่อน",
      "tx.save": "บันทึก",
      "tx.cancel": "ยกเลิก",
      "tx.deleteTitle": "ลบรายการนี้?",
      "tx.deleteBody": "รายการนี้จะถูกลบอย่างถาวรจากเครื่องของคุณ",
      "tx.deleteConfirm": "ลบรายการ",
      "tx.saved": "บันทึกรายการแล้ว",
      "tx.deleted": "ลบรายการแล้ว",
      "tx.updated": "อัปเดตรายการแล้ว",
      "tx.timestamp": "บันทึกเมื่อ",
      "tx.occurred": "วันที่และเวลา",
      "tx.original": "จำนวนเดิม",
      "tx.converted": "แปลงเป็น {currency}",
      "tx.noCategory": "ไม่ระบุหมวดหมู่",
      "tx.selectCategory": "เลือกหมวดหมู่",
      "tx.manageCategories": "จัดการหมวดหมู่",
      "tx.addCategoryFirst": "ยังไม่มีหมวดหมู่สำหรับประเภทนี้",
      "tx.addCategoryFirstBody": "เพิ่มหมวดหมู่ก่อนบันทึกรายการ",
      "tx.required": "กรุณากรอกข้อมูลให้ครบ",
      "tx.invalidAmount": "จำนวนเงินต้องมากกว่า 0",
      "tx.invalidDate": "วันที่และเวลาไม่ถูกต้อง",
      "tx.saveError": "บันทึกไม่สำเร็จ กรุณาลองใหม่",
      "tx.filterSearch": "ค้นหาโน้ตหรือหมวดหมู่",
      "tx.filterType": "ทุกประเภท",
      "tx.filterCategory": "ทุกหมวดหมู่",
      "tx.filterMonth": "ทุกเดือน",
      "tx.filterYear": "ทุกปี",
      "tx.filterCurrency": "ทุกสกุลเงิน",
      "tx.filterClear": "ล้างตัวกรอง",
      "tx.filters": "ตัวกรอง",
      "tx.noneTitle": "ไม่พบรายการ",
      "tx.noneBody": "ลองเปลี่ยนตัวกรอง หรือเพิ่มรายการใหม่",
      "tx.loadMore": "แสดงเพิ่ม",
      "tx.showing": "แสดง {shown} จาก {total} รายการ",
      "tx.editHint": "คลิกรายการเพื่อแก้ไข",
      "tx.deleteHint": "ลบ",
      "tx.editHintShort": "แก้ไข",
      "tx.amountPlaceholder": "0.00",
      "tx.createdAt": "สร้างเมื่อ",
      "tx.updatedAt": "แก้ไขล่าสุด",
      "tx.timezoneNote": "เวลาในเครื่องของคุณ",
      "tx.count": "{count} รายการ",
      "tx.uncategorized": "ไม่ระบุหมวดหมู่",
      "tx.dayIncome": "รับ {amount}",
      "tx.dayExpense": "จ่าย {amount}",
      "tx.rowAria": "แก้ไขรายการ {name} จำนวน {amount}",
      "tx.editAria": "แก้ไขรายการ {name}",
      "tx.deleteAria": "ลบรายการ {name}",
      "tx.addFirst": "เพิ่มรายการแรก",
      "tx.noCategoryOption": "ยังไม่มีหมวดหมู่",

      "summary.title": "สรุปปี",
      "summary.subtitle": "ยอดรวมรายปี รายเดือน และตามหมวดหมู่",
      "summary.year": "ปี",
      "summary.currency": "สกุลเงินที่แสดง",
      "summary.export": "ส่งออก CSV",
      "summary.exported": "ส่งออกไฟล์ CSV แล้ว",
      "summary.monthly": "สรุปรายเดือน",
      "summary.monthlyHint": "รายรับ รายจ่าย และคงเหลือของแต่ละเดือน",
      "summary.total": "รวมทั้งปี",
      "summary.byCategory": "ตามหมวดหมู่",
      "summary.byCurrency": "ตามสกุลเงิน",
      "summary.currencyHint": "ยอดเดิมในแต่ละสกุลและยอดที่แปลงแล้ว",
      "summary.income": "รายรับ",
      "summary.expense": "รายจ่าย",
      "summary.balance": "คงเหลือ",
      "summary.net": "สุทธิ",
      "summary.rate": "อัตรา (THB)",
      "summary.original": "ยอดเดิม",
      "summary.converted": "แปลงเป็น {currency}",
      "summary.noData": "ยังไม่มีข้อมูลในปีนี้",
      "summary.noDataBody": "เพิ่มรายการแล้วกลับมาดูสรุปได้ทันที",
      "summary.percentOfExpense": "{percent} ของรายจ่าย",
      "summary.percentOfIncome": "{percent} ของรายรับ",
      "summary.month": "เดือน",
      "summary.entries": "รายการ",
      "summary.currencyNote": "อัตราแลกเปลี่ยนเป็นค่าประมาณที่แก้ไขได้ในหน้าตั้งค่า",
      "summary.totalRow": "รวม",
      "summary.share": "สัดส่วน",
      "summary.thisYear": "ปีนี้",
      "summary.allYears": "ทุกปี",
      "summary.exportEmpty": "ยังไม่มีข้อมูลให้ส่งออก",

      "categories.title": "หมวดหมู่",
      "categories.subtitle": "จัดการหมวดรายรับและรายจ่ายที่ใช้บ่อย",
      "categories.add": "เพิ่มหมวดหมู่",
      "categories.edit": "แก้ไขหมวดหมู่",
      "categories.expense": "หมวดรายจ่าย",
      "categories.income": "หมวดรายรับ",
      "categories.nameTh": "ชื่อภาษาไทย",
      "categories.nameEn": "ชื่อภาษาอังกฤษ",
      "categories.nameThPlaceholder": "เช่น อาหาร",
      "categories.nameEnPlaceholder": "e.g. Food",
      "categories.color": "สี",
      "categories.type": "ประเภท",
      "categories.save": "บันทึก",
      "categories.cancel": "ยกเลิก",
      "categories.deleteTitle": "ลบหมวดหมู่นี้?",
      "categories.deleteBody": "หมวดหมู่นี้ไม่มีรายการ สามารถลบได้เลย",
      "categories.deleteUsedBody": "มีรายการ {count} รายการในหมวดนี้ ต้องการย้ายไปหมวด “อื่นๆ” แล้วลบหรือไม่?",
      "categories.deleteUsedBodyOne": "มีรายการ 1 รายการในหมวดนี้ ต้องการย้ายไปหมวด “อื่นๆ” แล้วลบหรือไม่?",
      "categories.deleteConfirm": "ลบหมวดหมู่",
      "categories.created": "เพิ่มหมวดหมู่แล้ว",
      "categories.updated": "อัปเดตหมวดหมู่แล้ว",
      "categories.deleted": "ลบหมวดหมู่แล้ว",
      "categories.moved": "ย้ายรายการไปหมวด “อื่นๆ” แล้ว",
      "categories.nameRequired": "กรุณากรอกชื่อหมวดหมู่อย่างน้อยหนึ่งภาษา",
      "categories.duplicate": "มีชื่อหมวดหมู่นี้อยู่แล้ว",
      "categories.other": "อื่นๆ",
      "categories.usage": "{count} รายการ",
      "categories.usageOne": "1 รายการ",
      "categories.total": "ยอดรวมปีนี้",
      "categories.emptyExpense": "ยังไม่มีหมวดรายจ่าย",
      "categories.emptyIncome": "ยังไม่มีหมวดรายรับ",
      "categories.emptyBody": "เพิ่มหมวดหมู่เพื่อเริ่มบันทึกรายการ",
      "categories.colorLabel": "สีที่ {n}",
      "categories.manageHint": "คลิกหมวดหมู่ในแถบด้านข้างเพื่อกรองรายการ",
      "categories.count": "{count} หมวดหมู่",
      "categories.countOne": "1 หมวดหมู่",
      "categories.saveError": "บันทึกไม่สำเร็จ กรุณาลองใหม่",
      "categories.deleteError": "ลบไม่สำเร็จ กรุณาลองใหม่",
      "categories.used": "ใช้ในรายการ",
      "categories.noName": "ไม่มีชื่อ",

      "settings.title": "ตั้งค่า",
      "settings.subtitle": "ปรับภาษา โทนสี สกุลเงิน และข้อมูลในเครื่อง",
      "settings.language": "ภาษา",
      "settings.languageHelp": "ใช้กับเมนู วันที่ และรูปแบบตัวเลขทั้งหมด",
      "settings.thai": "ไทย",
      "settings.english": "English",
      "settings.theme": "โทนสี",
      "settings.themeHelp": "เลือกโหมดที่สบายตาสำหรับการใช้งานของคุณ",
      "settings.light": "สว่าง",
      "settings.dark": "มืด",
      "settings.currency": "สกุลเงินที่ใช้สรุป",
      "settings.currencyHelp": "รายการแต่ละรายการยังเก็บสกุลเงินเดิมไว้ และจะถูกแปลงเพื่อสรุปยอด",
      "settings.rates": "อัตราแลกเปลี่ยน",
      "settings.ratesHelp": "ระบุมูลค่า 1 หน่วยของแต่ละสกุลเป็นบาท อัตราเหล่านี้เป็นค่าประมาณสำหรับการสรุปยอด แก้ไขได้ตลอด",
      "settings.rateColumn": "1 หน่วย = บาท",
      "settings.resetRates": "รีเซ็ตอัตราเริ่มต้น",
      "settings.ratesReset": "รีเซ็ตอัตราแลกเปลี่ยนแล้ว",
      "settings.rateInvalid": "อัตราแลกเปลี่ยนต้องมากกว่า 0",
      "settings.rateChanged": "อัปเดตอัตราแลกเปลี่ยนแล้ว",
      "settings.data": "ข้อมูลในเครื่อง",
      "settings.dataHelp": "ข้อมูลทั้งหมดถูกเก็บในเบราว์เซอร์นี้ ไม่มีบัญชีและไม่มีการส่งออกไปยังเซิร์ฟเวอร์",
      "settings.exportJson": "สำรองข้อมูล (JSON)",
      "settings.importJson": "นำเข้าข้อมูล (JSON)",
      "settings.exportCsv": "ส่งออก CSV ปีนี้",
      "settings.clearData": "ลบข้อมูลทั้งหมด",
      "settings.clearTitle": "ลบข้อมูลทั้งหมด?",
      "settings.clearBody": "รายการ หมวดหมู่ และการตั้งค่าทั้งหมดในเครื่องนี้จะถูกลบอย่างถาวร ไม่สามารถกู้คืนได้ หมวดหมู่เริ่มต้นจะถูกสร้างใหม่",
      "settings.clearConfirm": "ลบทั้งหมด",
      "settings.cleared": "ลบข้อมูลทั้งหมดแล้ว",
      "settings.importTitle": "นำเข้าข้อมูล?",
      "settings.importBody": "ไฟล์สำรองจะถูกนำเข้าและรวมกับข้อมูลปัจจุบัน รายการที่มี id เดียวกันจะถูกเขียนทับ",
      "settings.importConfirm": "นำเข้า",
      "settings.importSuccess": "นำเข้าข้อมูลแล้ว",
      "settings.importError": "ไฟล์ไม่ถูกต้องหรือเสียหาย",
      "settings.install": "ติดตั้งแอป",
      "settings.installed": "ติดตั้งแล้ว",
      "settings.installHelp": "ติดตั้งเพื่อเปิดใช้งานแบบเต็มหน้าจอและออฟไลน์ได้",
      "settings.installUnavailable": "ยังไม่มีปุ่มติดตั้งจากเบราว์เซอร์",
      "settings.iosInstall": "บน iPhone/iPad: แตะปุ่มแชร์ แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”",
      "settings.desktopInstall": "บนคอมพิวเตอร์: ใช้เมนูของเบราว์เซอร์แล้วเลือก “ติดตั้งแอป”",
      "settings.openViaServer": "หากเปิดไฟล์โดยตรง ปุ่มติดตั้งอาจไม่ทำงาน ให้เปิดผ่าน start.cmd",
      "settings.status": "สถานะการเชื่อมต่อ",
      "settings.online": "ออนไลน์",
      "settings.offline": "ออฟไลน์",
      "settings.offlineReady": "พร้อมใช้งานออฟไลน์",
      "settings.offlineNote": "หลังโหลดครั้งแรก แอปจะทำงานได้แม้ไม่มีอินเทอร์เน็ต",
      "settings.pwa": "แอปพลิเคชัน (PWA)",
      "settings.connection": "การเชื่อมต่อ",
      "settings.version": "เวอร์ชัน",
      "settings.about": "เกี่ยวกับแอป",
      "settings.aboutBody": "สมุดรายรับรายจ่ายแบบออฟไลน์ ทำงานบนเบราว์เซอร์ของคุณ ข้อมูลอยู่ในเครื่องเท่านั้น",
      "settings.privacy": "ความเป็นส่วนตัว",
      "settings.privacyBody": "ไม่มีการสมัครสมาชิก ไม่มีโฆษณา และไม่มีการส่งข้อมูลออกจากอุปกรณ์ของคุณ",
      "settings.dataActions": "จัดการข้อมูล",
      "settings.dangerZone": "โซนอันตราย",
      "settings.storage": "พื้นที่จัดเก็บ",
      "settings.storageUsed": "ใช้ไปประมาณ {size}",
      "settings.storageUnknown": "ไม่ทราบขนาด",
      "settings.storageMode": "โหมดจัดเก็บ",
      "settings.storageIdb": "IndexedDB",
      "settings.storageLocal": "ที่จัดเก็บในเบราว์เซอร์ (สำรอง)",
      "settings.dataLocal": "ข้อมูลอยู่ใน IndexedDB ของเบราว์เซอร์นี้",
      "settings.exportJsonDone": "สำรองข้อมูลแล้ว",
      "settings.exportCsvDone": "ส่งออก CSV แล้ว",
      "settings.importJsonHelp": "เลือกไฟล์ .json ที่สำรองไว้",
      "settings.clearHint": "ลบรายการ หมวดหมู่ และการตั้งค่าทั้งหมด แล้วสร้างหมวดหมู่เริ่มต้นใหม่",
      "settings.sample": "โหลดข้อมูลตัวอย่าง",
      "settings.sampleHelp": "เพิ่มรายการตัวอย่างเพื่อดูการสรุปยอด (ไม่กระทบข้อมูลจริงหากยังไม่มีรายการ)",
      "settings.sampleConfirmTitle": "โหลดข้อมูลตัวอย่าง?",
      "settings.sampleConfirmBody": "ระบบจะเพิ่มรายการตัวอย่างในปีนี้และปีย้อนหลังหนึ่งปี",
      "settings.sampleLoaded": "โหลดข้อมูลตัวอย่างแล้ว",
      "settings.sampleExists": "มีข้อมูลอยู่แล้ว ไม่ได้เพิ่มตัวอย่าง",
      "settings.versionValue": "1.0.0",
      "settings.languageChanged": "เปลี่ยนภาษาแล้ว",
      "settings.themeChanged": "เปลี่ยนโทนสีแล้ว",
      "settings.currencyChanged": "เปลี่ยนสกุลเงินที่แสดงแล้ว",
      "settings.appInstalled": "ติดตั้งแอปแล้ว",
      "settings.ratesNote": "ตัวอย่าง: 1 USD = 35.50 THB",
      "settings.storageNote": "ข้อมูลถูกเก็บในอุปกรณ์นี้",
      "settings.installHint": "ติดตั้งเพื่อเปิดแบบเต็มหน้าจอ",
      "settings.aboutVersion": "เวอร์ชัน {version}",

      "common.close": "ปิด",
      "common.save": "บันทึก",
      "common.cancel": "ยกเลิก",
      "common.delete": "ลบ",
      "common.edit": "แก้ไข",
      "common.add": "เพิ่ม",
      "common.confirm": "ยืนยัน",
      "common.search": "ค้นหา",
      "common.all": "ทั้งหมด",
      "common.total": "รวม",
      "common.today": "วันนี้",
      "common.thisYear": "ปีนี้",
      "common.current": "ปัจจุบัน",
      "common.actions": "การกระทำ",
      "common.name": "ชื่อ",
      "common.amount": "จำนวน",
      "common.date": "วันที่",
      "common.time": "เวลา",
      "common.type": "ประเภท",
      "common.category": "หมวดหมู่",
      "common.currency": "สกุลเงิน",
      "common.note": "โน้ต",
      "common.year": "ปี",
      "common.month": "เดือน",
      "common.loading": "กำลังโหลด…",
      "common.optional": "ไม่บังคับ",
      "common.required": "จำเป็น",
      "common.reset": "รีเซ็ต",
      "common.done": "เสร็จสิ้น",
      "common.dismiss": "ปิด",
      "common.view": "ดู",
      "common.export": "ส่งออก",
      "common.import": "นำเข้า",
      "common.settings": "ตั้งค่า",
      "common.error": "เกิดข้อผิดพลาด",
      "common.retry": "ลองใหม่",
      "common.localOnly": "ข้อมูลอยู่ในเครื่องนี้เท่านั้น",
      "common.offline": "ออฟไลน์",
      "common.online": "ออนไลน์",
      "common.install": "ติดตั้ง",
      "common.installed": "ติดตั้งแล้ว",
      "common.clear": "ล้าง",
      "common.back": "ย้อนกลับ",
      "common.next": "ถัดไป",
      "common.previous": "ก่อนหน้า",
      "common.none": "ไม่มี",

      "aria.skip": "ข้ามไปยังเนื้อหาหลัก",
      "aria.menu": "เมนูหลัก",
      "aria.openSidebar": "เปิดเมนูด้านข้าง",
      "aria.closeSidebar": "ปิดเมนูด้านข้าง",
      "aria.language": "เปลี่ยนภาษา",
      "aria.theme": "เปลี่ยนโทนสี",
      "aria.clock": "นาฬิกาและวันที่ปัจจุบัน",
      "aria.addCategory": "เพิ่มหมวดหมู่",
      "aria.editCategory": "แก้ไขหมวดหมู่",
      "aria.deleteCategory": "ลบหมวดหมู่",
      "aria.install": "ติดตั้งแอป",
      "aria.filter": "ตัวกรองรายการ",
      "aria.pagination": "การแสดงรายการ",
      "aria.categoryFilter": "กรองตามหมวดหมู่ {name}",
      "aria.closeDialog": "ปิดหน้าต่าง",
      "aria.editTransaction": "แก้ไขรายการ",
      "aria.deleteTransaction": "ลบรายการ",
      "aria.more": "ตัวเลือกเพิ่มเติม",
      "aria.currentPage": "หน้าปัจจุบัน",
      "aria.income": "รายรับ",
      "aria.expense": "รายจ่าย",
      "aria.search": "ค้นหารายการ",
      "aria.year": "เลือกปี",
      "aria.currency": "เลือกสกุลเงิน",
      "aria.type": "เลือกประเภท",
      "aria.category": "เลือกหมวดหมู่",
      "aria.month": "เลือกเดือน",
      "aria.amount": "จำนวนเงิน",
      "aria.note": "โน้ต",
      "aria.date": "วันที่",
      "aria.time": "เวลา",
      "aria.color": "เลือกสี",
      "aria.rates": "อัตราแลกเปลี่ยน",
      "aria.installApp": "ติดตั้งแอปพลิเคชัน",
      "aria.offlineStatus": "สถานะการเชื่อมต่อ"
    },

    en: {
      "app.name": "Money Ledger",
      "app.tagline": "Your money, on your device",

      "nav.dashboard": "Overview",
      "nav.transactions": "Entries",
      "nav.summary": "Yearly summary",
      "nav.categories": "Categories",
      "nav.settings": "Settings",
      "nav.expense": "Expenses",
      "nav.income": "Income",
      "nav.addCategory": "Add category",
      "nav.openMenu": "Open menu",
      "nav.closeMenu": "Close menu",
      "top.add": "Add entry",
      "top.language": "Switch language",
      "top.theme": "Switch color mode",
      "top.themeLight": "Light mode",
      "top.themeDark": "Dark mode",
      "clock.timezone": "Thailand time (ICT)",
      "clock.label": "Clock",

      "sidebar.categories": "Categories",
      "sidebar.manage": "Manage",
      "sidebar.noCategories": "No categories yet",
      "sidebar.addFirst": "Add your first category",
      "sidebar.showAll": "View all",
      "sidebar.expenseCount": "{count} categories",
      "sidebar.incomeCount": "{count} categories",
      "sidebar.countOne": "1 category",

      "dashboard.title": "Overview",
      "dashboard.subtitle": "Income, expenses and balance for the selected year",
      "dashboard.year": "Year",
      "dashboard.currency": "Display currency",
      "dashboard.income": "Income",
      "dashboard.expense": "Expenses",
      "dashboard.balance": "Balance",
      "dashboard.monthly": "By month",
      "dashboard.monthlyHint": "Monthly totals for the selected year",
      "dashboard.byCategory": "By category",
      "dashboard.breakdownHint": "Expense and income shares this year",
      "dashboard.recent": "Recent entries",
      "dashboard.recentHint": "Latest entries in the selected year",
      "dashboard.viewAll": "View all",
      "dashboard.viewSummary": "View yearly summary",
      "dashboard.emptyTitle": "No entries this year",
      "dashboard.emptyBody": "Add your first income or expense. Everything stays on this device.",
      "dashboard.emptyAction": "Add first entry",
      "dashboard.convertedNote": "Converted to {currency} using your saved rates",
      "dashboard.currentMonth": "This month",
      "dashboard.noExpense": "No expenses this year",
      "dashboard.noIncome": "No income this year",
      "dashboard.proportion": "Income and expense share",
      "dashboard.incomeShort": "In",
      "dashboard.expenseShort": "Out",
      "dashboard.balanceShort": "Balance",
      "dashboard.entries": "{count} entries",
      "dashboard.entriesOne": "1 entry",
      "dashboard.yearTotal": "Year total",
      "dashboard.current": "Current month",

      "tx.title": "Entries",
      "tx.subtitle": "Search, filter and edit every entry",
      "tx.add": "Add entry",
      "tx.addTitle": "Add entry",
      "tx.editTitle": "Edit entry",
      "tx.delete": "Delete entry",
      "tx.type": "Type",
      "tx.income": "Income",
      "tx.expense": "Expense",
      "tx.amount": "Amount",
      "tx.currency": "Currency",
      "tx.category": "Category",
      "tx.date": "Date",
      "tx.time": "Time",
      "tx.note": "Note",
      "tx.notePlaceholder": "e.g. Lunch with a friend",
      "tx.save": "Save",
      "tx.cancel": "Cancel",
      "tx.deleteTitle": "Delete this entry?",
      "tx.deleteBody": "This entry will be permanently removed from your device.",
      "tx.deleteConfirm": "Delete entry",
      "tx.saved": "Entry saved",
      "tx.deleted": "Entry deleted",
      "tx.updated": "Entry updated",
      "tx.timestamp": "Saved at",
      "tx.occurred": "Date and time",
      "tx.original": "Original amount",
      "tx.converted": "Converted to {currency}",
      "tx.noCategory": "Uncategorized",
      "tx.selectCategory": "Select a category",
      "tx.manageCategories": "Manage categories",
      "tx.addCategoryFirst": "No categories for this type yet",
      "tx.addCategoryFirstBody": "Add a category before saving this entry.",
      "tx.required": "Please complete the required fields",
      "tx.invalidAmount": "Amount must be greater than 0",
      "tx.invalidDate": "Date and time are not valid",
      "tx.saveError": "Could not save. Please try again.",
      "tx.filterSearch": "Search notes or categories",
      "tx.filterType": "All types",
      "tx.filterCategory": "All categories",
      "tx.filterMonth": "All months",
      "tx.filterYear": "All years",
      "tx.filterCurrency": "All currencies",
      "tx.filterClear": "Clear filters",
      "tx.filters": "Filters",
      "tx.noneTitle": "No entries found",
      "tx.noneBody": "Try different filters or add a new entry.",
      "tx.loadMore": "Show more",
      "tx.showing": "Showing {shown} of {total} entries",
      "tx.editHint": "Click an entry to edit",
      "tx.deleteHint": "Delete",
      "tx.editHintShort": "Edit",
      "tx.amountPlaceholder": "0.00",
      "tx.createdAt": "Created",
      "tx.updatedAt": "Last updated",
      "tx.timezoneNote": "Your device time",
      "tx.count": "{count} entries",
      "tx.uncategorized": "Uncategorized",
      "tx.dayIncome": "In {amount}",
      "tx.dayExpense": "Out {amount}",
      "tx.rowAria": "Edit {name} for {amount}",
      "tx.editAria": "Edit {name}",
      "tx.deleteAria": "Delete {name}",
      "tx.addFirst": "Add first entry",
      "tx.noCategoryOption": "No categories yet",

      "summary.title": "Yearly summary",
      "summary.subtitle": "Yearly, monthly and category totals",
      "summary.year": "Year",
      "summary.currency": "Display currency",
      "summary.export": "Export CSV",
      "summary.exported": "CSV file exported",
      "summary.monthly": "Monthly summary",
      "summary.monthlyHint": "Income, expenses and balance for each month",
      "summary.total": "Year total",
      "summary.byCategory": "By category",
      "summary.byCurrency": "By currency",
      "summary.currencyHint": "Original totals per currency and converted totals",
      "summary.income": "Income",
      "summary.expense": "Expenses",
      "summary.balance": "Balance",
      "summary.net": "Net",
      "summary.rate": "Rate (THB)",
      "summary.original": "Original",
      "summary.converted": "Converted to {currency}",
      "summary.noData": "No data for this year",
      "summary.noDataBody": "Add an entry and come back to see the summary.",
      "summary.percentOfExpense": "{percent} of expenses",
      "summary.percentOfIncome": "{percent} of income",
      "summary.month": "Month",
      "summary.entries": "Entries",
      "summary.currencyNote": "Exchange rates are editable estimates set in Settings.",
      "summary.totalRow": "Total",
      "summary.share": "Share",
      "summary.thisYear": "This year",
      "summary.allYears": "All years",
      "summary.exportEmpty": "Nothing to export yet",

      "categories.title": "Categories",
      "categories.subtitle": "Manage the income and expense categories you use",
      "categories.add": "Add category",
      "categories.edit": "Edit category",
      "categories.expense": "Expense categories",
      "categories.income": "Income categories",
      "categories.nameTh": "Thai name",
      "categories.nameEn": "English name",
      "categories.nameThPlaceholder": "e.g. อาหาร",
      "categories.nameEnPlaceholder": "e.g. Food",
      "categories.color": "Color",
      "categories.type": "Type",
      "categories.save": "Save",
      "categories.cancel": "Cancel",
      "categories.deleteTitle": "Delete this category?",
      "categories.deleteBody": "This category has no entries and can be deleted.",
      "categories.deleteUsedBody": "This category has {count} entries. Move them to “Other” and delete it?",
      "categories.deleteUsedBodyOne": "This category has 1 entry. Move them to “Other” and delete it?",
      "categories.deleteConfirm": "Delete category",
      "categories.created": "Category added",
      "categories.updated": "Category updated",
      "categories.deleted": "Category deleted",
      "categories.moved": "Entries moved to “Other”",
      "categories.nameRequired": "Enter at least one category name",
      "categories.duplicate": "A category with this name already exists",
      "categories.other": "Other",
      "categories.usage": "{count} entries",
      "categories.usageOne": "1 entry",
      "categories.total": "This year",
      "categories.emptyExpense": "No expense categories yet",
      "categories.emptyIncome": "No income categories yet",
      "categories.emptyBody": "Add a category to start recording entries.",
      "categories.colorLabel": "Color {n}",
      "categories.manageHint": "Click a category in the sidebar to filter entries",
      "categories.count": "{count} categories",
      "categories.countOne": "1 category",
      "categories.saveError": "Could not save. Please try again.",
      "categories.deleteError": "Could not delete. Please try again.",
      "categories.used": "Used in entries",
      "categories.noName": "Untitled",

      "settings.title": "Settings",
      "settings.subtitle": "Language, color mode, currency and on-device data",
      "settings.language": "Language",
      "settings.languageHelp": "Applies to menus, dates and number formatting",
      "settings.thai": "ไทย",
      "settings.english": "English",
      "settings.theme": "Color mode",
      "settings.themeHelp": "Choose the mode that is easiest on your eyes",
      "settings.light": "Light",
      "settings.dark": "Dark",
      "settings.currency": "Display currency",
      "settings.currencyHelp": "Each entry keeps its original currency and is converted for summaries",
      "settings.rates": "Exchange rates",
      "settings.ratesHelp": "Set the value of 1 unit of each currency in baht. These are editable estimates used for summaries.",
      "settings.rateColumn": "1 unit = THB",
      "settings.resetRates": "Reset default rates",
      "settings.ratesReset": "Exchange rates reset",
      "settings.rateInvalid": "Rate must be greater than 0",
      "settings.rateChanged": "Exchange rate updated",
      "settings.data": "Data on this device",
      "settings.dataHelp": "Everything is stored in this browser. No account and no server.",
      "settings.exportJson": "Back up (JSON)",
      "settings.importJson": "Import (JSON)",
      "settings.exportCsv": "Export year CSV",
      "settings.clearData": "Delete all data",
      "settings.clearTitle": "Delete all data?",
      "settings.clearBody": "All entries, categories and settings on this device will be permanently deleted. This cannot be undone. Default categories will be recreated.",
      "settings.clearConfirm": "Delete everything",
      "settings.cleared": "All data deleted",
      "settings.importTitle": "Import data?",
      "settings.importBody": "The backup will be merged with your current data. Entries with the same id are overwritten.",
      "settings.importConfirm": "Import",
      "settings.importSuccess": "Data imported",
      "settings.importError": "The file is invalid or damaged",
      "settings.install": "Install app",
      "settings.installed": "Installed",
      "settings.installHelp": "Install for a full-screen, offline-ready app",
      "settings.installUnavailable": "Your browser has not offered an install prompt yet",
      "settings.iosInstall": "On iPhone/iPad: tap Share, then “Add to Home Screen”",
      "settings.desktopInstall": "On desktop: open the browser menu and choose “Install app”",
      "settings.openViaServer": "If you opened the file directly, install may be unavailable. Launch with start.cmd.",
      "settings.status": "Connection status",
      "settings.online": "Online",
      "settings.offline": "Offline",
      "settings.offlineReady": "Offline ready",
      "settings.offlineNote": "After the first load the app keeps working without a network.",
      "settings.pwa": "Progressive web app",
      "settings.connection": "Connection",
      "settings.version": "Version",
      "settings.about": "About",
      "settings.aboutBody": "An offline-first income and expense ledger that runs in your browser. Your data stays on this device.",
      "settings.privacy": "Privacy",
      "settings.privacyBody": "No sign-up, no ads and no data sent off your device.",
      "settings.dataActions": "Data actions",
      "settings.dangerZone": "Danger zone",
      "settings.storage": "Storage",
      "settings.storageUsed": "About {size} used",
      "settings.storageUnknown": "Size unknown",
      "settings.storageMode": "Storage mode",
      "settings.storageIdb": "IndexedDB",
      "settings.storageLocal": "Browser storage (fallback)",
      "settings.dataLocal": "Stored in this browser's IndexedDB",
      "settings.exportJsonDone": "Backup exported",
      "settings.exportCsvDone": "CSV exported",
      "settings.importJsonHelp": "Choose a .json backup file",
      "settings.clearHint": "Delete all entries, categories and settings, then recreate default categories",
      "settings.sample": "Load sample data",
      "settings.sampleHelp": "Add example entries to preview the summaries (only when you have no entries)",
      "settings.sampleConfirmTitle": "Load sample data?",
      "settings.sampleConfirmBody": "Example entries for this year and the previous year will be added.",
      "settings.sampleLoaded": "Sample data loaded",
      "settings.sampleExists": "You already have entries, so nothing was added",
      "settings.versionValue": "1.0.0",
      "settings.languageChanged": "Language changed",
      "settings.themeChanged": "Color mode changed",
      "settings.currencyChanged": "Display currency changed",
      "settings.appInstalled": "App installed",
      "settings.ratesNote": "Example: 1 USD = 35.50 THB",
      "settings.storageNote": "Your data stays on this device",
      "settings.installHint": "Install for a full-screen experience",
      "settings.aboutVersion": "Version {version}",

      "common.close": "Close",
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.delete": "Delete",
      "common.edit": "Edit",
      "common.add": "Add",
      "common.confirm": "Confirm",
      "common.search": "Search",
      "common.all": "All",
      "common.total": "Total",
      "common.today": "Today",
      "common.thisYear": "This year",
      "common.current": "Current",
      "common.actions": "Actions",
      "common.name": "Name",
      "common.amount": "Amount",
      "common.date": "Date",
      "common.time": "Time",
      "common.type": "Type",
      "common.category": "Category",
      "common.currency": "Currency",
      "common.note": "Note",
      "common.year": "Year",
      "common.month": "Month",
      "common.loading": "Loading…",
      "common.optional": "Optional",
      "common.required": "Required",
      "common.reset": "Reset",
      "common.done": "Done",
      "common.dismiss": "Dismiss",
      "common.view": "View",
      "common.export": "Export",
      "common.import": "Import",
      "common.settings": "Settings",
      "common.error": "Something went wrong",
      "common.retry": "Try again",
      "common.localOnly": "Your data stays on this device",
      "common.offline": "Offline",
      "common.online": "Online",
      "common.install": "Install",
      "common.installed": "Installed",
      "common.clear": "Clear",
      "common.back": "Back",
      "common.next": "Next",
      "common.previous": "Previous",
      "common.none": "None",

      "aria.skip": "Skip to main content",
      "aria.menu": "Main menu",
      "aria.openSidebar": "Open sidebar",
      "aria.closeSidebar": "Close sidebar",
      "aria.language": "Switch language",
      "aria.theme": "Switch color mode",
      "aria.clock": "Current date and time",
      "aria.addCategory": "Add category",
      "aria.editCategory": "Edit category",
      "aria.deleteCategory": "Delete category",
      "aria.install": "Install app",
      "aria.filter": "Entry filters",
      "aria.pagination": "Entry pagination",
      "aria.categoryFilter": "Filter by {name} category",
      "aria.closeDialog": "Close dialog",
      "aria.editTransaction": "Edit entry",
      "aria.deleteTransaction": "Delete entry",
      "aria.more": "More options",
      "aria.currentPage": "Current page",
      "aria.income": "Income",
      "aria.expense": "Expense",
      "aria.search": "Search entries",
      "aria.year": "Choose year",
      "aria.currency": "Choose currency",
      "aria.type": "Choose type",
      "aria.category": "Choose category",
      "aria.month": "Choose month",
      "aria.amount": "Amount",
      "aria.note": "Note",
      "aria.date": "Date",
      "aria.time": "Time",
      "aria.color": "Choose color",
      "aria.rates": "Exchange rates",
      "aria.installApp": "Install the application",
      "aria.offlineStatus": "Connection status"
    }
  };

  var lang = "th";
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.indexOf(saved) !== -1) lang = saved;
  } catch (err) {
    /* storage can be unavailable on file:// */
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function toDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === "number") return new Date(value);
    if (typeof value === "string") return new Date(value);
    return null;
  }

  function t(key, vars) {
    var table = DICT[lang] || DICT.th;
    var text = table[key];
    if (text == null) text = DICT.th[key];
    if (text == null) return key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        text = text.split("{" + name + "}").join(String(vars[name]));
      });
    }
    return text;
  }

  function setLanguage(next) {
    if (SUPPORTED.indexOf(next) === -1) return lang;
    lang = next;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (err) {
      /* ignore */
    }
    document.documentElement.lang = lang;
    return lang;
  }

  function applyStaticTranslations(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (key) el.textContent = t(key);
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      if (key) el.setAttribute("placeholder", t(key));
    });
    scope.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (key) el.setAttribute("aria-label", t(key));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-title");
      if (key) el.setAttribute("title", t(key));
    });
  }

  function numberLocale() {
    return lang === "th" ? "th-TH" : "en-US";
  }

  function formatNumber(value, decimals) {
    var n = Number(value);
    if (!isFinite(n)) n = 0;
    var d = typeof decimals === "number" ? decimals : 2;
    return new Intl.NumberFormat(numberLocale(), {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    }).format(n);
  }

  function zeroDecimal(currency) {
    return ["JPY", "KRW", "VND", "LAK"].indexOf(String(currency).toUpperCase()) !== -1;
  }

  function formatMoney(value, currency, options) {
    var opts = options || {};
    var code = String(currency || "THB").toUpperCase();
    var n = Number(value);
    if (!isFinite(n)) n = 0;
    var decimals = opts.decimals;
    if (typeof decimals !== "number") decimals = zeroDecimal(code) ? 0 : 2;
    var display = opts.showCode || code !== "THB" ? "code" : "narrowSymbol";
    try {
      return new Intl.NumberFormat(numberLocale(), {
        style: "currency",
        currency: code,
        currencyDisplay: display,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(n);
    } catch (err) {
      return code + " " + formatNumber(n, decimals);
    }
  }

  function formatDate(value, style) {
    var d = toDate(value);
    if (!d || isNaN(d.getTime())) return "—";
    var y = d.getFullYear();
    var m = d.getMonth();
    var day = d.getDate();
    var wd = d.getDay();
    if (lang === "th") {
      var by = y + 543;
      if (style === "long") return "วัน" + WEEKDAYS.th[wd] + "ที่ " + day + " " + MONTHS.th[m] + " " + by;
      if (style === "medium") return day + " " + MONTHS.th[m] + " " + by;
      if (style === "monthShort") return MONTHS_SHORT.th[m];
      if (style === "monthLong") return MONTHS.th[m];
      if (style === "weekday") return "วัน" + WEEKDAYS.th[wd];
      if (style === "weekdayShort") return WEEKDAYS_SHORT.th[wd];
      return day + " " + MONTHS_SHORT.th[m] + " " + by;
    }
    if (style === "long") return WEEKDAYS.en[wd] + ", " + day + " " + MONTHS.en[m] + " " + y;
    if (style === "medium") return day + " " + MONTHS.en[m] + " " + y;
    if (style === "monthShort") return MONTHS_SHORT.en[m];
    if (style === "monthLong") return MONTHS.en[m];
    if (style === "weekday") return WEEKDAYS.en[wd];
    if (style === "weekdayShort") return WEEKDAYS_SHORT.en[wd];
    return day + " " + MONTHS_SHORT.en[m] + " " + y;
  }

  function formatTime(value, withSeconds) {
    var d = toDate(value);
    if (!d || isNaN(d.getTime())) return "--:--";
    var h = pad(d.getHours());
    var m = pad(d.getMinutes());
    if (withSeconds === false) return h + ":" + m;
    return h + ":" + m + ":" + pad(d.getSeconds());
  }

  function formatDateTime(value, options) {
    var opts = options || {};
    var d = toDate(value);
    if (!d || isNaN(d.getTime())) return "—";
    var date = formatDate(d, opts.long ? "long" : "short");
    var time = formatTime(d, opts.seconds !== false);
    return date + " · " + time;
  }

  function formatIsoLocal(value) {
    var d = toDate(value);
    if (!d || isNaN(d.getTime())) return "—";
    return (
      d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
      " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds())
    );
  }

  function formatYear(year) {
    var y = Number(year);
    if (!isFinite(y)) y = new Date().getFullYear();
    return lang === "th" ? "พ.ศ. " + (y + 543) : String(y);
  }

  function formatMonthYear(year, month) {
    var y = Number(year);
    var m = Number(month);
    if (lang === "th") return MONTHS.th[m] + " " + (y + 543);
    return MONTHS.en[m] + " " + y;
  }

  function monthName(month, short) {
    var m = Number(month);
    if (!isFinite(m) || m < 0 || m > 11) return "—";
    return short ? MONTHS_SHORT[lang][m] : MONTHS[lang][m];
  }

  function weekdayName(day, short) {
    var d = Number(day);
    if (!isFinite(d) || d < 0 || d > 6) return "—";
    return short ? WEEKDAYS_SHORT[lang][d] : WEEKDAYS[lang][d];
  }

  function currencyName(code) {
    try {
      if (typeof Intl.DisplayNames === "function") {
        var names = new Intl.DisplayNames([numberLocale()], { type: "currency" });
        return names.of(code) || code;
      }
    } catch (err) {
      /* fall through */
    }
    return code;
  }

  function percent(value, decimals) {
    var n = Number(value);
    if (!isFinite(n)) n = 0;
    var d = typeof decimals === "number" ? decimals : 0;
    return new Intl.NumberFormat(numberLocale(), {
      style: "percent",
      minimumFractionDigits: d,
      maximumFractionDigits: d
    }).format(n);
  }

  function bytes(size) {
    var n = Number(size);
    if (!isFinite(n) || n <= 0) return "0 B";
    var units = ["B", "KB", "MB", "GB"];
    var i = Math.floor(Math.log(n) / Math.log(1024));
    i = Math.min(i, units.length - 1);
    var v = n / Math.pow(1024, i);
    return (i === 0 ? Math.round(v) : v.toFixed(1)) + " " + units[i];
  }

  document.documentElement.lang = lang;

  window.I18n = {
    get lang() {
      return lang;
    },
    t: t,
    setLanguage: setLanguage,
    applyStaticTranslations: applyStaticTranslations,
    formatNumber: formatNumber,
    formatMoney: formatMoney,
    formatDate: formatDate,
    formatTime: formatTime,
    formatDateTime: formatDateTime,
    formatIsoLocal: formatIsoLocal,
    formatYear: formatYear,
    formatMonthYear: formatMonthYear,
    monthName: monthName,
    weekdayName: weekdayName,
    currencyName: currencyName,
    percent: percent,
    bytes: bytes
  };
})();
