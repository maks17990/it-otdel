# Стадия 1: Установка зависимостей и сборка проекта
FROM node:18.18-alpine AS builder

WORKDIR /app

# Копируем только package.json и lock файл для кэширования npm install
COPY package*.json ./

# Установка зависимостей
RUN npm install

# Копируем весь проект
COPY . .

# Установка переменной окружения (доступно во время сборки)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Установка production-режима
ENV NODE_ENV=production

# Сборка фронтенда
RUN npm run build

# Стадия 2: Финальный минимальный образ
FROM node:18.18-alpine

WORKDIR /app

# Копируем только собранный фронтенд и необходимые файлы
COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
