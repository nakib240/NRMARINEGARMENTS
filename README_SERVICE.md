Permanent service setup (Windows)
================================

This repository contains helper scripts to register the backend and a simple frontend server as Windows services so they keep running after you close VS Code or log out.

Options provided:
- `service-install-node-windows.js` — uses the `node-windows` npm package to register two services (`NRM-Backend` and `NRM-Frontend`). Run as Administrator.
- `nssm_install.ps1` — PowerShell helper that calls `nssm.exe` (you must download NSSM separately) to install services non-interactively.

Recommended (easiest & reliable): NSSM
------------------------------------
1. Download NSSM: https://nssm.cc/download and unzip.
2. Open PowerShell as Administrator.
3. Run the helper with the path to `nssm.exe`:

```powershell
.\nssm_install.ps1 -NssmPath 'C:\path\to\nssm.exe' -ProjectRoot 'C:\Users\acer\Desktop\NRMARINEGARMENTS' -AdminKey 'YOUR_ADMIN_KEY'
```

This installs two services that start at boot and will keep Node running.

Alternative: node-windows (npm)
--------------------------------
1. Open PowerShell as Administrator.
2. From the project root run:

```powershell
npm install node-windows --save
# Optionally set ADMIN_KEY for this run
#$env:ADMIN_KEY='12345'
node service-install-node-windows.js
```

Notes and security
- Running as a service means the server is reachable as long as the machine is on. Keep your `ADMIN_KEY` secret and change it from `12345`.
- Use HTTPS/ngrok when exposing publicly.
- If service install fails due to permissions, make sure you're running the shell as Administrator.

If you'd like, I can attempt to run the `npm install` and `node service-install-node-windows.js` steps now — but installing services often requires Administrator privileges, so you may need to confirm or run them in an elevated shell.
