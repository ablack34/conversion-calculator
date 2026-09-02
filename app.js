(function () {
  "use strict";

  const RATE_API_PRIMARY = (base) => `https://open.er-api.com/v6/latest/${base}`;
  const RATE_API_FALLBACK = (base) => `https://api.frankfurter.dev/v1/latest?base=${base}`;
  const BASE = "USD";
  const LS = {
    from: "cc_from",
    to: "cc_to",
    mode: "cc_mode",
    rates: "cc_rates_v1",
  };

  // ---- Elements ----
  const primaryEl = document.getElementById("primary");
  const secondaryEl = document.getElementById("secondary");
  const rateNoteEl = document.getElementById("rate-note");
  const keysEl = document.getElementById("keys");
  const clearBtn = keysEl.querySelector('[data-action="clear"]');

  const modeCalcBtn = document.getElementById("mode-calc");
  const modeConvertBtn = document.getElementById("mode-convert");
  const convertBar = document.getElementById("convert-bar");

  const pillFrom = document.getElementById("pill-from");
  const pillTo = document.getElementById("pill-to");
  const fromFlag = document.getElementById("from-flag");
  const fromCode = document.getElementById("from-code");
  const toFlag = document.getElementById("to-flag");
  const toCode = document.getElementById("to-code");
  const swapBtn = document.getElementById("swap-btn");

  const sheet = document.getElementById("sheet");
  const sheetList = document.getElementById("sheet-list");
  const sheetSearch = document.getElementById("sheet-search");
  const sheetClose = document.getElementById("sheet-close");
  const sheetTitle = document.getElementById("sheet-title");

  // ---- State ----
  const calc = {
    current: "0",
    previous: null,
    operator: null,
    overwrite: true,
    secondary: "",
  };

  let mode = localStorage.getItem(LS.mode) === "convert" ? "convert" : "calc";

  const conv = {
    from: localStorage.getItem(LS.from) || "USD",
    to: localStorage.getItem(LS.to) || "EUR",
    base: BASE,
    rates: null,
    date: null,
    source: null, // "network" | "cache"
    status: "idle", // idle | loading | ok | offline | error
    codes: [],
  };

  let pickerTarget = null;

  // ---- Calculator engine ----
  const OP_SYMBOL = { "+": "+", "-": "−", "*": "×", "/": "÷" };

  function evaluate(a, op, b) {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function roundResult(n) {
    if (!isFinite(n)) return n;
    return parseFloat(n.toPrecision(12));
  }

  function numToString(n) {
    if (!isFinite(n)) return "Error";
    return String(n);
  }

  function inputDigit(d) {
    if (calc.current === "Error") clearAll();
    if (calc.overwrite) {
      calc.current = d;
      calc.overwrite = false;
    } else {
      const digitsOnly = calc.current.replace(/[-.]/g, "");
      if (digitsOnly.length >= 12) return;
      calc.current = calc.current === "0" ? d : calc.current + d;
    }
    clearOperatorHighlight();
    render();
  }

  function inputDecimal() {
    if (calc.current === "Error") clearAll();
    if (calc.overwrite) {
      calc.current = "0.";
      calc.overwrite = false;
    } else if (!calc.current.includes(".")) {
      calc.current += ".";
    }
    clearOperatorHighlight();
    render();
  }

  function setOperator(op) {
    if (calc.current === "Error") return;
    const inputValue = parseFloat(calc.current);
    if (calc.operator !== null && !calc.overwrite) {
      const result = roundResult(evaluate(calc.previous, calc.operator, inputValue));
      calc.current = numToString(result);
      calc.previous = result;
    } else if (calc.operator === null) {
      calc.previous = inputValue;
    }
    calc.operator = op;
    calc.overwrite = true;
    calc.secondary = `${formatEntry(numToString(calc.previous))} ${OP_SYMBOL[op]}`;
    highlightOperator(op);
    render();
  }

  function computeEquals() {
    if (calc.operator === null || calc.current === "Error") return;
    const a = calc.previous;
    const op = calc.operator;
    const b = parseFloat(calc.current);
    const result = roundResult(evaluate(a, op, b));
    calc.secondary = `${formatEntry(numToString(a))} ${OP_SYMBOL[op]} ${formatEntry(numToString(b))} =`;
    calc.current = numToString(result);
    calc.previous = null;
    calc.operator = null;
    calc.overwrite = true;
    clearOperatorHighlight();
    render();
  }

  function percent() {
    if (calc.current === "Error") return;
    let value = parseFloat(calc.current) / 100;
    if ((calc.operator === "+" || calc.operator === "-") && calc.previous !== null) {
      value = calc.previous * value;
    }
    calc.current = numToString(roundResult(value));
    calc.overwrite = true;
    render();
  }

  function negate() {
    if (calc.current === "Error" || calc.current === "0") return;
    calc.current = calc.current.startsWith("-")
      ? calc.current.slice(1)
      : "-" + calc.current;
    render();
  }

  function backspace() {
    if (calc.current === "Error") { clearAll(); return; }
    if (calc.overwrite) return;
    if (
      calc.current.length <= 1 ||
      (calc.current.length === 2 && calc.current.startsWith("-"))
    ) {
      calc.current = "0";
    } else {
      calc.current = calc.current.slice(0, -1);
    }
    render();
  }

  function clearAll() {
    calc.current = "0";
    calc.previous = null;
    calc.operator = null;
    calc.overwrite = true;
    calc.secondary = "";
    clearOperatorHighlight();
    render();
  }

  function clearOrEntry() {
    if (calc.current !== "0" && !calc.overwrite) {
      calc.current = "0";
      calc.overwrite = true;
      render();
    } else {
      clearAll();
    }
  }

  // ---- Display formatting ----
  function formatEntry(str) {
    if (str === "Error") return str;
    if (str.includes("e") || str.includes("E")) {
      const n = Number(str);
      if (isFinite(n)) return n.toLocaleString("en-US", { maximumFractionDigits: 8 });
      return "Error";
    }
    let neg = str.startsWith("-");
    if (neg) str = str.slice(1);
    let intPart = str;
    let decPart = "";
    const dot = str.indexOf(".");
    if (dot !== -1) {
      intPart = str.slice(0, dot);
      decPart = str.slice(dot + 1);
    }
    intPart = intPart.replace(/^0+(?=\d)/, "");
    if (intPart === "") intPart = "0";
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let out = intPart;
    if (dot !== -1) out += "." + decPart;
    return (neg ? "-" : "") + out;
  }

  function fitPrimary(text) {
    const len = text.length;
    let size = "";
    if (len > 12) size = "clamp(24px, 8.5vw, 40px)";
    else if (len > 9) size = "clamp(34px, 12vw, 54px)";
    else if (len > 6) size = "clamp(44px, 16vw, 68px)";
    primaryEl.style.fontSize = size;
  }

  function render() {
    const text = formatEntry(calc.current);
    primaryEl.textContent = text;
    fitPrimary(text);
    updateClearLabel();
    if (mode === "convert") {
      updateConversion();
    } else {
      secondaryEl.textContent = calc.secondary || "\u00A0";
      secondaryEl.classList.remove("converted");
    }
  }

  function updateClearLabel() {
    const showC = calc.current !== "0" && !calc.overwrite;
    clearBtn.textContent = showC ? "C" : "AC";
  }

  function highlightOperator(op) {
    clearOperatorHighlight();
    const btn = keysEl.querySelector(`[data-op="${op}"]`);
    if (btn) btn.classList.add("selected");
  }
  function clearOperatorHighlight() {
    keysEl.querySelectorAll(".key-op.selected").forEach((b) => b.classList.remove("selected"));
  }

  // ---- Currency conversion ----
  function convertAmount(amount, from, to) {
    if (!conv.rates) return null;
    const rf = conv.rates[from];
    const rt = conv.rates[to];
    if (!rf || !rt) return null;
    return (amount / rf) * rt;
  }

  function formatMoney(n, code) {
    const digits = Math.abs(n) !== 0 && Math.abs(n) < 1 ? 4 : 2;
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: digits,
      }).format(n);
    } catch (e) {
      return n.toLocaleString("en-US", { maximumFractionDigits: digits }) + " " + code;
    }
  }

  function updateConversion() {
    if (mode !== "convert") return;
    secondaryEl.classList.add("converted");
    const raw = calc.current === "Error" ? 0 : parseFloat(calc.current);
    const amount = isFinite(raw) ? raw : 0;
    const converted = convertAmount(amount, conv.from, conv.to);
    if (converted === null) {
      secondaryEl.textContent = conv.status === "loading" ? "…" : "—";
    } else {
      secondaryEl.textContent = `${formatMoney(converted, conv.to)}`;
    }
    updateRateNote();
  }

  function updateRateNote() {
    if (mode !== "convert") {
      rateNoteEl.hidden = true;
      return;
    }
    rateNoteEl.hidden = false;
    rateNoteEl.classList.remove("offline", "error");
    if (conv.status === "loading" && !conv.rates) {
      rateNoteEl.textContent = "Updating rates…";
      return;
    }
    if (conv.status === "error" && !conv.rates) {
      rateNoteEl.classList.add("error");
      rateNoteEl.textContent = "Couldn't load rates — check connection";
      return;
    }
    const unit = convertAmount(1, conv.from, conv.to);
    let line = "";
    if (unit !== null) {
      let r = unit >= 1 ? unit.toFixed(4) : unit.toPrecision(4);
      r = r.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
      line = `1 ${conv.from} = ${r} ${conv.to}`;
    }
    if (conv.source === "cache" || conv.status === "offline") {
      rateNoteEl.classList.add("offline");
      rateNoteEl.textContent = `${line}  ·  offline${conv.date ? " · " + shortDate(conv.date) : ""}`;
    } else {
      rateNoteEl.textContent = `${line}${conv.date ? "  ·  " + shortDate(conv.date) : ""}`;
    }
  }

  function shortDate(d) {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function updatePills() {
    fromFlag.textContent = Currencies.flagFor(conv.from);
    fromCode.textContent = conv.from;
    toFlag.textContent = Currencies.flagFor(conv.to);
    toCode.textContent = conv.to;
  }

  // ---- Rate loading ----
  async function fetchRatesNetwork() {
    try {
      const r = await fetch(RATE_API_PRIMARY(BASE), { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        if (j && j.result === "success" && j.rates) {
          return { base: BASE, rates: j.rates, date: j.time_last_update_utc || null };
        }
      }
    } catch (e) { /* try fallback */ }

    const r2 = await fetch(RATE_API_FALLBACK(BASE));
    if (!r2.ok) throw new Error("rate fetch failed");
    const j2 = await r2.json();
    const rates = Object.assign({ [BASE]: 1 }, j2.rates || {});
    return { base: BASE, rates, date: j2.date || null };
  }

  function applyRates(data, source) {
    conv.base = data.base;
    conv.rates = data.rates;
    conv.date = data.date;
    conv.source = source;
    conv.codes = Object.keys(data.rates).sort();
    if (!conv.rates[conv.from]) conv.from = "USD";
    if (!conv.rates[conv.to]) conv.to = "EUR";
    updatePills();
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(LS.rates);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj && obj.rates) return obj;
    } catch (e) {}
    return null;
  }

  function writeCache(data) {
    try {
      localStorage.setItem(LS.rates, JSON.stringify({ ...data, savedAt: Date.now() }));
    } catch (e) {}
  }

  async function loadRates() {
    const cached = readCache();
    if (cached) applyRates(cached, "cache");
    conv.status = "loading";
    if (mode === "convert") { updateConversion(); updateRateNote(); }
    try {
      const data = await fetchRatesNetwork();
      applyRates(data, "network");
      writeCache(data);
      conv.status = "ok";
    } catch (e) {
      conv.status = cached ? "offline" : "error";
    }
    if (mode === "convert") { updateConversion(); updateRateNote(); }
  }

  // ---- Currency picker ----
  function availableCodes() {
    if (conv.codes.length) return conv.codes;
    return Object.keys(Currencies.CURRENCY_META).sort();
  }

  function orderedCodes(filter) {
    const all = availableCodes();
    const q = (filter || "").trim().toUpperCase();
    let list = all;
    if (q) {
      list = all.filter((c) =>
        c.includes(q) || Currencies.nameFor(c).toUpperCase().includes(q)
      );
      return list;
    }
    const pop = Currencies.POPULAR.filter((c) => all.includes(c));
    const rest = all.filter((c) => !pop.includes(c));
    return pop.concat(rest);
  }

  function renderSheetList(filter) {
    const codes = orderedCodes(filter);
    const selected = pickerTarget === "from" ? conv.from : conv.to;
    sheetList.innerHTML = "";
    const frag = document.createDocumentFragment();
    codes.forEach((code) => {
      const li = document.createElement("li");
      li.className = "sheet-item" + (code === selected ? " is-selected" : "");
      li.dataset.code = code;
      li.innerHTML =
        `<span class="sheet-item-flag">${Currencies.flagFor(code)}</span>` +
        `<span class="sheet-item-code">${code}</span>` +
        `<span class="sheet-item-name">${Currencies.nameFor(code)}</span>`;
      frag.appendChild(li);
    });
    sheetList.appendChild(frag);
  }

  function openPicker(target) {
    pickerTarget = target;
    sheetTitle.textContent = target === "from" ? "Convert from" : "Convert to";
    sheetSearch.value = "";
    renderSheetList("");
    sheet.hidden = false;
    setTimeout(() => sheetSearch.focus(), 50);
  }

  function closePicker() {
    sheet.hidden = true;
    pickerTarget = null;
  }

  function pickCurrency(code) {
    if (pickerTarget === "from") {
      if (code === conv.to) conv.to = conv.from; // avoid identical pair by swapping
      conv.from = code;
    } else {
      if (code === conv.from) conv.from = conv.to;
      conv.to = code;
    }
    localStorage.setItem(LS.from, conv.from);
    localStorage.setItem(LS.to, conv.to);
    updatePills();
    updateConversion();
    closePicker();
  }

  function swapCurrencies() {
    const t = conv.from;
    conv.from = conv.to;
    conv.to = t;
    localStorage.setItem(LS.from, conv.from);
    localStorage.setItem(LS.to, conv.to);
    updatePills();
    updateConversion();
    vibrate(8);
  }

  // ---- Mode switching ----
  function setMode(next) {
    mode = next;
    localStorage.setItem(LS.mode, mode);
    const isConvert = mode === "convert";
    modeCalcBtn.classList.toggle("is-active", !isConvert);
    modeConvertBtn.classList.toggle("is-active", isConvert);
    modeCalcBtn.setAttribute("aria-selected", String(!isConvert));
    modeConvertBtn.setAttribute("aria-selected", String(isConvert));
    convertBar.hidden = !isConvert;
    rateNoteEl.hidden = !isConvert;
    if (isConvert && !conv.rates && conv.status !== "loading") loadRates();
    render();
    if (isConvert) updateRateNote();
  }

  // ---- Haptics ----
  function vibrate(ms) {
    if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} }
  }

  // ---- Event wiring ----
  keysEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".key");
    if (!btn) return;
    const action = btn.dataset.action;
    vibrate(6);
    switch (action) {
      case "digit": inputDigit(btn.dataset.digit); break;
      case "decimal": inputDecimal(); break;
      case "op": setOperator(btn.dataset.op); break;
      case "equals": computeEquals(); break;
      case "percent": percent(); break;
      case "negate": negate(); break;
      case "clear": clearOrEntry(); break;
    }
  });

  modeCalcBtn.addEventListener("click", () => setMode("calc"));
  modeConvertBtn.addEventListener("click", () => setMode("convert"));
  pillFrom.addEventListener("click", () => openPicker("from"));
  pillTo.addEventListener("click", () => openPicker("to"));
  swapBtn.addEventListener("click", swapCurrencies);

  sheetClose.addEventListener("click", closePicker);
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closePicker(); });
  sheetSearch.addEventListener("input", () => renderSheetList(sheetSearch.value));
  sheetList.addEventListener("click", (e) => {
    const li = e.target.closest(".sheet-item");
    if (li) pickCurrency(li.dataset.code);
  });

  // Keyboard support (desktop / Bluetooth keyboard)
  window.addEventListener("keydown", (e) => {
    if (!sheet.hidden) {
      if (e.key === "Escape") closePicker();
      return;
    }
    if (e.key >= "0" && e.key <= "9") { inputDigit(e.key); }
    else if (e.key === ".") { inputDecimal(); }
    else if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/") { setOperator(e.key); }
    else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); computeEquals(); }
    else if (e.key === "Backspace") { backspace(); }
    else if (e.key === "Escape") { clearAll(); }
    else if (e.key === "%") { percent(); }
    else return;
  });

  // ---- Service worker ----
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }

  // ---- Init ----
  updatePills();
  setMode(mode);
  render();
  loadRates();
})();
