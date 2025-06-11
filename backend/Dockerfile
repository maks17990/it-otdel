# ========================
# СТАДИЯ 1: Сборка проекта
# ========================
FROM node:20 AS builder

WORKDIR /app

# Установка необходимых утилит
RUN apt-get update && apt-get install -y tini git

# ✅ Корректное копирование package.json и package-lock.json
COPY package.json package-lock.json* ./

# Копирование схемы Prisma
COPY prisma ./prisma

# Установка прод-зависимостей (и dev-зависимостей тоже, чтобы собрать проект и prisma client)
RUN npm install --legacy-peer-deps

# Копирование исходников проекта
COPY . .

# Генерация Prisma клиента и сборка NestJS
RUN npx prisma generate
RUN npm run build

# ========================
# СТАДИЯ 2: Финальный образ
# ========================
FROM node:20

WORKDIR /app

# Создание непривилегированного пользователя
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Установка tini
RUN apt-get update && apt-get install -y tini

# Копирование собранного приложения
COPY --from=builder /app /app

# Установка переменной окружения
ENV NODE_ENV=production

# Переключение на пользователя
USER appuser

# Инициализация через tini
ENTRYPOINT ["/usr/bin/tini", "--"]

# Команда по умолчанию
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
