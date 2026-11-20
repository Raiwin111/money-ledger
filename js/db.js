/* =========================================================
   Money Ledger — local storage
   IndexedDB is the primary store. If the browser blocks it
   (for example when index.html is opened from file://), the
   same API falls back to localStorage so the ledger still works.
   ========================================================= */

(function () {
  "use strict";

  var DB_NAME = "money-ledger-db";
  var DB_VERSION = 1;
  var CATEGORIES = "categories";
  var TRANSACTIONS = "transactions";
  var META = "meta";

  var LS_CATEGORIES = "ledger.local.categories";
  var LS_TRANSACTIONS = "ledger.local.transactions";
  var LS_META = "ledger.local.meta";

  var CURRENCIES = ["THB", "USD", "EUR", "GBP", "JPY", "CNY", "KRW", "AUD", "SGD", "MYR", "HKD", "TWD", "LAK", "VND"];

  var DEFAULT_RATES = {
    THB: 1,
    USD: 35.5,
    EUR: 38.5,
    GBP: 45.0,
    JPY: 0.23,
    CNY: 4.9,
    KRW: 0.025,
    AUD: 23.5,
    SGD: 26.5,
    MYR: 8.0,
    HKD: 4.55,
    TWD: 1.1,
    LAK: 0.0016,
    VND: 0.0014
  };

  var DEFAULT_CATEGORIES = [
    { id: "exp-food", type: "expense", nameTh: "อาหาร", nameEn: "Food", color: "#b5683f", order: 0 },
    { id: "exp-transport", type: "expense", nameTh: "เดินทาง", nameEn: "Transport", color: "#4f7f8f", order: 1 },
    { id: "exp-home", type: "expense", nameTh: "ที่อยู่อาศัย", nameEn: "Housing", color: "#7c6a55", order: 2 },
    { id: "exp-health", type: "expense", nameTh: "สุขภาพ", nameEn: "Health", color: "#a35f6e", order: 3 },
    { id: "exp-shopping", type: "expense", nameTh: "ช้อปปิ้ง", nameEn: "Shopping", color: "#8a6f9e", order: 4 },
    { id: "exp-bills", type: "expense", nameTh: "บิลและสาธารณูปโภค", nameEn: "Bills & utilities", color: "#b08a3e", order: 5 },
    { id: "exp-fun", type: "expense", nameTh: "บันเทิง", nameEn: "Entertainment", color: "#5f8a6f", order: 6 },
    { id: "exp-other", type: "expense", nameTh: "อื่นๆ", nameEn: "Other", color: "#7a828a", order: 7 },
    { id: "inc-salary", type: "income", nameTh: "เงินเดือน", nameEn: "Salary", color: "#2f7d64", order: 8 },
    { id: "inc-side", type: "income", nameTh: "งานเสริม", nameEn: "Freelance", color: "#4f7f8f", order: 9 },
    { id: "inc-invest", type: "income", nameTh: "การลงทุน", nameEn: "Investments", color: "#8a6f4d", order: 10 },
    { id: "inc-gift", type: "income", nameTh: "ของขวัญ", nameEn: "Gifts", color: "#a35f6e", order: 11 },
    { id: "inc-other", type: "income", nameTh: "รายได้อื่นๆ", nameEn: "Other income", color: "#7a828a", order: 12 }
  ];

  var db = null;
  var mode = "idb";

  function nowIso() {
    return new Date().toISOString();
  }

  function openIdb() {
    return new Promise(function (resolve, reject) {
      if (!("indexedDB" in window)) {
        reject(new Error("IndexedDB is not available"));
        return;
      }

      var request;
      try {
        request = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (err) {
        reject(err);
        return;
      }

      request.onupgradeneeded = function (event) {
        var database = event.target.result;

        if (!database.objectStoreNames.contains(CATEGORIES)) {
          var categoryStore = database.createObjectStore(CATEGORIES, { keyPath: "id" });
          categoryStore.createIndex("type", "type", { unique: false });
          categoryStore.createIndex("order", "order", { unique: false });
        }

        if (!database.objectStoreNames.contains(TRANSACTIONS)) {
          var txStore = database.createObjectStore(TRANSACTIONS, { keyPath: "id" });
          txStore.createIndex("occurredAt", "occurredAt", { unique: false });
          txStore.createIndex("year", "year", { unique: false });
          txStore.createIndex("month", "month", { unique: false });
          txStore.createIndex("yearMonth", "yearMonth", { unique: false });
          txStore.createIndex("type", "type", { unique: false });
          txStore.createIndex("categoryId", "categoryId", { unique: false });
          txStore.createIndex("currency", "currency", { unique: false });
        }

        if (!database.objectStoreNames.contains(META)) {
          database.createObjectStore(META, { keyPath: "key" });
        }
      };

      request.onsuccess = function (event) {
        db = event.target.result;
        db.onversionchange = function () {
          db.close();
        };
        resolve(db);
      };

      request.onerror = function (event) {
        reject(event.target.error || new Error("IndexedDB open failed"));
      };

      request.onblocked = function () {
        reject(new Error("IndexedDB is blocked by another tab"));
      };
    });
  }

  function req(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function store(name, access) {
    var transaction = db.transaction([name], access);
    return transaction.objectStore(name);
  }

  function getAllIdb(name) {
    return new Promise(function (resolve, reject) {
      var transaction = db.transaction([name], "readonly");
      var request = transaction.objectStore(name).getAll();
      request.onsuccess = function () {
        resolve(request.result || []);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function putIdb(name, value) {
    return new Promise(function (resolve, reject) {
      var transaction = db.transaction([name], "readwrite");
      var request = transaction.objectStore(name).put(value);
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function deleteIdb(name, key) {
    return new Promise(function (resolve, reject) {
      var transaction = db.transaction([name], "readwrite");
      var request = transaction.objectStore(name).delete(key);
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function clearIdb(name) {
    return new Promise(function (resolve, reject) {
      var transaction = db.transaction([name], "readwrite");
      var request = transaction.objectStore(name).clear();
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  function lsRead(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (err) {
      return fallback;
    }
  }

  function lsWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      throw new Error("Local storage is full or unavailable");
    }
  }

  function sortCategories(list) {
    return list.slice().sort(function (a, b) {
      var ao = typeof a.order === "number" ? a.order : 9999;
      var bo = typeof b.order === "number" ? b.order : 9999;
      if (ao !== bo) return ao - bo;
      return String(a.nameTh || a.nameEn || "").localeCompare(String(b.nameTh || b.nameEn || ""), "th");
    });
  }

  function sortTransactions(list) {
    return list.slice().sort(function (a, b) {
      return new Date(b.occurredAt || 0) - new Date(a.occurredAt || 0);
    });
  }

  function defaultCategories() {
    return DEFAULT_CATEGORIES.map(function (item, index) {
      return {
        id: item.id,
        type: item.type,
        nameTh: item.nameTh,
        nameEn: item.nameEn,
        color: item.color,
        order: index,
        createdAt: nowIso()
      };
    });
  }

  var api = {
    get mode() {
      return mode;
    },
    CURRENCIES: CURRENCIES,
    DEFAULT_RATES: DEFAULT_RATES,
    DEFAULT_CATEGORIES: DEFAULT_CATEGORIES,
    defaultCategories: defaultCategories,

    async open() {
      if (db || mode === "local") return mode;
      try {
        await openIdb();
        mode = "idb";
        return mode;
      } catch (err) {
        console.warn("IndexedDB unavailable; using localStorage fallback.", err);
        mode = "local";
        return mode;
      }
    },

    async getCategories() {
      if (mode === "local") {
        return sortCategories(lsRead(LS_CATEGORIES, []));
      }
      return sortCategories(await getAllIdb(CATEGORIES));
    },

    async putCategory(category) {
      if (mode === "local") {
        var list = lsRead(LS_CATEGORIES, []);
        var index = list.findIndex(function (item) {
          return item.id === category.id;
        });
        if (index === -1) list.push(category);
        else list[index] = category;
        lsWrite(LS_CATEGORIES, list);
        return category.id;
      }
      return putIdb(CATEGORIES, category);
    },

    async bulkPutCategories(categories) {
      if (mode === "local") {
        var list = lsRead(LS_CATEGORIES, []);
        categories.forEach(function (category) {
          var index = list.findIndex(function (item) {
            return item.id === category.id;
          });
          if (index === -1) list.push(category);
          else list[index] = category;
        });
        lsWrite(LS_CATEGORIES, list);
        return true;
      }
      await Promise.all(categories.map(function (category) {
        return putIdb(CATEGORIES, category);
      }));
      return true;
    },

    async deleteCategory(id) {
      if (mode === "local") {
        lsWrite(LS_CATEGORIES, lsRead(LS_CATEGORIES, []).filter(function (item) {
          return item.id !== id;
        }));
        return true;
      }
      return deleteIdb(CATEGORIES, id);
    },

    async getTransactions() {
      if (mode === "local") {
        return sortTransactions(lsRead(LS_TRANSACTIONS, []));
      }
      return sortTransactions(await getAllIdb(TRANSACTIONS));
    },

    async putTransaction(transaction) {
      if (mode === "local") {
        var list = lsRead(LS_TRANSACTIONS, []);
        var index = list.findIndex(function (item) {
          return item.id === transaction.id;
        });
        if (index === -1) list.push(transaction);
        else list[index] = transaction;
        lsWrite(LS_TRANSACTIONS, list);
        return transaction.id;
      }
      return putIdb(TRANSACTIONS, transaction);
    },

    async bulkPutTransactions(transactions) {
      if (mode === "local") {
        var list = lsRead(LS_TRANSACTIONS, []);
        transactions.forEach(function (transaction) {
          var index = list.findIndex(function (item) {
            return item.id === transaction.id;
          });
          if (index === -1) list.push(transaction);
          else list[index] = transaction;
        });
        lsWrite(LS_TRANSACTIONS, list);
        return true;
      }
      await Promise.all(transactions.map(function (transaction) {
        return putIdb(TRANSACTIONS, transaction);
      }));
      return true;
    },

    async deleteTransaction(id) {
      if (mode === "local") {
        lsWrite(LS_TRANSACTIONS, lsRead(LS_TRANSACTIONS, []).filter(function (item) {
          return item.id !== id;
        }));
        return true;
      }
      return deleteIdb(TRANSACTIONS, id);
    },

    async clearAll() {
      if (mode === "local") {
        try {
          localStorage.removeItem(LS_CATEGORIES);
          localStorage.removeItem(LS_TRANSACTIONS);
          localStorage.removeItem(LS_META);
        } catch (err) {
          throw new Error("Could not clear local storage");
        }
        return true;
      }
      await clearIdb(TRANSACTIONS);
      await clearIdb(CATEGORIES);
      await clearIdb(META);
      return true;
    },

    async countTransactionsByCategory(categoryId) {
      if (mode === "local") {
        return lsRead(LS_TRANSACTIONS, []).filter(function (item) {
          return item.categoryId === categoryId;
        }).length;
      }
      if (!db) await api.open();
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction([TRANSACTIONS], "readonly");
        var index = transaction.objectStore(TRANSACTIONS).index("categoryId");
        var request = index.count(categoryId);
        request.onsuccess = function () {
          resolve(request.result || 0);
        };
        request.onerror = function () {
          reject(request.error);
        };
      });
    },

    async reassignCategory(fromId, toId) {
      if (mode === "local") {
        var list = lsRead(LS_TRANSACTIONS, []);
        var changed = 0;
        list.forEach(function (item) {
          if (item.categoryId === fromId) {
            item.categoryId = toId;
            item.updatedAt = nowIso();
            changed += 1;
          }
        });
        lsWrite(LS_TRANSACTIONS, list);
        return changed;
      }

      if (!db) await api.open();
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction([TRANSACTIONS], "readwrite");
        var index = transaction.objectStore(TRANSACTIONS).index("categoryId");
        var request = index.openCursor(IDBKeyRange.only(fromId));
        var changed = 0;
        request.onsuccess = function (event) {
          var cursor = event.target.result;
          if (!cursor) {
            resolve(changed);
            return;
          }
          var record = cursor.value;
          record.categoryId = toId;
          record.updatedAt = nowIso();
          cursor.update(record);
          changed += 1;
          cursor.continue();
        };
        request.onerror = function () {
          reject(request.error);
        };
      });
    },

    async getMeta(key) {
      if (mode === "local") {
        var meta = lsRead(LS_META, {});
        return meta[key];
      }
      if (!db) await api.open();
      var record = await req(store(META, "readonly").get(key));
      return record ? record.value : undefined;
    },

    async setMeta(key, value) {
      if (mode === "local") {
        var meta = lsRead(LS_META, {});
        meta[key] = value;
        lsWrite(LS_META, meta);
        return true;
      }
      return putIdb(META, { key: key, value: value });
    },

    async seedCategories(force) {
      var existing = await api.getCategories();
      if (existing.length > 0 && !force) return existing;
      var categories = defaultCategories();
      await api.bulkPutCategories(categories);
      await api.setMeta("seededAt", nowIso());
      return categories;
    },

    async ensureOtherCategory(type, excludeId) {
      var categories = await api.getCategories();
      var other = categories.find(function (category) {
        if (category.type !== type) return false;
        if (excludeId && category.id === excludeId) return false;
        var th = String(category.nameTh || "").trim();
        var en = String(category.nameEn || "").toLowerCase().trim();
        return th === "อื่นๆ" || th === "รายได้อื่นๆ" || en === "other" || en === "other income" ||
          category.id === (type === "expense" ? "exp-other" : "inc-other");
      });
      if (other) return other;

      var created = {
        id: type + "-other-" + Date.now().toString(36),
        type: type,
        nameTh: type === "expense" ? "อื่นๆ" : "รายได้อื่นๆ",
        nameEn: type === "expense" ? "Other" : "Other income",
        color: "#7a828a",
        order: categories.length,
        createdAt: nowIso()
      };
      await api.putCategory(created);
      return created;
    }
  };

  window.DB = api;
})();
