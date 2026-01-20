# Instalación Whisper en Linux Ubuntu 22.04

## Requisitos Previos

```bash
# Sistema operativo
Ubuntu 22.04 LTS

# Hardware mínimo
- 4GB RAM (8GB recomendado)
- 20GB espacio en disco
- CPU: 2 cores (4 cores recomendado)
```

## Paso 1: Actualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

## Paso 2: Instalar Docker

```bash
# Instalar dependencias
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Agregar GPG key de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Agregar repositorio Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Actualizar e instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Verificar instalación
sudo docker --version
```

## Paso 3: Instalar Docker Compose

```bash
# Descargar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permisos de ejecución
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker-compose --version
```

## Paso 4: Configurar Usuario Docker (Opcional)

```bash
# Agregar usuario actual al grupo docker
sudo usermod -aG docker $USER

# Aplicar cambios (cerrar sesión y volver a iniciar)
newgrp docker

# Verificar sin sudo
docker ps
```

## Paso 5: Crear Directorio de Instalación

```bash
# Crear directorio /opt/whisper
sudo mkdir -p /opt/whisper

# Cambiar propietario
sudo chown -R $USER:$USER /opt/whisper

# Navegar al directorio
cd /opt/whisper
```

## Paso 6: Clonar o Copiar Proyecto

```bash
# Opción A: Si tienes git
git clone <repository-url> /opt/whisper

# Opción B: Copiar archivos manualmente
# Copiar todos los archivos del proyecto a /opt/whisper
```

## Paso 7: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example /opt/whisper/.env

# Editar archivo .env
nano /opt/whisper/.env
```

Configurar valores:
```env
# Whisper Service
MODEL_SIZE=tiny
NATS_URL=nats://nats:4222
GRPC_HOST=whisper_grpc
GRPC_PORT=50051

# MinIO Storage
MINIO_ENDPOINT=https://minio.darwinyusef.com
MINIO_CONSOLE=https://console.darwinyusef.com
MINIO_ACCESS_KEY=your_access_key
MINIO_SECRET_KEY=your_secret_key

# n8n
N8N_HOST=n8n.darwinyusef.com
WEBHOOK_URL=https://n8n.darwinyusef.com/
N8N_USER=admin
N8N_PASSWORD=change_this_password
```

## Paso 8: Crear Red Docker

```bash
docker network create whisper_network
```

## Paso 9: Iniciar Servicios

### Solo Whisper

```bash
cd /opt/whisper
docker-compose up -d
```

### Whisper + n8n

```bash
cd /opt/whisper
docker-compose up -d

cd n8n
docker-compose up -d
```

## Paso 10: Verificar Servicios

```bash
# Ver contenedores activos
docker ps

# Ver logs de Whisper
docker-compose logs -f

# Verificar salud de servicios
curl http://localhost:8001/health
curl http://localhost:8222/healthz
```

## Paso 11: Probar API

```bash
# Acceder a documentación
curl http://localhost:8001/docs

# O abrir en navegador
# http://SERVER_IP:8001/docs
```

## Paso 12: Configurar Firewall (Opcional)

```bash
# Permitir puertos necesarios
sudo ufw allow 8001/tcp   # API Gateway
sudo ufw allow 50051/tcp  # gRPC
sudo ufw allow 4222/tcp   # NATS
sudo ufw allow 8222/tcp   # NATS Monitoring

# Habilitar firewall
sudo ufw enable
```

## Paso 13: Configurar Inicio Automático

```bash
# Crear servicio systemd
sudo nano /etc/systemd/system/whisper.service
```

Contenido:
```ini
[Unit]
Description=Whisper Service
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/whisper
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=YOUR_USER

[Install]
WantedBy=multi-user.target
```

Habilitar servicio:
```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar inicio automático
sudo systemctl enable whisper.service

# Iniciar servicio
sudo systemctl start whisper.service

# Ver estado
sudo systemctl status whisper.service
```

## Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar servicios
docker-compose restart

# Detener servicios
docker-compose down

# Ver estado de servicios
docker-compose ps

# Limpiar todo (incluye volúmenes)
docker-compose down -v

# Actualizar servicios
cd /opt/whisper
git pull
docker-compose build
docker-compose up -d
```

## Pruebas de Funcionamiento

```bash
# Prueba básica con curl
curl -X POST http://localhost:8001/transcribe \
  -F "file=@/path/to/audio.mp3"

# Verificar NATS
curl http://localhost:8222

# Verificar gRPC (requiere grpcurl)
grpcurl -plaintext localhost:50051 list
```

## Troubleshooting

### Contenedores no inician

```bash
# Ver logs detallados
docker-compose logs whisper_grpc
docker-compose logs api_gateway
docker-compose logs nats

# Verificar red
docker network inspect whisper_network
```

### Puertos en uso

```bash
# Ver qué está usando el puerto
sudo netstat -tulpn | grep 8001

# Cambiar puerto en docker-compose.yml
ports:
  - "8002:8000"  # Usar 8002 en lugar de 8001
```

### Problemas de memoria

```bash
# Reducir modelo Whisper en .env
MODEL_SIZE=tiny  # Usar tiny en lugar de base/small

# Limitar memoria en docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

## Desinstalación

```bash
# Detener servicios
cd /opt/whisper
docker-compose down -v

cd n8n
docker-compose down -v

# Eliminar red
docker network rm whisper_network

# Eliminar archivos
sudo rm -rf /opt/whisper

# Desinstalar Docker (opcional)
sudo apt remove docker-ce docker-ce-cli containerd.io
sudo rm -rf /var/lib/docker
```

## Siguientes Pasos

1. Configurar reverse proxy (Nginx/Caddy) para HTTPS
2. Configurar MinIO para almacenamiento de audio
3. Integrar con n8n para workflows
4. Configurar backups automáticos
5. Monitoreo con Grafana/Prometheus

## Soporte

- Documentación: README.txt
- Arquitectura: ARCHITECTURE.txt
- Deployment: DEPLOYMENT.txt
- Issues: Reportar en repositorio
