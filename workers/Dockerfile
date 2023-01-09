FROM alpine

RUN apk update && apk add nodejs

COPY . /workers

WORKDIR /workers

# run the application
CMD ["node" , "worker.js"]
