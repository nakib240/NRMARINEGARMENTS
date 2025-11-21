# NRMARINEGARMENTS — Local dev

This repository contains a small static frontend and a minimal Node/Express upload server used for development.

Quick start (Windows PowerShell):

1. Install server dependencies

```powershell
cd 'C:\Users\acer\Desktop\NRMARINEGARMENTS\server'
npm install
```

2. Start the server with an admin key for protected operations (only for development):

```powershell
$env:ADMIN_KEY = '12345'
cd 'C:\Users\acer\Desktop\NRMARINEGARMENTS\server'
node server.js
```

3. Serve frontend and open in browser:

```powershell
cd 'C:\Users\acer\Desktop\NRMARINEGARMENTS'
npx http-server -p 8080 -c-1 .
# open http://localhost:8080
```

Notes
- Admin-protected endpoints require the `x-api-key` header to match the server's `ADMIN_KEY` environment variable.
- For production use deploy the server to a hosting provider (Render, Railway, Heroku) and set `ADMIN_KEY` there. Do not use the debug routes in production.
