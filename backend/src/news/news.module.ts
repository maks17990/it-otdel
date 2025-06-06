import { Module, forwardRef } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModule } from '../notifications/notification.module';
import { TelegramService } from '../telegram/telegram.service';
import { UsersModule } from '../users/users.module'; // <--- добавь это

@Module({
  imports: [
    forwardRef(() => UsersModule), // <--- вот тут!
    NotificationModule
  ],
  controllers: [NewsController],
  providers: [
    NewsService,
    PrismaService,
    TelegramService,
  ],
})
export class NewsModule {}
