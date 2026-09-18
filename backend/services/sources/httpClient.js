/**
 * Minimal SSRF-hardened HTTP GET client for source adapters (PLAN.md §19).
 *
 * Used to fetch external job feeds. Because source configuration eventually
 * becomes admin-configurable, every request:
 *   - allows only http(s)
 *   - resolves the hostname and refuses private / loopback / link-local /
 *     carrier-grade-NAT / reserved / cloud-metadata addresses (re-checked on
 *     every redirect hop via a pinned DNS lookup, closing the TOCTOU gap)
 *   - has an explicit timeout and a bounded response size
 *   - follows at most a few redirects, re-validating each Location
 *   - classifies failures (SsrfError / TimeoutError / HttpError / ResponseError
 *     / NetworkError / ConfigError)
 *
 * Deliberately small — not a general HTTP library.
 */
import http from "http";
import https from "https";
import dns from "dns";
import net from "net";
import { URL } from "url";

export class SourceHttpError extends Error {
  constructor(message, kind) {
    super(message);
    this.name = "SourceHttpError";
    this.kind = kind; // ssrf | timeout | http | response | network | config
  }
}
const err = (kind, msg) => new SourceHttpError(msg, kind);

const DEFAULTS = {
  timeoutMs: 15000,
  maxBytes: 8 * 1024 * 1024,
  maxRedirects: 3,
};

// ── IP range checks ──────────────────────────────────────────────────────
function ipv4ToInt(ip) {
  return ip.split(".").reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}
function inV4Cidr(ip, base, bits) {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

const BLOCKED_V4 = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // link-local (incl. 169.254.169.254 metadata)
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved
  ["255.255.255.255", 32],
];

export function isBlockedAddress(address) {
  if (!address) return true;
  let ip = address;
  const family = net.isIP(ip);

  if (family === 6) {
    const low = ip.toLowerCase();
    if (low === "::1" || low === "::") return true;
    if (low.startsWith("fc") || low.startsWith("fd")) return true; // fc00::/7 ULA
    if (low.startsWith("fe8") || low.startsWith("fe9") || low.startsWith("fea") || low.startsWith("feb"))
      return true; // fe80::/10 link-local
    if (low.startsWith("2001:db8")) return true;
    if (low.startsWith("::ffff:")) {
      const mapped = low.split(":").pop();
      if (net.isIP(mapped) === 4) ip = mapped;
      else return true;
    } else {
      return false; // other global v6 allowed
    }
  } else if (family !== 4) {
    return true; // not a literal IP → caller must resolve first
  }

  return BLOCKED_V4.some(([base, bits]) => inV4Cidr(ip, base, bits));
}

function resolveHost(hostname) {
  return new Promise((resolve, reject) => {
    // Literal IP → validate directly.
    if (net.isIP(hostname)) return resolve([hostname]);
    dns.lookup(hostname, { all: true, verbatim: true }, (e, addresses) => {
      if (e) return reject(err("network", `DNS lookup failed for ${hostname}: ${e.message}`));
      if (!addresses.length) return reject(err("network", `No DNS records for ${hostname}`));
      resolve(addresses.map((a) => a.address));
    });
  });
}

async function assertSafeUrl(rawUrl, { allowedHosts, allowPrivateHosts = false } = {}) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw err("config", `Invalid URL: ${rawUrl}`);
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw err("ssrf", `Blocked non-http(s) protocol: ${parsed.protocol}`);
  }
  if (allowedHosts && allowedHosts.length && !allowedHosts.includes(parsed.hostname)) {
    throw err("ssrf", `Host not in allowlist: ${parsed.hostname}`);
  }
  const addresses = await resolveHost(parsed.hostname);
  if (!allowPrivateHosts) {
    const bad = addresses.find((a) => isBlockedAddress(a));
    if (bad) throw err("ssrf", `Blocked address ${bad} for host ${parsed.hostname}`);
  }
  return { parsed, addresses };
}

/**
 * SSRF-safe HTTP request. Resolves to `{ status, headers, body, url }`; throws
 * SourceHttpError on any failure. `method` defaults to GET; pass `body` (string
 * or object → JSON) for POST.
 */
