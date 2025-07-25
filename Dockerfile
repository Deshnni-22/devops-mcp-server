FROM node:lts-alpine

# Set working directory
WORKDIR /app

# Declare build arguments
ARG AZURE_DEVOPS_ORG_URL
ARG AZURE_DEVOPS_PROJECT
ARG AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN

# Set as environment variables (optional if needed at runtime)
ENV AZURE_DEVOPS_ORG_URL=$AZURE_DEVOPS_ORG_URL
ENV AZURE_DEVOPS_PROJECT=$AZURE_DEVOPS_PROJECT
ENV AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN=$AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN

# Set default port (Azure App Service will override this with PORT env var)
ENV PORT=3000

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --ignore-scripts

# Copy all source files
COPY . .

# Build the project
RUN npm run build

# Expose default port
EXPOSE 3000

# Start the server
CMD [ "npm", "run", "start" ]
