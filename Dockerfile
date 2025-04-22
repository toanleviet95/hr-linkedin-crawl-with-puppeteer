FROM ghcr.io/puppeteer/puppeteer:24.6.1

# Install Google Chrome
RUN apt-get update && apt-get install -y google-chrome-stable

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "node", "app.js" ]
