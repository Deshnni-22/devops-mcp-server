#!/bin/bash

echo 'Building Docker Image & Creating Container'

# Login to Azure first (required before ACR login)
az login --tenant ${TENANT_ID}
az account set --subscription ${SUBSCRIPTION_ID}

# Login to Azure Container Registry
az acr login --name $AZURE_CONTAINER_REGISTRY_NAME --username $USERNAME --password $PASSWORD
 
# Build Docker image with build arguments
docker build \
  --build-arg AZURE_DEVOPS_ORG_URL=$AZURE_DEVOPS_ORG_URL \
  --build-arg AZURE_DEVOPS_PROJECT=$AZURE_DEVOPS_PROJECT \
  --build-arg AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN=$AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN \
  --build-arg AZURE_CONTAINER_REGISTRY_NAME=$AZURE_CONTAINER_REGISTRY_NAME \
  --build-arg USERNAME=$USERNAME \
  --build-arg PASSWORD=$PASSWORD \
  -t $IMAGE_NAME:latest .
 
echo "Docker image built"
 
# Show built images
docker images

# Tag image for Azure Container Registry
docker tag $IMAGE_NAME:latest ${AZURE_CONTAINER_REGISTRY_NAME}.azurecr.io/${IMAGE_NAME}:latest

# Push image to Azure Container Registry
docker push ${AZURE_CONTAINER_REGISTRY_NAME}.azurecr.io/${IMAGE_NAME}:latest
 
# Optional: Tag and push with build number
# docker tag $IMAGE_NAME:latest ${AZURE_CONTAINER_REGISTRY_NAME}.azurecr.io/${IMAGE_NAME}:$(Build.BuildNumber)
# docker push ${AZURE_CONTAINER_REGISTRY_NAME}.azurecr.io/${IMAGE_NAME}:$(Build.BuildNumber)
 
# Clean up local image
docker rmi -f ${IMAGE_NAME}:latest