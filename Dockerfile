# Use the Node.js 18 base image
FROM node:18

# Create a working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the application code to the container
COPY . .

# Expose the port used by the API
EXPOSE 5000

# Start the API
CMD [ "npm", "start" ]