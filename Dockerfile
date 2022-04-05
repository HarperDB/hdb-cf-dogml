FROM node:16-bullseye

RUN mkdir /app
RUN chown 1000.1000 /app
WORKDIR /app

USER 1000

# COPY package*.json ./
# RUN npm ci
