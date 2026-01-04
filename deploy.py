import requests
import os

def upload_to_fileditch():
    """Загрузка файла на fileditch.com"""
    url = "https://fileditch.com/upload.php"
    
    with open('index.html', 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)
    
    if response.status_code == 200:
        # Ищем URL в ответе
        response_text = response.text
        if "https://fileditch.com/" in response_text:
            # Извлекаем URL из ответа
            lines = response_text.split('\n')
            for line in lines:
                if 'https://fileditch.com/' in line:
                    url = line.strip()
                    return url
        return response.text
    else:
        return f"Ошибка: {response.status_code}"

def upload_to_anonfiles():
    """Загрузка файла на anonfiles.com"""
    url = "https://api.anonfiles.com/upload"
    
    with open('index.html', 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status'):
            return data['data']['file']['url']['full']
        else:
            return f"Ошибка: {data.get('message', 'Unknown error')}"
    else:
        return f"Ошибка: {response.status_code}"

def upload_to_gofile():
    """Загрузка файла на gofile.io"""
    url = "https://api.gofile.io/uploadFile"
    
    with open('index.html', 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files)
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 'ok':
            return data['data']['downloadPage']
        else:
            return f"Ошибка: {data.get('status', 'Unknown error')}"
    else:
        return f"Ошибка: {response.status_code}"

if __name__ == "__main__":
    print("🚀 Загружаю index.html на хостинг...")
    
    # Пробуем разные хостинги
    services = [
        ("FileDitch", upload_to_fileditch),
        ("GoFile", upload_to_gofile),
        ("AnonFiles", upload_to_anonfiles),
    ]
    
    for name, upload_func in services:
        try:
            print(f"\n📤 Пробую {name}...")
            result = upload_func()
            print(f"✅ {name}: {result}")
            if result.startswith("http"):
                print(f"\n🎉 Успешно загружено на {name}!")
                print(f"🔗 URL: {result}")
                print(f"\n⚠️  Обнови этот URL в файле mini_app_bot.py:")
                print(f"MINI_APP_URL = \"{result}\"")
                break
        except Exception as e:
            print(f"❌ {name} ошибка: {e}")
    
    print("\n💡 Если ни один сервис не сработал, можешь:")
    print("1. Использовать GitHub Pages (рекомендуется)")
    print("2. Загрузить вручную на Netlify/Vercel")
    print("3. Использовать любой другой статический хостинг")
