FROM node:12.18.1

WORKDIR /SADLAB

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

WORKDIR /SADLAB/workers

# run the application
CMD ["node" , "worker.js"]
