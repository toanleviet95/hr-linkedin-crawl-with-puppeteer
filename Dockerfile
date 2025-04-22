FROM --platform=linux/amd64 ghcr.io/puppeteer/puppeteer:24.6.1

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    DEBIAN_FRONTEND=noninteractive

# Switch to root to install system packages
USER root

RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    curl \
  && curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-linux-keyring.gpg \
  && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
     > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update && apt-get install -y google-chrome-stable \
  && rm -rf /var/lib/apt/lists/*

# Switch back to the default non-root user (usually `pptruser`)
USER pptruser

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

CMD [ "node", "app.js" ]
