FROM node:16
#RUN apk add --no-cache libc6-compat

WORKDIR ./usr/src/

COPY ./package.json package-lock.json ./
RUN npm install
COPY ./ .

CMD ["npm", "run", "start"]
