# 🚀 Деплой Фитнес-Трекера через GitLab CI/CD

## 📋 Подготовка

### 1. Создай репозиторий в GitLab
```bash
# Инициализация Git репозитория
git init
git add .
git commit -m "Initial commit: Fitness Tracker"

# Добавление удаленного репозитория
git remote add origin git@gitlab.com:your-username/fitness-tracker.git
git push -u origin main
```

### 2. Настройка GitLab CI/CD

#### Вариант А: GitLab CI/CD (рекомендуется)
1. **Создай файл `.gitlab-ci.yml`** (уже создан)
2. **Добавь в GitLab:**
   - Settings → CI/CD → Variables
   - Добавь переменные:
     ```
     SSH_PRIVATE_KEY: (приватный SSH ключ)
     SSH_SERVER_IP: 178.212.12.73
     SSH_USER: root
     ```

#### Вариант Б: Docker (альтернатива)
1. **Используй `Dockerfile` и `docker-compose.yml`**
2. **Запуск на сервере:**
   ```bash
   docker-compose up -d
   ```

## 🔧 SSH Ключи для GitLab

### Создание SSH ключей:
```bash
# На локальной машине
ssh-keygen -t rsa -b 4096 -C "gitlab-ci-key"

# Копирование публичного ключа на сервер
ssh-copy-id -i ~/.ssh/gitlab-ci-key.pub root@178.212.12.73
```

### Добавление в GitLab:
1. **Settings → Repository → Deploy Keys**
2. **Добавь приватный ключ** (`~/.ssh/gitlab-ci-key`)
3. **Разреши запись на сервер**

## 🚀 Автоматический деплой

### Способ 1: GitLab CI/CD
```bash
# Пуш в main ветку запустит деплой
git add .
git commit -m "Deploy: $(date)"
git push origin main
```

### Способ 2: Ручной деплой через GitLab
```bash
# Использование GitLab Runner
gitlab-runner exec docker deploy
```

### Способ 3: Docker Compose
```bash
# На сервере
git clone https://gitlab.com/your-username/fitness-tracker.git
cd fitness-tracker
docker-compose up -d
```

## 📁 Структура проекта для GitLab

```
fitness-tracker/
├── .gitlab-ci.yml          # CI/CD конфигурация
├── Dockerfile               # Docker образ
├── docker-compose.yml       # Docker compose
├── package.json            # Зависимости
├── server.js               # Бэкенд
├── public/                 # Frontend
│   └── index.html
└── README.md               # Документация
```

## 🔗 GitLab CI/CD Pipeline

### Стадии:
1. **Build** - сборка приложения
2. **Deploy** - развертывание на сервер

### Переменные окружения:
- `SSH_PRIVATE_KEY` - SSH ключ для доступа
- `SSH_SERVER_IP` - IP сервера (178.212.12.73)
- `SSH_USER` - пользователь (root)
- `NODE_VERSION` - версия Node.js (18)
- `PORT` - порт приложения (5001)

## 🛠️ Настройка Nginx для Docker

### Создание nginx.conf:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream fitness-app {
        server fitness-tracker:5001;
    }

    server {
        listen 80;
        server_name _;

        location / {
            proxy_pass http://fitness-app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 📊 Мониторинг

### GitLab CI/CD:
- **Pipeline статус:** GitLab → CI/CD → Pipelines
- **Логи деплоя:** GitLab → CI/CD → Jobs
- **Переменные:** GitLab → Settings → CI/CD → Variables

### На сервере:
```bash
# Docker контейнеры
docker-compose ps

# Логи контейнера
docker-compose logs fitness-tracker

# Перезапуск
docker-compose restart fitness-tracker
```

## 🔒 Безопасность

### GitLab:
- **Protected branches** - защита main ветки
- **Protected tags** - защита тегов
- **Deploy keys** - ограничения доступа

### Сервер:
```bash
# Firewall
ufw status
ufw allow 80
ufw allow 443
ufw allow 22

# SSL (опционально)
certbot --nginx -d your-domain.com
```

## 🚀 Быстрый старт

### 1. Клонирование и настройка:
```bash
# Клонирование репозитория
git clone https://gitlab.com/your-username/fitness-tracker.git
cd fitness-tracker

# Настройка переменных
export SSH_SERVER_IP="178.212.12.73"
export SSH_USER="root"
```

### 2. Деплой:
```bash
# Через GitLab CI/CD
git push origin main

# Или локально через скрипт
./deploy.sh
```

## 📱 Доступ после деплоя

- **Основной сайт:** http://178.212.12.73
- **API эндпоинт:** http://178.212.12.73/api/health
- **GitLab Pipeline:** GitLab → CI/CD → Pipelines

## 🔄 Обновление

### Автоматическое:
```bash
git add .
git commit -m "Update: $(date)"
git push origin main
```

### Ручное:
```bash
git pull origin main
docker-compose up -d --build
```

## 🎯 Преимущества GitLab CI/CD

- ✅ **Автоматический деплой** при пуше
- ✅ **Версионирование** через Git теги
- ✅ **Откат** на предыдущие версии
- ✅ **Тестирование** перед деплоем
- ✅ **Мониторинг** всех деплоев
- ✅ **Безопасность** через SSH ключи

---

**🚀 Готово! Теперь твой Фитнес-Трекер будет автоматически развертываться через GitLab!**
