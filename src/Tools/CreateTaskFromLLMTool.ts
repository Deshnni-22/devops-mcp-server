// Tools/CreateTaskFromLLMTool.ts
import { AzureDevOpsConfig } from '../Interfaces/AzureDevOps';
import { WorkItemService } from '../Services/WorkItemService';
import {
  formatMcpResponse,
  formatErrorResponse,
  McpResponse
} from '../Interfaces/Common';
import { CreateWorkItemParams } from '../Interfaces/WorkItems';

export class CreateTaskFromLLMTool {
  private workItemService: WorkItemService;

  constructor(config: AzureDevOpsConfig) {
    this.workItemService = new WorkItemService(config);
  }

  /** Create an Azure Boards Task from LLM output */
  public async createTask(params: {
    assignedTo: string;
    title: string;
    description: string;
  }): Promise<McpResponse> {
    try {
      const createParams: CreateWorkItemParams = {
        workItemType: 'Task',
        title: params.title,
        description: params.description,
        assignedTo: params.assignedTo
      };

      const workItem = await this.workItemService.createWorkItem(createParams);

      return formatMcpResponse(
        workItem,
        `✅ Task #${workItem.id} created for ${params.assignedTo}`
      );
    } catch (error) {
      console.error('Error in CreateTaskFromLLMTool:', error);
      return formatErrorResponse(error);
    }
  }
}
