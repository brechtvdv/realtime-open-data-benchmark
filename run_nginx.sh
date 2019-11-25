#!/bin/sh

mkdir /data
mkdir /data/nginx
mkdir /data/nginx/cache
mkdir /data/nginx/log

echo '
proxy_cache_path /data/nginx/cache levels=1:2 keys_zone=my_cache:10m max_size=100m inactive=600s use_temp_path=off;

server {
    listen 80;

          add_header Cache-Control "";

      proxy_cache_lock on;
      proxy_cache_valid 200 1s;
      proxy_cache_use_stale updating;

      proxy_cache my_cache;

    location / {
    	proxy_http_version 1.1; # Always upgrade to HTTP/1.1 
      proxy_set_header Connection ""; # Enable keepalives
      proxy_set_header Accept-Encoding ""; # Optimize encoding
      proxy_set_header Host $host;
      proxy_hide_header Cache-Control;
      add_header X-Cache-Status $upstream_cache_status;
      
      proxy_pass http://SERVER_SERVICE_HOST:1111/;
     }
}' > /etc/nginx/conf.d/default.conf

echo '
user www-data;
worker_processes 8; # Change this according to the amount of CPU cores
pid /run/nginx.pid;

events {
  worker_connections 10000;
}

http {
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;

  # For large headers (due to Memento)
  proxy_buffer_size   128k;
  proxy_buffers   4 256k;

  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  # Logging Settings
  log_format fragments '$remote_addr - $remote_user [$time_local] '
                       '"$request" $status $body_bytes_sent '
                       '"$http_referer" "$http_user_agent" "$http_accept" $upstream_cache_status';
  access_log /data/nginx/log/access.log fragments buffer=4k;
  error_log  /data/nginx/log/error.log;

  # Gzip Settings
  gzip on;
  gzip_disable "msie6";

  gzip_vary on;
  gzip_proxied any;
  gzip_comp_level 6;
  gzip_buffers 16 8k;
  gzip_http_version 1.1;
  gzip_types text/plain text/css application/json application/x-javascript text/xml application/xml application/xml+rss text/javascript
             application/javascript application/ld+json text/turtle image/svg+xml application/trig application/n-triples application/n-quads;

  include /etc/nginx/conf.d/*.conf;
  include /etc/nginx/sites-enabled/*;
}' > /etc/nginx/nginx.conf

KUBE_MASTER_IP=$(kubectl cluster-info | head -n 1 | egrep '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' -o --color=never)

if [ "$KUBE_MASTER_IP" == "" ]; then
	sed --in-place "s/SERVER_SERVICE_HOST/localhost/g" /etc/nginx/conf.d/default.conf
	sed --in-place "s/1111/4443/g" /etc/nginx/conf.d/default.conf
else
sed --in-place "s/SERVER_SERVICE_HOST/${SERVER_SERVICE_HOST}/g" /etc/nginx/conf.d/default.conf
sed --in-place "s/1111/${SERVER_SERVICE_PORT}/g" /etc/nginx/conf.d/default.conf
fi

service nginx reload
