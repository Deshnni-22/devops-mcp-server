// config/azure.ts
import { config } from 'dotenv';
import { AzureDevOpsConfig } from '../Interfaces/AzureDevOps';

config(); // Load .env values

export const azureDevOpsConfig: AzureDevOpsConfig = {
  orgUrl: process.env.AZURE_DEVOPS_ORG_URL || '',
  project: process.env.AZURE_DEVOPS_PROJECT || '',
  personalAccessToken: process.env.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN || '',
//   baseUrl: process.env.AZURE_BASE_URL || 'https://dev.azure.com',
};
