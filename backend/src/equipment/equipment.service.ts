import { Express } from 'express';
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import { NotificationService } from '../notifications/notification.service';
import * as bcrypt from 'bcrypt'; // Для хэширования паролей оборудования
import { NotificationType } from '../notifications/dto/create-notification.dto';
import axios from 'axios';

// ==========================
// Вспомогательная функция для Telegram-уведомлений
// ==========================
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

type EquipmentInputDto = {
  inventoryNumber: string;
  name: string;
  type: string;
  macAddress?: string;
  ipAddress?: string;
  login?: string;
  password?: string;
  location: string;
  floor?: string;
  cabinet?: string;
  assignedToUserId?: number | null;
};

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async getAll() {
    return this.prisma.equipment.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        inventoryNumber: true,
        name: true,
        type: true,
        macAddress: true,
        ipAddress: true,
        login: true,
        // password: false, // Никогда не возвращать пароль!
        location: true,
        floor: true,
        cabinet: true,
        createdAt: true,
        fileUrls: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            department: true,
          },
        },
      },
    });
  }

  async findById(id: number) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      select: {
        id: true,
        inventoryNumber: true,
        name: true,
        type: true,
        macAddress: true,
        ipAddress: true,
        login: true,
        // password: false, // Никогда не возвращать пароль!
        location: true,
        floor: true,
        cabinet: true,
        createdAt: true,
        fileUrls: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            department: true,
          },
        },
      },
    });
    if (!equipment) throw new NotFoundException('Оборудование не найдено');
    return equipment;
  }

  async create(data: EquipmentInputDto) {
    // Проверка уникальности inventoryNumber
    const existing = await this.prisma.equipment.findUnique({
      where: { inventoryNumber: data.inventoryNumber },
    });
    if (existing) {
      throw new ConflictException('Оборудование с таким инвентарным номером уже существует');
    }

    // Хэшируем пароль оборудования (если есть)
    let hashedPassword: string | undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    const equipment = await this.prisma.equipment.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });

    // Оповещения (личные кабинеты)
    await this.notifications.create({
      role: 'superuser',
      title: '🖥 Добавлено новое оборудование',
      message: `Оборудование "${equipment.name}" добавлено в систему.`,
      type: NotificationType.EQUIPMENT,
      url: `/admin/equipment`,
    });

    await this.notifications.create({
      role: 'admin',
      title: '🖥 Добавлено новое оборудование',
      message: `Добавлено новое оборудование: "${equipment.name}".`,
      type: NotificationType.EQUIPMENT,
      url: `/admin/equipment`,
    });

    if (equipment.assignedToUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: equipment.assignedToUserId },
      });

      if (user) {
        await this.notifications.create({
          userId: user.id,
          title: '📦 Вам назначено оборудование',
          message: `Вам назначено оборудование "${equipment.name}".`,
          type: NotificationType.EQUIPMENT,
          url: `/dashboard/profile`,
        });
      }
    }

    // Уведомление в Telegram-группу
    await notifyTelegramGroup(
      `🖥 *Добавлено новое оборудование:*\n*${equipment.name}* (${equipment.type})\nИнв. №: ${equipment.inventoryNumber}`
    );

    // Не возвращаем password!
    const { password, ...safeEquipment } = equipment;
    return safeEquipment;
  }

  async update(id: number, data: Partial<EquipmentInputDto>) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id } });
    if (!equipment) throw new NotFoundException('Оборудование не найдено');

    // Если меняется инвентарный номер — проверить уникальность
    if (data.inventoryNumber && data.inventoryNumber !== equipment.inventoryNumber) {
      const existing = await this.prisma.equipment.findUnique({
        where: { inventoryNumber: data.inventoryNumber },
      });
      if (existing) {
        throw new ConflictException('Оборудование с таким инвентарным номером уже существует');
      }
    }

    // Если обновляется пароль — хэшируем
    let updatedPassword: string | undefined;
    if (data.password) {
      updatedPassword = await bcrypt.hash(data.password, 10);
    }

    try {
      const updated = await this.prisma.equipment.update({
        where: { id },
        data: {
          ...data,
          ...(updatedPassword && { password: updatedPassword }),
        },
      });
      // Не возвращаем password!
      const { password, ...safeEquipment } = updated;
      return safeEquipment;
    } catch (err) {
      throw new InternalServerErrorException('Ошибка при обновлении оборудования');
    }
  }

  async remove(id: number) {
    const equipment = await this.prisma.equipment.findUnique({ where: { id } });
    if (!equipment) throw new NotFoundException('Оборудование не найдено');
    try {
      await this.prisma.equipment.delete({
        where: { id },
      });
      return { message: 'Оборудование удалено' };
    } catch (err) {
      throw new InternalServerErrorException('Ошибка при удалении оборудования');
    }
  }

  async attachFile(id: number, file: Express.Multer.File) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      select: { fileUrls: true },
    });

    if (!equipment) {
      throw new NotFoundException('Оборудование не найдено');
    }

    const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, '/');
    const updatedFiles = [...(equipment.fileUrls || []), relativePath];

    return this.prisma.equipment.update({
      where: { id },
      data: {
        fileUrls: updatedFiles,
      },
    });
  }
}
