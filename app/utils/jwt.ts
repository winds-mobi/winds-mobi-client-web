export interface JwtPayload {
  username?: string;
  exp?: number;
}

// Decodes a JWT's payload segment without verifying the signature — the
// client only needs the claims (`exp`, `username`); verification is the
// backend's job on every authenticated request.
export function decodeJwtPayload(token: string): JwtPayload | null {
  const segment = token.split('.')[1];

  if (!segment) {
    return null;
  }

  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');

    return JSON.parse(atob(base64)) as JwtPayload;
  } catch {
    return null;
  }
}
