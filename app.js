// Initialize IndexedDB database for offline storage
const DB_NAME = ' offline-category-db';
const DB_VERSION = 1;
const CATEGORY_STORE = 'categories';

let db = null;

// Open or create the database
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const thisDB = event.target.result;
      if (!thisDB.objectStoreNames.contains(CATEGORY_STORE)) {
        thisDB.createObjectStore(CATEGORY_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
    
    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Get all categories
async function getCategories() {
  if (!db) await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CATEGORY_STORE], 'readonly');
    const objectStore = transaction.objectStore(CATEGORY_STORE);
    const request = objectStore.getAll();
    request.onsuccess = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Add a category
async function addCategory(name) {
  if (!db) await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CATEGORY_STORE], 'readwrite');
    const objectStore = transaction.objectStore(CATEGORY_STORE);
    const request = objectStore.add({ name: name.trim(), createdAt: new Date().toISOString() });
    request.onsuccess = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Delete a category
async function deleteCategory(id) {
  if (!db) await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CATEGORY_STORE], 'readwrite');
    const objectStore = transaction.objectStore(CATEGORY_STORE);
    const request = objectStore.delete(id);
    request.onsuccess = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
  });
}

// Render categories in sidebar
async function renderSidebar() {
  const categories = await getCategories();
  const categoryList = document.getElementById('category-list');
  
  categoryList.innerHTML = '';
  
  categories.forEach((cat, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="#" data-id="${cat.id}" class="category-link ${index === 0 ? 'active' : ''}">
        ${cat.name}
      </a>
    `;
    categoryList.appendChild(li);
  });
  
  // Add click handlers
  document.querySelectorAll('.category-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.category-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      showCategoryContent(parseInt(link.dataset.id));
    });
  });
}

// Show category content area
function showCategoryContent(categoryId) {
  const contentSection = document.getElementById('content');
  contentSection.innerHTML = `
    <div class="category-item">
      <span class="name">หมวดหมู่ที่ ${categoryId}</span>
      <div class="actions">
        <button class="edit-btn">แก้ไข</button>
        <button class="delete-btn">ลบ</button>
      </div>
    </div>
    <p>แสดงรายการรายรับ/รายจ่ายภายในหมวดหมู่</p>
  `;
}

// Register Service Worker for offline capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(() => {
      console.log('Service Worker registered successfully');
    });
  });
}

// Initialize the app
async function init() {
  await openDatabase();
  await renderSidebar();
  
  // Add category button
  const addBtn = document.getElementById('add-category-btn');
  const formSection = document.getElementById('category-form-section');
  const cancelBtn = document.getElementById('cancel-category-btn');
  const saveBtn = document.getElementById('save-category-btn');
  const input = document.getElementById('new-category-input');
  
  addBtn.addEventListener('click', () => {
    formSection.classList.add('visible');
    input.focus();
  });
  
  cancelBtn.addEventListener('click', () => {
    formSection.classList.remove('visible');
    input.value = '';
  });
  
  saveBtn.addEventListener('click', async () => {
    const name = input.value.trim();
    if (name) {
      await addCategory(name);
      await renderSidebar();
      formSection.classList.remove('visible');
      input.value = '';
    }
  });
  
  // Initial content
  showCategoryContent(1);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);