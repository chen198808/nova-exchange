FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY server/package*.json ./server/

RUN npm install
RUN cd server && npm install

COPY . .

RUN npm run build
RUN cd server && npm run build

RUN cp -r dist server/dist/dist

RUN mkdir -p data

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
