import { AzureDevOpsConfig } from '../Interfaces/AzureDevOps';
import { WorkItemService } from '../Services/WorkItemService';
import { formatMcpResponse, formatErrorResponse, McpResponse } from '../Interfaces/Common';
import {
  WorkItemByIdParams,
  SearchWorkItemsParams,
  RecentWorkItemsParams,
  MyWorkItemsParams,
  CreateWorkItemParams,
  UpdateWorkItemParams,
  AddWorkItemCommentParams,
  UpdateWorkItemStateParams,
  AssignWorkItemParams,
  CreateLinkParams,
  BulkWorkItemParams,
  UserEffortSummaryParams,
  ListAssignedTasksParams,
  GetAllWorkItemCommentsParams,
  ListBugsBySeverityAndPriorityParams,
  SuggestTaskDistributionParams,
  ListTasksWithoutEffortInActiveUserStoriesParams,
  GetCurrentDateTimeParams,
  CommentOnTasksWithoutDescriptionParams,
  ListStaleUnassignedOrActiveBugsParams,
  ListBugsWithoutTriagedTagParams,
  FlagReopenedCriticalBugsParams
} from '../Interfaces/WorkItems';
import getClassMethods from "../utils/getClassMethods";

export class WorkItemTools {
  private workItemService: WorkItemService;

  constructor(config: AzureDevOpsConfig) {
    this.workItemService = new WorkItemService(config);
  }

