@echo off
chcp 65001 >nul
title Iniciando demo
cd /d "%~dp0"

if not exist ".env" (
  if exist ".env.example" (
    copy ".env.example" ".env" >nul
    echo Se creo .env a partir de .env.example
  )
)

docker info >nul 2>&1
if errorlevel 1 (
  echo Docker apagado. Encendiendo Docker Desktop...
  if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  ) else (
    echo No se encontro Docker Desktop. Instalalo desde https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
  )
  :esperaDocker
  timeout /t 5 /nobreak >nul
  docker info >nul 2>&1
  if errorlevel 1 goto esperaDocker
)

echo Docker listo. Levantando contenedores (la primera vez tarda varios minutos)...
docker compose up -d --build
if errorlevel 1 (
  echo Fallo docker compose. Revisa el mensaje de arriba.
  pause
  exit /b 1
)

echo Esperando a que la app responda...
:esperaApp
timeout /t 3 /nobreak >nul
powershell -NoProfile -Command "try{(Invoke-WebRequest http://localhost:5173 -UseBasicParsing -TimeoutSec 3).StatusCode}catch{exit 1}" >nul 2>&1
if errorlevel 1 goto esperaApp
start "" http://localhost:5173
exit /b 0
