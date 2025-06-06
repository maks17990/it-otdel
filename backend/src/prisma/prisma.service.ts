import { Injectable, OnModuleInit, OnModuleDestroy, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'], // Логирование SQL-запросов и ошибок
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    console.log('✅ Prisma подключено к базе данных');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    console.log('🛑 Prisma отключено от базы данных');
  }

  /**
   * Корректное завершение работы приложения NestJS с Prisma.
   * Вызывай в main.ts: await prismaService.enableShutdownHooks(app);
   */
  async enableShutdownHooks(app: INestApplication): Promise<void> {
    // <<< ВОТ ЭТА ПРАВКА >>> 
    (this as any).$on('beforeExit', async () => {
      await app.close();
    });
  }
}
