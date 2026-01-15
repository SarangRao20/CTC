@echo off
echo Starting CareConnect App...

:: Start Backend
echo Starting Backend (Flask)...
start "CareConnect Backend" cmd /k "pip install -r requirements.txt && python app.py"

:: Start Frontend
echo Starting Frontend (Vite)...
start "CareConnect Frontend" cmd /k "npm install && npm run dev"

echo Done! Two terminal windows should have opened.
