import { Module, forwardRef } from '@nestjs/common';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notification.module';
import { UsersModule } from '../users/users.module'; // <-- Добавили импорт UsersModule
import * as fs from 'fs';
import * as path from 'path';

// Гарантируем, что директория для загрузки файлов существует
const uploadPath = path.resolve('./uploads/equipment');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

@Module({
  imports: [
    MulterModule.register({
      dest: uploadPath,
    }),
    PrismaModule,
    NotificationModule,
    forwardRef(() => UsersModule), // <-- Добавили UsersModule (в конец списка)
  ],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService], // <-- Обычно good practice если используется в других модулях
})
export class EquipmentModule {}
