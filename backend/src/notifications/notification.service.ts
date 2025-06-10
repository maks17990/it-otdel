import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationMessage } from './notification.model';
import { NotificationType, CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationGateway } from './notification.gateway';
import { TelegramService } from '../telegram/telegram.service';
import { Role, Department } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationGateway,
    private readonly telegram: TelegramService,
  ) {}

  /**
   * Создаёт уведомление, сохраняет в БД, рассылает через WebSocket и Telegram.
   */
  async create(payload: CreateNotificationDto) {
    // Проверка существования получателя
    if (payload.userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user) {
        throw new NotFoundException('Пользователь-адресат не найден');
      }
    }
    if (payload.role) {
      const validRoles: string[] = Object.values(Role);
      if (!validRoles.includes(payload.role as any)) {
        throw new BadRequestException('Некорректная роль для уведомления');
      }
    }
    // ✅ ENUM-проверка для департамента!
    if (payload.department && !Object.values(Department).includes(payload.department as Department)) {
      throw new BadRequestException('Некорректный департамент');
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        role: payload.role,
        department: payload.department as Department,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        url: payload.url,
      },
    });

    const socketPayload: NotificationMessage = {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type as NotificationType, // 👈 исправлено!
      url: notification.url ?? undefined,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
    };

    // WebSocket уведомление
    try {
      if (payload.userId) {
        this.gateway.sendToUser(payload.userId, socketPayload);
      } else if (payload.role) {
        this.gateway.sendToRole(payload.role, socketPayload);
      } else if (payload.department) {
        this.gateway.sendToDepartment(payload.department, socketPayload);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('WebSocket send error:', err);
      }
    }

    // Telegram уведомление
    this.telegram.sendFromNotification(notification).catch((err) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Telegram send error:', err);
      }
    });

    return notification;
  }

  /**
   * Получить уведомления пользователя (по ID, роли и департаменту).
   */
  async getUserNotifications(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, department: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    return this.prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { role: user.role ?? undefined },
          { department: user.department ?? undefined },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Получить количество непрочитанных уведомлений.
   */
  async getUnreadCount(userId: number): Promise<{ count: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, department: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const count = await this.prisma.notification.count({
      where: {
        isRead: false,
        OR: [
          { userId },
          { role: user.role ?? undefined },
          { department: user.department ?? undefined },
        ],
      },
    });

    return { count };
  }

  /**
   * Отметить уведомление как прочитанное.
   */
  async markAsRead(id: string, userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, department: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException('Уведомление не найдено');
    }

    const allowed =
      notification.userId === userId ||
      (notification.role && notification.role === user.role) ||
      (notification.department && notification.department === user.department);

    if (!allowed) {
      throw new ForbiddenException('Нет доступа к уведомлению');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
