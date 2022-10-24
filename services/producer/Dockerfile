FROM node:10-alpine
WORKDIR /home/node
USER node
COPY package*.json ./
RUN npm install
COPY --chown=node:node . .
CMD ["node", "src/producer.js"]
