FROM node:16.13-alpine3.13 
# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json /app/

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
# Get all the code needed to run the app
COPY . .
# Build app
RUN npm run build  
#
# Expose the port the app runs in
EXPOSE 5000
# Serve the app
CMD [ "node", "index.js" ]
