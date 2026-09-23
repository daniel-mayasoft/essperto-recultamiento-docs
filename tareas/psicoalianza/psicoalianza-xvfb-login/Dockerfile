FROM node:22-trixie-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium xvfb fonts-liberation \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY login.mjs ./

CMD ["node", "login.mjs"]
