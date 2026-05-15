export interface JwtPayload {
  sub: string | number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
