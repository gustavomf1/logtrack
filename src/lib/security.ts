import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
export const stationCookie = "logtrack_station";
export const newToken = () => randomBytes(32).toString("hex");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
function secret() {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value || value.length < 32) throw new Error("Configure NEXTAUTH_SECRET com pelo menos 32 caracteres.");
  return value;
}
export function signStation(id: string, tokenHash: string) {
  const payload = id + "." + tokenHash;
  return payload + "." + createHmac("sha256", secret()).update(payload).digest("hex");
}
export function verifyStation(value?: string) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3 || !/^[a-f0-9]{64}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) return null;
  const expected = signStation(parts[0], parts[1]).split(".")[2];
  if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(parts[2], "hex"))) return null;
  return { id: parts[0], tokenHash: parts[1] };
}
export function cookieOptions() {
  return { httpOnly: true, secure: process.env.NEXTAUTH_URL?.startsWith("https://") ?? process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 365 * 24 * 60 * 60 };
}
