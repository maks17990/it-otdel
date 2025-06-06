import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Department, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/dto/create-notification.dto';
import axios from 'axios';

// ======= Telegram Group Notify ==========
async function notifyTelegramGroup(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID;
  if (!botToken || !groupChatId) return;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: groupChatId,
      text: message,
      parse_mode: 'Markdown',
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ Ошибка отправки в Telegram:', (error as any).message);
    }
  }
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const cleaned = digits.replace(/^8/, '7');
  return `+${cleaned}`;
}

function normalizeSnils(snils: string): string {
  return snils.replace(/\D/g, '');
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async getAllUsers() {
    return this.prisma.user.findMany({
      orderBy: { lastName: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        department: true,
        position: true,
        role: true,
        internalPhone: true,
      },
    });
  }

  async createUser(data: {
    firstName: string;
    lastName: string;
    middleName?: string;
    password: string;
    birthDate: Date | string;
    snils: string;
    mobilePhone: string;
    internalPhone: string;
    position: string;
    department: Department;
    floor?: string;
    cabinet?: string;
    role?: Role;
  }) {
    const normSnils = normalizeSnils(data.snils);
    const userWithSameSnils = await this.findBySnils(normSnils);
    if (userWithSameSnils) {
      throw new HttpException('Пользователь с таким СНИЛС уже существует', HttpStatus.CONFLICT);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const normalizedPhone = normalizePhone(data.mobilePhone);
    const { password, birthDate, ...rest } = data;
    const birthDateValue: Date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;

    if (!birthDateValue || isNaN(birthDateValue.getTime())) {
      throw new HttpException('birthDate обязателен и должен быть корректной датой', HttpStatus.BAD_REQUEST);
    }

    const newUser = await this.prisma.user.create({
      data: {
        ...rest,
        snils: data.snils,
        mobilePhone: normalizedPhone,
        birthDate: birthDateValue,
        passwordHash,
        role: rest.role || 'user',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        department: true,
        position: true,
        role: true,
        internalPhone: true,
        mobilePhone: true,
        snils: true,
        floor: true,
        cabinet: true,
        birthDate: true,
      },
    });

    await this.notifications.create({
      role: 'superuser',
      title: '👤 Новый пользователь',
      message: `Пользователь ${newUser.lastName} ${newUser.firstName} зарегистрирован в системе.`,
      type: NotificationType.USER,
      url: `/admin/users`,
    });

    await notifyTelegramGroup(
      `👤 *Новый пользователь зарегистрирован!*\n${newUser.lastName} ${newUser.firstName} (${newUser.department})`
    );

    return newUser;
  }

  async updateUserById(
    id: number,
    updateData: Partial<{
      firstName: string;
      lastName: string;
      middleName?: string;
      birthDate?: Date | string;
      snils?: string;
      mobilePhone?: string;
      internalPhone?: string;
      department?: Department;
      position?: string;
      role?: Role;
      floor?: string;
      cabinet?: string;
      assignedEquipmentId?: number;
      password?: string;
    }>,
  ) {
    if (updateData.mobilePhone) {
      updateData.mobilePhone = normalizePhone(updateData.mobilePhone);
    }
    if (updateData.birthDate && typeof updateData.birthDate === 'string') {
      updateData.birthDate = new Date(updateData.birthDate);
    }
    if (updateData.password && updateData.password.length >= 6) {
      updateData['passwordHash'] = await bcrypt.hash(updateData.password, 10);
    }
    delete updateData.password;

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        department: true,
        position: true,
        role: true,
        internalPhone: true,
        mobilePhone: true,
        snils: true,
        floor: true,
        cabinet: true,
        birthDate: true,
      },
    });
  }

  async updateUser(
    userId: number,
    updateData: Partial<{
      firstName: string;
      lastName: string;
      middleName?: string;
      department?: Department;
      position?: string;
      mobilePhone?: string;
      internalPhone?: string;
    }>,
  ) {
    if (updateData.mobilePhone) {
      updateData.mobilePhone = normalizePhone(updateData.mobilePhone);
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        department: true,
        position: true,
        role: true,
        internalPhone: true,
        mobilePhone: true,
        snils: true,
        floor: true,
        cabinet: true,
        birthDate: true,
      },
    });
  }

  async findById(userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        firstName: true,
        lastName: true,
        middleName: true,
        department: true,
        position: true,
        mobilePhone: true,
        internalPhone: true,
        birthDate: true,
        snils: true,
        floor: true,
        cabinet: true,
        assignedEquipment: {
          select: {
            id: true,
            name: true,
            type: true,
            inventoryNumber: true,
          },
        },
      },
    });
  }

  /**
   * Для авторизации: вернуть user с passwordHash!
   */
  async findBySnilsWithPassword(snils: string) {
    const onlyDigits = normalizeSnils(snils);
    const result = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "User" WHERE regexp_replace(snils, '[^0-9]', '', 'g') = $1 LIMIT 1`,
      onlyDigits
    );
    return result?.[0] || null; // passwordHash тут есть!
  }

  /**
   * Безопасный возврат: user без passwordHash.
   */
  async findBySnils(snils: string) {
    const user = await this.findBySnilsWithPassword(snils);
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async deleteUserById(id: number) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findByNormalizedPhone(inputPhone: string) {
    const phone = normalizePhone(inputPhone);
    return this.prisma.user.findFirst({
      where: { mobilePhone: phone },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        middleName: true,
        department: true,
        position: true,
        role: true,
        internalPhone: true,
        mobilePhone: true,
        snils: true,
        floor: true,
        cabinet: true,
        birthDate: true,
      },
    });
  }
}
