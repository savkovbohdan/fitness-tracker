#!/usr/bin/env python3
import http.server
import socketserver
import threading
import time
import requests
import json

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def get_public_ip():
    """Получаем публичный IP адрес"""
    try:
        response = requests.get('https://api.ipify.org?format=json')
        return response.json()['ip']
    except:
        return "localhost"

def get_tunnel_url():
    """Пытаемся создать туннель через ngrok или локальный сервер"""
    try:
        # Пробуем получить бесплатный туннель
        response = requests.post('https://tunnel.mendable.ai/tunnel', 
                               json={'port': 8000, 'subdomain': f'fitness-{int(time.time())}'})
        if response.status_code == 200:
            data = response.json()
            return data.get('url')
    except:
        pass
    return None

def start_server():
    """Запускаем локальный сервер"""
    PORT = 8000
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 Сервер запущен на порту {PORT}")
        
        # Получаем публичный IP
        public_ip = get_public_ip()
        local_url = f"http://localhost:{PORT}"
        public_url = f"http://{public_ip}:{PORT}" if public_ip != "localhost" else local_url
        
        print(f"📱 Локальный URL: {local_url}")
        print(f"🌐 Публичный URL: {public_url}")
        
        # Пробуем создать туннель
        tunnel_url = get_tunnel_url()
        if tunnel_url:
            print(f"🔗 Туннель URL: {tunnel_url}")
            print(f"\n⚠️  Обнови этот URL в mini_app_bot.py:")
            print(f"MINI_APP_URL = \"{tunnel_url}\"")
        else:
            print(f"\n⚠️  Обнови этот URL в mini_app_bot.py:")
            print(f"MINI_APP_URL = \"{public_url}\"")
        
        print(f"\n📝 Открой в браузере: {local_url}")
        print("⏹️  Нажми Ctrl+C для остановки сервера")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен")

if __name__ == "__main__":
    start_server()
