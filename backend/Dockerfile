# ========================
# СТАДИЯ 1: Сборка проекта
# ========================
FROM node:20-alpine AS builder

WORKDIR /app

# Установка необходимых утилит
RUN apk add --no-cache tini git

# ✅ Корректное копирование package.json и package-lock.json
COPY package.json package-lock.json* ./

# Копирование схемы Prisma
COPY prisma ./prisma

# Установка прод-зависимостей c увеличенными таймаутами скачивания
RUN npm config set fetch-retry-maxtimeout 600000 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retries 5 \
    && npm install --legacy-peer-deps

# Копирование исходников проекта
COPY . .

# Генерация Prisma клиента и сборка NestJS
RUN npx prisma generate
RUN npm run build

# ========================
# СТАДИЯ 2: Финальный образ
# ========================
FROM node:20-alpine

WORKDIR /app

# Создание непривилегированного пользователя
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Установка tini
RUN apk add --no-cache tini

# Копирование собранного приложения
COPY --from=builder /app /app

# Установка переменной окружения
ENV NODE_ENV=production

# Переключение на пользователя
USER appuser

# Инициализация через tini
ENTRYPOINT ["/sbin/tini", "--"]

# Команда по умолчанию
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
