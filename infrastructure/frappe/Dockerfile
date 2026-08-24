# Image de développement pour l'app Frappe platform_core.
FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1

# Installer les dépendances de base (incluant cron)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl wget build-essential \
    default-mysql-client \
    redis-tools \
    libmariadb-dev pkg-config \
    xvfb libfontconfig1 fonts-cantarell \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Installation de Node.js 20 et npm/yarn
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g yarn \
    && rm -rf /var/lib/apt/lists/*

# Créer l'utilisateur
RUN useradd -ms /bin/bash frappe

# Installer frappe-bench
RUN pip install --no-cache-dir frappe-bench

USER frappe
WORKDIR /home/frappe

# Initialiser le bench avec version-15 (compatible Python 3.12)
RUN bench init --skip-redis-config-generation --frappe-branch version-15 frappe-bench

WORKDIR /home/frappe/frappe-bench

USER root
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
USER frappe

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["bench", "start"]
