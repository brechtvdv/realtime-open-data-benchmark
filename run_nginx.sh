#!/bin/sh

mkdir /data
mkdir /data/nginx
mkdir /data/nginx/cache

echo '
proxy_cache_path /data/nginx/cachelevels=1:2 keys_zone=STATIC:10m inactive=24h  max_size=1g;

# events { worker_connections 1024; }

server {
    listen 80;
    location / {
        proxy_pass http://SERVER_SERVICE_HOST:1111/;
        proxy_set_header Host $host;
        add_header X-Cache-Status $upstream_cache_status;
        # proxy_redirect off;                
        # proxy_buffering        on;
        # proxy_cache            STATIC;
        # proxy_cache_valid      200  1d;
        # proxy_cache_use_stale  error timeout invalid_header updating http_500 http_502 http_503 http_504;
     }
}' > /etc/nginx/conf.d/default.conf

sed --in-place "s/SERVER_SERVICE_HOST/${SERVER_SERVICE_HOST}/g" /etc/nginx/conf.d/default.conf
sed --in-place "s/1111/${SERVER_SERVICE_PORT}/g" /etc/nginx/conf.d/default.conf

service nginx reload