export async function safeRequest(rawUrl, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const method = (opts.method || "GET").toUpperCase();
  let bodyStr;
  if (opts.body !== undefined && opts.body !== null) {
    bodyStr = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  }
  let currentUrl = rawUrl;

  for (let redirect = 0; redirect <= opts.maxRedirects; redirect += 1) {
    const { parsed, addresses } = await assertSafeUrl(currentUrl, {
      allowedHosts: opts.allowedHosts,
      // The test-only escape hatch applies to the FIRST hop only; every
      // redirect target is always validated strictly.
      allowPrivateHosts: opts.allowPrivateHosts && redirect === 0,
    });
    const lib = parsed.protocol === "https:" ? https : http;

    // Pin DNS to the validated address so a rebind can't point us elsewhere.
    // Node's connect path calls this with `{ all: true }` (happy-eyeballs /
    // autoSelectFamily), which expects the array form `[{address, family}]`;
    // the positional form is only for the legacy single-address callback.
    const pinnedLookup = (hostname, lookupOpts, cb) => {
      const fn = typeof lookupOpts === "function" ? lookupOpts : cb;
      const wantsAll = lookupOpts && typeof lookupOpts === "object" && lookupOpts.all === true;
      if (wantsAll) {
        fn(
          null,
          addresses.map((address) => ({ address, family: net.isIP(address) || 4 }))
        );
      } else {
        const addr = addresses[0];
        fn(null, addr, net.isIP(addr) || 4);
      }
    };

    const response = await new Promise((resolve, reject) => {
      let settled = false;
      const fail = (e) => {
        if (settled) return;
        settled = true;
        reject(e instanceof SourceHttpError ? e : err("network", e.message));
      };
      const done = (v) => {
        if (settled) return;
        settled = true;
        resolve(v);
      };

      const req = lib.request(
        currentUrl,
        {
          method,
          lookup: pinnedLookup,
          headers: {
            Accept: "application/json",
            "User-Agent": opts.userAgent || "JobPilot-JobSync/1.0",
            ...(bodyStr !== undefined
              ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(bodyStr) }
              : {}),
            ...(opts.headers || {}),
          },
          timeout: opts.timeoutMs,
        },
        (res) => {
          const chunks = [];
          let size = 0;
          res.on("data", (chunk) => {
            size += chunk.length;
            if (size > opts.maxBytes) {
              fail(err("response", `Response exceeded ${opts.maxBytes} bytes`));
              req.destroy();
              res.destroy();
              return;
            }
            chunks.push(chunk);
          });
          res.on("error", fail);
          res.on("end", () =>
            done({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString("utf8") })
          );
        }
      );
      req.on("timeout", () => {
        fail(err("timeout", `Request timed out after ${opts.timeoutMs}ms`));
        req.destroy();
      });
      req.on("error", fail);
      if (bodyStr !== undefined) req.write(bodyStr);
      req.end();
    });

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location;
      if (!location) throw err("http", `Redirect ${response.status} without Location`);
      if (redirect === opts.maxRedirects) throw err("http", "Too many redirects");
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (response.status < 200 || response.status >= 300) {
      throw err("http", `HTTP ${response.status} from ${parsed.hostname}`);
    }

    return { ...response, url: currentUrl };
  }

  throw err("http", "Too many redirects");
}

/** SSRF-safe GET (thin wrapper over safeRequest). */
export function safeGet(rawUrl, options = {}) {
  return safeRequest(rawUrl, { ...options, method: "GET" });
}

const INTERNAL_TLD = /\.(local|internal|lan|home|corp|intranet)$/i;

/**
 * Synchronous check for a URL we are about to send a BROWSER to via a 302.
 * Rejects non-http(s) schemes, localhost, IP-literal private/reserved/metadata
 * addresses, and obvious internal-only TLDs. (The browser makes the real
 * request, so full DNS re-resolution is not required here.)
 */
export function isSafeRedirectUrl(raw) {
  let u;
  try {
    u = new URL(String(raw || ""));
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  // URL keeps IPv6 hosts bracketed ("[::1]") — strip for the IP check.
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return false;
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (INTERNAL_TLD.test(host)) return false;
  if (net.isIP(host) && isBlockedAddress(host)) return false;
  return true;
}

// ── Per-host sliding-window rate limiter ─────────────────────────────────
const hostWindows = new Map(); // host -> number[] (timestamps)

/**
 * Wait (if needed) so that no more than `perMin` requests are made to `host`
 * within any rolling 60s window. In-process; sufficient for a single sync
 * process. `perMin <= 0` disables limiting.
 */
export async function throttleHost(host, perMin) {
  if (!perMin || perMin <= 0) return;
  const now = Date.now();
  const windowStart = now - 60_000;
  const hits = (hostWindows.get(host) || []).filter((t) => t > windowStart);

  if (hits.length >= perMin) {
    const waitMs = hits[0] + 60_000 - now;
    if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
  }
  hits.push(Date.now());
  hostWindows.set(host, hits);
}

export function __resetRateLimiter() {
  hostWindows.clear();
}
