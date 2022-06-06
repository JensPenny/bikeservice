# LTS version of node
FROM node:16

# Create the location where we will store the DB - not needed atm since we store the db in src
# RUN mkdir /opt/bikeservice/

# Create the location where we will install the service
WORKDIR /usr/bikeservice/src

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "node", "src" ]