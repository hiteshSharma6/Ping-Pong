FROM node:12-buster

# RUN apt-get update -y

WORKDIR /home/ping_pong
COPY . .

EXPOSE 8000

CMD ["node", "index.js"]