import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

interface JwtPayload {
  sub: number;
  role: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  department: string;
  position: string;
  mobilePhone?: string;
  internalPhone?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          if (req.cookies?.token) return req.cookies.token;
          const authHeader = req.headers.authorization;
          if (authHeader?.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
          }
          return null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretkey',
    });
  }

  async validate(payload: JwtPayload) {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ JWT Payload:', payload);
    }

    if (
      !payload?.sub ||
      !payload.role ||
      !payload.firstName ||
      !payload.lastName ||
      !payload.department ||
      !payload.position
    ) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub, // Теперь user.id всегда доступен в Guards и контроллерах
      role: payload.role,
      firstName: payload.firstName,
      lastName: payload.lastName,
      middleName: payload.middleName || '',
      department: payload.department,
      position: payload.position,
      mobilePhone: payload.mobilePhone || '',
      internalPhone: payload.internalPhone || '',
    };
  }
}
