import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** 📌 Общая статистика: пользователи, оборудование, активные заявки */
  async getStats() {
    try {
      const [users, equipment, requests] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.equipment.count(),
        this.prisma.request.count({
          where: { status: { not: RequestStatus.COMPLETED } },
        }),
      ]);
      return { users, equipment, requests };
    } catch (error) {
      this.logger.error('❌ Ошибка при получении общей статистики', error instanceof Error ? error.stack : '');
      throw new InternalServerErrorException('Не удалось получить статистику');
    }
  }

  /** 📊 Статистика заявок: по статусу и источнику */
  async getRequestStats() {
    try {
      const [byStatusRaw, bySourceRaw] = await Promise.all([
        this.prisma.request.groupBy({
          by: ['status'],
          _count: true,
        }),
        this.prisma.request.groupBy({
          by: ['source'],
          _count: true,
        }),
      ]);
      const byStatus = byStatusRaw.map((item) => ({
        status: item.status,
        count: item._count,
      }));

      const bySource = bySourceRaw.map((item) => ({
        source: item.source ?? 'UNKNOWN',
        count: item._count,
      }));

      // --- Активность по часам ---
      const hourly = await this.getHourlyActivity();

      return { byStatus, bySource, hourly };
    } catch (error) {
      this.logger.error('❌ Ошибка при получении статистики заявок', error instanceof Error ? error.stack : '');
      throw new InternalServerErrorException('Не удалось получить статистику заявок');
    }
  }

  /** 🗓️ Реальные запросы календаря */
  async getCalendarRequests() {
    try {
      const requests = await this.prisma.request.findMany({
        select: {
          id: true,
          title: true,
          createdAt: true,
        }
      });
      const events = requests.map((req) => ({
        id: req.id,
        title: req.title ?? `Заявка #${req.id}`,
        date: req.createdAt,
      }));
      return events;
    } catch (error) {
      this.logger.error('❌ Ошибка при получении calendar-requests', error instanceof Error ? error.stack : '');
      throw new InternalServerErrorException('Не удалось получить calendar-requests');
    }
  }

  /** 📈 Реальные инсайты */
  async getInsights() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const newRequestsToday = await this.prisma.request.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          }
        }
      });

      return {
        insights: [
          `Новых заявок сегодня: ${newRequestsToday}`,
        ]
      };
    } catch (error) {
      this.logger.error('❌ Ошибка при получении insights', error instanceof Error ? error.stack : '');
      throw new InternalServerErrorException('Не удалось получить insights');
    }
  }

  /** 📆 Активность по часам (за последние 24 часа) */
  async getHourlyActivity() {
    try {
      // Получаем текущую дату и предыдущие 24 часа
      const now = new Date();
      const hours: { hour: string; count: number }[] = [];
      const start = new Date(now);
      start.setHours(now.getHours() - 23, 0, 0, 0);

      // Сгруппируем по часам
      const requests = await this.prisma.request.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: now
          }
        },
        select: { createdAt: true }
      });

      // Считаем заявки по каждому часу (локальное время)
      const hourly: { [key: string]: number } = {};
      for (let i = 0; i < 24; i++) {
        const date = new Date(start);
        date.setHours(start.getHours() + i);
        const key = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        hourly[key] = 0;
        hours.push({ hour: key, count: 0 });
      }

      requests.forEach((req) => {
        const key = new Date(req.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        if (key in hourly) {
          hourly[key]++;
        }
      });

      // Массив для графика
      const data = hours.map(({ hour }) => ({
        hour,
        count: hourly[hour] || 0,
      }));

      return data;
    } catch (error) {
      this.logger.error('❌ Ошибка при получении активности по часам', error instanceof Error ? error.stack : '');
      throw new InternalServerErrorException('Не удалось получить активность по часам');
    }
  }
}
