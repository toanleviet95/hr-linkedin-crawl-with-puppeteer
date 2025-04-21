# Use an official Node.js image as the base
FROM node:20-slim

# Set working directory
WORKDIR /app

# Install dependencies for Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy package.json and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy your app files
COPY . .

# Tell Puppeteer where Chromium is
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

# Expose the port Express will listen on
EXPOSE 3000

# Run the app
CMD ["node", "app.js"]
