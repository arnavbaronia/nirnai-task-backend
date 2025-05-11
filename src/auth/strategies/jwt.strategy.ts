import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { db } from '../../db/drizzle';
import { users } from '../entities/user.entity';
import { eq } from 'drizzle-orm';
import { User } from '../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any): Promise<User> {
    const user = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user.length) {
      throw new Error('User not found');
    }
    const { password_hash, ...result } = user[0];
    return result as User;
  }
}