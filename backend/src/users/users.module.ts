import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModule } from '../notifications/notification.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [forwardRef(() => NotificationModule), forwardRef(() => AdminModule)],
  providers: [UsersService, PrismaService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
