import { createHash } from "node:crypto";
import { ipHashSalt } from "./config";

/**
 * sha256(ip + IP_HASH_SALT); raw IPs are never stored. On Vercel the IP is
 * the first entry of x-forwarded-for, trusted only because the platform
 * sets it.
 */
export function ipHashOf(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : "local";
  return createHash("sha256")
    .update(ip + ipHashSalt())
    .digest("hex");
}

/** invalid_move / state_mismatch / bad_token share one user-facing message. */
const MESSAGES: Record<string, string> = {
  bad_request: "That request could not be read.",
  bad_token: "Your game is out of sync with the server.",
  expired: "This game's session has expired.",
  engine_version:
    "This game was started on an older version and can no longer continue.",
  no_session: "This game's session no longer exists.",
  already_over: "This game is already over.",
  invalid_move: "Your game is out of sync with the server.",
  state_mismatch: "Your game is out of sync with the server.",
  not_finished: "This game is not finished yet.",
  rate_limited: "Too many requests — try again later.",
  audit_failed: "Something went wrong on our side saving this game.",
  bad_name: "That name can't be used.",
  rejected_name: "That name can't be used.",
};

export function errorResponse(code: string, status: number): Response {
  return Response.json(
    { error: code, message: MESSAGES[code] ?? "Something went wrong." },
    { status },
  );
}
