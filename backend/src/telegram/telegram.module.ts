import { Module, OnModuleInit } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramBotService } from './telegram.bot';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TelegramService, TelegramBotService],
  exports: [TelegramService, TelegramBotService], // экспортируем оба
})
export class TelegramModule implements OnModuleInit {
  constructor(private readonly bot: TelegramBotService) {}

  async onModuleInit() {
    console.log('🤖 TelegramBotService initializing...');
    // bot уже запускается внутри конструктора TelegramBotService (polling)
  }
}
