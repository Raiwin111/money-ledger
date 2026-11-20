/* =========================================================
   Money Ledger — application
   A calm, bilingual, offline-first income and expense ledger.
   ========================================================= */

(function () {
  "use strict";

  var STORAGE_THEME = "ledger.theme";
  var STORAGE_CURRENCY = "ledger.currency";
  var STORAGE_RATES = "ledger.rates";
  var TX_PAGE = 60;
  var VIEWS = ["dashboard", "transactions", "summary", "categories", "settings"];
  var COLOR_PALETTE = [
    "#b5683f", "#4f7f8f", "#7c6a55", "#a35f6e", "#8a6f9e",
    "#b08a3e", "#5f8a6f", "#7a828a", "#2f7d64", "#8a6f4d"
  ];

  var ICONS = {
    edit: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M13.5 6.5l3 3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v5M14 11v5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    ledger: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3.5h14a1 1 0 0 1 1 1v16l-2.5-1.6L15 20.5l-3-1.6-3 1.6-2.5-1.6L4 20.5v-16a1 1 0 0 1 1-1Z"/><path d="M8 8h8M8 12h8M8 16h4"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>',
    chart: '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>'
  };

  var state = {
    view: "dashboard",
    year: new Date().getFullYear(),
    displayCurrency: loadCurrency(),
    theme: loadTheme(),
    rates: loadRates(),
    categories: [],
    transactions: [],
    filters: {
      search: "",
      type: "all",
      categoryId: "all",
      month: "all",
      year: String(new Date().getFullYear()),
      currency: "all"
    },
    txLimit: TX_PAGE,
    editingTxId: null,
    editingCategoryId: null,
    confirmCallback: null,
    deferredPrompt: null,
    txDefaults: {},
    initialized: false,
    swReady: false,
    swUnavailable: false
  };

  var toastTimer = null;
  var searchTimer = null;
  var clockTimer = null;
  var previousView = null;

  /* ---------------------------------------------------------
     Small helpers
     --------------------------------------------------------- */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || "")) ? value : "#7a828a";
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function toDate(value) {
    if (value instanceof Date) return value;
    if (typeof value === "number") return new Date(value);
    if (typeof value === "string") return new Date(value);
    return null;
  }

  function dateInputValue(date) {
    return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
  }

  function timeInputValue(date) {
    return pad2(date.getHours()) + ":" + pad2(date.getMinutes()) + ":" + pad2(date.getSeconds());
  }

  function buildOccurredAt(dateStr, timeStr) {
    var dateParts = String(dateStr || "").split("-").map(Number);
    var timeParts = String(timeStr || "00:00:00").split(":").map(Number);
    if (dateParts.length !== 3 || !dateParts[0] || !dateParts[1] || !dateParts[2]) return null;
    var date = new Date(
      dateParts[0], dateParts[1] - 1, dateParts[2],
      timeParts[0] || 0, timeParts[1] || 0, timeParts[2] || 0, 0
    );
    if (isNaN(date.getTime())) return null;
    if (date.getFullYear() !== dateParts[0] || date.getMonth() !== dateParts[1] - 1 || date.getDate() !== dateParts[2]) {
      return null;
    }
    return date;
  }

  function dateKey(value) {
    var d = toDate(value);
    if (!d || isNaN(d.getTime())) return "unknown";
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function isToday(value) {
    var d = toDate(value);
    if (!d) return false;
    var now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }

  function parseAmount(value) {
    var n = Number(String(value == null ? "" : value).replace(/,/g, "").trim());
    return isFinite(n) ? n : 0;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function debounce(fn, wait) {
    return function () {
      var args = arguments;
      var context = this;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        fn.apply(context, args);
      }, wait);
    };
  }

  function downloadBlob(content, filename, type) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1500);
  }

  function csvEscape(value) {
    var text = String(value == null ? "" : value);
    if (/[",\r\n]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
    return text;
  }

  /* ---------------------------------------------------------
     Settings persistence
     --------------------------------------------------------- */

  function loadTheme() {
    try {
      return localStorage.getItem(STORAGE_THEME) === "dark" ? "dark" : "light";
    } catch (err) {
      return "light";
    }
  }

  function loadCurrency() {
    try {
      var code = localStorage.getItem(STORAGE_CURRENCY);
      return DB.CURRENCIES.indexOf(code) !== -1 ? code : "THB";
    } catch (err) {
      return "THB";
    }
  }

  function loadRates() {
    var rates = Object.assign({}, DB.DEFAULT_RATES);
    try {
      var raw = localStorage.getItem(STORAGE_RATES);
      if (!raw) return rates;
      var saved = JSON.parse(raw);
      Object.keys(saved).forEach(function (code) {
        var value = Number(saved[code]);
        if (DB.CURRENCIES.indexOf(code) !== -1 && isFinite(value) && value > 0) rates[code] = value;
      });
    } catch (err) {
      /* keep defaults */
    }
    return rates;
  }

  function persistTheme() {
    try { localStorage.setItem(STORAGE_THEME, state.theme); } catch (err) { /* ignore */ }
  }

  function persistCurrency() {
    try { localStorage.setItem(STORAGE_CURRENCY, state.displayCurrency); } catch (err) { /* ignore */ }
  }

  function persistRates() {
    try { localStorage.setItem(STORAGE_RATES, JSON.stringify(state.rates)); } catch (err) { /* ignore */ }
  }

  /* ---------------------------------------------------------
     Money and dates
     --------------------------------------------------------- */

  function rateOf(code) {
    var rate = Number(state.rates[code]);
    return isFinite(rate) && rate > 0 ? rate : 1;
  }

  function convert(amount, from, to) {
    var value = Number(amount) || 0;
    if (from === to) return value;
    return (value * rateOf(from)) / rateOf(to);
  }

  function displayValue(transaction) {
    return convert(transaction.amount, transaction.currency, state.displayCurrency);
  }

  function fmtDisplay(value) {
    return I18n.formatMoney(value, state.displayCurrency);
  }

  function fmtMoney(value, currency) {
    return I18n.formatMoney(value, currency || state.displayCurrency);
  }

  function fmtSigned(transaction) {
    var sign = transaction.type === "income" ? "+" : "-";
    return sign + I18n.formatMoney(transaction.amount, transaction.currency);
  }

  function totalsFor(list) {
    var totals = { income: 0, expense: 0, balance: 0, incomeCount: 0, expenseCount: 0, count: list.length };
    list.forEach(function (transaction) {
      var value = displayValue(transaction);
      if (transaction.type === "income") {
        totals.income += value;
        totals.incomeCount += 1;
      } else {
        totals.expense += value;
        totals.expenseCount += 1;
      }
    });
    totals.balance = totals.income - totals.expense;
    return totals;
  }

  function monthTotals(year, month) {
    return totalsFor(state.transactions.filter(function (transaction) {
      return transaction.year === year && transaction.month === month;
    }));
  }

  function categoryTotals(list) {
    var map = {};
    list.forEach(function (transaction) {
      var key = transaction.categoryId || "uncategorized";
      if (!map[key]) map[key] = { income: 0, expense: 0, count: 0 };
      map[key][transaction.type] += displayValue(transaction);
      map[key].count += 1;
    });
    return map;
  }

  function currencyTotals(list) {
    var map = {};
    list.forEach(function (transaction) {
      if (!map[transaction.currency]) map[transaction.currency] = { income: 0, expense: 0, count: 0 };
      map[transaction.currency][transaction.type] += Number(transaction.amount) || 0;
      map[transaction.currency].count += 1;
    });
    return map;
  }

  function availableYears() {
    var years = new Set();
    years.add(new Date().getFullYear());
    years.add(Number(state.year));
    state.transactions.forEach(function (transaction) {
      if (transaction.year) years.add(Number(transaction.year));
    });
    return Array.from(years).filter(function (year) {
      return isFinite(year);
    }).sort(function (a, b) {
      return b - a;
    });
  }

  /* ---------------------------------------------------------
     Categories
     --------------------------------------------------------- */

  function categoryById(id) {
    return state.categories.find(function (category) {
      return category.id === id;
    }) || null;
  }

  function categoryName(category) {
    if (!category) return I18n.t("tx.uncategorized");
    if (I18n.lang === "th") return category.nameTh || category.nameEn || I18n.t("categories.noName");
    return category.nameEn || category.nameTh || I18n.t("categories.noName");
  }

  function categorySecondary(category) {
    if (!category) return "";
    var primary = I18n.lang === "th" ? category.nameTh : category.nameEn;
    var other = I18n.lang === "th" ? category.nameEn : category.nameTh;
    if (!other || other === primary) return "";
    return other;
  }

  function categoriesOfType(type) {
    return state.categories.filter(function (category) {
      return category.type === type;
    });
  }

  function categoryUsage(categoryId) {
    return state.transactions.filter(function (transaction) {
      return transaction.categoryId === categoryId;
    }).length;
  }

  function categoryYearTotal(categoryId) {
    return state.transactions.reduce(function (sum, transaction) {
      if (transaction.categoryId !== categoryId || transaction.year !== state.year) return sum;
      return sum + displayValue(transaction);
    }, 0);
  }

  /* ---------------------------------------------------------
     Options markup
     --------------------------------------------------------- */

  function yearOptionsHTML(selected, includeAll) {
    var years = availableYears();
    var value = selected == null ? state.year : selected;
    if (value !== "all" && years.indexOf(Number(value)) === -1 && isFinite(Number(value))) {
      years.push(Number(value));
      years.sort(function (a, b) { return b - a; });
    }
    var html = "";
    if (includeAll) {
      html += '<option value="all"' + (value === "all" ? " selected" : "") + ">" + esc(I18n.t("tx.filterYear")) + "</option>";
    }
    years.forEach(function (year) {
      html += '<option value="' + year + '"' + (Number(value) === year ? " selected" : "") + ">" + esc(I18n.formatYear(year)) + "</option>";
    });
    return html;
  }

  function currencyOptionsHTML(selected) {
    return DB.CURRENCIES.map(function (code) {
      return '<option value="' + code + '"' + (code === selected ? " selected" : "") + ">" +
        esc(code + " · " + I18n.currencyName(code)) + "</option>";
    }).join("");
  }

  function monthOptionsHTML(selected) {
    var html = '<option value="all"' + (selected === "all" ? " selected" : "") + ">" + esc(I18n.t("tx.filterMonth")) + "</option>";
    for (var month = 0; month < 12; month += 1) {
      html += '<option value="' + month + '"' + (String(selected) === String(month) ? " selected" : "") + ">" +
        esc(I18n.monthName(month)) + "</option>";
    }
    return html;
  }

  function categoryOptionsHTML(selected, options) {
    var opts = options || {};
    var html = "";
    if (opts.includeAll) {
      html += '<option value="all"' + (selected === "all" ? " selected" : "") + ">" + esc(I18n.t("tx.filterCategory")) + "</option>";
    }
    var types = opts.type ? [opts.type] : ["expense", "income"];
    types.forEach(function (type) {
      var list = categoriesOfType(type);
      if (!list.length) return;
      if (!opts.type) html += '<optgroup label="' + esc(I18n.t(type === "expense" ? "categories.expense" : "categories.income")) + '">';
      list.forEach(function (category) {
        html += '<option value="' + esc(category.id) + '"' + (category.id === selected ? " selected" : "") + ">" +
          esc(categoryName(category)) + "</option>";
      });
      if (!opts.type) html += "</optgroup>";
    });
    if (!html && !opts.includeAll) {
      html += '<option value="">' + esc(I18n.t("tx.noCategoryOption")) + "</option>";
    }
    return html;
  }

  /* ---------------------------------------------------------
     Theme and language
     --------------------------------------------------------- */

  function applyTheme(theme, announce) {
    state.theme = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", state.theme);
    persistTheme();
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", state.theme === "dark" ? "#101715" : "#f1f3ef");
    updateThemeButton();
    if (announce) showToast(I18n.t("settings.themeChanged"));
  }

  function updateThemeButton() {
    var button = $("#theme-toggle");
    if (!button) return;
    var key = state.theme === "dark" ? "top.themeLight" : "top.themeDark";
    button.setAttribute("aria-label", I18n.t(key));
    button.setAttribute("title", I18n.t(key));
  }

  function updateLangButton() {
    var button = $("#lang-toggle");
    if (!button) return;
    button.textContent = I18n.lang === "th" ? "EN" : "ไทย";
    button.setAttribute("aria-label", I18n.t("aria.language"));
    button.setAttribute("title", I18n.t("aria.language"));
  }

  function setLanguage(next) {
    if (next === I18n.lang) return;
    I18n.setLanguage(next);
    I18n.applyStaticTranslations(document);
    updateLangButton();
    updateThemeButton();
    updateTopbar();
    renderSidebarCategories();
    renderCurrentView();
    updateClock();
    refreshOpenDialogs();
    showToast(I18n.t("settings.languageChanged"));
  }

  /* ---------------------------------------------------------
     Clock
     --------------------------------------------------------- */

  function updateClock() {
    var now = new Date();
    var timeEl = $("#clock-time");
    var longEl = $("#clock-date-long");
    var shortEl = $("#clock-date-short");
    var time = I18n.formatTime(now, true);
    var longDate = I18n.formatDate(now, "long");
    var shortDate = I18n.formatDate(now, "short");
    var zone = "";
    try {
      zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (err) { /* ignore */ }
    var title = I18n.formatDateTime(now, { long: true, seconds: true }) + (zone ? " · " + zone : "");
    if (timeEl) {
      timeEl.textContent = time;
      timeEl.setAttribute("title", title);
    }
    if (longEl) {
      longEl.textContent = longDate;
      longEl.setAttribute("title", title);
    }
    if (shortEl) {
      shortEl.textContent = shortDate;
      shortEl.setAttribute("title", title);
    }
  }

  /* ---------------------------------------------------------
     Connection, toast and dialogs
     --------------------------------------------------------- */

  function updateConnection() {
    var el = $("#connection-status");
    var online = navigator.onLine;
    if (el) {
      el.classList.toggle("is-offline", !online);
      var label = el.querySelector("span:last-child");
      if (label) label.textContent = I18n.t(online ? "settings.offlineReady" : "common.offline");
      el.setAttribute("title", I18n.t(online ? "settings.online" : "settings.offline"));
    }
    var status = $("#settings-connection");
    if (status) status.textContent = I18n.t(online ? "settings.online" : "settings.offline");
  }

  function showToast(message) {
    var toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2800);
  }

  function showDialog(id) {
    var dialog = document.getElementById(id);
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    document.body.classList.add("dialog-open");
  }

  function closeDialog(id) {
    var dialog = document.getElementById(id);
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      if (dialog.open) dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
    if (!document.querySelector("dialog[open]")) document.body.classList.remove("dialog-open");
    if (id === "confirm-dialog") state.confirmCallback = null;
  }

  function showFormError(selector, message) {
    var el = $(selector);
    if (!el) return;
    el.textContent = message;
    el.hidden = false;
  }

  function openConfirm(options) {
    var opts = options || {};
    var title = $("#confirm-title");
    var body = $("#confirm-body");
    var ok = $("#confirm-ok");
    if (!title || !body || !ok) return;
    title.textContent = opts.title || I18n.t("common.confirm");
    body.textContent = opts.body || "";
    ok.textContent = opts.confirmLabel || I18n.t("common.confirm");
    ok.className = "btn " + (opts.danger === false ? "btn--primary" : "btn--danger");
    state.confirmCallback = opts.onConfirm || null;
    showDialog("confirm-dialog");
  }

  /* ---------------------------------------------------------
     PWA
     --------------------------------------------------------- */

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function updateInstallUI() {
    var sidebarButton = $("#install-btn");
    var settingsButton = $("#settings-install-btn");
    var available = Boolean(state.deferredPrompt) && !isStandalone();
    if (sidebarButton) sidebarButton.hidden = !available;
    if (settingsButton) {
      settingsButton.hidden = !available;
      settingsButton.disabled = !available;
    }
  }

  async function installApp() {
    if (state.deferredPrompt) {
      var promptEvent = state.deferredPrompt;
      state.deferredPrompt = null;
      updateInstallUI();
      try {
        promptEvent.prompt();
        await promptEvent.userChoice;
        showToast(I18n.t("settings.appInstalled"));
      } catch (err) {
        console.warn("Install prompt failed", err);
      }
      return;
    }
    var isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    showToast(I18n.t(isIos ? "settings.iosInstall" : "settings.desktopInstall"));
  }

  function setupPWA() {
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      state.deferredPrompt = event;
      updateInstallUI();
    });
    window.addEventListener("appinstalled", function () {
      state.deferredPrompt = null;
      updateInstallUI();
      showToast(I18n.t("settings.appInstalled"));
    });
    window.matchMedia("(display-mode: standalone)").addEventListener("change", updateInstallUI);

    if (!("serviceWorker" in navigator) || location.protocol === "file:") {
      state.swUnavailable = true;
      return;
    }
    navigator.serviceWorker.register("./sw.js").then(function () {
      state.swReady = true;
      return navigator.serviceWorker.ready;
    }).catch(function (err) {
      console.warn("Service worker registration failed", err);
      state.swReady = false;
    });
  }

  /* ---------------------------------------------------------
     Data
     --------------------------------------------------------- */

  function normalizeTransaction(transaction) {
    if (!transaction || !transaction.id || !transaction.occurredAt) return null;
    var date = new Date(transaction.occurredAt);
    if (isNaN(date.getTime())) return null;
    var amount = Number(transaction.amount);
    if (!isFinite(amount)) return null;
    var type = transaction.type === "income" ? "income" : "expense";
    var year = typeof transaction.year === "number" ? transaction.year : date.getFullYear();
    var month = typeof transaction.month === "number" ? transaction.month : date.getMonth();
    return Object.assign({}, transaction, {
      amount: amount,
      type: type,
      year: year,
      month: month,
      yearMonth: year + "-" + pad2(month + 1),
      currency: DB.CURRENCIES.indexOf(transaction.currency) !== -1 ? transaction.currency : "THB"
    });
  }

  async function loadData() {
    state.categories = await DB.getCategories();
    var list = await DB.getTransactions();
    state.transactions = list.map(normalizeTransaction).filter(Boolean);
  }

  function chooseInitialYear() {
    var current = new Date().getFullYear();
    var hasCurrent = state.transactions.some(function (transaction) {
      return transaction.year === current;
    });
    if (!hasCurrent && state.transactions.length) {
      var latest = state.transactions.reduce(function (max, transaction) {
        return Math.max(max, transaction.year);
      }, current);
      state.year = latest;
      state.filters.year = String(latest);
    }
  }

  /* ---------------------------------------------------------
     Shell rendering
     --------------------------------------------------------- */

  var VIEW_COPY = {
    dashboard: ["dashboard.title", "dashboard.subtitle"],
    transactions: ["tx.title", "tx.subtitle"],
    summary: ["summary.title", "summary.subtitle"],
    categories: ["categories.title", "categories.subtitle"],
    settings: ["settings.title", "settings.subtitle"]
  };

  function updateTopbar() {
    var copy = VIEW_COPY[state.view] || VIEW_COPY.dashboard;
    var title = I18n.t(copy[0]);
    var subtitle = I18n.t(copy[1]);
    var titleEl = $("#page-title");
    var subtitleEl = $("#page-subtitle");
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
    document.title = title + " · " + I18n.t("app.name");
  }

  function updateNav() {
    $$(".nav-item[data-nav]").forEach(function (link) {
      if (link.dataset.nav === state.view) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function renderAll() {
    I18n.applyStaticTranslations(document);
    updateTopbar();
    updateNav();
    updateLangButton();
    updateThemeButton();
    updateConnection();
    updateInstallUI();
    renderSidebarCategories();
    renderCurrentView();
  }

  function renderCurrentView() {
    $$(".view").forEach(function (view) {
      view.hidden = view.dataset.view !== state.view;
    });
    var view = document.getElementById("view-" + state.view);
    if (!view) return;
    if (state.view === "dashboard") renderDashboard(view);
    else if (state.view === "transactions") renderTransactions(view);
    else if (state.view === "summary") renderSummary(view);
    else if (state.view === "categories") renderCategories(view);
    else if (state.view === "settings") renderSettings(view);
  }

  function renderSidebarCategories() {
    var container = $("#sidebar-category-groups");
    if (!container) return;
    if (!state.categories.length) {
      container.innerHTML = '<div class="sidebar-empty"><span>' + esc(I18n.t("sidebar.noCategories")) + "</span>" +
        '<button type="button" data-action="add-category" data-type="expense">' + esc(I18n.t("sidebar.addFirst")) + "</button></div>";
      return;
    }
    var html = "";
    ["expense", "income"].forEach(function (type) {
      var list = categoriesOfType(type);
      html += '<div class="sidebar-group"><div class="sidebar-group__head"><span>' +
        esc(I18n.t(type === "expense" ? "nav.expense" : "nav.income")) + "</span><span>" +
        esc(list.length === 1 ? I18n.t("sidebar.countOne") : I18n.t(type === "expense" ? "sidebar.expenseCount" : "sidebar.incomeCount", { count: list.length })) +
        "</span></div>";
      if (!list.length) {
        html += '<div class="sidebar-empty"><span>' + esc(I18n.t("sidebar.noCategories")) + "</span></div>";
      }
      list.forEach(function (category) {
        var count = state.transactions.filter(function (transaction) {
          return transaction.year === state.year && transaction.categoryId === category.id;
        }).length;
        var active = state.view === "transactions" && state.filters.categoryId === category.id;
        html += '<button class="sidebar-cat' + (active ? " is-active" : "") + '" type="button" data-action="filter-category" data-id="' +
          esc(category.id) + '" aria-label="' + esc(I18n.t("aria.categoryFilter", { name: categoryName(category) })) + '">' +
          '<span class="sidebar-cat__dot" style="--dot:' + safeColor(category.color) + '"></span>' +
          '<span class="sidebar-cat__name">' + esc(categoryName(category)) + "</span>" +
          (count ? '<span class="sidebar-cat__count">' + count + "</span>" : "") +
          "</button>";
      });
      html += "</div>";
    });
    container.innerHTML = html;
  }

  /* ---------------------------------------------------------
     Routing
     --------------------------------------------------------- */

  function parseHash() {
    var raw = location.hash.replace(/^#\/?/, "");
    if (!raw) return { view: "dashboard", params: new URLSearchParams() };
    var split = raw.split("?");
    var view = VIEWS.indexOf(split[0]) !== -1 ? split[0] : "dashboard";
    return { view: view, params: new URLSearchParams(split[1] || "") };
  }

  function navigateTo(hash) {
    if (location.hash === hash) {
      applyRoute(false);
    } else {
      location.hash = hash;
    }
  }

  function closeSidebar() {
    var sidebar = $("#sidebar");
    var scrim = $("#scrim");
    var menu = $("#menu-btn");
    if (sidebar) sidebar.classList.remove("is-open");
    if (scrim) scrim.hidden = true;
    if (menu) menu.setAttribute("aria-expanded", "false");
    document.body.classList.remove("nav-open");
  }

  function openSidebar() {
    var sidebar = $("#sidebar");
    var scrim = $("#scrim");
    var menu = $("#menu-btn");
    if (sidebar) sidebar.classList.add("is-open");
    if (scrim) scrim.hidden = false;
    if (menu) menu.setAttribute("aria-expanded", "true");
    document.body.classList.add("nav-open");
  }

  function applyRoute(isInitial) {
    var route = parseHash();
    var changed = state.view !== route.view;
    state.view = route.view;

    var category = route.params.get("category");
    if (category) state.filters.categoryId = category;
    var type = route.params.get("type");
    if (type === "income" || type === "expense") state.filters.type = type;
    var month = route.params.get("month");
    if (month != null && /^\d{1,2}$/.test(month)) state.filters.month = String(Number(month));
    var year = route.params.get("year");
    if (year && /^\d{4}$/.test(year)) {
      state.year = Number(year);
      state.filters.year = year;
    }
    var currency = route.params.get("currency");
    if (currency && DB.CURRENCIES.indexOf(currency) !== -1) {
      state.filters.currency = currency;
    }

    renderAll();
    closeSidebar();

    if (changed || isInitial) {
      window.scrollTo({ top: 0, behavior: "auto" });
      var main = $("#main");
      if (main && !isInitial) main.focus({ preventScroll: true });
    }
    previousView = state.view;

    if (route.params.get("add") === "1") {
      history.replaceState(null, "", "#/" + state.view);
      setTimeout(function () {
        if (state.view === "categories") {
          openCategoryDialog(null, { type: route.params.get("type") || "expense" });
        } else {
          openTxDialog(null, {
            type: route.params.get("type") || "expense",
            categoryId: route.params.get("category") || null
          });
        }
      }, 30);
    }
  }

  function renderFatalError(error) {
    var main = $("#main");
    if (!main) return;
    main.innerHTML = '<div class="empty-state surface"><div class="empty-state__mark">' + ICONS.ledger + "</div><h3>" +
      esc(I18n.t("common.error")) + "</h3><p>" + esc(String(error && error.message ? error.message : error)) +
      "</p><p>" + esc(I18n.t("settings.openViaServer")) + "</p></div>";
  }

  /* ---------------------------------------------------------
     Shared view pieces
     --------------------------------------------------------- */

  function emptyState(title, body, actionLabel, action) {
    return '<div class="empty-state surface"><div class="empty-state__mark">' + ICONS.ledger + "</div><h3>" +
      esc(title) + "</h3><p>" + esc(body) + "</p>" +
      (action ? '<button class="btn btn--primary" type="button" data-action="' + esc(action) + '">' +
        ICONS.plus + "<span>" + esc(actionLabel) + "</span></button>" : "") +
      "</div>";
  }

  function entriesLabel(count) {
    return count === 1 ? I18n.t("dashboard.entriesOne") : I18n.t("dashboard.entries", { count: count });
  }

  function categoryCountLabel(count) {
    return count === 1 ? I18n.t("categories.countOne") : I18n.t("categories.count", { count: count });
  }

  function usageLabel(count) {
    return count === 1 ? I18n.t("categories.usageOne") : I18n.t("categories.usage", { count: count });
  }

  function summaryBand(totals) {
    var balanceClass = totals.balance < 0 ? " is-negative" : "";
    return '<div class="summary-band">' +
      '<div class="summary-band__item"><span class="summary-band__label">' + esc(I18n.t("dashboard.income")) +
      '</span><strong class="summary-band__value is-income">' + esc(fmtDisplay(totals.income)) +
      '</strong><span class="summary-band__meta">' + esc(entriesLabel(totals.incomeCount)) + "</span></div>" +
      '<div class="summary-band__item"><span class="summary-band__label">' + esc(I18n.t("dashboard.expense")) +
      '</span><strong class="summary-band__value is-expense">' + esc(fmtDisplay(totals.expense)) +
      '</strong><span class="summary-band__meta">' + esc(entriesLabel(totals.expenseCount)) + "</span></div>" +
      '<div class="summary-band__item summary-band__item--balance"><span class="summary-band__label">' + esc(I18n.t("dashboard.balance")) +
      '</span><strong class="summary-band__value' + balanceClass + '">' + esc(fmtDisplay(totals.balance)) +
      '</strong><span class="summary-band__meta">' + esc(I18n.formatYear(state.year)) + "</span></div>" +
      "</div>";
  }

  function proportionBlock(totals) {
    var total = totals.income + totals.expense;
    var incomePct = total > 0 ? clamp((totals.income / total) * 100, 0, 100) : 0;
    var expensePct = total > 0 ? 100 - incomePct : 0;
    return '<div class="summary-foot">' +
      '<div class="proportion" role="img" aria-label="' + esc(I18n.t("dashboard.proportion")) + '">' +
      '<span class="proportion__income" style="width:' + incomePct + '%"></span>' +
      '<span class="proportion__expense" style="width:' + expensePct + '%"></span></div>' +
      '<div class="legend"><span><i style="--dot:var(--income)"></i>' + esc(I18n.t("dashboard.income")) + " " +
      esc(I18n.percent(total > 0 ? totals.income / total : 0, 0)) + "</span>" +
      "<span><i style=\"--dot:var(--expense)\"></i>" + esc(I18n.t("dashboard.expense")) + " " +
      esc(I18n.percent(total > 0 ? totals.expense / total : 0, 0)) + "</span></div></div>";
  }

  function yearCurrencyToolbar(yearKey, currencyKey, extra) {
    return '<div class="toolbar">' +
      '<label class="field"><span class="field__label">' + esc(I18n.t(yearKey)) +
      '</span><select class="input" data-role="year" aria-label="' + esc(I18n.t("aria.year")) + '">' +
      yearOptionsHTML(state.year, false) + "</select></label>" +
      '<label class="field"><span class="field__label">' + esc(I18n.t(currencyKey)) +
      '</span><select class="input" data-role="currency" aria-label="' + esc(I18n.t("aria.currency")) + '">' +
      currencyOptionsHTML(state.displayCurrency) + "</select></label>" +
      (extra || "") + "</div>";
  }

  function shareBar(totals) {
    var total = totals.income + totals.expense;
    if (total <= 0) return '<span class="share-track" aria-hidden="true"></span>';
    var pct = Math.round((totals.income / total) * 100);
    return '<span class="share-track" role="img" aria-label="' + esc(I18n.t("dashboard.proportion")) + '">' +
      '<span class="share-track__income" style="width:' + pct + '%"></span>' +
      '<span class="share-track__expense" style="width:' + (100 - pct) + '%"></span></span>';
  }

  function monthlyMarkup(year) {
    var current = new Date();
    var rows = [];
    var total = { income: 0, expense: 0, balance: 0 };
    for (var month = 0; month < 12; month += 1) {
      var totals = monthTotals(year, month);
      total.income += totals.income;
      total.expense += totals.expense;
      rows.push({ month: month, totals: totals });
    }
    total.balance = total.income - total.expense;

    var desktop = '<div class="table-wrap"><table class="ledger-table ledger-table--desktop">' +
      '<caption class="sr-only">' + esc(I18n.t("dashboard.monthly")) + "</caption><thead><tr>" +
      "<th>" + esc(I18n.t("summary.month")) + "</th>" +
      "<th>" + esc(I18n.t("dashboard.income")) + "</th>" +
      "<th>" + esc(I18n.t("dashboard.expense")) + "</th>" +
      "<th>" + esc(I18n.t("dashboard.balance")) + "</th>" +
      '<th class="cell-share">' + esc(I18n.t("summary.share")) + "</th></tr></thead><tbody>";

    var mobile = '<div class="monthly-list surface">';

    rows.forEach(function (row) {
      var isCurrent = year === current.getFullYear() && row.month === current.getMonth();
      var balanceClass = row.totals.balance < 0 ? " negative" : "";
      desktop += '<tr class="' + (isCurrent ? "is-current" : "") + '"' + (isCurrent ? ' aria-current="date"' : "") + ">" +
        '<td class="cell-month">' + esc(I18n.monthName(row.month, true)) + "</td>" +
        '<td class="income-text">' + (row.totals.income ? esc(fmtDisplay(row.totals.income)) : '<span class="muted">—</span>') + "</td>" +
        '<td class="expense-text">' + (row.totals.expense ? esc(fmtDisplay(row.totals.expense)) : '<span class="muted">—</span>') + "</td>" +
        '<td class="' + balanceClass.trim() + '">' + (row.totals.balance ? esc(fmtDisplay(row.totals.balance)) : '<span class="muted">—</span>') + "</td>" +
        '<td class="cell-share">' + shareBar(row.totals) + "</td></tr>";

      mobile += '<div class="month-row' + (isCurrent ? " is-current" : "") + '">' +
        '<div class="month-row__head"><span class="month-row__month">' + esc(I18n.monthName(row.month)) +
        '</span><span class="month-row__balance' + balanceClass + '">' +
        (row.totals.balance ? esc(fmtDisplay(row.totals.balance)) : '<span class="muted">—</span>') + "</span></div>" +
        '<div class="month-row__meta"><span class="income-text">' + esc(I18n.t("dashboard.incomeShort")) + " " +
        (row.totals.income ? esc(fmtDisplay(row.totals.income)) : "—") + "</span>" +
        '<span class="expense-text">' + esc(I18n.t("dashboard.expenseShort")) + " " +
        (row.totals.expense ? esc(fmtDisplay(row.totals.expense)) : "—") + "</span></div>" +
        '<div class="month-row__bar">' + shareBar(row.totals) + "</div></div>";
    });

    desktop += "</tbody><tfoot><tr><td>" + esc(I18n.t("summary.totalRow")) + "</td>" +
      "<td>" + esc(fmtDisplay(total.income)) + "</td><td>" + esc(fmtDisplay(total.expense)) + "</td>" +
      '<td class="' + (total.balance < 0 ? "negative" : "") + '">' + esc(fmtDisplay(total.balance)) + "</td>" +
      "<td>" + shareBar(total) + "</td></tr></tfoot></table></div>";
    mobile += "</div>";
    return desktop + mobile;
  }

  function breakdownPanel(type, list) {
    var typeList = list.filter(function (transaction) {
      return transaction.type === type;
    });
    var total = typeList.reduce(function (sum, transaction) {
      return sum + displayValue(transaction);
    }, 0);
    var map = categoryTotals(typeList);
    var rows = Object.keys(map).map(function (id) {
      return {
        id: id,
        category: categoryById(id),
        amount: map[id][type] || 0
      };
    }).filter(function (row) {
      return row.amount > 0;
    }).sort(function (a, b) {
      return b.amount - a.amount;
    });

    var html = '<div class="breakdown-panel surface"><div class="breakdown-panel__head"><h4>' +
      esc(I18n.t(type === "expense" ? "dashboard.expense" : "dashboard.income")) + "</h4><span>" +
      esc(fmtDisplay(total)) + "</span></div>";

    if (!rows.length) {
      html += '<p class="breakdown-empty">' +
        esc(I18n.t(type === "expense" ? "dashboard.noExpense" : "dashboard.noIncome")) + "</p>";
    } else {
      rows.forEach(function (row) {
        var pct = total > 0 ? clamp((row.amount / total) * 100, 0, 100) : 0;
        var color = row.category ? safeColor(row.category.color) : "#7a828a";
        html += '<div class="breakdown-row"><div class="breakdown-row__label">' +
          '<span class="breakdown-row__dot" style="--dot:' + color + '"></span><span>' +
          esc(categoryName(row.category)) + '</span></div><span class="breakdown-row__amount">' +
          esc(fmtDisplay(row.amount)) + '</span><div class="breakdown-row__bar">' +
          '<span style="width:' + pct + "%;--dot:" + color + '"></span></div></div>';
      });
    }
    html += "</div>";
    return html;
  }

  function breakdownGrid(list) {
    return '<div class="breakdown-grid">' + breakdownPanel("expense", list) + breakdownPanel("income", list) + "</div>";
  }

  function renderTxRow(transaction) {
    var category = categoryById(transaction.categoryId);
    var name = categoryName(category);
    var note = String(transaction.note || "").trim();
    var labelName = note || name;
    var display = displayValue(transaction);
    var converted = transaction.currency !== state.displayCurrency
      ? '<span class="tx-row__converted">≈ ' + esc(fmtDisplay(display)) + "</span>"
      : "";
    var stamp = I18n.formatIsoLocal(transaction.occurredAt);
    var iso = new Date(transaction.occurredAt).toISOString();
    var title = I18n.formatDateTime(transaction.occurredAt, { long: true, seconds: true }) + " · " + iso;
    return '<article class="tx-row" data-id="' + esc(transaction.id) + '" tabindex="0" role="button" aria-label="' +
      esc(I18n.t("tx.rowAria", { name: labelName, amount: fmtMoney(transaction.amount, transaction.currency) })) + '">' +
      '<span class="tx-row__dot" style="--dot:' + (category ? safeColor(category.color) : "#7a828a") + '"></span>' +
      '<div class="tx-row__main"><div class="tx-row__title"><span class="tx-row__cat">' + esc(name) + "</span>" +
      (note ? '<span class="tx-row__note">' + esc(note) + "</span>" : "") + "</div>" +
      '<div class="tx-row__meta"><time class="tx-row__stamp" datetime="' + esc(iso) + '" title="' +
      esc(title) + '">' + esc(stamp) + "</time></div></div>" +
      '<div class="tx-row__amount-wrap"><span class="tx-row__amount ' +
      (transaction.type === "income" ? "is-income" : "is-expense") + '">' + esc(fmtSigned(transaction)) +
      "</span>" + converted + "</div>" +
      '<div class="tx-row__actions">' +
      '<button class="icon-btn icon-btn--sm" type="button" data-action="edit-tx" data-id="' + esc(transaction.id) +
      '" aria-label="' + esc(I18n.t("tx.editAria", { name: labelName })) + '" title="' + esc(I18n.t("common.edit")) + '">' + ICONS.edit + "</button>" +
      '<button class="icon-btn icon-btn--sm is-danger" type="button" data-action="delete-tx" data-id="' + esc(transaction.id) +
      '" aria-label="' + esc(I18n.t("tx.deleteAria", { name: labelName })) + '" title="' + esc(I18n.t("common.delete")) + '">' + ICONS.trash + "</button>" +
      "</div></article>";
  }

  function renderDashboard(view) {
    var yearTransactions = state.transactions.filter(function (transaction) {
      return transaction.year === state.year;
    });
    var totals = totalsFor(yearTransactions);

    var html = '<div class="view-head">' +
      yearCurrencyToolbar("dashboard.year", "dashboard.currency",
        '<a class="btn btn--ghost btn--sm" href="#/summary?year=' + state.year + '">' + ICONS.chart +
        "<span>" + esc(I18n.t("dashboard.viewSummary")) + "</span></a>") + "</div>";

    html += summaryBand(totals);
    html += proportionBlock(totals);

    if (!yearTransactions.length) {
      html += '<section class="section">' +
        emptyState(I18n.t("dashboard.emptyTitle"), I18n.t("dashboard.emptyBody"), I18n.t("dashboard.emptyAction"), "add-tx") +
        "</section>";
    } else {
      html += '<section class="section"><div class="section__head"><h3>' + esc(I18n.t("dashboard.monthly")) +
        '</h3><span class="section__hint">' + esc(I18n.t("dashboard.monthlyHint")) + "</span></div>" +
        monthlyMarkup(state.year) + "</section>";
      html += '<section class="section"><div class="section__head"><h3>' + esc(I18n.t("dashboard.byCategory")) +
        '</h3><span class="section__hint">' + esc(I18n.t("dashboard.breakdownHint")) + "</span></div>" +
        breakdownGrid(yearTransactions) + "</section>";
      html += '<section class="section"><div class="section__head"><h3>' + esc(I18n.t("dashboard.recent")) +
        '</h3><a href="#/transactions?year=' + state.year + '">' + esc(I18n.t("dashboard.viewAll")) + "</a></div>" +
        '<div class="tx-list tx-list--standalone">' + yearTransactions.slice(0, 6).map(renderTxRow).join("") + "</div></section>";
    }

    view.innerHTML = html;
  }

  /* ---------------------------------------------------------
     Transactions view
     --------------------------------------------------------- */

  function filteredTransactions() {
    var f = state.filters;
    var query = String(f.search || "").trim().toLowerCase();
    return state.transactions.filter(function (transaction) {
      if (f.year !== "all" && String(transaction.year) !== String(f.year)) return false;
      if (f.type !== "all" && transaction.type !== f.type) return false;
      if (f.categoryId !== "all" && transaction.categoryId !== f.categoryId) return false;
      if (f.month !== "all" && String(transaction.month) !== String(f.month)) return false;
      if (f.currency !== "all" && transaction.currency !== f.currency) return false;
      if (query) {
        var category = categoryById(transaction.categoryId);
        var haystack = [
          transaction.note || "",
          category ? category.nameTh || "" : "",
          category ? category.nameEn || "" : ""
        ].join(" ").toLowerCase();
        if (haystack.indexOf(query) === -1) return false;
      }
      return true;
    });
  }

  function groupByDay(list) {
    var groups = [];
    var map = {};
    list.forEach(function (transaction) {
      var key = dateKey(transaction.occurredAt);
      if (!map[key]) {
        map[key] = { key: key, date: toDate(transaction.occurredAt), items: [] };
        groups.push(map[key]);
      }
      map[key].items.push(transaction);
    });
    return groups;
  }

  function daySums(items) {
    var income = 0;
    var expense = 0;
    items.forEach(function (transaction) {
      if (transaction.type === "income") income += displayValue(transaction);
      else expense += displayValue(transaction);
    });
    return { income: income, expense: expense };
  }

  function renderTransactions(view) {
    var list = filteredTransactions();
    var shown = list.slice(0, state.txLimit);
    var groups = groupByDay(shown);
    var totals = totalsFor(list);

    var html = '<div class="view-head view-head--end"><div class="toolbar"><button class="btn btn--primary btn--sm" type="button" data-action="add-tx">' +
      ICONS.plus + "<span>" + esc(I18n.t("tx.add")) + "</span></button></div></div>";

    html += '<div class="filters" role="search" aria-label="' + esc(I18n.t("aria.filter")) + '">' +
      '<label class="field search-wrap"><span class="field__label sr-only">' + esc(I18n.t("common.search")) + "</span>" +
      ICONS.search +
      '<input class="input" type="search" data-role="filter-search" value="' + esc(state.filters.search) +
      '" placeholder="' + esc(I18n.t("tx.filterSearch")) + '" aria-label="' + esc(I18n.t("aria.search")) + '"></label>' +
      '<label class="field"><span class="field__label">' + esc(I18n.t("common.type")) + "</span>" +
      '<select class="input" data-role="filter-type" aria-label="' + esc(I18n.t("aria.type")) + '">' +
      '<option value="all"' + (state.filters.type === "all" ? " selected" : "") + ">" + esc(I18n.t("tx.filterType")) + "</option>" +
      '<option value="expense"' + (state.filters.type === "expense" ? " selected" : "") + ">" + esc(I18n.t("tx.expense")) + "</option>" +
      '<option value="income"' + (state.filters.type === "income" ? " selected" : "") + ">" + esc(I18n.t("tx.income")) + "</option>" +
      "</select></label>" +
      '<label class="field"><span class="field__label">' + esc(I18n.t("common.category")) + "</span>" +
      '<select class="input" data-role="filter-category" aria-label="' + esc(I18n.t("aria.category")) + '">' +
      categoryOptionsHTML(state.filters.categoryId, { includeAll: true }) +
      "</select></label>" +
      '<label class="field"><span class="field__label">' + esc(I18n.t("common.month")) + "</span>" +
      '<select class="input" data-role="filter-month" aria-label="' + esc(I18n.t("aria.month")) + '">' +
      monthOptionsHTML(state.filters.month) +
      "</select></label>" +
      '<label class="field"><span class="field__label">' + esc(I18n.t("common.year")) + "</span>" +
      '<select class="input" data-role="filter-year" aria-label="' + esc(I18n.t("aria.year")) + '">' +
      yearOptionsHTML(state.filters.year, true) +
      "</select></label>" +
      '<label class="field"><span class="field__label">' + esc(I18n.t("common.currency")) + "</span>" +
      '<select class="input" data-role="filter-currency" aria-label="' + esc(I18n.t("aria.currency")) + '">' +
      '<option value="all"' + (state.filters.currency === "all" ? " selected" : "") + ">" + esc(I18n.t("tx.filterCurrency")) + "</option>" +
      DB.CURRENCIES.map(function (code) {
        return '<option value="' + code + '"' + (state.filters.currency === code ? " selected" : "") + ">" + esc(code) + "</option>";
      }).join("") +
      "</select></label>" +
      '<div class="filter-actions"><button class="btn btn--ghost btn--sm" type="button" data-action="clear-filters">' +
      esc(I18n.t("tx.filterClear")) + "</button></div></div>";

    html += '<div class="tx-results">';
    html += '<div class="tx-count"><span>' + esc(I18n.t("tx.showing", { shown: shown.length, total: list.length })) + "</span>" +
      (list.length ? "<span>" + esc(I18n.t("dashboard.incomeShort")) + " " + esc(fmtDisplay(totals.income)) + " · " +
        esc(I18n.t("dashboard.expenseShort")) + " " + esc(fmtDisplay(totals.expense)) + "</span>" : "") + "</div>";

    if (!list.length) {
      html += emptyState(I18n.t("tx.noneTitle"), I18n.t("tx.noneBody"), I18n.t("tx.addFirst"), "add-tx");
    } else {
      groups.forEach(function (group) {
        var sums = daySums(group.items);
        var heading = I18n.formatDate(group.date, "long") + (isToday(group.date) ? " · " + I18n.t("common.today") : "");
        html += '<div class="tx-day"><div class="tx-day__head"><span class="tx-day__date">' + esc(heading) + "</span>" +
          '<span class="tx-day__sum">' +
          (sums.income ? esc(I18n.t("tx.dayIncome", { amount: fmtDisplay(sums.income) })) + " " : "") +
          (sums.expense ? esc(I18n.t("tx.dayExpense", { amount: fmtDisplay(sums.expense) })) : "") +
          "</span></div>" +
          '<div class="tx-list">' + group.items.map(renderTxRow).join("") + "</div></div>";
      });

      if (list.length > shown.length) {
        html += '<div class="tx-more"><button class="btn btn--ghost" type="button" data-action="load-more">' +
          esc(I18n.t("tx.loadMore")) + " (" + (list.length - shown.length) + ")</button></div>";
      }
    }
    html += "</div>";

    view.innerHTML = html;
  }

  /* ---------------------------------------------------------
     Summary view
     --------------------------------------------------------- */

  function currencyTable(list) {
    var map = currencyTotals(list);
    var codes = Object.keys(map).sort(function (a, b) {
      return a.localeCompare(b);
    });
    var html = '<div class="table-wrap surface"><table class="rates-table">' +
      "<thead><tr><th>" + esc(I18n.t("common.currency")) + "</th>" +
      "<th>" + esc(I18n.t("summary.rate")) + "</th>" +
      "<th>" + esc(I18n.t("summary.entries")) + "</th>" +
      "<th>" + esc(I18n.t("summary.income")) + "</th>" +
      "<th>" + esc(I18n.t("summary.expense")) + "</th>" +
      "<th>" + esc(I18n.t("summary.balance")) + "</th></tr></thead><tbody>";
    codes.forEach(function (code) {
      var entry = map[code];
      var balance = entry.income - entry.expense;
      var converted = convert(balance, code, state.displayCurrency);
      html += "<tr><td><span class=\"rate-code\">" + esc(code) + "</span></td>" +
        '<td class="num">' + esc(I18n.formatNumber(rateOf(code), rateOf(code) >= 1 ? 2 : 4)) + "</td>" +
        '<td class="num">' + entry.count + "</td>" +
        '<td class="num income-text">' + esc(fmtMoney(entry.income, code)) + "</td>" +
        '<td class="num expense-text">' + esc(fmtMoney(entry.expense, code)) + "</td>" +
        '<td class="num">' + esc(fmtDisplay(converted)) + "</td></tr>";
    });
    html += "</tbody></table></div>";
    html += '<p class="surface-note" style="margin-top:8px">' + esc(I18n.t("summary.currencyNote")) + "</p>";
    return html;
  }

  function renderSummary(view) {
    var yearTransactions = state.transactions.filter(function (transaction) {
      return transaction.year === state.year;
    });
    var totals = totalsFor(yearTransactions);

    var html = '<div class="view-head">' +
      yearCurrencyToolbar("summary.year", "summary.currency",
        '<button class="btn btn--ghost btn--sm" type="button" data-action="export-csv">' +
        '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 20h14"/></svg>' +
        "<span>" + esc(I18n.t("summary.export")) + "</span></button>") + "</div>";

    html += summaryBand(totals);
    html += proportionBlock(totals);

    if (!yearTransactions.length) {
      html += '<section class="section">' +
        emptyState(I18n.t("summary.noData"), I18n.t("summary.noDataBody"), I18n.t("tx.addFirst"), "add-tx") +
        "</section>";
    } else {
      html += '<section class="section"><div class="section__head"><h3>' + esc(I18n.t("summary.monthly")) +
        '</h3><span class="section__hint">' + esc(I18n.t("summary.monthlyHint")) + "</span></div>" +
        monthlyMarkup(state.year) + "</section>";

      html += '<section class="section"><div class="section__head"><h3>' + esc(I18n.t("summary.byCategory")) +
        '</h3><span class="section__hint">' + esc(I18n.t("summary.net")) + " " + esc(fmtDisplay(totals.income - totals.expense)) + "</span></div>" +
        breakdownGrid(yearTransactions) + "</section>";

      html += '<section class="section"><div class="section__head"><h3>' + esc(I18n.t("summary.byCurrency")) +
        '</h3><span class="section__hint">' + esc(I18n.t("summary.currencyHint")) + "</span></div>" +
        currencyTable(yearTransactions) + "</section>";
    }

    view.innerHTML = html;
  }

  /* ---------------------------------------------------------
     Categories view
     --------------------------------------------------------- */

  function categoryPanelMarkup(type) {
    var list = categoriesOfType(type);
    var html = '<div class="category-panel surface"><div class="category-panel__head"><h3>' +
      esc(I18n.t(type === "expense" ? "categories.expense" : "categories.income")) + "</h3><span>" +
      esc(categoryCountLabel(list.length)) + "</span></div>";

    if (!list.length) {
      html += '<div class="category-empty"><p>' +
        esc(I18n.t(type === "expense" ? "categories.emptyExpense" : "categories.emptyIncome")) + "</p>" +
        '<button class="btn btn--ghost btn--sm" type="button" data-action="add-category" data-type="' + type + '" style="margin-top:8px">' +
        esc(I18n.t("categories.add")) + "</button></div>";
    } else {
      list.forEach(function (category) {
        var usage = categoryUsage(category.id);
        var total = categoryYearTotal(category.id);
        html += '<div class="category-row" data-id="' + esc(category.id) + '">' +
          '<span class="category-row__dot" style="--dot:' + safeColor(category.color) + '" aria-hidden="true"></span>' +
          '<div class="category-row__name"><strong>' + esc(categoryName(category)) + "</strong>" +
          (categorySecondary(category) ? "<span>" + esc(categorySecondary(category)) + "</span>" : "") + "</div>" +
          '<div class="category-row__stat"><strong>' + esc(fmtDisplay(total)) + "</strong><span>" +
          esc(usageLabel(usage)) + "</span></div>" +
          '<div class="category-row__actions">' +
          '<button class="icon-btn icon-btn--sm" type="button" data-action="edit-category" data-id="' + esc(category.id) +
          '" aria-label="' + esc(I18n.t("aria.editCategory")) + '" title="' + esc(I18n.t("common.edit")) + '">' + ICONS.edit + "</button>" +
          '<button class="icon-btn icon-btn--sm is-danger" type="button" data-action="delete-category" data-id="' + esc(category.id) +
          '" aria-label="' + esc(I18n.t("aria.deleteCategory")) + '" title="' + esc(I18n.t("common.delete")) + '">' + ICONS.trash + "</button>" +
          "</div></div>";
      });
    }
    html += "</div>";
    return html;
  }

  function renderCategories(view) {
    var html = '<div class="view-head view-head--end"><div class="toolbar">' +
      '<button class="btn btn--primary btn--sm" type="button" data-action="add-category" data-type="expense">' +
      ICONS.plus + "<span>" + esc(I18n.t("categories.add")) + "</span></button></div></div>";
    html += '<p class="surface-note" style="margin-bottom:14px">' + esc(I18n.t("categories.manageHint")) + "</p>";
    html += '<div class="category-columns">' + categoryPanelMarkup("expense") + categoryPanelMarkup("income") + "</div>";
    view.innerHTML = html;
  }

  /* ---------------------------------------------------------
     Settings view
     --------------------------------------------------------- */

  function selectedAttr(value, current) {
    return value === current ? " selected" : "";
  }

  function renderSettings(view) {
    var online = navigator.onLine;
    var storageMode = DB.mode === "local" ? I18n.t("settings.storageLocal") : I18n.t("settings.storageIdb");
    var approxBytes = 0;
    try {
      approxBytes = new Blob([JSON.stringify(state.transactions) + JSON.stringify(state.categories)]).size;
    } catch (err) {
      approxBytes = JSON.stringify(state.transactions).length;
    }

    var langOptions = '<option value="th"' + selectedAttr("th", I18n.lang) + ">" + esc(I18n.t("settings.thai")) + "</option>" +
      '<option value="en"' + selectedAttr("en", I18n.lang) + ">" + esc(I18n.t("settings.english")) + "</option>";
    var themeOptions = '<option value="light"' + selectedAttr("light", state.theme) + ">" + esc(I18n.t("settings.light")) + "</option>" +
      '<option value="dark"' + selectedAttr("dark", state.theme) + ">" + esc(I18n.t("settings.dark")) + "</option>";
    var currencyOptions = DB.CURRENCIES.map(function (code) {
      return '<option value="' + code + '"' + selectedAttr(code, state.displayCurrency) + ">" +
        esc(code + " · " + I18n.currencyName(code)) + "</option>";
    }).join("");

    var rates = DB.CURRENCIES.map(function (code) {
      return "<tr><td><span class=\"rate-code\">" + esc(code) + " <span>" + esc(I18n.currencyName(code)) + "</span></span></td>" +
        '<td><input class="input" type="number" inputmode="decimal" min="0" step="0.0001" data-role="rate" data-code="' +
        code + '" value="' + esc(rateOf(code)) + '" aria-label="' + esc(code + " " + I18n.t("settings.rateColumn")) + '"></td></tr>';
    }).join("");

    var html = '<div class="settings-grid">';

    html += '<section class="settings-section surface"><h2>' + esc(I18n.t("settings.language")) + "</h2><p>" +
      esc(I18n.t("settings.languageHelp")) + '</p><div class="settings-section__body">' +
      '<label class="field"><span class="field__label">' + esc(I18n.t("settings.language")) + "</span>" +
      '<select class="input" data-role="setting-lang">' + langOptions + "</select></label>" +
      '<label class="field"><span class="field__label">' + esc(I18n.t("settings.theme")) + "</span>" +
      '<select class="input" data-role="setting-theme">' + themeOptions + "</select></label>" +
      '<p class="surface-note">' + esc(I18n.t("settings.themeHelp")) + "</p></div></section>";

    html += '<section class="settings-section surface"><h2>' + esc(I18n.t("settings.currency")) + "</h2><p>" +
      esc(I18n.t("settings.currencyHelp")) + '</p><div class="settings-section__body">' +
      '<label class="field"><span class="field__label">' + esc(I18n.t("settings.currency")) + "</span>" +
      '<select class="input" data-role="setting-currency">' + currencyOptions + "</select></label>" +
      '<div class="kv-list"><div class="kv-list__row"><span>' + esc(I18n.t("settings.storage")) + "</span><span>" +
      esc(I18n.t("settings.storageUsed", { size: I18n.bytes(approxBytes) })) + "</span></div>" +
      '<div class="kv-list__row"><span>' + esc(I18n.t("settings.storageMode")) + "</span><span>" + esc(storageMode) + "</span></div>" +
      '<div class="kv-list__row"><span>' + esc(I18n.t("settings.connection")) + "</span><span>" +
      esc(I18n.t(online ? "settings.online" : "settings.offline")) + "</span></div></div></div></section>";

    html += '<section class="settings-section settings-section--wide surface"><h2>' + esc(I18n.t("settings.rates")) +
      "</h2><p>" + esc(I18n.t("settings.ratesHelp")) + '</p><div class="settings-section__body">' +
      '<div class="table-wrap"><table class="rates-table"><thead><tr><th>' + esc(I18n.t("common.currency")) +
      "</th><th>" + esc(I18n.t("settings.rateColumn")) + '</th></tr></thead><tbody>' + rates + "</tbody></table></div>" +
      '<div class="settings-actions"><button class="btn btn--ghost btn--sm" type="button" data-action="reset-rates">' +
      esc(I18n.t("settings.resetRates")) + "</button><span class=\"surface-note\">" + esc(I18n.t("settings.ratesNote")) +
      "</span></div></div></section>";

    html += '<section class="settings-section surface"><h2>' + esc(I18n.t("settings.data")) + "</h2><p>" +
      esc(I18n.t("settings.dataHelp")) + '</p><div class="settings-section__body"><div class="settings-actions">' +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="export-json">' + esc(I18n.t("settings.exportJson")) + "</button>" +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="import-json">' + esc(I18n.t("settings.importJson")) + "</button>" +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="export-csv">' + esc(I18n.t("settings.exportCsv")) + "</button>" +
      '<button class="btn btn--ghost btn--sm" type="button" data-action="load-sample">' + esc(I18n.t("settings.sample")) + "</button>" +
      "</div><p class=\"surface-note\">" + esc(I18n.t("settings.importJsonHelp")) + "</p></div></section>";

    html += '<section class="settings-section surface"><h2>' + esc(I18n.t("settings.pwa")) + "</h2><p>" +
      esc(I18n.t("settings.installHelp")) + '</p><div class="settings-section__body">' +
      '<div class="settings-actions"><button id="settings-install-btn" class="btn btn--primary btn--sm" type="button" data-action="install-app" hidden>' +
      esc(I18n.t("settings.install")) + "</button></div>" +
      '<div class="kv-list">' +
      '<div class="kv-list__row"><span>' + esc(I18n.t("settings.status")) + '</span><span id="settings-connection">' +
      esc(I18n.t(online ? "settings.online" : "settings.offline")) + "</span></div>" +
      '<div class="kv-list__row"><span>' + esc(I18n.t("settings.version")) + "</span><span>" +
      esc(I18n.t("settings.versionValue")) + "</span></div></div>" +
      '<p class="surface-note">' + esc(I18n.t("settings.offlineNote")) + "</p></div></section>";

    html += '<section class="settings-section settings-section--wide settings-section--danger surface"><h2>' +
      esc(I18n.t("settings.dangerZone")) + "</h2><p>" + esc(I18n.t("settings.clearHint")) +
      '</p><div class="settings-section__body"><div class="settings-actions">' +
      '<button class="btn btn--danger-ghost btn--sm" type="button" data-action="clear-data">' +
      esc(I18n.t("settings.clearData")) + "</button></div></div></section>";

    html += "</div>";
    view.innerHTML = html;
    updateInstallUI();
  }

  /* ---------------------------------------------------------
     Dialog helpers
     --------------------------------------------------------- */

  function findTransaction(id) {
    return state.transactions.find(function (transaction) {
      return transaction.id === id;
    }) || null;
  }

  function findCategory(id) {
    return state.categories.find(function (category) {
      return category.id === id;
    }) || null;
  }

  function clearFormError(selector) {
    var el = $(selector);
    if (el) {
      el.textContent = "";
      el.hidden = true;
    }
  }

  function markInvalid(selector, invalid) {
    var el = $(selector);
    if (el) {
      if (invalid) el.setAttribute("aria-invalid", "true");
      else el.removeAttribute("aria-invalid");
    }
  }

  function updateTxCategoryOptions(type, selectedId) {
    var select = $("#tx-category");
    if (!select) return;
    var list = categoriesOfType(type);
    var chosen = selectedId && list.some(function (category) {
      return category.id === selectedId;
    }) ? selectedId : (list[0] ? list[0].id : "");
    select.innerHTML = categoryOptionsHTML(chosen, { type: type });
  }

  function txMetaMarkup(transaction) {
    var parts = [];
    if (transaction.createdAt) {
      parts.push("<div><strong>" + esc(I18n.t("tx.createdAt")) + ":</strong> " +
        esc(I18n.formatDateTime(transaction.createdAt, { seconds: true })) + "</div>");
    }
    if (transaction.updatedAt && transaction.updatedAt !== transaction.createdAt) {
      parts.push("<div><strong>" + esc(I18n.t("tx.updatedAt")) + ":</strong> " +
        esc(I18n.formatDateTime(transaction.updatedAt, { seconds: true })) + "</div>");
    }
    if (transaction.currency !== state.displayCurrency) {
      parts.push("<div><strong>" + esc(I18n.t("tx.converted", { currency: state.displayCurrency })) + ":</strong> " +
        esc(fmtDisplay(displayValue(transaction))) + "</div>");
    }
    return parts.join("");
  }

  function openTxDialog(transaction, defaults) {
    var editing = transaction && transaction.id ? transaction : null;
    var opts = defaults || {};
    state.editingTxId = editing ? editing.id : null;

    var now = new Date();
    var when = editing ? new Date(editing.occurredAt) : now;
    var type = editing ? editing.type : (opts.type === "income" ? "income" : "expense");

    var title = $("#tx-dialog-title");
    if (title) title.textContent = I18n.t(editing ? "tx.editTitle" : "tx.addTitle");

    $$('input[name="tx-type"]').forEach(function (radio) {
      radio.checked = radio.value === type;
    });

    var amountInput = $("#tx-amount");
    if (amountInput) amountInput.value = editing ? String(editing.amount) : "";
    var currencySelect = $("#tx-currency");
    if (currencySelect) {
      currencySelect.innerHTML = currencyOptionsHTML(editing ? editing.currency : state.displayCurrency);
    }
    updateTxCategoryOptions(type, editing ? editing.categoryId : opts.categoryId || null);

    var dateInput = $("#tx-date");
    if (dateInput) dateInput.value = dateInputValue(when);
    var timeInput = $("#tx-time");
    if (timeInput) timeInput.value = timeInputValue(when);
    var noteInput = $("#tx-note");
    if (noteInput) noteInput.value = editing ? editing.note || "" : "";

    var deleteBtn = $("#tx-delete");
    if (deleteBtn) deleteBtn.hidden = !editing;

    var meta = $("#tx-meta");
    if (meta) {
      if (editing) {
        meta.innerHTML = txMetaMarkup(editing);
        meta.hidden = false;
      } else {
        meta.innerHTML = "";
        meta.hidden = true;
      }
    }

    clearFormError("#tx-error");
    markInvalid("#tx-amount", false);
    markInvalid("#tx-date", false);
    markInvalid("#tx-time", false);
    markInvalid("#tx-category", false);

    showDialog("tx-dialog");
    setTimeout(function () {
      if (amountInput) amountInput.focus();
    }, 60);
  }

  async function saveTransactionFromForm() {
    var typeInput = $('input[name="tx-type"]:checked');
    var type = typeInput ? typeInput.value : "expense";
    var amount = parseAmount($("#tx-amount") ? $("#tx-amount").value : "");
    var currency = $("#tx-currency") ? $("#tx-currency").value : "THB";
    var categoryId = $("#tx-category") ? $("#tx-category").value : "";
    var dateStr = $("#tx-date") ? $("#tx-date").value : "";
    var timeStr = $("#tx-time") ? $("#tx-time").value : "";
    var note = $("#tx-note") ? $("#tx-note").value.trim() : "";

    clearFormError("#tx-error");

    if (!(amount > 0)) {
      markInvalid("#tx-amount", true);
      showFormError("#tx-error", I18n.t("tx.invalidAmount"));
      return;
    }
    markInvalid("#tx-amount", false);

    var occurred = buildOccurredAt(dateStr, timeStr);
    if (!occurred) {
      markInvalid("#tx-date", true);
      markInvalid("#tx-time", true);
      showFormError("#tx-error", I18n.t("tx.invalidDate"));
      return;
    }
    markInvalid("#tx-date", false);
    markInvalid("#tx-time", false);

    var category = findCategory(categoryId);
    if (!category || category.type !== type) {
      markInvalid("#tx-category", true);
      showFormError("#tx-error", I18n.t("tx.addCategoryFirstBody"));
      return;
    }
    markInvalid("#tx-category", false);

    var existing = state.editingTxId ? findTransaction(state.editingTxId) : null;
    var stamp = new Date().toISOString();
    var record = {
      id: existing ? existing.id : uid("tx"),
      type: type,
      amount: amount,
      currency: DB.CURRENCIES.indexOf(currency) !== -1 ? currency : "THB",
      categoryId: category.id,
      note: note,
      occurredAt: occurred.toISOString(),
      year: occurred.getFullYear(),
      month: occurred.getMonth(),
      yearMonth: occurred.getFullYear() + "-" + pad2(occurred.getMonth() + 1),
      createdAt: existing && existing.createdAt ? existing.createdAt : stamp,
      updatedAt: stamp
    };

    try {
      await DB.putTransaction(record);
    } catch (err) {
      console.error("Could not save transaction", err);
      showFormError("#tx-error", I18n.t("tx.saveError"));
      return;
    }

    if (existing) {
      var index = state.transactions.findIndex(function (item) {
        return item.id === existing.id;
      });
      if (index !== -1) state.transactions[index] = record;
      else state.transactions.push(record);
    } else {
      state.transactions.push(record);
    }
    state.transactions.sort(function (a, b) {
      return new Date(b.occurredAt) - new Date(a.occurredAt);
    });
    state.year = record.year;

    closeDialog("tx-dialog");
    state.editingTxId = null;
    renderAll();
    showToast(I18n.t(existing ? "tx.updated" : "tx.saved"));
  }

  function deleteTransaction(id) {
    var transaction = findTransaction(id);
    if (!transaction) return;
    if (state.editingTxId === id) {
      closeDialog("tx-dialog");
      state.editingTxId = null;
    }
    var label = transaction.note || categoryName(findCategory(transaction.categoryId));
    openConfirm({
      title: I18n.t("tx.deleteTitle"),
      body: label + " · " + fmtMoney(transaction.amount, transaction.currency) + " — " + I18n.t("tx.deleteBody"),
      confirmLabel: I18n.t("tx.deleteConfirm"),
      onConfirm: async function () {
        try {
          await DB.deleteTransaction(id);
          state.transactions = state.transactions.filter(function (item) {
            return item.id !== id;
          });
          renderAll();
          showToast(I18n.t("tx.deleted"));
        } catch (err) {
          console.error("Could not delete transaction", err);
          showToast(I18n.t("common.error"));
        }
      }
    });
  }

  /* ---------------------------------------------------------
     Category dialog
     --------------------------------------------------------- */

  function renderColorSwatches(selected) {
    var container = $("#category-colors");
    if (!container) return;
    var value = safeColor(selected || COLOR_PALETTE[0]);
    container.innerHTML = COLOR_PALETTE.map(function (color, index) {
      return '<label class="color-swatch" title="' + esc(I18n.t("categories.colorLabel", { n: index + 1 })) + '">' +
        '<input type="radio" name="category-color" value="' + color + '"' + (color === value ? " checked" : "") +
        ' aria-label="' + esc(I18n.t("categories.colorLabel", { n: index + 1 })) + '">' +
        '<span style="--swatch:' + color + '"></span></label>';
    }).join("");
    if (!container.querySelector('input[name="category-color"]:checked')) {
      var first = container.querySelector('input[name="category-color"]');
      if (first) first.checked = true;
    }
  }

  function openCategoryDialog(category, defaults) {
    var editing = category && category.id ? category : null;
    var opts = defaults || {};
    state.editingCategoryId = editing ? editing.id : null;

    var title = $("#category-dialog-title");
    if (title) title.textContent = I18n.t(editing ? "categories.edit" : "categories.add");

    var typeSelect = $("#category-type");
    if (typeSelect) typeSelect.value = editing ? editing.type : (opts.type === "income" ? "income" : "expense");
    var nameTh = $("#category-name-th");
    if (nameTh) nameTh.value = editing ? editing.nameTh || "" : "";
    var nameEn = $("#category-name-en");
    if (nameEn) nameEn.value = editing ? editing.nameEn || "" : "";

    renderColorSwatches(editing ? editing.color : COLOR_PALETTE[categoriesOfType(
      editing ? editing.type : (opts.type === "income" ? "income" : "expense")
    ).length % COLOR_PALETTE.length]);

    clearFormError("#category-error");
    markInvalid("#category-name-th", false);
    markInvalid("#category-name-en", false);

    showDialog("category-dialog");
    setTimeout(function () {
      if (nameTh) nameTh.focus();
    }, 60);
  }

  function categoryNameExists(nameTh, nameEn, type, excludeId) {
    var th = String(nameTh || "").trim().toLowerCase();
    var en = String(nameEn || "").trim().toLowerCase();
    return state.categories.some(function (category) {
      if (category.type !== type) return false;
      if (excludeId && category.id === excludeId) return false;
      var cTh = String(category.nameTh || "").trim().toLowerCase();
      var cEn = String(category.nameEn || "").trim().toLowerCase();
      return (th && th === cTh) || (en && en === cEn) || (th && th === cEn) || (en && en === cTh);
    });
  }

  async function saveCategoryFromForm() {
    var type = $("#category-type") ? $("#category-type").value : "expense";
    var nameTh = $("#category-name-th") ? $("#category-name-th").value.trim() : "";
    var nameEn = $("#category-name-en") ? $("#category-name-en").value.trim() : "";
    var colorInput = $('input[name="category-color"]:checked');

    clearFormError("#category-error");

    if (!nameTh && !nameEn) {
      markInvalid("#category-name-th", true);
      markInvalid("#category-name-en", true);
      showFormError("#category-error", I18n.t("categories.nameRequired"));
      return;
    }
    markInvalid("#category-name-th", false);
    markInvalid("#category-name-en", false);

    var existing = state.editingCategoryId ? findCategory(state.editingCategoryId) : null;
    if (categoryNameExists(nameTh, nameEn, type, existing ? existing.id : null)) {
      showFormError("#category-error", I18n.t("categories.duplicate"));
      return;
    }

    var maxOrder = state.categories.reduce(function (max, category) {
      return Math.max(max, typeof category.order === "number" ? category.order : 0);
    }, -1);

    var record = {
      id: existing ? existing.id : uid("cat"),
      type: type === "income" ? "income" : "expense",
      nameTh: nameTh,
      nameEn: nameEn,
      color: colorInput ? colorInput.value : COLOR_PALETTE[0],
      order: existing && typeof existing.order === "number" ? existing.order : maxOrder + 1,
      createdAt: existing && existing.createdAt ? existing.createdAt : new Date().toISOString()
    };

    try {
      await DB.putCategory(record);
    } catch (err) {
      console.error("Could not save category", err);
      showFormError("#category-error", I18n.t("categories.saveError"));
      return;
    }

    if (existing) {
      var index = state.categories.findIndex(function (category) {
        return category.id === existing.id;
      });
      if (index !== -1) state.categories[index] = record;
      else state.categories.push(record);
    } else {
      state.categories.push(record);
    }
    state.categories.sort(function (a, b) {
      var ao = typeof a.order === "number" ? a.order : 9999;
      var bo = typeof b.order === "number" ? b.order : 9999;
      return ao - bo;
    });

    closeDialog("category-dialog");
    state.editingCategoryId = null;
    renderAll();
    showToast(I18n.t(existing ? "categories.updated" : "categories.created"));
  }

  function deleteCategory(id) {
    var category = findCategory(id);
    if (!category) return;
    var usage = categoryUsage(id);

    if (!usage) {
      openConfirm({
        title: I18n.t("categories.deleteTitle"),
        body: I18n.t("categories.deleteBody"),
        confirmLabel: I18n.t("categories.deleteConfirm"),
        onConfirm: async function () {
          try {
            await DB.deleteCategory(id);
            state.categories = state.categories.filter(function (item) {
              return item.id !== id;
            });
            renderAll();
            showToast(I18n.t("categories.deleted"));
          } catch (err) {
            console.error("Could not delete category", err);
            showToast(I18n.t("categories.deleteError"));
          }
        }
      });
      return;
    }

    openConfirm({
      title: I18n.t("categories.deleteTitle"),
      body: I18n.t(usage === 1 ? "categories.deleteUsedBodyOne" : "categories.deleteUsedBody", { count: usage }),
      confirmLabel: I18n.t("categories.deleteConfirm"),
      onConfirm: async function () {
        try {
          var target = await DB.ensureOtherCategory(category.type, id);
          await DB.reassignCategory(id, target.id);
          await DB.deleteCategory(id);

          state.transactions.forEach(function (transaction) {
            if (transaction.categoryId === id) transaction.categoryId = target.id;
          });
          state.categories = state.categories.filter(function (item) {
            return item.id !== id;
          });
          if (!findCategory(target.id)) state.categories.push(target);

          renderAll();
          showToast(I18n.t("categories.moved") + " · " + I18n.t("categories.deleted"));
        } catch (err) {
          console.error("Could not move and delete category", err);
          showToast(I18n.t("categories.deleteError"));
        }
      }
    });
  }

  /* ---------------------------------------------------------
     Data actions
     --------------------------------------------------------- */

  function csvContent(year) {
    var list = state.transactions.filter(function (transaction) {
      return transaction.year === year;
    }).slice().sort(function (a, b) {
      return new Date(a.occurredAt) - new Date(b.occurredAt);
    });
    var header = ["Date", "Time", "Type", "Category", "Amount", "Currency",
      "Amount (" + state.displayCurrency + ")", "Note", "Created at"];
    var lines = [header];
    list.forEach(function (transaction) {
      var date = new Date(transaction.occurredAt);
      var category = findCategory(transaction.categoryId);
      lines.push([
        dateInputValue(date),
        timeInputValue(date),
        I18n.t(transaction.type === "income" ? "tx.income" : "tx.expense"),
        category ? categoryName(category) : I18n.t("tx.uncategorized"),
        transaction.amount,
        transaction.currency,
        Number(displayValue(transaction).toFixed(2)),
        transaction.note || "",
        transaction.createdAt || ""
      ]);
    });
    return "\ufeff" + lines.map(function (row) {
      return row.map(csvEscape).join(",");
    }).join("\r\n");
  }

  function exportCsv() {
    var list = state.transactions.filter(function (transaction) {
      return transaction.year === state.year;
    });
    if (!list.length) {
      showToast(I18n.t("summary.exportEmpty"));
      return;
    }
    downloadBlob(csvContent(state.year), "ledger-" + state.year + ".csv", "text/csv;charset=utf-8");
    showToast(I18n.t("summary.exported"));
  }

  function exportJson() {
    var payload = {
      app: "money-ledger",
      schema: 1,
      exportedAt: new Date().toISOString(),
      settings: {
        displayCurrency: state.displayCurrency,
        rates: state.rates
      },
      categories: state.categories,
      transactions: state.transactions
    };
    var stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(JSON.stringify(payload, null, 2), "money-ledger-backup-" + stamp + ".json", "application/json");
    showToast(I18n.t("settings.exportJsonDone"));
  }

  function sanitizeCategory(raw) {
    if (!raw || !raw.id) return null;
    return {
      id: String(raw.id),
      type: raw.type === "income" ? "income" : "expense",
      nameTh: String(raw.nameTh || ""),
      nameEn: String(raw.nameEn || ""),
      color: safeColor(raw.color),
      order: isFinite(Number(raw.order)) ? Number(raw.order) : 0,
      createdAt: raw.createdAt || new Date().toISOString()
    };
  }

  function handleImportFile(file) {
    if (!file) return;
    var reader = file.text();
    reader.then(function (text) {
      var data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        showToast(I18n.t("settings.importError"));
        return;
      }
      var categories = Array.isArray(data.categories) ? data.categories.map(sanitizeCategory).filter(Boolean) : [];
      var transactions = Array.isArray(data.transactions) ? data.transactions.map(function (raw) {
        return normalizeTransaction(Object.assign({}, raw, { id: raw.id || uid("tx") }));
      }).filter(Boolean) : [];

      if (!categories.length && !transactions.length) {
        showToast(I18n.t("settings.importError"));
        return;
      }

      openConfirm({
        title: I18n.t("settings.importTitle"),
        body: I18n.t("settings.importBody"),
        confirmLabel: I18n.t("settings.importConfirm"),
        danger: false,
        onConfirm: async function () {
          try {
            if (categories.length) await DB.bulkPutCategories(categories);
            if (transactions.length) await DB.bulkPutTransactions(transactions);

            if (data.settings) {
              if (data.settings.rates && typeof data.settings.rates === "object") {
                Object.keys(data.settings.rates).forEach(function (code) {
                  var value = Number(data.settings.rates[code]);
                  if (DB.CURRENCIES.indexOf(code) !== -1 && isFinite(value) && value > 0) {
                    state.rates[code] = value;
                  }
                });
                persistRates();
              }
              if (DB.CURRENCIES.indexOf(data.settings.displayCurrency) !== -1) {
                state.displayCurrency = data.settings.displayCurrency;
                persistCurrency();
              }
            }

            await loadData();
            chooseInitialYear();
            renderAll();
            showToast(I18n.t("settings.importSuccess"));
          } catch (err) {
            console.error("Import failed", err);
            showToast(I18n.t("settings.importError"));
          }
        }
      });
    }).catch(function () {
      showToast(I18n.t("settings.importError"));
    });
  }

  function sampleTransactions() {
    var now = new Date();
    var thisYear = now.getFullYear();
    var lastYear = thisYear - 1;
    var expenseCats = categoriesOfType("expense");
    var incomeCats = categoriesOfType("income");
    if (!expenseCats.length && !incomeCats.length) return [];

    var plan = [
      { type: "income", cat: 0, day: 25, hour: 9, minute: 5, amount: 42000 },
      { type: "expense", cat: 2, day: 8, hour: 19, minute: 12, amount: 1450 },
      { type: "expense", cat: 0, day: 3, hour: 12, minute: 40, amount: 320 },
      { type: "expense", cat: 1, day: 6, hour: 8, minute: 25, amount: 140 },
      { type: "expense", cat: 5, day: 10, hour: 15, minute: 2, amount: 890 },
      { type: "expense", cat: 4, day: 18, hour: 17, minute: 45, amount: 680 },
      { type: "income", cat: 1, day: 12, hour: 14, minute: 30, amount: 8500 },
      { type: "expense", cat: 0, day: 21, hour: 18, minute: 10, amount: 470 }
    ];

    var records = [];
    var stamp = new Date().toISOString();

    function pushYear(year, maxMonth) {
      for (var month = 0; month <= maxMonth; month += 1) {
        plan.forEach(function (item, index) {
          var pool = item.type === "income" ? incomeCats : expenseCats;
          if (!pool.length) return;
          var category = pool[item.cat % pool.length];
          var day = Math.min(item.day + (month % 3), 28);
          var when = new Date(year, month, day, item.hour, item.minute + index, 0, 0);
          var currency = "THB";
          var amount = item.amount;
          if (year === lastYear) amount = Math.round(amount * 0.94);
          var note = "";
          if (month === 2 && index === 5) {
            currency = "USD";
            amount = 45;
            note = "Online order";
          }
          records.push({
            id: uid("tx"),
            type: item.type,
            amount: amount,
            currency: currency,
            categoryId: category.id,
            note: note,
            occurredAt: when.toISOString(),
            year: when.getFullYear(),
            month: when.getMonth(),
            yearMonth: when.getFullYear() + "-" + pad2(when.getMonth() + 1),
            createdAt: stamp,
            updatedAt: stamp
          });
        });
      }
    }

    pushYear(thisYear, now.getMonth());
    pushYear(lastYear, 11);
    return records;
  }

  async function loadSampleData() {
    if (state.transactions.length) {
      showToast(I18n.t("settings.sampleExists"));
      return;
    }
    var records = sampleTransactions();
    if (!records.length) return;

    openConfirm({
      title: I18n.t("settings.sampleConfirmTitle"),
      body: I18n.t("settings.sampleConfirmBody"),
      confirmLabel: I18n.t("settings.sample"),
      danger: false,
      onConfirm: async function () {
        try {
          await DB.bulkPutTransactions(records);
          await loadData();
          state.year = new Date().getFullYear();
          state.filters.year = String(state.year);
          renderAll();
          showToast(I18n.t("settings.sampleLoaded"));
        } catch (err) {
          console.error("Could not load sample data", err);
          showToast(I18n.t("common.error"));
        }
      }
    });
  }

  function resetRates() {
    state.rates = Object.assign({}, DB.DEFAULT_RATES);
    persistRates();
    renderAll();
    showToast(I18n.t("settings.ratesReset"));
  }

  function clearAllData() {
    openConfirm({
      title: I18n.t("settings.clearTitle"),
      body: I18n.t("settings.clearBody"),
      confirmLabel: I18n.t("settings.clearConfirm"),
      onConfirm: async function () {
        try {
          await DB.clearAll();
          await DB.seedCategories(true);
          await loadData();
          state.year = new Date().getFullYear();
          state.filters = {
            search: "", type: "all", categoryId: "all", month: "all",
            year: "all", currency: "all"
          };
          state.txLimit = TX_PAGE;
          renderAll();
          showToast(I18n.t("settings.cleared"));
        } catch (err) {
          console.error("Could not clear data", err);
          showToast(I18n.t("common.error"));
        }
      }
    });
  }

  /* ---------------------------------------------------------
     Action routing
     --------------------------------------------------------- */

  function handleAction(action, element) {
    if (!action) return;
    var id = element.getAttribute("data-id");
    switch (action) {
      case "add-tx":
        openTxDialog(null, { type: element.getAttribute("data-type") || "expense" });
        break;
      case "edit-tx":
        openTxDialog(findTransaction(id));
        break;
      case "delete-tx":
        deleteTransaction(id);
        break;
      case "add-category":
        openCategoryDialog(null, { type: element.getAttribute("data-type") || "expense" });
        break;
      case "edit-category":
        openCategoryDialog(findCategory(id));
        break;
      case "delete-category":
        deleteCategory(id);
        break;
      case "filter-category":
        state.filters.type = "all";
        state.filters.year = "all";
        state.filters.month = "all";
        state.filters.currency = "all";
        navigateTo("#/transactions?category=" + encodeURIComponent(id));
        break;
      case "clear-filters":
        state.filters = { search: "", type: "all", categoryId: "all", month: "all", year: "all", currency: "all" };
        state.txLimit = TX_PAGE;
        renderAll();
        break;
      case "load-more":
        state.txLimit += TX_PAGE;
        renderCurrentView();
        break;
      case "export-csv":
        exportCsv();
        break;
      case "export-json":
        exportJson();
        break;
      case "import-json": {
        var fileInput = $("#import-file");
        if (fileInput) fileInput.click();
        break;
      }
      case "load-sample":
        loadSampleData();
        break;
      case "reset-rates":
        resetRates();
        break;
      case "clear-data":
        clearAllData();
        break;
      case "install-app":
        installApp();
        break;
      default:
        break;
    }
  }

  function handleChange(event) {
    var target = event.target;

    if (target.matches('input[name="tx-type"]')) {
      updateTxCategoryOptions(target.value, null);
      return;
    }

    var role = target.getAttribute("data-role");
    if (!role) return;
    var value = target.value;

    if (role === "year") {
      state.year = Number(value);
      if (state.view === "transactions") state.filters.year = String(value);
      renderAll();
      return;
    }
    if (role === "currency" || role === "setting-currency") {
      state.displayCurrency = value;
      persistCurrency();
      renderAll();
      showToast(I18n.t("settings.currencyChanged"));
      return;
    }
    if (role === "filter-type") {
      state.filters.type = value;
    } else if (role === "filter-category") {
      state.filters.categoryId = value;
    } else if (role === "filter-month") {
      state.filters.month = value;
    } else if (role === "filter-year") {
      state.filters.year = value;
      if (value !== "all") state.year = Number(value);
    } else if (role === "filter-currency") {
      state.filters.currency = value;
    } else if (role === "setting-lang") {
      setLanguage(value);
      return;
    } else if (role === "setting-theme") {
      applyTheme(value, true);
      return;
    } else if (role === "rate") {
      var code = target.getAttribute("data-code");
      var rate = Number(value);
      if (DB.CURRENCIES.indexOf(code) !== -1) {
        if (isFinite(rate) && rate > 0) {
          state.rates[code] = rate;
          persistRates();
          showToast(I18n.t("settings.rateChanged"));
        } else {
          target.value = String(rateOf(code));
          showToast(I18n.t("settings.rateInvalid"));
        }
      }
      return;
    }

    state.txLimit = TX_PAGE;
    renderAll();
  }

  function handleSearchInput(value) {
    state.filters.search = value;
    state.txLimit = TX_PAGE;
    renderCurrentView();
    var input = $('[data-role="filter-search"]');
    if (input) {
      input.focus();
      try {
        input.setSelectionRange(input.value.length, input.value.length);
      } catch (err) {
        /* search inputs also support this */
      }
    }
  }

  /* ---------------------------------------------------------
     Event wiring
     --------------------------------------------------------- */

  var debouncedSearch = debounce(handleSearchInput, 200);

  function setupEventListeners() {
    document.addEventListener("click", function (event) {
      var closeTarget = event.target.closest("[data-close]");
      if (closeTarget) {
        closeDialog(closeTarget.getAttribute("data-close"));
        return;
      }

      var actionTarget = event.target.closest("[data-action]");
      if (actionTarget) {
        event.preventDefault();
        handleAction(actionTarget.getAttribute("data-action"), actionTarget);
        return;
      }

      var row = event.target.closest(".tx-row[data-id]");
      if (row) openTxDialog(findTransaction(row.getAttribute("data-id")));
    });

    document.addEventListener("change", handleChange);

    document.addEventListener("input", function (event) {
      if (event.target.matches('[data-role="filter-search"]')) {
        debouncedSearch(event.target.value);
      }
    });

    document.addEventListener("keydown", function (event) {
      if ((event.key === "Enter" || event.key === " ") && event.target.matches(".tx-row[data-id]")) {
        event.preventDefault();
        openTxDialog(findTransaction(event.target.getAttribute("data-id")));
      }
      if (event.key === "Escape") closeSidebar();
    });

    var txForm = $("#tx-form");
    if (txForm) {
      txForm.addEventListener("submit", function (event) {
        event.preventDefault();
        saveTransactionFromForm();
      });
    }

    var txDelete = $("#tx-delete");
    if (txDelete) {
      txDelete.addEventListener("click", function () {
        if (state.editingTxId) deleteTransaction(state.editingTxId);
      });
    }

    var categoryForm = $("#category-form");
    if (categoryForm) {
      categoryForm.addEventListener("submit", function (event) {
        event.preventDefault();
        saveCategoryFromForm();
      });
    }

    var confirmOk = $("#confirm-ok");
    if (confirmOk) {
      confirmOk.addEventListener("click", async function () {
        var callback = state.confirmCallback;
        closeDialog("confirm-dialog");
        if (typeof callback === "function") {
          try {
            await callback();
          } catch (err) {
            console.error("Confirm action failed", err);
            showToast(I18n.t("common.error"));
          }
        }
      });
    }

    ["tx-dialog", "category-dialog", "confirm-dialog"].forEach(function (id) {
      var dialog = document.getElementById(id);
      if (!dialog) return;
      dialog.addEventListener("close", function () {
        if (!document.querySelector("dialog[open]")) {
          document.body.classList.remove("dialog-open");
        }
      });
      dialog.addEventListener("click", function (event) {
        if (event.target === dialog) closeDialog(id);
      });
    });

    var fileInput = $("#import-file");
    if (fileInput) {
      fileInput.addEventListener("change", function () {
        var file = fileInput.files && fileInput.files[0];
        if (file) handleImportFile(file);
        fileInput.value = "";
      });
    }

    var menuButton = $("#menu-btn");
    if (menuButton) menuButton.addEventListener("click", openSidebar);
    var sidebarClose = $("#sidebar-close");
    if (sidebarClose) sidebarClose.addEventListener("click", closeSidebar);
    var scrim = $("#scrim");
    if (scrim) scrim.addEventListener("click", closeSidebar);

    var quickAdd = $("#quick-add-btn");
    if (quickAdd) quickAdd.addEventListener("click", function () {
      openTxDialog(null, { type: "expense" });
    });
    var mobileAdd = $("#mobile-add");
    if (mobileAdd) mobileAdd.addEventListener("click", function () {
      openTxDialog(null, { type: "expense" });
    });
    var sidebarAdd = $("#sidebar-add-category");
    if (sidebarAdd) sidebarAdd.addEventListener("click", function () {
      openCategoryDialog(null, { type: "expense" });
    });
    var langToggle = $("#lang-toggle");
    if (langToggle) langToggle.addEventListener("click", function () {
      setLanguage(I18n.lang === "th" ? "en" : "th");
    });
    var themeToggle = $("#theme-toggle");
    if (themeToggle) themeToggle.addEventListener("click", function () {
      applyTheme(state.theme === "dark" ? "light" : "dark", true);
    });
    var installButton = $("#install-btn");
    if (installButton) installButton.addEventListener("click", installApp);

    window.addEventListener("hashchange", function () {
      applyRoute(false);
    });
    window.addEventListener("online", function () {
      updateConnection();
      if (state.view === "settings") renderCurrentView();
    });
    window.addEventListener("offline", function () {
      updateConnection();
      if (state.view === "settings") renderCurrentView();
    });
  }

  function refreshOpenDialogs() {
    var txDialog = document.getElementById("tx-dialog");
    if (txDialog && txDialog.open && state.editingTxId) {
      openTxDialog(findTransaction(state.editingTxId));
    }
    var categoryDialog = document.getElementById("category-dialog");
    if (categoryDialog && categoryDialog.open && state.editingCategoryId) {
      openCategoryDialog(findCategory(state.editingCategoryId));
    }
  }

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */

  function startClock() {
    updateClock();
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(updateClock, 1000);
  }

  async function init() {
    applyTheme(state.theme, false);
    updateLangButton();

    try {
      await DB.open();
      await DB.seedCategories(false);
      await loadData();
      chooseInitialYear();
      state.initialized = true;
    } catch (err) {
      console.error("Could not initialise the ledger", err);
      renderFatalError(err);
      return;
    }

    setupEventListeners();
    setupPWA();
    startClock();
    updateConnection();

    var route = parseHash();
    state.view = route.view;
    applyRoute(true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
