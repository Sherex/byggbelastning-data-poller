FROM node:12-slim

WORKDIR /usr/src/app

COPY ./package*.json ./

RUN npm ci

COPY src/ ./src/

CMD ["npm", "start"]