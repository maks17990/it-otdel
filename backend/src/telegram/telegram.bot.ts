import { Injectable, Logger } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { PrismaService } from '../prisma/prisma.service';
import * as dotenv from 'dotenv';
import { Role } from '@prisma/client';

dotenv.config();

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const cleaned = digits.replace(/^8/, '7');
  return `+${cleaned}`;
}

@Injectable()
export class TelegramBotService {
  private bot: TelegramBot;
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(private prisma: PrismaService) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN не задан в .env!');
      return;
    }

    this.bot = new TelegramBot(token, { polling: true });
    this.logger.log('🤖 TelegramBotService запущен с polling');

    this.bot.setMyCommands([
      { command: 'start', description: 'Приветствие' },
      { command: 'auth', description: 'Авторизация по номеру телефона' },
      { command: 'myrequests', description: 'Посмотреть мои заявки' },
      { command: 'admin', description: 'Меню администратора' },
    ]);

    this.initCommands();
  }

  private initCommands() {
    this.bot.onText(/\/start/, this.handleStart.bind(this));
    this.bot.onText(/\/auth/, this.handleAuth.bind(this));
    this.bot.on('contact', this.handleContact.bind(this));
    this.bot.onText(/\/myrequests/, this.handleMyRequests.bind(this));
    this.bot.onText(/\/admin/, this.handleAdmin.bind(this));
  }

  private async handleStart(msg: TelegramBot.Message) {
    try {
      const chatId = msg.chat.id;
      const user = await this.prisma.user.findFirst({
        where: { telegramUserId: BigInt(chatId) },
      });

      if (user) {
        return this.bot.sendMessage(
          chatId,
          `✅ Вы уже авторизованы как ${user.firstName} ${user.lastName} (${user.role})`
        );
      }

      this.bot.sendMessage(
        chatId,
        `Здравствуйте, ${msg.from?.first_name || 'пользователь'}! 👋\n\nИспользуйте /auth для входа.`
      );
    } catch (error) {
      this.logger.error('Ошибка в handleStart:', error instanceof Error ? error.message : error);
    }
  }

  private async handleAuth(msg: TelegramBot.Message) {
    try {
      const chatId = msg.chat.id;
      const user = await this.prisma.user.findFirst({
        where: { telegramUserId: BigInt(chatId) },
      });

      if (user) {
        return this.bot.sendMessage(
          chatId,
          `✅ Вы уже авторизованы как ${user.firstName} ${user.lastName} (${user.role})`
        );
      }

      this.bot.sendMessage(chatId, '📱 Для входа отправьте свой номер телефона:', {
        reply_markup: {
          keyboard: [[{ text: '📲 Отправить номер', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    } catch (error) {
      this.logger.error('Ошибка в handleAuth:', error instanceof Error ? error.message : error);
    }
  }

  private async handleContact(msg: TelegramBot.Message) {
    try {
      const chatId = msg.chat.id;
      const rawPhone = msg.contact?.phone_number;

      if (!rawPhone) {
        return this.bot.sendMessage(chatId, '❗ Номер телефона не получен.');
      }

      const normalizedPhone = normalizePhone(rawPhone);

      const user = await this.prisma.user.findFirst({
        where: { mobilePhone: normalizedPhone },
      });

      if (!user) {
        return this.bot.sendMessage(chatId, '🚫 Пользователь с таким номером не найден.');
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: { telegramUserId: BigInt(chatId) },
      });

      this.bot.sendMessage(
        chatId,
        `✅ Вы авторизованы как ${user.firstName} ${user.lastName} (${user.role})`
      );
    } catch (error) {
      this.logger.error('Ошибка в handleContact:', error instanceof Error ? error.message : error);
    }
  }

  private async handleMyRequests(msg: TelegramBot.Message) {
    try {
      const chatId = msg.chat.id;
      const user = await this.prisma.user.findFirst({
        where: { telegramUserId: BigInt(chatId) },
        include: { requests: true },
      });

      if (!user) {
        return this.bot.sendMessage(chatId, '❗ Вы не авторизованы. Используйте /auth.');
      }

      if (!user.requests || user.requests.length === 0) {
        return this.bot.sendMessage(chatId, '📭 У вас пока нет заявок.');
      }

      const text = user.requests
        .map(r => `📌 ${r.title} — [${r.status}] от ${new Date(r.createdAt).toLocaleDateString('ru-RU')}`)
        .join('\n');

      this.bot.sendMessage(chatId, `Ваши заявки:\n\n${text}`);
    } catch (error) {
      this.logger.error('Ошибка в handleMyRequests:', error instanceof Error ? error.message : error);
    }
  }

  private async handleAdmin(msg: TelegramBot.Message) {
    try {
      const chatId = msg.chat.id;

      const user = await this.prisma.user.findFirst({
        where: {
          telegramUserId: BigInt(chatId),
          role: { in: ['admin', 'superuser'] as Role[] },
        },
      });

      if (!user) {
        return this.bot.sendMessage(chatId, '⛔️ Доступ только для администратора или суперпользователя.');
      }

      this.bot.sendMessage(chatId, `🛠 Админ-панель:\n\n📢 /broadcast\n📊 /stats\n👥 /finduser`);
    } catch (error) {
      this.logger.error('Ошибка в handleAdmin:', error instanceof Error ? error.message : error);
    }
  }
}
