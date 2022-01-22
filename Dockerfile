FROM node:17
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install 
COPY . .
EXPOSE 8080
RUN chown -R node /usr/src/app
USER node
CMD ["npm","run","start:dev"]
