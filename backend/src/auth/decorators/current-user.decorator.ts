import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  createdAt?: Date;
};

type AuthenticatedRequest = Request & { user: AuthUser };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return req.user;
  },
);
