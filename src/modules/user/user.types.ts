export type JwtUserPayload = {
  sub: number;
  email: string;
};

export type AuthenticatedRequest = Request & {
  user: JwtUserPayload;
};

export type OptionalAuthenticatedRequest = Request & {
  user?: JwtUserPayload;
};
import type { Request } from 'express';
