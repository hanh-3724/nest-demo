export type JwtUserPayload = {
  sub: number;
  email: string;
};

export type AuthenticatedRequest = Request & {
  user: JwtUserPayload;
};
