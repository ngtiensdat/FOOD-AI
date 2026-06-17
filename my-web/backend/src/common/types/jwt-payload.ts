export interface JwtPayload {
  id?: number;
  sub: string | number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
