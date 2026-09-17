import { URL } from "url";
import dns from "dns/promises";
import IPCIDR from "ip-cidr";
import { logger } from "./logger.js";

const BLOCKED_CIDRS = [
  "127.0.0.0/8",      // Loopback
  "10.0.0.0/8",       // RFC1918
  "172.16.0.0/12",    // RFC1918
  "192.168.0.0/16",   // RFC1918
  "169.254.0.0/16",   // Link-local
  "::1/128",          // IPv6 Loopback
  "fc00::/7",         // IPv6 Unique Local
  "fe80::/10",        // IPv6 Link Local
];

const cidrs = BLOCKED_CIDRS.map(cidr => new IPCIDR(cidr));

export async function isSafeUrl(urlString: string): Promise<boolean> {
  try {
    const url = new URL(urlString);
    
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false; // Only allow HTTP/HTTPS
    }

    const hostname = url.hostname;
    
    // Resolve hostname to IP
    const addresses = await dns.resolve(hostname);
    
    for (const ip of addresses) {
      for (const cidr of cidrs) {
        if (cidr.contains(ip)) {
          logger.warn({ url: urlString, ip }, "SSRF attempt blocked");
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    logger.error({ url: urlString, err: error }, "Error validating URL for SSRF");
    return false; // Block on error to be safe
  }
}

export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.hash = ""; // Remove fragments
    return url.toString();
  } catch {
    return rawUrl;
  }
}
