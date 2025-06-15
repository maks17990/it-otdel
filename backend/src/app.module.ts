import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { EquipmentModule } from './equipment/equipment.module';
import { SoftwareModule } from './software/software.module';
import { RequestsModule } from './requests/requests.module';
import { PrismaModule } from './prisma/prisma.module';

import { NotificationModule } from './notifications/notification.module';
import { TelegramModule } from './telegram/telegram.module';
import { NewsModule } from './news/news.module';
import { AdminLogsGateway } from './admin/admin-logs.gateway'; // 👈 Добавлен импорт

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot({ ttl: 60, limit: 20 }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AdminModule,
    EquipmentModule,
    SoftwareModule,
    RequestsModule,
    NotificationModule,
    TelegramModule,
    NewsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AdminLogsGateway, // 👈 Добавлен gateway для Live-логов!
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