  /**
   * List work items based on a WIQL query
   */
  public async listWorkItems(params: { query: string }): Promise<McpResponse> {
    try {
      const response = await this.workItemService.listWorkItems(params.query);
      return formatMcpResponse(response, `Found ${response.workItems?.length || 0} work items.`);
    } catch (error) {
      console.error('Error in listWorkItems tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Get a work item by ID
   */
  public async getWorkItemById(params: WorkItemByIdParams): Promise<McpResponse> {
    try {
      const workItem = await this.workItemService.getWorkItemById(params);
      return formatMcpResponse(workItem, `Work item ${params.id} details`);
    } catch (error) {
      console.error('Error in getWorkItemById tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Search work items
   */
  public async searchWorkItems(params: SearchWorkItemsParams): Promise<McpResponse> {
    try {
      const results = await this.workItemService.searchWorkItems(params);
      return formatMcpResponse(results, `Found ${results.workItems?.length || 0} matching work items`);
    } catch (error) {
      console.error('Error in searchWorkItems tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Get recently updated work items
   */
  public async getRecentlyUpdatedWorkItems(params: RecentWorkItemsParams): Promise<McpResponse> {
    try {
      const results = await this.workItemService.getRecentWorkItems(params);
      return formatMcpResponse(results, `Found ${results.workItems?.length || 0} recently updated work items`);
    } catch (error) {
      console.error('Error in getRecentlyUpdatedWorkItems tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Get work items assigned to current user
   */
  public async getMyWorkItems(params: MyWorkItemsParams): Promise<McpResponse> {
    try {
      const results = await this.workItemService.getMyWorkItems(params);
      return formatMcpResponse(results, `Found ${results.workItems?.length || 0} work items assigned to you`);
    } catch (error) {
      console.error('Error in getMyWorkItems tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Create a work item
   */
  public async createWorkItem(params: CreateWorkItemParams): Promise<McpResponse> {
    try {
      const workItem = await this.workItemService.createWorkItem(params);
      console.log("params"+params.title);
      console.log('-----------------------------------------------------------------------------------');
      console.log("workItem"+workItem);
      return formatMcpResponse(workItem, `Created work item: ${workItem.id}`);
    } catch (error) {
      console.error('Error in createWorkItem tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Update a work item
   */
  public async updateWorkItem(params: UpdateWorkItemParams): Promise<McpResponse> {
    try {
      console.log("tool called");
      const workItem = await this.workItemService.updateWorkItem(params);
      return formatMcpResponse(workItem, `Updated work item: ${params.id}`);
    } catch (error) {
      console.error('Error in updateWorkItem tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Add a comment to a work item
   */
  public async addWorkItemComment(params: AddWorkItemCommentParams): Promise<McpResponse> {
    try {
      const comment = await this.workItemService.addWorkItemComment(params);
      return formatMcpResponse(comment, `Comment added to work item: ${params.id}`);
    } catch (error) {
      console.error('Error in addWorkItemComment tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Update work item state
   */
  public async updateWorkItemState(params: UpdateWorkItemStateParams): Promise<McpResponse> {
    try {
      const workItem = await this.workItemService.updateWorkItemState(params);
      return formatMcpResponse(workItem, `Updated state of work item ${params.id} to "${params.state}"`);
    } catch (error) {
      console.error('Error in updateWorkItemState tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Assign work item to a user
   */
  public async assignWorkItem(params: AssignWorkItemParams): Promise<McpResponse> {
    try {
      const workItem = await this.workItemService.assignWorkItem(params);
      return formatMcpResponse(workItem, `Assigned work item ${params.id} to ${params.assignedTo}`);
    } catch (error) {
      console.error('Error in assignWorkItem tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Create a link between work items
   */
  public async createLink(params: CreateLinkParams): Promise<McpResponse> {
    try {
      const workItem = await this.workItemService.createLink(params);
      return formatMcpResponse(workItem, `Created ${params.linkType} link from work item ${params.sourceId} to ${params.targetId}`);
    } catch (error) {
      console.error('Error in createLink tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Bulk create or update work items
   */
  public async bulkCreateWorkItems(params: BulkWorkItemParams): Promise<McpResponse> {
    try {
      const results = await this.workItemService.bulkUpdateWorkItems(params);
      return formatMcpResponse(results, `Processed ${results.count} work items`);
    } catch (error) {
      console.error('Error in bulkCreateWorkItems tool:', error);
      return formatErrorResponse(error);
    }
  }
  /**
   * Get user effort summary
   */
  public async getUserEffortSummary(params: UserEffortSummaryParams): Promise<McpResponse> {
    try {
      const results = await this.workItemService.getUserEffortSummary(params);
      return formatMcpResponse(results, `Total effort for ${params.assignedTo} is ${results.totalEffort} hours`);
    } catch (error) {
      console.error('Error in getUserEffortSummary tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * List assigned tasks
   */
  public async listAssignedTasks(): Promise<McpResponse> {
    try {
      const results = await this.workItemService.listAssignedTasks();
      return formatMcpResponse(results, "Listed assigned tasks with details like title, state, type, assigned user, and effort");
    } catch (error) {
      console.error('Error in listAssignedTasks tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Get all comments for a work item
   */
  public async getAllWorkItemComments(params: GetAllWorkItemCommentsParams): Promise<McpResponse> {
    try {
      const results = await this.workItemService.getAllWorkItemComments(params);
      return formatMcpResponse(results, "Retrieved all comments from all work items");
    } catch (error) {
      console.error('Error in getAllWorkItemComments tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * List bugs by severity and priority
   */
  public async listBugsBySeverityAndPriority(params: ListBugsBySeverityAndPriorityParams): Promise<McpResponse> {
    try {
      const results = await this.workItemService.listBugsBySeverityAndPriority(params);
      return formatMcpResponse(
        results,
        `Listed bugs${params.severity ? ` with severity '${params.severity}'` : ''}${params.priority ? ` and priority '${params.priority}'` : ''}`
      );
    } catch (error) {
      console.error('Error in listBugsBySeverityAndPriority tool:', error);
      return formatErrorResponse(error);
    }
  }
  /**
   * Suggest task distribution based on user 
   */
  public async suggestTaskDistribution(params: SuggestTaskDistributionParams): Promise<McpResponse> {
    try {
      const results = await this.workItemService.suggestTaskDistribution(params);
      return formatMcpResponse(
        results,
        `Suggested distribution for ${results.suggestions?.length || 0} unassigned task(s)`
      );
    } catch (error) {
      console.error('Error in suggestTaskDistribution tool:', error);
      return formatErrorResponse(error);
    }
  }
  /**
   * List tasks without effort in active user stories
   */
  public async listTasksWithoutEffortInActiveUserStories(params: ListTasksWithoutEffortInActiveUserStoriesParams): Promise<McpResponse> {
    try {
      const results = await this.workItemService.listTasksWithoutEffortInActiveUserStories(params);
      return formatMcpResponse(
        results,
        `Found ${results.length} tasks without effort in active user stories.Comments added where needed.`
      );
    } catch (error) {
      console.error('Error in listTasksWithoutEffortInActiveUserStories tool:', error);
      return formatErrorResponse(error);
    }
  }
  /**
   * Get current date and time
   */
  public async getCurrentDateTime(): Promise<McpResponse> {
    try {
      const result = await this.workItemService.getCurrentDateTime();
      return formatMcpResponse(result, `Current server time: ${result.locale}`);
    } catch (error) {
      console.error('Error in getCurrentDateTime tool:', error);
      return formatErrorResponse(error);
    }
  }
  /**
   * Comment on tasks without description
   */
  public async commentOnTasksWithoutDescription(): Promise<McpResponse> {
    try {
      const result = await this.workItemService.commentOnTasksWithoutDescription();
      return formatMcpResponse(result, "Added comments to tasks without description.");
    } catch (error) {
      return formatErrorResponse(error);
    }
  }
  /**
   * List stale unassigned or active bugs
   */
  public async listStaleUnassignedOrActiveBugs(params: ListStaleUnassignedOrActiveBugsParams): Promise<McpResponse> {
    try {
      const results = await this.workItemService.listStaleUnassignedOrActiveBugs(params);
      return formatMcpResponse(results, "Listed stale bugs and added comments.");
    } catch (error) {
      console.error("Error in listStaleUnassignedOrActiveBugs:", error);
      return formatErrorResponse(error);
    }
  }
  /**
   * List bugs without triaged tag
   */
  public async listBugsWithoutTriagedTag(params: ListBugsWithoutTriagedTagParams): Promise<McpResponse> {
    try {
      const results = await this.workItemService.listBugsWithoutTriagedTag(params);
      return formatMcpResponse(results, "Listed bugs missing the 'triaged' tag and added comments.");
    } catch (error) {
      console.error("Error in listBugsWithoutTriagedTag:", error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Flag reopened critical bugs
   */
  public async flagReopenedCriticalBugs(params: FlagReopenedCriticalBugsParams): Promise<McpResponse> {
    try {
      const result = await this.workItemService.flagReopenedCriticalBugs(params);
      return formatMcpResponse(result, "Flagged reopened bugs and tagged them as 'Critical'");
    } catch (error) {
      console.error("Error in flagReopenedCriticalBugs:", error);
      return formatErrorResponse(error);
    }
  }

}

export const WorkItemToolMethods = getClassMethods(WorkItemTools.prototype);