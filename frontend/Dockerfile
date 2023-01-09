FROM alpine

RUN apk update && apk add nodejs

COPY . /frontend

WORKDIR /frontend

# run the application
CMD ["node","app.js"]
