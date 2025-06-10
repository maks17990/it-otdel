import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';
import { AdminLogsGateway } from './admin-logs.gateway'; // ✅ Live-лог Gateway
import { AuditLogService } from './audit-log.service';

@Module({
  imports: [
    PrismaModule,
    TelegramModule,
    // Если планируешь circular dependencies — можно добавить forwardRef,
    // но для базового случая не нужно
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminLogsGateway, // ✅ Подключаем gateway к провайдерам
    AuditLogService,
  ],
  exports: [
    AdminService,
    AdminLogsGateway, // ✅ Экспортируй, если лог нужен в других модулях (например, RequestsService)
    AuditLogService,
  ],
})
export class AdminModule {}
