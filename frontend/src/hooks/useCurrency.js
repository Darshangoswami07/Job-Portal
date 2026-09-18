import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { CURRENCIES, DEFAULT_CURRENCY, INR_COUNTRIES } from "@/config/pricing";

const STORAGE_KEY = "jp_currency";

/** Read a manually-selected currency that should survive the session. */
function readStoredCurrency() {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    return v && CURRENCIES[v] ? v : null;
  } catch {
    return null;
  }
}

/** Map an ISO country code to a supported currency code. */
function currencyForCountry(countryCode) {
  if (!countryCode) return null;
  const cc = String(countryCode).toUpperCase();
  if (INR_COUNTRIES.has(cc)) return "INR";
  if (cc === "US") return "USD";
  return null;
}

/** Best-effort guess from a free-text profile location like "Nainital, Uttarakhand, India". */
function currencyFromLocationText(location) {
  if (!location || typeof location !== "string") return null;
  const l = location.toLowerCase();
  if (l.includes("india") || /\b(bharat)\b/.test(l)) return "INR";
  if (l.includes("united states") || /\b(usa|u\.s\.a|u\.s\.)\b/.test(l)) return "USD";
  return null;
}

/** Fallback: infer from the browser's IANA timezone (no language sniffing). */
function currencyFromTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (/Kolkata|Calcutta/i.test(tz)) return "INR";
    if (/America\//i.test(tz)) return "USD";
  } catch {
    /* ignore */
  }
  return null;
}

/** Server/API-based country detection. Never throws. */
async function currencyFromIp(signal) {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal });
    if (!res.ok) return null;
    const data = await res.json();
    return currencyForCountry(data?.country_code || data?.country);
  } catch {
    return null;
  }
}

/**
 * useCurrency — resolves the currency to show for pricing and lets the user
 * override it for the session.
 *
 * Resolution order:
 *   1. Manual session selection (currency switcher)
 *   2. Logged-in user's saved profile location
 *   3. IP-based country detection (ipapi.co)
 *   4. Browser timezone
 *   5. DEFAULT_CURRENCY
 */
export function useCurrency() {
  const { user } = useSelector((store) => store.auth || {});
  const profileLocation = user?.profile?.location || user?.location || null;

  const [currencyCode, setCurrencyCode] = useState(
    () => readStoredCurrency() || currencyFromLocationText(profileLocation) || null
  );
  const [detecting, setDetecting] = useState(() => !readStoredCurrency());
  const manualRef = useRef(Boolean(readStoredCurrency()));

  // Re-check the profile location once the user object loads/changes.
  useEffect(() => {
    if (manualRef.current) return;
    const fromProfile = currencyFromLocationText(profileLocation);
    if (fromProfile) {
      setCurrencyCode(fromProfile);
      setDetecting(false);
    }
  }, [profileLocation]);

  // Async detection (IP → timezone) only when we still don't have a value.
  useEffect(() => {
    if (manualRef.current || currencyCode) {
      setDetecting(false);
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    (async () => {
      const resolved =
        (await currencyFromIp(controller.signal)) ||
        currencyFromTimezone() ||
        DEFAULT_CURRENCY;
      if (!cancelled && !manualRef.current) {
        setCurrencyCode(resolved);
        setDetecting(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [currencyCode]);

  const setCurrency = useCallback((code) => {
    if (!CURRENCIES[code]) return;
    manualRef.current = true;
    setDetecting(false);
    setCurrencyCode(code);
    try {
      sessionStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const effectiveCode = currencyCode || DEFAULT_CURRENCY;

  return {
    currencyCode: effectiveCode,
    currency: CURRENCIES[effectiveCode],
    currencies: CURRENCIES,
    setCurrency,
    detecting,
    isManual: manualRef.current,
  };
}

export default useCurrency;
