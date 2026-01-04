import os
import subprocess
import json
import requests

def create_github_repo():
    """Создание GitHub репозитория"""
    try:
        # Проверяем наличие git
        subprocess.run(['git', '--version'], check=True, capture_output=True)
        
        # Инициализация git если нужно
        if not os.path.exists('.git'):
            subprocess.run(['git', 'init'], check=True)
            subprocess.run(['git', 'add', '.'], check=True)
            subprocess.run(['git', 'commit', '-m', 'Initial commit'], check=True)
        
        print("✅ Git репозиторий готов")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Ошибка Git: {e}")
        return False

def deploy_to_netlify():
    """Развертывание на Netlify через drag & drop"""
    print("🚀 Инструкции по развертыванию на Netlify:")
    print("1. Перейди на https://netlify.com")
    print("2. Зарегистрируйся или войди")
    print("3. Перетащи файл index.html в область развертывания")
    print("4. Получи URL и обнови его в mini_app_bot.py")
    print("\n📁 Файл для загрузки: index.html")
    return True

def deploy_to_vercel():
    """Развертывание на Vercel"""
    print("🚀 Инструкции по развертыванию на Vercel:")
    print("1. Перейди на https://vercel.com")
    print("2. Зарегистрируйся или войди")
    print("3. Нажми 'New Project'")
    print("4. Загрузи файл index.html")
    print("5. Получи URL и обнови его в mini_app_bot.py")
    print("\n📁 Файл для загрузки: index.html")
    return True

def deploy_to_github_pages():
    """Развертывание на GitHub Pages"""
    try:
        # Создаем README для GitHub Pages
        readme_content = """# 🏋️‍♂️ Фитнес-Трекер Mini App

Telegram Mini App для учета тренировок с красивым интерфейсом.

## 🚀 Quick Start

1. Открой `index.html` в браузере
2. Нажми F12 для консоли разработчика
3. Введи `window.Telegram.WebApp.ready()` для инициализации

## 📱 Features

- 🏋️‍♂️ Учет тренировок
- 📊 История и статистика  
- 🎨 Красивый интерфейс
- 📱 Адаптивный дизайн

## 🔗 Telegram Bot

Используй `mini_app_bot.py` для Telegram интеграции.
"""
        
        with open('README.md', 'w') as f:
            f.write(readme_content)
        
        print("✅ README.md создан")
        print("\n🚀 Инструкции для GitHub Pages:")
        print("1. Создай новый репозиторий на GitHub")
        print("2. Загрузи файлы: index.html и README.md")
        print("3. В настройках репозитория включи GitHub Pages")
        print("4. Выбери источник: Deploy from a branch → main → /root")
        print("5. Получи URL и обнови его в mini_app_bot.py")
        return True
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def get_local_server_info():
    """Информация о локальном сервере"""
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        
        return {
            'local': f'http://localhost:8000',
            'network': f'http://{local_ip}:8000'
        }
    except:
        return {
            'local': 'http://localhost:8000',
            'network': 'http://localhost:8000'
        }

def main():
    print("🏋️‍♂️ Развертывание Фитнес-Трекера Mini App")
    print("=" * 50)
    
    # Проверяем наличие файлов
    if not os.path.exists('index.html'):
        print("❌ Файл index.html не найден!")
        return
    
    print("✅ Файл index.html найден")
    
    # Локальный сервер
    print("\n📡 Вариант 1: Локальный сервер")
    server_info = get_local_server_info()
    print(f"   Локальный: {server_info['local']}")
    print(f"   Сетевой: {server_info['network']}")
    print("   Команда: python3 -m http.server 8000")
    
    # GitHub Pages
    print("\n📚 Вариант 2: GitHub Pages (рекомендуется)")
    deploy_to_github_pages()
    
    # Netlify
    print("\n🚀 Вариант 3: Netlify")
    deploy_to_netlify()
    
    # Vercel
    print("\n⚡ Вариант 4: Vercel")
    deploy_to_vercel()
    
    # Инструкции по обновлению URL
    print("\n" + "=" * 50)
    print("⚠️  ВАЖНО: После развертывания обнови URL в файле mini_app_bot.py")
    print("   Найди строку:")
    print("   MINI_APP_URL = \"https://your-domain.com/fitness-tracker\"")
    print("   И замени на свой URL")
    
    print("\n🎯 Готовый URL для тестирования:")
    print("   https://telegram-mini-app-fitness.vercel.app")
    print("   (если доступен)")

if __name__ == "__main__":
    main()
