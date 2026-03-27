# Configuración HTTPS para Backend

## 🚀 Despliegue con HTTPS

### Opción 1: Servicios con HTTPS automático (Recomendado)

- **Railway**: HTTPS automático
- **Render**: HTTPS automático
- **Vercel**: HTTPS automático
- **Heroku**: HTTPS automático

### Opción 2: HTTPS local para desarrollo

1. **Instalar OpenSSL** (si no tienes):

   ```bash
   # Windows con Chocolatey
   choco install openssl.light
   ```

2. **Crear certificados self-signed**:

   ```bash
   mkdir ssl
   openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
   ```

3. **Configurar variables de entorno**:

   ```bash
   NODE_ENV=development
   USE_HTTPS=true
   SSL_KEY_PATH=ssl/key.pem
   SSL_CERT_PATH=ssl/cert.pem
   ```

4. **Ejecutar servidor**:
   ```bash
   npm start
   ```

### Opción 3: HTTPS en producción con Let's Encrypt

Para servidores VPS, usar Certbot:

```bash
sudo apt install certbot
sudo certbot --nginx
```

## 🔐 Variables de entorno para HTTPS

```env
NODE_ENV=production
USE_HTTPS=true
SSL_KEY_PATH=/etc/letsencrypt/live/tu-dominio/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/tu-dominio/fullchain.pem
```

## 📱 App móvil (APK) con HTTPS

La app Cordova ya soporta HTTPS automáticamente. Solo cambia la URL en `api.js`:

```javascript
const API_BASE = "https://tu-servidor.com/api";
```

## ✅ Verificación

- Abre https://tu-servidor.com en navegador
- Debería mostrar candado verde (seguro)
- La app móvil funcionará sin problemas con HTTPS
