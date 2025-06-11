import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { Priority, RequestSource, RequestStatus } from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';
import { NotificationType } from '../notifications/dto/create-notification.dto';
import axios from 'axios';
import { AdminLogsGateway } from '../admin/admin-logs.gateway';

/** 🇷🇺 Русификация статусов и приоритетов */
const STATUS_RU: Record<string, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  APPROVED: 'Одобрена',
  REJECTED: 'Отклонена',
  COMPLETED: 'Завершена',
  RESOLVED: 'Решена',
  DONE: 'Выполнена',
};
const PRIORITY_RU: Record<string, string> = {
  LOW: 'Низкий',
  NORMAL: 'Обычный',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};

function fixBigInt(obj: any): any {
  if (Array.isArray(obj)) return obj.map(fixBigInt);
  if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'bigint') {
        newObj[key] = obj[key].toString();
      } else if (typeof obj[key] === 'object') {
        newObj[key] = fixBigInt(obj[key]);
      } else {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  }
  return obj;
}

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationService,
    private adminLogsGateway: AdminLogsGateway,
  ) {}

  private async notifyTelegram(chatId: string | number | bigint, message: string) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken || !chatId) return;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    try {
      await axios.post(url, {
        chat_id: chatId.toString(),
        text: message,
        parse_mode: 'Markdown',
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Ошибка отправки в Telegram:', (error as any).message);
      }
    }
  }

  private async getLeastBusyAdminId(): Promise<number | null> {
    const twoWeeksAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
    const admins = await this.prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: {
          select: {
            assignedRequests: {
              where: {
                status: { in: [RequestStatus.NEW, RequestStatus.IN_PROGRESS] },
                createdAt: { gte: twoWeeksAgo },
              },
            },
          },
        },
      },
    });
    if (!admins.length) return null;
    const sorted = admins.sort(
      (a, b) => a._count.assignedRequests - b._count.assignedRequests,
    );
    return sorted[0].id;
  }

  async createWithFiles(dto: CreateRequestDto, userId: number, fileUrls: string[]) {
    try {
      let executorId = dto.executorId ?? null;
      if (!executorId) {
        executorId = await this.getLeastBusyAdminId();
      }
      const effectiveUserId = userId;
      const userExists = await this.prisma.user.findUnique({
        where: { id: effectiveUserId },
      });
      if (!userExists) {
        throw new HttpException('Указанный автор заявки не найден', HttpStatus.BAD_REQUEST);
      }
      const payload = {
        title: dto.title?.trim().slice(0, 100),
        content: dto.content?.trim(),
        status: (dto.status as RequestStatus) ?? RequestStatus.NEW,
        priority: (dto.priority as Priority) ?? Priority.NORMAL,
        category: dto.category?.trim().slice(0, 50) || null,
        expectedResolutionDate: dto.expectedResolutionDate
          ? new Date(dto.expectedResolutionDate)
          : null,
        fileUrls,
        userId: effectiveUserId,
        executorId,
        equipmentId: dto.equipmentId ?? null,
        assignedAt: executorId ? new Date() : null,
        source: (dto.source as RequestSource) ?? RequestSource.WEB,
      };

      const request = await this.prisma.request.create({ data: payload });

      try {
        this.adminLogsGateway.sendLog(
          `🆕 Новая заявка: "${request.title}" (ID: ${request.id}) Автор: ${userExists.lastName} ${userExists.firstName}`
        );
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Ошибка при логировании заявки:', err);
        }
      }

      try {
        await this.notifications.create({
          userId: effectiveUserId,
          title: '📥 Заявка отправлена',
          message: `Ваша заявка "${request.title}" была успешно зарегистрирована.`,
          type: NotificationType.REQUEST,
          url: `/dashboard/requests`,
        });

        if (executorId) {
          await this.notifications.create({
            userId: executorId,
            title: '🛠️ Назначена новая заявка',
            message: `Вам назначена новая заявка "${request.title}".`,
            type: NotificationType.REQUEST,
            url: `/dashboard/requests`,
          });
        }

        await this.notifications.create({
          role: 'superuser',
          title: '📢 Новая заявка',
          message: `Поступила новая заявка: "${request.title}" от ${userExists.lastName} ${userExists.firstName}.`,
          type: NotificationType.REQUEST,
          url: `/admin/requests`,
        });
      } catch (notifErr) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Ошибка при создании уведомлений:', notifErr);
        }
      }

      const author = userExists;
      const executor = executorId
        ? await this.prisma.user.findUnique({ where: { id: executorId } })
        : null;
      const executorName = executor ? `${executor.lastName} ${executor.firstName}` : 'ещё не назначен';
      const requestStatus = request.status;
      try {
        if (author?.telegramUserId) {
          await this.notifyTelegram(
            author.telegramUserId,
            `📌 *Ваша заявка успешно создана!*\n` +
            `№${request.id} — *${request.title}*\n\n` +
            `📝 Описание: ${request.content}\n` +
            `⭐️ Приоритет: ${PRIORITY_RU[request.priority] || request.priority}\n` +
            `👨‍💼 Статус: ${STATUS_RU[requestStatus] || requestStatus}\n` +
            `🛠 Исполнитель: ${executorName}`
          );
        }

        if (executor?.telegramUserId) {
          await this.notifyTelegram(
            executor.telegramUserId,
            `🛠 *Вам назначена новая заявка!*\n` +
            `№${request.id} — *${request.title}*\n\n` +
            `📝 Описание: ${request.content}\n` +
            `⭐️ Приоритет: ${PRIORITY_RU[request.priority] || request.priority}\n` +
            `👤 Автор: ${author.lastName} ${author.firstName}`
          );
        }

        const groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID;
        if (groupChatId) {
          await this.notifyTelegram(
            groupChatId,
            `🆕 *Открыта новая заявка №${request.id}:* *${request.title}*\n\n` +
            `📝 Описание: ${request.content}\n` +
            `⭐️ Приоритет: ${PRIORITY_RU[request.priority] || request.priority}\n` +
            `👤 Автор: ${author.lastName} ${author.firstName}\n` +
            `🛠 Исполнитель: ${executorName}`
          );
        }
      } catch (tgError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Ошибка при отправке уведомления в Telegram:', tgError);
        }
      }

      return fixBigInt(request);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Неизвестная ошибка');
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Ошибка при создании заявки с файлами:', err);
      }
      if ((error as any)?.code === 'P2002') {
        throw new HttpException(
          'Нарушено уникальное ограничение в заявке',
          HttpStatus.CONFLICT,
        );
      }
      throw new HttpException('Не удалось создать заявку', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(opts?: { limit?: number; offset?: number }) {
    const result = await this.prisma.request.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            internalPhone: true,
          },
        },
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            internalPhone: true,
          },
        },
        comments: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: opts?.offset ?? 0,
      take: opts?.limit ?? 10,
    });
    return fixBigInt(result);
  }

  async findByUser(userId: number) {
    const result = await this.prisma.request.findMany({
      where: { userId },
      include: {
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            internalPhone: true,
          },
        },
        comments: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return fixBigInt(result);
  }

  async findByExecutor(executorId: number) {
    const result = await this.prisma.request.findMany({
      where: { executorId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            internalPhone: true,
          },
        },
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            internalPhone: true,
          },
        },
        comments: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return fixBigInt(result);
  }

  async findOne(id: number) {
    const request = await this.prisma.request.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            internalPhone: true,
          },
        },
        executor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            internalPhone: true,
          },
        },
        comments: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!request) {
      throw new HttpException('Заявка не найдена', HttpStatus.NOT_FOUND);
    }

    return fixBigInt(request);
  }

  async update(id: number, dto: UpdateRequestDto, updatedBy?: number) {
    try {
      const oldRequest = await this.prisma.request.findUnique({
        where: { id },
        include: {
          user: true,
          executor: true,
        },
      });

      if (!oldRequest) {
        throw new HttpException('Заявка не найдена', HttpStatus.NOT_FOUND);
      }

      const updateData: Record<string, any> = {};

      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.content !== undefined) updateData.content = dto.content;
      if (dto.status !== undefined) updateData.status = dto.status as RequestStatus;
      if (dto.priority !== undefined) updateData.priority = dto.priority;
      if (dto.category !== undefined) updateData.category = dto.category;

      if (dto.executorId !== undefined) {
        updateData.executorId = dto.executorId;
        if (!oldRequest.assignedAt) {
          updateData.assignedAt = new Date();
        }
      }

      if (dto.equipmentId !== undefined) {
        updateData.equipmentId = dto.equipmentId;
      }

      if (dto.expectedResolutionDate !== undefined) {
        updateData.expectedResolutionDate = new Date(dto.expectedResolutionDate);
      }

      if (dto.fileUrls !== undefined) {
        updateData.fileUrls = dto.fileUrls;
      }

      // === Корректно пишем рейтинг/отзыв только для завершения заявки ===
      const status = dto.status?.toUpperCase();
      if ((status === 'DONE' || status === 'COMPLETED') && dto.rating !== undefined) {
        const numericRating = Number(dto.rating);
        updateData.rating = isNaN(numericRating) ? null : numericRating;
        updateData.feedback = (dto.feedback ?? '').trim();
      } else {
        // Для других статусов не обновляем рейтинг и отзыв
        // НИЧЕГО не пишем в updateData.rating/updateData.feedback!
      }

      if (dto.resolvedAt !== undefined) {
        updateData.resolvedAt = new Date(dto.resolvedAt);
        if (oldRequest.assignedAt) {
          const duration =
            (new Date(dto.resolvedAt).getTime() - oldRequest.assignedAt.getTime()) / 60000;
          updateData.workDuration = Math.round(duration);
        }
      }

      const updated = await this.prisma.request.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          executor: true,
        },
      });

      // ----- Блок уведомлений: всё в try/catch -----
      try {
        this.adminLogsGateway.sendLog(
          `✏️ Обновлена заявка: "${updated.title}" (ID: ${updated.id}) пользователем ID: ${updatedBy ?? 'N/A'}`
        );
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Ошибка при логировании изменений заявки:', err);
        }
      }

      const author = updated.user;
      const executor = updated.executor;
      const executorName = executor ? `${executor.lastName} ${executor.firstName}` : 'ещё не назначен';

      // Оповещение автора (если меняет не он сам)
      try {
        if (author?.telegramUserId && updatedBy !== author.id) {
          await this.notifyTelegram(
            author.telegramUserId,
            `✏️ *Ваша заявка №${updated.id} обновлена!*\n` +
            `*${updated.title}*\n\n` +
            `📝 Описание: ${updated.content}\n` +
            `⭐️ Приоритет: ${PRIORITY_RU[updated.priority] || updated.priority}\n` +
            `👨‍💼 Статус: ${STATUS_RU[updated.status] || updated.status}\n` +
            `🛠 Исполнитель: ${executorName}`
          );
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Ошибка при отправке уведомления автору:', e);
        }
      }

      // Оповещение исполнителю, если автор сам обновил заявку и исполнитель != автор
      try {
        if (
          executor?.telegramUserId &&
          updatedBy &&
          updatedBy === author?.id &&
          executor.id !== author.id
        ) {
          await this.notifyTelegram(
            executor.telegramUserId,
            `✏️ *Автор заявки №${updated.id} внёс изменения!*\n` +
            `*${updated.title}*\n\n` +
            `📝 Описание: ${updated.content}\n` +
            `⭐️ Приоритет: ${PRIORITY_RU[updated.priority] || updated.priority}\n` +
            `👨‍💼 Статус: ${STATUS_RU[updated.status] || updated.status}\n` +
            `🛠 Вы — исполнитель`
          );
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Ошибка при отправке уведомления исполнителю:', e);
        }
      }

      // Оповещение группы Telegram, если изменились статус, приоритет или исполнитель
      try {
        const groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID;
        const statusChanged = dto.status !== undefined && dto.status !== oldRequest.status;
        const priorityChanged = dto.priority !== undefined && dto.priority !== oldRequest.priority;
        const executorChanged = dto.executorId !== undefined && dto.executorId !== oldRequest.executorId;

        if (groupChatId && (statusChanged || priorityChanged || executorChanged)) {
          let whatChanged: string[] = [];
          if (statusChanged)
            whatChanged.push(
              `Статус: *${STATUS_RU[oldRequest.status] || oldRequest.status}* → *${STATUS_RU[updated.status] || updated.status}*`
            );
          if (priorityChanged)
            whatChanged.push(
              `Приоритет: *${PRIORITY_RU[oldRequest.priority] || oldRequest.priority}* → *${PRIORITY_RU[updated.priority] || updated.priority}*`
            );
          if (executorChanged) {
            let oldExec = oldRequest.executor ? oldRequest.executor.lastName + ' ' + oldRequest.executor.firstName : 'ещё не назначен';
            let newExec = executor ? executor.lastName + ' ' + executor.firstName : 'ещё не назначен';
            whatChanged.push(`Исполнитель: *${oldExec}* → *${newExec}*`);
          }

          await this.notifyTelegram(
            groupChatId,
            `🔔 *Изменения по заявке №${updated.id}:* *${updated.title}*\n\n` +
            `${whatChanged.join('\n')}\n\n` +
            `👤 Автор: ${author.lastName} ${author.firstName}\n` +
            `🛠 Текущий исполнитель: ${executorName}`
          );
        }
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Ошибка при отправке уведомления в группу:', e);
        }
      }

      return fixBigInt(updated);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Неизвестная ошибка');
      if (process.env.NODE_ENV !== 'production') {
        console.error(`❌ Ошибка при обновлении заявки ID ${id}:`, err);
      }
      throw new HttpException('Не удалось обновить заявку', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addComment(requestId: number, text: string, userId: number) {
    try {
      const request = await this.prisma.request.findUnique({
        where: { id: requestId },
        include: {
          user: true,
          executor: true,
        },
      });

      if (!request) {
        throw new HttpException('Заявка не найдена', HttpStatus.NOT_FOUND);
      }

      const userExists = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true },
      });

      if (!userExists) {
        throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
      }

      const comment = await this.prisma.comment.create({
        data: {
          content: text.trim(),
          requestId,
          userId,
        },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      try {
        this.adminLogsGateway.sendLog(
          `💬 Новый комментарий к заявке: "${request.title}" (ID: ${request.id}), автор: ${userExists.lastName} ${userExists.firstName}`
        );
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Ошибка при логировании комментария:', err);
        }
      }

      try {
        const author = request.user;
        if (author?.telegramUserId && userId !== author.id) {
          await this.notifyTelegram(
            author.telegramUserId,
            `💬 *Комментарий к вашей заявке №${request.id}:* *${request.title}*\n\n` +
            `👤 Комментатор: ${userExists.lastName} ${userExists.firstName}\n` +
            `📝 Текст: ${comment.content}`
          );
        }

        const executor = request.executor;
        if (
          executor?.telegramUserId &&
          request.userId === userId &&
          executor.id !== userId
        ) {
          await this.notifyTelegram(
            executor.telegramUserId,
            `💬 *Автор заявки №${request.id} оставил комментарий:*\n\n` +
            `📝 ${comment.content}`
          );
        }
      } catch (tgErr) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('❌ Ошибка отправки Telegram-уведомления по комментарию:', tgErr);
        }
      }

      return fixBigInt(comment);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error('Неизвестная ошибка');
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          `❌ Ошибка при добавлении комментария (requestId=${requestId}, userId=${userId}):`,
          err,
        );
        console.error('🔍 Стек ошибки:', err.stack);
      }
      throw new HttpException('Не удалось добавить комментарий', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
