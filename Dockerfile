FROM node:14

WORKDIR /
COPY package.json .
RUN npm install --only=production

COPY . ./

ARG MYSQL_HOST
ARG MYSQL_USER
ARG MYSQL_PASS
ARG MYSQL_DATABASE
ARG PORT
ARG SOCKET_PORT
ARG SECRET
ENV MYSQL_HOST=$MYSQL_HOST \
    MYSQL_USER=$MYSQL_USER \
    MYSQL_PASS=$MYSQL_PASS \
    MYSQL_DATABASE=$MYSQL_DATABASE \
    PORT=$PORT \
    SOCKET_PORT=$SOCKET_PORT \
    SECRET=$SECRET

EXPOSE 8080 3001

CMD [ "npm", "start" ]