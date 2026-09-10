import crypto from "crypto";
import { db } from "@/lib/db";

const INVITATION_EXPIRY_HOURS = 48;

export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashInvitationToken(token: string): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function createFacultyInvitation(
  email: string,
  invitedBy: string
) {
  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);

  const expiresAt = new Date(
    Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await db()
    .from("faculty_invitations")
    .insert({
      email: email.trim().toLowerCase(),
      token_hash: tokenHash,
      invited_by: invitedBy,
      expires_at: expiresAt,
    })
    .select("id, email, expires_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    invitation: data,
    token,
  };
}

export async function getValidFacultyInvitation(token: string) {
  const tokenHash = hashInvitationToken(token);

  const { data, error } = await db()
    .from("faculty_invitations")
    .select("id, email, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .single();

  if (error || !data) {
    return null;
  }

  if (data.used_at) {
    return null;
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return data;
}

export async function markFacultyInvitationUsed(id: string) {
  const { error } = await db()
    .from("faculty_invitations")
    .update({
      used_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("used_at", null);

  if (error) {
    throw new Error(error.message);
  }
}