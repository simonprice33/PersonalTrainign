# Combined Nginx Configuration Setup

This configuration handles **multiple websites** on the same server:
- **IISHF websites**: www.iishf.com, events.iishf.com, dev.iishf.com, my-iis-site.com
- **Simon Price PT**: simonprice-pt.co.uk

## Prerequisites

1. **Nginx installed** on your Windows server
2. **SSL Certificates**:
   - IISHF: `C:/nginx/ssl/fullchain.crt` and `C:/nginx/ssl/STAR.iishf.com.key`
   - Simon Price PT: `C:/nginx/ssl/simonprice-pt.co.uk/fullchain.crt` and private key
3. **All services running**:
   - IISHF Production: `http://localhost:5000`
   - IISHF Dev: `http://localhost:2000`
   - Legacy IIS: `http://localhost:8080`
   - Simon Price PT Frontend: `http://localhost:3000`
   - Simon Price PT Backend: `http://localhost:8001`

## Installation Steps

### 1. Obtain SSL Certificate

You can get a free SSL certificate from [Let's Encrypt](https://letsencrypt.org/) or purchase one from a certificate authority.

For Let's Encrypt on Windows, use [win-acme](https://www.win-acme.com/):
```bash
wacs.exe --target manual --host simonprice-pt.co.uk --webroot C:/nginx/html
```

### 2. Update Certificate Paths

In `nginx.conf`, update these lines with your actual certificate locations:
```nginx
ssl_certificate      C:/nginx/ssl/simonprice-pt.co.uk/fullchain.crt;
ssl_certificate_key  C:/nginx/ssl/simonprice-pt.co.uk/private.key;
```

### 3. Backup Your Current Config

Before replacing, backup your existing configuration:
```cmd
copy C:\nginx\conf\nginx.conf C:\nginx\conf\nginx.conf.backup
```

### 4. Create Log Directory

```cmd
mkdir C:\nginx\logs
```

### 5. Configure Nginx

**Option A: Replace entire nginx.conf**
```cmd
copy nginx.conf C:\nginx\conf\nginx.conf
```

**Option B: Include as separate file (Recommended)**

Add this to your existing `C:\nginx\conf\nginx.conf` inside the `http` block:
```nginx
http {
    # ... your existing config ...
    
    # Include Simon Price PT configuration
    include C:/Sites/simonprice-pt/nginx.conf;
}
```

Then copy just the server blocks from the provided nginx.conf.

### 6. Test Configuration

```cmd
nginx -t
```

If you see "syntax is ok" and "test is successful", proceed to the next step.

### 7. Reload Nginx

**If Nginx is already running:**
```cmd
nginx -s reload
```

**If Nginx is not running:**
```cmd
nginx
```

**To stop Nginx:**
```cmd
nginx -s stop
```

## Configuration Features

### ✅ Security
- HTTPS enforcement (HTTP → HTTPS redirect)
- Modern TLS protocols (TLS 1.2 and 1.3)
- Security headers (HSTS, X-Frame-Options, etc.)
- Rate limiting on API endpoints
- Extra rate limiting on contact form (3 requests per minute)

### ✅ Performance
- Gzip compression
- Static file caching
- Efficient proxy buffering

### ✅ API Routing
- `/api/*` routes to Node.js backend (port 8001)
- `/api/contact` has additional rate limiting
- `/api/health` for monitoring

### ✅ Frontend Routing
- React frontend served from port 3000
- WebSocket support for development hot reload
- Static assets cached for 7 days
- HTML files not cached (for updates)

## DNS Configuration

Point your domain to your server's IP address:

```
A Record:
simonprice-pt.co.uk → YOUR_SERVER_IP

CNAME Record (optional):
www.simonprice-pt.co.uk → simonprice-pt.co.uk
```

## Troubleshooting

### Check Nginx Status
```cmd
tasklist /FI "IMAGENAME eq nginx.exe"
```

### Check Nginx Error Log
```cmd
type C:\nginx\logs\error.log
```

### Check Simon Price PT Error Log
```cmd
type C:\nginx\logs\simonprice-pt-error.log
```

### Test Backend API
```cmd
curl http://localhost:8001/api/health
```

### Test Frontend
```cmd
curl http://localhost:3000
```

### Common Issues

**1. Port Already in Use**
```
Error: bind() to 0.0.0.0:80 failed (10013: An attempt was made to access a socket in a way forbidden by its access permissions)
```
Solution: Stop IIS or other services using port 80/443

**2. Certificate Not Found**
```
Error: SSL: error:02001002:system library:fopen:No such file or directory
```
Solution: Verify SSL certificate paths in nginx.conf

**3. Backend Connection Refused**
```
Error: connect() failed (10061: No connection could be made because the target machine actively refused it)
```
Solution: Ensure backend is running on port 8001
```cmd
node C:\Sites\simonprice-pt\backend\server.js
```

**4. Frontend Connection Refused**
Solution: Ensure frontend is running on port 3000
```cmd
cd C:\Sites\simonprice-pt\frontend
npm start
```

## Production Deployment (Using Build Files)

For better performance in production, build the React app and serve static files:

1. Build the React app:
```cmd
cd C:\Sites\simonprice-pt\frontend
npm run build
```

2. Update nginx.conf to serve from build folder instead of proxying to port 3000:
```nginx
location / {
    root C:/Sites/simonprice-pt/frontend/build;
    try_files $uri $uri/ /index.html;
}
```

3. Reload nginx:
```cmd
nginx -s reload
```

## Service Management (Windows)

### Option 1: NSSM (Recommended for Windows Services)

Install services using NSSM:
```cmd
# Install Frontend Service
nssm install SimonPricePT-Frontend "C:\Program Files\nodejs\node.exe"
nssm set SimonPricePT-Frontend AppDirectory "C:\Sites\simonprice-pt\frontend"
nssm set SimonPricePT-Frontend AppParameters "node_modules\.bin\react-scripts start"
nssm start SimonPricePT-Frontend

# Install Backend Service
nssm install SimonPricePT-Backend "C:\Program Files\nodejs\node.exe"
nssm set SimonPricePT-Backend AppDirectory "C:\Sites\simonprice-pt\backend"
nssm set SimonPricePT-Backend AppParameters "server.js"
nssm start SimonPricePT-Backend
```

### Option 2: PM2
```cmd
pm2 start C:\Sites\simonprice-pt\backend\server.js --name simonprice-backend
pm2 startup
pm2 save
```

## Monitoring

Check access logs:
```cmd
type C:\nginx\logs\simonprice-pt-access.log
```

Monitor in real-time (using PowerShell):
```powershell
Get-Content C:\nginx\logs\simonprice-pt-access.log -Wait -Tail 50
```

## Support

For nginx documentation: https://nginx.org/en/docs/
For issues with this setup, refer to the backend logs and frontend console.
