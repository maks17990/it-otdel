import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';

// Функция для нормализации СНИЛС: оставить только цифры
function normalizeSnils(snils: string): string {
  return snils.replace(/\D/g, '');
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is required (add to .env)');
    }
    this.jwtSecret = secret;
  }

  async validateUser(snils: string, password: string): Promise<any> {
    // Нормализуем СНИЛС (оставляем только цифры)
    const cleanSnils = normalizeSnils(snils);

    // Используем метод, который возвращает passwordHash для сравнения пароля
    const user = await this.usersService.findBySnilsWithPassword(cleanSnils);
    if (!user) {
      console.log(`[AuthService] Пользователь с СНИЛС ${cleanSnils} не найден`);
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Пароль не установлен, обратитесь к администратору.');
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) {
      console.log(`[AuthService] Неверный пароль для пользователя с СНИЛС ${cleanSnils}`);
      throw new UnauthorizedException('Неверный пароль');
    }

    // Удаляем passwordHash из возвращаемых данных
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async generateToken(user: any): Promise<{ token: string }> {
    const payload = {
      sub: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      position: user.position,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: '4h',
    });
    return { token };
  }

  async login(user: any, res: Response) {
    const { token } = await this.generateToken(user);

    // Ключевой момент: secure true только в production с HTTPS!
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // <--- это оставляем!
      sameSite: 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 4, // 4 часа
    });

    console.log(`[AuthService] Пользователь ${user.id} вошёл, токен установлен в cookie`);

    return {
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      message: 'Вход успешно выполнен',
      access_token: token,
    };
  }
}
