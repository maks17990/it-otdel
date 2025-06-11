import { Controller, Get, Req, Res, UseGuards, ForbiddenException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { TelegramService } from '../telegram/telegram.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

// --- Пример простого кастомного декоратора для ролей ---
function Roles(...roles: string[]) {
  return (target: any, key?: any, descriptor?: any) => {
    Reflect.defineMetadata('roles', roles, descriptor ? descriptor.value : target);
  };
}

// --- Universal guard (если нужен): ---
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
@Injectable()
class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const handler = context.getHandler();
    const allowedRoles = Reflect.getMetadata('roles', handler) || [];
    return !allowedRoles.length || allowedRoles.includes(user?.role);
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // <--- Добавил универсальный guard!
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly telegramService: TelegramService
  ) {}

  @Get('stats')
  @Roles('admin', 'superuser')
  async getStats(): Promise<{ users: number; equipment: number; requests: number }> {
    return this.adminService.getStats();
  }

  @Get('stats-requests')
  @Roles('admin', 'superuser')
  async getRequestStats(): Promise<{
    byStatus: { status: string; count: number }[];
    bySource: { source: string; count: number }[];
  }> {
    return this.adminService.getRequestStats();
  }

  @Get('telegram-feed')
  @Roles('admin', 'superuser')
  async getTelegramFeed(@Req() req) {
    const user = req.user;
    if (!user || !['admin', 'superuser'].includes(user.role)) {
      throw new ForbiddenException('Доступ запрещён');
    }
    return this.telegramService.getLatestNotifications();
  }

  // --- НОВЫЕ МАРШРУТЫ ---

  @Get('calendar-requests')
  @Roles('admin', 'superuser')
  async getCalendarRequests() {
    return this.adminService.getCalendarRequests();
  }

  @Get('insights')
  @Roles('admin', 'superuser')
  async getInsights() {
    return this.adminService.getInsights();
  }

  @Get('hourly-activity')
  @Roles('admin', 'superuser')
  async getHourlyActivity() {
    return this.adminService.getHourlyActivity();
  }

  @Get('stats/daily')
  @Roles('admin', 'superuser')
  async getDailyStats(@Req() req) {
    const days = parseInt(req.query.days) || 30;
    return this.adminService.getDailyStats(days);
  }

  @Get('stats/equipment-faults')
  @Roles('admin', 'superuser')
  async getEquipmentFaults(@Req() req) {
    const days = parseInt(req.query.days) || 30;
    return this.adminService.getEquipmentFaults(days);
  }

  @Get('stats/users-activity')
  @Roles('admin', 'superuser')
  async getUsersActivity(@Req() req) {
    const days = parseInt(req.query.days) || 30;
    return this.adminService.getUsersActivity(days);
  }

  @Get('audit-log')
  @Roles('admin', 'superuser')
  async getAuditLog(@Req() req) {
    const { userId, type, dateFrom, dateTo, entityType } = req.query;
    return this.adminService.getAuditLogs({
      userId: userId ? parseInt(userId) : undefined,
      type: type as string,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      entityType: entityType as string,
    });
  }

  @Get('monitoring')
  @Roles('admin', 'superuser')
  async getMonitoring() {
    return this.adminService.getMonitoring();
  }

  @Get('reports/requests-by-admin')
  @Roles('admin', 'superuser')
  async getRequestsByAdmin(@Req() req) {
    const { dateFrom, dateTo } = req.query;
    return this.adminService.getRequestsByAdmin(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
  }

  @Get('reports/requests-by-admin/csv')
  @Roles('admin', 'superuser')
  async getRequestsByAdminCsv(@Req() req, @Res() res: Response) {
    const { dateFrom, dateTo } = req.query;
    const csv = await this.adminService.getRequestsByAdminCsv(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="requests_by_admin.csv"');
    res.send(csv);
  }

  @Get('reports/requests-by-equipment')
  @Roles('admin', 'superuser')
  async getRequestsByEquipment(@Req() req) {
    const { dateFrom, dateTo, type, location } = req.query;
    return this.adminService.getRequestsByEquipment(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
      type as string | undefined,
      location as string | undefined,
    );
  }

  @Get('reports/requests-by-equipment/csv')
  @Roles('admin', 'superuser')
  async getRequestsByEquipmentCsv(@Req() req, @Res() res: Response) {
    const { dateFrom, dateTo, type, location } = req.query;
    const csv = await this.adminService.getRequestsByEquipmentCsv(
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
      type as string | undefined,
      location as string | undefined,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="requests_by_equipment.csv"');
    res.send(csv);
  }
}
