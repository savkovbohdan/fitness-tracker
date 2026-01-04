#!/usr/bin/env python3
import subprocess
import threading
import time
import signal
import sys

def run_server():
    """Запуск веб-сервера"""
    try:
        process = subprocess.Popen([sys.executable, 'simple_server.py'])
        return process
    except Exception as e:
        print(f"Ошибка запуска сервера: {e}")
        return None

def run_bot():
    """Запуск Telegram бота"""
    try:
        process = subprocess.Popen([sys.executable, 'mini_app_bot.py'])
        return process
    except Exception as e:
        print(f"Ошибка запуска бота: {e}")
        return None

def signal_handler(sig, frame):
    """Обработчик сигналов для корректного завершения"""
    print("\n🛑 Остановка всех процессов...")
    sys.exit(0)

if __name__ == "__main__":
    # Регистрируем обработчик сигналов
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    print("🚀 Запуск Фитнес-Трекера...")
    
    # Запускаем сервер
    print("📡 Запуск веб-сервера...")
    server_process = run_server()
    
    # Ждем немного для инициализации сервера
    time.sleep(3)
    
    # Запускаем бота
    print("🤖 Запуск Telegram бота...")
    bot_process = run_bot()
    
    if server_process and bot_process:
        print("✅ Оба процесса запущены успешно!")
        print("📱 Mini App доступен по адресу: http://localhost:8000")
        print("🤖 Бот готов к работе в Telegram")
        print("⏹️  Нажми Ctrl+C для остановки")
        
        # Ожидаем завершения процессов
        try:
            server_process.wait()
            bot_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Остановка...")
            if server_process:
                server_process.terminate()
            if bot_process:
                bot_process.terminate()
    else:
        print("❌ Ошибка запуска процессов")
