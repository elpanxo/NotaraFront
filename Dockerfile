# ./frontend/Dockerfile

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# NEXT_PUBLIC_API_URL debe estar disponible DURANTE el build,
# porque Next.js "quema" las variables NEXT_PUBLIC_* dentro del
# JavaScript compilado en este paso (npm run build), no en runtime.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]