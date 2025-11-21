@echo off
REM Start or resurrect pm2-managed NRM upload server
cd /d "%~dp0"
SET "ADMIN_KEY=12345"
SET PM2CMD="%USERPROFILE%\AppData\Roaming\npm\pm2.cmd"
IF EXIST %PM2CMD% (
  %PM2CMD% resurrect || %PM2CMD% start "%~dp0server\ecosystem.config.js" --env development --update-env
) ELSE (
  echo pm2 not found at %PM2CMD%. Please install pm2 globally or update this script.
)
exit /b 0
