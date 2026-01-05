# SSL Setup Guide

## Quick SSL Setup

After deployment, your application works on HTTP. To enable HTTPS, follow these steps:

### Option 1: Automated SSL Setup (Recommended)

Run the SSL setup script on the server:

```bash
cd /var/www/fitness-tracker
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
```

### Option 2: Manual SSL Setup

1. **Install certbot:**
```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

2. **Get SSL certificate:**
```bash
sudo certbot certonly --standalone -d 178.212.12.73 \
    --non-interactive \
    --agree-tos \
    --email admin@178.212.12.73
```

3. **Open firewall ports:**
```bash
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw reload
```

4. **Restart application:**
```bash
pm2 restart fitness-tracker
```

## URLs After SSL Setup

- **HTTP:** http://178.212.12.73:5001
- **HTTPS:** https://178.212.12.73

## SSL Certificate Location

Certificates are stored at: `/etc/letsencrypt/live/178.212.12.73/`

- `privkey.pem` - Private key
- `cert.pem` - Certificate
- `chain.pem` - Chain certificate
- `fullchain.pem` - Full chain certificate

## Certificate Renewal

Let's Encrypt certificates auto-renew every 90 days.

To check renewal status:
```bash
sudo certbot renew --dry-run
```

To force renewal:
```bash
sudo certbot renew
```

## Troubleshooting

### If SSL setup fails:

1. **Check domain ownership:** Make sure `178.212.12.73` points to your server
2. **Check ports:** Ensure ports 80 and 443 are not blocked
3. **Check firewall:** `sudo ufw status`
4. **Check certbot logs:** `sudo journalctl -u certbot`

### If HTTPS doesn't work:

1. **Check certificates:** `sudo ls -la /etc/letsencrypt/live/178.212.12.73/`
2. **Restart application:** `pm2 restart fitness-tracker`
3. **Check application logs:** `pm2 logs fitness-tracker`

## Security

- SSL certificates are from Let's Encrypt (trusted by all browsers)
- Certificates auto-renew automatically
- Application supports both HTTP and HTTPS
- All data is encrypted on HTTPS
