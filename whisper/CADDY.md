# Configuración Caddy para Whisper (Proyecto Externo)

Este archivo contiene la configuración de Caddy para usar como reverse proxy con el proyecto Whisper desde un proyecto separado.

## Prerequisitos

- Caddy instalado en el servidor o en contenedor Docker
- Dominios configurados:
  - `whisper.darwinyusef.com` → Whisper API
  - `n8n.darwinyusef.com` → n8n
  - `minio.darwinyusef.com` → MinIO API
  - `console.darwinyusef.com` → MinIO Console

## Opción 1: Caddyfile (Configuración Simple)

Crear archivo `Caddyfile`:

```caddy
# Whisper API
whisper.darwinyusef.com {
    reverse_proxy localhost:8001

    encode gzip

    # Timeouts para archivos grandes
    timeouts {
        read_body 10m
        write 10m
    }

    # Límite de tamaño de body
    request_body {
        max_size 100MB
    }

    # Logs
    log {
        output file /var/log/caddy/whisper.log
        format json
    }
}

# n8n Workflow
n8n.darwinyusef.com {
    reverse_proxy localhost:5678

    encode gzip

    # Headers para n8n
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
    }

    log {
        output file /var/log/caddy/n8n.log
        format json
    }
}

# MinIO API
minio.darwinyusef.com {
    reverse_proxy localhost:9000

    encode gzip

    # Headers para CORS
    header {
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, PUT, POST, DELETE, HEAD"
        Access-Control-Allow-Headers "*"
    }

    log {
        output file /var/log/caddy/minio-api.log
        format json
    }
}

# MinIO Console
console.darwinyusef.com {
    reverse_proxy localhost:9001

    encode gzip

    log {
        output file /var/log/caddy/minio-console.log
        format json
    }
}
```

## Opción 2: Docker Compose para Caddy

Crear `docker-compose.caddy.yml`:

```yaml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    container_name: caddy_proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
      - /var/log/caddy:/var/log/caddy
    networks:
      - whisper_network
      - caddy_public
    environment:
      - ACME_AGREE=true

volumes:
  caddy_data:
  caddy_config:

networks:
  whisper_network:
    external: true
  caddy_public:
    driver: bridge
```

Iniciar Caddy:
```bash
docker-compose -f docker-compose.caddy.yml up -d
```

## Opción 3: Caddyfile con Autenticación

Para agregar autenticación básica a Whisper:

```caddy
whisper.darwinyusef.com {
    # Autenticación básica
    basicauth {
        admin $2a$14$hash_de_contraseña
    }

    reverse_proxy localhost:8001

    encode gzip
}
```

Generar hash de contraseña:
```bash
caddy hash-password --plaintext "tu_contraseña"
```

## Opción 4: Caddyfile con Rate Limiting

```caddy
whisper.darwinyusef.com {
    # Rate limiting (requiere plugin)
    rate_limit {
        zone whisper {
            key {remote_host}
            events 100
            window 1m
        }
    }

    reverse_proxy localhost:8001

    encode gzip
}
```

## Opción 5: Configuración Completa (Recomendada)

```caddy
# Configuración global
{
    email admin@darwinyusef.com
    admin off
}

# Whisper API
whisper.darwinyusef.com {
    reverse_proxy localhost:8001 {
        # Health check
        health_uri /health
        health_interval 30s
        health_timeout 5s

        # Headers
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    encode gzip zstd

    # Límites
    request_body {
        max_size 100MB
    }

    # Timeouts
    timeouts {
        read_body 10m
        write 10m
        idle 5m
    }

    # CORS para API
    @options {
        method OPTIONS
    }

    handle @options {
        header Access-Control-Allow-Origin "*"
        header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        header Access-Control-Allow-Headers "Content-Type, Authorization"
        respond 204
    }

    # Logs estructurados
    log {
        output file /var/log/caddy/whisper.log {
            roll_size 100mb
            roll_keep 5
            roll_keep_for 720h
        }
        format json
        level INFO
    }

    # Métricas Prometheus
    metrics /metrics
}

# n8n
n8n.darwinyusef.com {
    reverse_proxy localhost:5678 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    encode gzip

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Strict-Transport-Security "max-age=31536000"
    }

    log {
        output file /var/log/caddy/n8n.log
        format json
    }
}

# MinIO API
minio.darwinyusef.com {
    reverse_proxy localhost:9000 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    encode gzip

    # CORS
    header {
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, PUT, POST, DELETE, HEAD"
        Access-Control-Allow-Headers "*"
        Access-Control-Expose-Headers "ETag, Content-Length, Content-Range"
    }

    log {
        output file /var/log/caddy/minio-api.log
        format json
    }
}

# MinIO Console
console.darwinyusef.com {
    reverse_proxy localhost:9001 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    encode gzip

    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
    }

    log {
        output file /var/log/caddy/minio-console.log
        format json
    }
}
```

## Instalación de Caddy en Ubuntu 22.04

```bash
# Instalar Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# Verificar instalación
caddy version
```

## Configurar Caddy como Servicio

```bash
# Copiar Caddyfile
sudo cp Caddyfile /etc/caddy/Caddyfile

# Validar configuración
caddy validate --config /etc/caddy/Caddyfile

# Recargar Caddy
sudo systemctl reload caddy

# Ver estado
sudo systemctl status caddy

# Ver logs
sudo journalctl -u caddy -f
```

## Estructura de Proyecto Recomendada

```
/opt/caddy/
├── Caddyfile
├── docker-compose.yml (opcional)
└── logs/
    ├── whisper.log
    ├── n8n.log
    ├── minio-api.log
    └── minio-console.log
```

## Verificar Configuración

```bash
# Test local
curl -I http://localhost:8001/health

# Test con dominio
curl -I https://whisper.darwinyusef.com/health

# Ver certificados SSL
curl -vI https://whisper.darwinyusef.com 2>&1 | grep -i ssl
```

## Troubleshooting

### Certificados SSL no se generan

```bash
# Verificar DNS
dig whisper.darwinyusef.com
nslookup whisper.darwinyusef.com

# Verificar puertos 80 y 443
sudo netstat -tulpn | grep -E ':(80|443)'

# Ver logs de Caddy
sudo journalctl -u caddy -f
```

### Error de conexión al backend

```bash
# Verificar que Whisper esté corriendo
curl http://localhost:8001/health

# Ver logs de Caddy
tail -f /var/log/caddy/whisper.log
```

## Integración con Firewall

```bash
# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Bloquear acceso directo a puertos internos (opcional)
sudo ufw deny 8001/tcp
sudo ufw deny 5678/tcp
sudo ufw deny 9000/tcp
sudo ufw deny 9001/tcp

# Aplicar reglas
sudo ufw reload
```

## Backup de Certificados

```bash
# Backup de data de Caddy
sudo tar -czf caddy-backup-$(date +%Y%m%d).tar.gz /var/lib/caddy

# Restaurar
sudo tar -xzf caddy-backup-YYYYMMDD.tar.gz -C /
```

## Monitoreo

```bash
# Habilitar métricas Prometheus en Caddyfile
{
    servers {
        metrics
    }
}

# Acceder a métricas
curl http://localhost:2019/metrics
```

## Actualizar Caddy

```bash
sudo apt update
sudo apt upgrade caddy
sudo systemctl restart caddy
```

## Referencias

- Documentación oficial: https://caddyserver.com/docs/
- Ejemplos: https://caddyserver.com/docs/caddyfile/patterns
- Comunidad: https://caddy.community/
