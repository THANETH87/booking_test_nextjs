import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma/client";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface JWTPayload {
  userId: number;
  email: string;
  role: Role;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("auth-token");
}

export function getTokenFromCookieHeader(headers: Headers): string | null {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/(?:^|;\s*)auth-token=([^;]*)/);
  return match ? match[1] : null;
}
