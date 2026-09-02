/*
 * Currency metadata: name, symbol, and an explicit flag emoji override where the
 * currency code's first two letters don't map to the right country flag.
 * For everything else the flag is derived from the ISO code (see flagFor()).
 */
(function (global) {
  "use strict";

  // code -> { name, symbol?, flag? }
  const CURRENCY_META = {
    USD: { name: "US Dollar", symbol: "$" },
    EUR: { name: "Euro", symbol: "€" },
    GBP: { name: "British Pound", symbol: "£" },
    JPY: { name: "Japanese Yen", symbol: "¥" },
    AUD: { name: "Australian Dollar", symbol: "$" },
    CAD: { name: "Canadian Dollar", symbol: "$" },
    CHF: { name: "Swiss Franc", symbol: "Fr" },
    CNY: { name: "Chinese Yuan", symbol: "¥" },
    HKD: { name: "Hong Kong Dollar", symbol: "$" },
    NZD: { name: "New Zealand Dollar", symbol: "$" },
    SEK: { name: "Swedish Krona", symbol: "kr" },
    NOK: { name: "Norwegian Krone", symbol: "kr" },
    DKK: { name: "Danish Krone", symbol: "kr" },
    SGD: { name: "Singapore Dollar", symbol: "$" },
    INR: { name: "Indian Rupee", symbol: "₹" },
    MXN: { name: "Mexican Peso", symbol: "$" },
    BRL: { name: "Brazilian Real", symbol: "R$" },
    ZAR: { name: "South African Rand", symbol: "R" },
    RUB: { name: "Russian Ruble", symbol: "₽" },
    KRW: { name: "South Korean Won", symbol: "₩" },
    TRY: { name: "Turkish Lira", symbol: "₺" },
    AED: { name: "UAE Dirham", symbol: "د.إ" },
    SAR: { name: "Saudi Riyal", symbol: "﷼" },
    PLN: { name: "Polish Złoty", symbol: "zł" },
    THB: { name: "Thai Baht", symbol: "฿" },
    IDR: { name: "Indonesian Rupiah", symbol: "Rp" },
    MYR: { name: "Malaysian Ringgit", symbol: "RM" },
    PHP: { name: "Philippine Peso", symbol: "₱" },
    VND: { name: "Vietnamese Dong", symbol: "₫" },
    CZK: { name: "Czech Koruna", symbol: "Kč" },
    HUF: { name: "Hungarian Forint", symbol: "Ft" },
    RON: { name: "Romanian Leu", symbol: "lei" },
    ILS: { name: "Israeli Shekel", symbol: "₪" },
    CLP: { name: "Chilean Peso", symbol: "$" },
    COP: { name: "Colombian Peso", symbol: "$" },
    ARS: { name: "Argentine Peso", symbol: "$" },
    EGP: { name: "Egyptian Pound", symbol: "£" },
    PKR: { name: "Pakistani Rupee", symbol: "₨" },
    BDT: { name: "Bangladeshi Taka", symbol: "৳" },
    NGN: { name: "Nigerian Naira", symbol: "₦" },
    KES: { name: "Kenyan Shilling", symbol: "Sh" },
    MAD: { name: "Moroccan Dirham", symbol: "د.م." },
    QAR: { name: "Qatari Riyal", symbol: "﷼" },
    KWD: { name: "Kuwaiti Dinar", symbol: "د.ك" },
    BHD: { name: "Bahraini Dinar", symbol: ".د.ب" },
    OMR: { name: "Omani Rial", symbol: "﷼" },
    JOD: { name: "Jordanian Dinar", symbol: "د.ا" },
    LKR: { name: "Sri Lankan Rupee", symbol: "₨" },
    ISK: { name: "Icelandic Króna", symbol: "kr" },
    UAH: { name: "Ukrainian Hryvnia", symbol: "₴" },
    TWD: { name: "New Taiwan Dollar", symbol: "$" },
    GHS: { name: "Ghanaian Cedi", symbol: "₵" },
    PEN: { name: "Peruvian Sol", symbol: "S/" },
    DOP: { name: "Dominican Peso", symbol: "$" },
    CRC: { name: "Costa Rican Colón", symbol: "₡" },
    UYU: { name: "Uruguayan Peso", symbol: "$" },
    TND: { name: "Tunisian Dinar", symbol: "د.ت" },
    // Flag overrides for multi-country / special codes
    XAF: { name: "Central African CFA Franc", flag: "🌍" },
    XOF: { name: "West African CFA Franc", flag: "🌍" },
    XCD: { name: "East Caribbean Dollar", flag: "🏝️" },
    XPF: { name: "CFP Franc", flag: "🏝️" },
    XDR: { name: "IMF Special Drawing Rights", flag: "🏦" },
    ANG: { name: "Netherlands Antillean Guilder", flag: "🏝️" },
    EUR_: {},
  };
  delete CURRENCY_META.EUR_;

  // Order for the default (unsearched) picker list: popular travel currencies first.
  const POPULAR = [
    "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR", "SGD",
    "HKD", "NZD", "THB", "AED", "MXN", "ZAR", "SEK", "NOK", "DKK", "TRY",
  ];

  const FLAG_OVERRIDE = { EUR: "🇪🇺" };

  // Convert a 2-letter region code (e.g. "US") to a flag emoji.
  function regionToFlag(cc) {
    if (!/^[A-Za-z]{2}$/.test(cc)) return "";
    const base = 0x1f1e6;
    const a = base + (cc.toUpperCase().charCodeAt(0) - 65);
    const b = base + (cc.toUpperCase().charCodeAt(1) - 65);
    return String.fromCodePoint(a, b);
  }

  // Best-effort flag for a currency code.
  function flagFor(code) {
    const meta = CURRENCY_META[code];
    if (meta && meta.flag) return meta.flag;
    if (FLAG_OVERRIDE[code]) return FLAG_OVERRIDE[code];
    const derived = regionToFlag(code.slice(0, 2));
    return derived || "💱";
  }

  function nameFor(code) {
    const meta = CURRENCY_META[code];
    return (meta && meta.name) || code;
  }

  function symbolFor(code) {
    const meta = CURRENCY_META[code];
    return (meta && meta.symbol) || "";
  }

  global.Currencies = { CURRENCY_META, POPULAR, flagFor, nameFor, symbolFor };
})(window);
