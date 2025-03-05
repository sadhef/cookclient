FROM node:14

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including SASS
RUN npm install --legacy-peer-deps && \
    npm install -g sass && \
    npm install @babel/plugin-proposal-private-property-in-object --save-dev

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]