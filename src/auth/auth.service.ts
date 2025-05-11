import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { db } from '../db/drizzle';
import { users } from './entities/user.entity';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (user.length === 0) return null;

    const isValid = await bcrypt.compare(password, user[0].password_hash);
    if (!isValid) return null;

    const { password_hash, ...result } = user[0];
    return result;
  }

  async login(loginDto: { email: string; password: string }) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) throw new Error('Invalid credentials');

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user
    };
  }

  async register(registerDto: { email: string; password: string }) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(registerDto.password, salt);

    const [user] = await db
      .insert(users)
      .values({
        email: registerDto.email,
        password_hash: hash,
      })
      .returning();

    const { password_hash, ...result } = user;
    return result;
  }
}