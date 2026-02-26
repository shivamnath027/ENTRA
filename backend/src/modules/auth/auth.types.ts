export type UserRole = "RESIDENT" | "GUARD" | "ADMIN";
export type DevicePlatform = "ANDROID" | "IOS" | "WEB";

export type JwtAccessPayload = {
  sub: string;        // userId
  societyId: string;
  role: UserRole;
};

export type JwtRefreshPayload = {
  sub: string;        // userId
  societyId: string;
  jti: string;        // refresh token id (for rotation / revoke)
};
