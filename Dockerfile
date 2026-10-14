FROM node:24-alpine

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# two-step copying, so we get better caching
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install

# Copying source files
COPY . /app/

# Building app
RUN npm run build
EXPOSE 3000

# Running the app
ENTRYPOINT ["node", "build"]
