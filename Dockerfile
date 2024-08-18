# Use the official Node.js image as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies
RUN npm install --production

# Copy the rest of your application code
COPY . .

RUN mv .env.example .env

# Expose the port on which your application will run
EXPOSE 3000

# Define the command to run your application
CMD ["node", "server.js"]
