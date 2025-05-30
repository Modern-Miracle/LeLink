import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

export interface AuthenticatedNextRequest extends NextRequest {
  auth?: Session | null;
}
import { NextResponse } from "next/server";
import { ROUTES } from "../consts";

export function isPublicRoute(pathname: string) {
  return [ROUTES.SIGN_IN].includes(pathname);
}

export function redirectToSignIn(nextUrl: URL) {
  return NextResponse.redirect(new URL(ROUTES.SIGN_IN, nextUrl.origin));
}

export function redirectToWelcome(nextUrl: URL) {
  return NextResponse.redirect(new URL(ROUTES.WELCOME, nextUrl.origin));
}
