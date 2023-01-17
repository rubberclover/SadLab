FROM alpine

RUN apk update && apk add nodejs

RUN apk update && apk add git

RUN apk update && apk add python3

COPY . /workers

WORKDIR /workers

# run the application
CMD ["node" , "worker.js"]
