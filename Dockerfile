FROM node:20

RUN apt-get update && apt-get install -y \
    chromium \
    libglib2.0-0 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcb1 \
    libxext6 \
    libxi6 \
    libxfixes3 \
    libdrm2 \
    libxrender1 \
    wget

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

CMD ["npm","start"]