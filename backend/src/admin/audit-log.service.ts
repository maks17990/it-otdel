import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogCreate {
  userId?: number;
  actionType: string;
  entityType: string;
  entityId?: number;
  params?: any;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  create(entry: AuditLogCreate) {
    return this.prisma.auditLog.create({ data: entry });
  }

  async getLogs(filter: {
    userId?: number;
    type?: string;
    dateFrom?: Date;
    dateTo?: Date;
    entityType?: string;
  }) {
    const { userId, type, dateFrom, dateTo, entityType } = filter;
    return this.prisma.auditLog.findMany({
      where: {
        userId: userId ?? undefined,
        actionType: type ?? undefined,
        entityType: entityType ?? undefined,
        createdAt: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
