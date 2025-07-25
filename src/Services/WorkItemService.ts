import * as azdev from 'azure-devops-node-api';
import { WorkItemTrackingApi } from 'azure-devops-node-api/WorkItemTrackingApi';
import { Readable } from 'stream';
import { Buffer } from "buffer";
import {
  JsonPatchOperation,
  Operation
} from 'azure-devops-node-api/interfaces/common/VSSInterfaces';
import { AzureDevOpsConfig } from '../Interfaces/AzureDevOps';
import { AzureDevOpsService } from './AzureDevOpsService';
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
import { WorkItemExpand, WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";

export class WorkItemService extends AzureDevOpsService {
  constructor(config: AzureDevOpsConfig) {
    super(config);
  }

  /**
   * Query work items using WIQL
   */
  public async listWorkItems(wiqlQuery: string): Promise<any> {
    try {
      const witApi = await this.getWorkItemTrackingApi();

      // Step 1: Run WIQL query
      const queryResult = await witApi.queryByWiql(
        { query: wiqlQuery },
        { project: this.config.project }
      );

      const workItems = queryResult.workItems;

      // Step 2: If no work items found, return empty
      if (!workItems || workItems.length === 0) {
        return { workItems: [] };
      }

      const ids: number[] = workItems
        .map(item => item.id)
        .filter((id): id is number => typeof id === "number");

      // Step 3: Retrieve details for each work item ID
      const fields = [
        "System.Id",
        "System.Title",
        "System.WorkItemType"
      ];

      const detailedItems = await witApi.getWorkItems(ids, fields);

      // Step 4: Format the output
      const result = detailedItems.map(item => ({
        id: item.id,
        title: item.fields?.["System.Title"] ?? "Unknown Title",
        type: item.fields?.["System.WorkItemType"] ?? "Unknown Type"
      }));

      return { workItems: result };

    } catch (error) {
      console.error('Error listing work items with details:', error);
      throw error;
    }
  }

  /**
   * Get a work item by ID
   */
  public async getWorkItemById(params: WorkItemByIdParams): Promise<any> {
    try {
      const witApi = await this.getWorkItemTrackingApi();
      const workItem = await witApi.getWorkItem(params.id, undefined, undefined, undefined, this.config.project);
      return workItem;
    } catch (error) {
      console.error(`Error getting work item ${params.id}:`, error);
      throw error;
    }
  }

  /**
   * Search work items using text
   */
  public async searchWorkItems(params: SearchWorkItemsParams): Promise<any> {
    try {
      const witApi = await this.getWorkItemTrackingApi();

      const conditions: string[] = [`[System.TeamProject] = @project`];

      // Add assigned user condition
      if (params.assignedTo) {
        conditions.push(`[System.AssignedTo] CONTAINS '${params.assignedTo}'`);
      }

      // Work item type (e.g., Bug, Task, User Story)
      if (params.workItemType) {
        conditions.push(`[System.WorkItemType] = '${params.workItemType}'`);
      }

      // Severity condition
      if (params.severity) {
        conditions.push(`[Microsoft.VSTS.Common.Severity] = '${params.severity}'`);
      }

      // Add search text condition
      if (params.searchText) {
        conditions.push(`(
        [System.Title] CONTAINS '${params.searchText}' OR
        [System.Description] CONTAINS '${params.searchText}'
      )`);
      }

      const query = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.WorkItemType], [System.CreatedDate]
      FROM WorkItems
      WHERE ${conditions.join(" AND ")}
      ORDER BY [System.CreatedDate] DESC
    `;

      const queryResult = await witApi.queryByWiql({ query }, { project: this.config.project });

      // Fetch full details for the found items
      const ids = (queryResult.workItems ?? [])
        .map(w => w.id)
        .filter((id): id is number => id !== undefined);

      const detailedItems = ids.length ? await witApi.getWorkItems(ids) : [];

      return detailedItems;
    } catch (error) {
      console.error('Error searching work items:', error);
      throw error;
    }
  }

  /**
   * Get recently updated work items
   */
  public async getRecentWorkItems(params: RecentWorkItemsParams): Promise<any> {
    try {
      const witApi = await this.getWorkItemTrackingApi();
      const query = `SELECT [System.Id], [System.Title], [System.State], [System.ChangedDate] 
                    FROM WorkItems 
                    WHERE [System.TeamProject] = @project 
                    ORDER BY [System.ChangedDate] DESC`;

      const queryResult = await witApi.queryByWiql({
        query
      }, {
        project: this.config.project
      });

      const top = params.top || 10;
      const skip = params.skip || 0;

      if (queryResult.workItems) {
        queryResult.workItems = queryResult.workItems.slice(skip, skip + top);
      }

      return queryResult;
    } catch (error) {
      console.error('Error getting recent work items:', error);
      throw error;
    }
  }

  /**
   * Get work items assigned to current user
   */
  public async getMyWorkItems(params: MyWorkItemsParams): Promise<any> {
    try {
      const witApi = await this.getWorkItemTrackingApi();
      let stateCondition = '';
      if (params.state) {
        stateCondition = `AND [System.State] = '${params.state}'`;
      }

      const query = `SELECT [System.Id], [System.Title], [System.State], [System.CreatedDate] 
                    FROM WorkItems 
                    WHERE [System.TeamProject] = @project 
                    AND [System.AssignedTo] = @me
                    ${stateCondition}
                    ORDER BY [System.CreatedDate] DESC`;

      const queryResult = await witApi.queryByWiql({
        query
      }, {
        project: this.config.project
      });

      const top = params.top || 100;

      if (queryResult.workItems) {
        queryResult.workItems = queryResult.workItems.slice(0, top);
      }

      return queryResult;
    } catch (error) {
      console.error('Error getting my work items:', error);
      throw error;
    }
  }

  /**
   * Create a work item
   */
  // public async createWorkItem(params: CreateWorkItemParams): Promise<any> {
  //   try {
  //     const witApi = await this.getWorkItemTrackingApi();
      
  //     const patchDocument: JsonPatchOperation[] = [];
      
  //     // Add title
  //     patchDocument.push({
  //       op: Operation.Add,
  //       path: "/fields/System.Title",
  //       value: params.title
  //     });
      
  //     // Add description if provided
  //     if (params.description) {
  //       patchDocument.push({
  //         op: Operation.Add,
  //         path: "/fields/System.Description",
  //         value: params.description
  //       });
  //     }
      
  //     // Add assigned to if provided
  //     if (params.assignedTo) {
  //       patchDocument.push({
  //         op: Operation.Add,
  //         path: "/fields/System.AssignedTo",
  //         value: params.assignedTo
  //       });
  //     }
      
  //     // Add state if provided
  //     if (params.state) {
  //       patchDocument.push({
  //         op: Operation.Add,
  //         path: "/fields/System.State",
  //         value: params.state
  //       });
  //     }
      
  //     // Add area path if provided
  //     if (params.areaPath) {
  //       patchDocument.push({
  //         op: Operation.Add,
  //         path: "/fields/System.AreaPath",
  //         value: params.areaPath
  //       });
  //     }
      
  //     // Add iteration path if provided
  //     if (params.iterationPath) {
  //       patchDocument.push({
  //         op: Operation.Add,
  //         path: "/fields/System.IterationPath",
  //         value: params.iterationPath
  //       });
  //     }
      
  //     // Add additional fields if provided
  //     if (params.additionalFields) {
  //       for (const [key, value] of Object.entries(params.additionalFields)) {
  //         patchDocument.push({
  //           op: Operation.Add,
  //           path: `/fields/${key}`,
  //           value: value
  //         });
  //       }
  //     }
  //     if (params.attachments && params.attachments.length > 0) {
  //       const attachmentOperations: JsonPatchOperation[] = [];
      
  //       for (const attachment of params.attachments) {
  //         // Create a readable stream from the string content
  //         const stream = Readable.from([attachment.content]);
        
  //         const uploaded = await witApi.createAttachment(
  //           {},                          // ✅ customHeaders (empty or custom if needed)
  //           stream,                      // ✅ contentStream
  //           attachment.name,             // optional fileName
  //           "simple",                    // optional uploadType (e.g., "simple")
  //           this.config.project,         // optional project
  //           undefined                    // optional areaPath
  //         );
        
  //         attachmentOperations.push({
  //           op: Operation.Add,
  //           path: "/relations/-",
  //           value: {
  //             rel: "AttachedFile",
  //             url: uploaded.url,
  //             attributes: {
  //               comment: `Attached file: ${attachment.name}`
  //             }
  //           }
  //         });
  //       }
        
      
  //       patchDocument.push(...attachmentOperations);
  //     }
      
      
  //     const workItem = await witApi.createWorkItem(
  //       undefined,
  //       patchDocument,
  //       this.config.project,
  //       params.workItemType
  //     );
      
  //     return workItem;
  //   } catch (error) {
  //     console.error('Error creating work item:', error);
  //     throw error;
  //   }
  // }

 

public async createWorkItem(params: CreateWorkItemParams): Promise<any> {
  try {
    const witApi = await this.getWorkItemTrackingApi();
    console.log("Service is calling");
    const patchDocument: JsonPatchOperation[] = [];
    console.log(params);
    // Add title
    patchDocument.push({
      op: Operation.Add,
      path: "/fields/System.Title",
      value: params.title
    });

    // Add description if provided
    if (params.description) {
      patchDocument.push({
        op: Operation.Add,
        path: "/fields/System.Description",
        value: params.description
      });
    }

    // Add assigned to if provided
    if (params.assignedTo) {
      patchDocument.push({
        op: Operation.Add,
        path: "/fields/System.AssignedTo",
        value: params.assignedTo
      });
    }

    // Add state if provided
    if (params.state) {
      patchDocument.push({
        op: Operation.Add,
        path: "/fields/System.State",
        value: params.state
      });
    }

    // Add area path if provided
    if (params.areaPath) {
      patchDocument.push({
        op: Operation.Add,
        path: "/fields/System.AreaPath",
        value: params.areaPath
      });
    }

    // Add iteration path if provided
    if (params.iterationPath) {
      patchDocument.push({
        op: Operation.Add,
        path: "/fields/System.IterationPath",
        value: params.iterationPath
      });
    }

    // Add additional fields if provided
    if (params.additionalFields) {
      for (const [key, value] of Object.entries(params.additionalFields)) {
        patchDocument.push({
          op: Operation.Add,
          path: `/fields/${key}`,
          value: value
        });
      }
    }

    // Add attachments if provided
    if (params.attachments && params.attachments.length > 0) {
      console.log("im in----------------------");
      const attachmentOperations: JsonPatchOperation[] = [];

      for (const attachment of params.attachments) {
        // Convert base64 content to binary buffer and stream
        const buffer = Buffer.from(attachment.content, 'base64');
        const stream = Readable.from(buffer);
        console.log("In and IN----------------------");
        const uploaded = await witApi.createAttachment(
          {},                          // custom headers
          stream,                      // binary stream
          attachment.name,             // file name
          "simple",                    // upload type
          this.config.project,         // project
          undefined                    // areaPath
        );

        attachmentOperations.push({
          op: Operation.Add,
          path: "/relations/-",
          value: {
            rel: "AttachedFile",
            url: uploaded.url,
            attributes: {
              comment: `Attached file: ${attachment.name}`
            }
          }
        });
      }

      patchDocument.push(...attachmentOperations);
    }

    const workItem = await witApi.createWorkItem(
      undefined,
      patchDocument,
      this.config.project,
      params.workItemType
    );

    return workItem;
  } catch (error) {
    console.error('Error creating work item:', error);
    throw error;
  }
}


  /**
   * Update a work item
   */
  public async updateWorkItem(params: UpdateWorkItemParams): Promise<any> {
    try {
      const witApi = await this.getWorkItemTrackingApi();
      console.log("-------");
      const patchDocument: JsonPatchOperation[] = [];

      // Add fields from the params
      for (const [key, value] of Object.entries(params.fields)) {
        patchDocument.push({
          op: Operation.Add,
          path: `/fields/${key}`,
          value: value
        });
      }

      const workItem = await witApi.updateWorkItem(
        undefined,
        patchDocument,
        params.id,
        this.config.project
      );

      return workItem;
    } catch (error) {
      console.error(`Error updating work item ${params.id}:`, error);
      throw error;
    }
  }

  /**
   * Add a comment to a work item
   */
  public async addWorkItemComment(params: AddWorkItemCommentParams): Promise<any> {
    try {
      const witApi = await this.getWorkItemTrackingApi();

      const comment = await witApi.addComment({
        text: params.text
      }, this.config.project, params.id);

      return comment;
    } catch (error) {
      console.error(`Error adding comment to work item ${params.id}:`, error);
      throw error;
    }
  }

  /**
   * Update work item state
   */
  public async updateWorkItemState(params: UpdateWorkItemStateParams): Promise<any> {
    try {
      const witApi = await this.getWorkItemTrackingApi();

      const patchDocument: JsonPatchOperation[] = [
        {
          op: Operation.Add,
          path: "/fields/System.State",
          value: params.state
        }
      ];

      // Add comment if provided
      if (params.comment) {
        patchDocument.push({
          op: Operation.Add,
          path: "/fields/System.History",
          value: params.comment
        });
      }

      const workItem = await witApi.updateWorkItem(
        undefined,
        patchDocument,
        params.id,
        this.config.project
      );

      return workItem;
    } catch (error) {
      console.error(`Error updating state for work item ${params.id}:`, error);
      throw error;
    }
  }

  /**
   * Assign work item to a user
   */
  public async assignWorkItem(params: AssignWorkItemParams): Promise<any> {
    try {
      const witApi = await this.getWorkItemTrackingApi();

      const patchDocument: JsonPatchOperation[] = [
        {
          op: Operation.Add,
          path: "/fields/System.AssignedTo",
          value: params.assignedTo
        }
      ];

      const workItem = await witApi.updateWorkItem(
        undefined,
        patchDocument,
        params.id,
        this.config.project
      );

      return workItem;
    } catch (error) {
      console.error(`Error assigning work item ${params.id}:`, error);
      throw error;
    }
  }

  /**
   * Create a link between work items
   */
  public async createLink(params: CreateLinkParams): Promise<any> {
    try {
      const witApi = await this.getWorkItemTrackingApi();

      const patchDocument: JsonPatchOperation[] = [
        {
          op: Operation.Add,
          path: "/relations/-",
          value: {
            rel: params.linkType,
            url: `${this.config.orgUrl}/_apis/wit/workItems/${params.targetId}`,
            attributes: {
              comment: params.comment || ""
            }
          }
        }
      ];

      const workItem = await witApi.updateWorkItem(
        undefined,
        patchDocument,
        params.sourceId,
        this.config.project
      );

      return workItem;
    } catch (error) {
      console.error(`Error creating link between work items:`, error);
      throw error;
    }
  }

  /**
   * Bulk create or update work items
   */
  public async bulkUpdateWorkItems(params: BulkWorkItemParams): Promise<any> {
    try {
      const results = [];

      for (const workItemParams of params.workItems) {
        if ('id' in workItemParams) {
          // It's an update
          const result = await this.updateWorkItem(workItemParams);
          results.push(result);
        } else {
          // It's a create
          const result = await this.createWorkItem(workItemParams);
          results.push(result);
        }
      }

      return {
        count: results.length,
        workItems: results
      };
    } catch (error) {
      console.error('Error in bulk work item operation:', error);
      throw error;
    }
  }

  //checking user effort summary
  public async getUserEffortSummary(params: UserEffortSummaryParams): Promise<any> {
    try {
      const witApi = await this.getWorkItemTrackingApi();

      // Step 1: Query work items assigned to the user
      const query = `
        SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
        FROM WorkItems
        WHERE [System.TeamProject] = @project 
          AND [System.AssignedTo] CONTAINS '${params.assignedTo}'
      `;

      const queryResult = await witApi.queryByWiql({ query }, { project: this.config.project });

      const ids = (queryResult.workItems ?? [])
        .map(w => w.id)
        .filter((id): id is number => typeof id === 'number');

      if (!ids.length) {
        return {
          message: `No work items found assigned to ${params.assignedTo}`,
          totalEffort: 0,
          count: 0,
          workItems: []
        };
      }

      // Step 2: Get detailed work item info
      const detailedItems = await witApi.getWorkItems(ids);

      let totalEffort = 0;

      const workItemSummaries = detailedItems.map(item => {
        const fields = item.fields || {};

        const effort =
          fields['Microsoft.VSTS.Scheduling.Effort'] ??
          fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] ??
          fields['Microsoft.VSTS.Scheduling.StoryPoints'] ??
          0;

        if (typeof effort === 'number') {
          totalEffort += effort;
        }

        return {
          id: item.id,
          title: fields['System.Title'] || '',
          state: fields['System.State'] || '',
          assignedTo: fields['System.AssignedTo'] || '',
          effort
        };
      });

      return {
        totalEffort,
        count: workItemSummaries.length,
        workItems: workItemSummaries
      };
    } catch (error) {
      console.error('Error getting user effort summary:', error);
      throw error;
    }
  }

  //listing assigned tasks for specific user
  public async listAssignedTasks(): Promise<any> {
    const witApi = await this.getWorkItemTrackingApi();
    const query = `
      SELECT [System.Id], [System.Title], [System.AssignedTo], [System.State], [System.WorkItemType], [Microsoft.VSTS.Scheduling.Effort]
      FROM WorkItems
      WHERE [System.TeamProject] = @project
        AND [System.WorkItemType] = 'Task'
        AND [System.AssignedTo] <> ''
      ORDER BY [System.CreatedDate] DESC
    `;

    const queryResult = await witApi.queryByWiql({ query }, { project: this.config.project });

    const ids = (queryResult.workItems ?? []).map(w => w.id).filter((id): id is number => id !== undefined);

    const detailedItems = ids.length ? await witApi.getWorkItems(ids) : [];

    const results = detailedItems.map(item => {
      const fields = item.fields ?? {};
      return {
        id: item.id,
        title: fields['System.Title'] ?? 'Untitled',
        state: fields['System.State'] ?? 'Unknown',
        assignedTo: typeof fields['System.AssignedTo'] === 'object'
          ? fields['System.AssignedTo']?.displayName
          : fields['System.AssignedTo'] ?? 'Unassigned',
        workItemType: fields['System.WorkItemType'] ?? 'Unknown',
        effort: typeof fields['Microsoft.VSTS.Scheduling.Effort'] === 'number'
          ? fields['Microsoft.VSTS.Scheduling.Effort']
          : 0
      };
    });

    return results;
  }

  // Get all workitem comments
  public async getAllWorkItemComments(params: GetAllWorkItemCommentsParams): Promise<any> {
    const witApi = await this.getWorkItemTrackingApi();

    // 1. Fetch work items (e.g., top 50 recently updated)
    const wiql = `
      SELECT [System.Id] 
      FROM WorkItems 
      WHERE [System.TeamProject] = @project 
      ORDER BY [System.ChangedDate] DESC
    `;

    const wiqlResult = await witApi.queryByWiql({ query: wiql }, { project: this.config.project });
    const ids = (wiqlResult.workItems ?? [])
      .map(w => w.id)
      .filter((id): id is number => id !== undefined);

    const limitedIds = params.top ? ids.slice(0, params.top) : ids;

    const allComments: { workItemId: number; comments: any[] }[] = [];

    for (const id of limitedIds) {
      try {
        const result = await witApi.getComments(this.config.project, id);
        const comments = result.comments?.map(comment => ({
          author: comment.createdBy?.displayName,
          date: comment.createdDate,
          text: comment.text,
        })) || [];

        allComments.push({
          workItemId: id,
          comments,
        });
      } catch (err) {
        console.error(`Error getting comments for WorkItem ${id}:`, err);
      }
    }
    return allComments;
  }

  //listing bugs by severity and priority
  public async listBugsBySeverityAndPriority(params: ListBugsBySeverityAndPriorityParams): Promise<any> {
    const witApi = await this.getWorkItemTrackingApi();

    const conditions: string[] = [
      `[System.TeamProject] = @project`,
      `[System.WorkItemType] = 'Bug'`
    ];
    if (params.severity) {
      conditions.push(`[Microsoft.VSTS.Common.Severity] = '${params.severity}'`);
    }
    if (params.priority) {
      conditions.push(`[Microsoft.VSTS.Common.Priority] = '${params.priority}'`);
    }
    const query = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.WorkItemType], [System.CreatedDate]
      FROM WorkItems
      WHERE ${conditions.join(" AND ")}
      ORDER BY [System.CreatedDate] DESC
    `;

    const queryResult = await witApi.queryByWiql({ query }, { project: this.config.project });

    const ids = (queryResult.workItems ?? [])
      .map(w => w.id)
      .filter((id): id is number => id !== undefined);

    const detailedItems = ids.length ? await witApi.getWorkItems(ids) : [];

    return detailedItems;
  }

  // Suggest task distribution based on user workload
  public async suggestTaskDistribution(params: SuggestTaskDistributionParams): Promise<any> {
    try {
      const witApi = await this.getWorkItemTrackingApi();
      const top = params.top || 10;

      // Step 1: Get unassigned tasks
      const wiql = `
        SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType], [Microsoft.VSTS.Scheduling.Effort]
        FROM WorkItems
        WHERE [System.TeamProject] = @project
        AND [System.AssignedTo] = ''
        AND [System.State] <> 'Closed'
        ORDER BY [System.CreatedDate] DESC
      `;

      const queryResult = await witApi.queryByWiql({ query: wiql }, { project: this.config.project });
      const unassignedIds = (queryResult.workItems ?? []).map(w => w.id).filter((id): id is number => id !== undefined);
      const unassignedItems = unassignedIds.length ? await witApi.getWorkItems(unassignedIds) : [];

      // Step 2: Get all assigned tasks and group by assignee
      const wiqlAssigned = `
        SELECT [System.Id], [System.AssignedTo], [Microsoft.VSTS.Scheduling.Effort]
        FROM WorkItems
        WHERE [System.TeamProject] = @project
        AND [System.AssignedTo] <> ''
        AND [System.State] <> 'Closed'
      `;
      const assignedResult = await witApi.queryByWiql({ query: wiqlAssigned }, { project: this.config.project });
      const assignedIds = (assignedResult.workItems ?? []).map(w => w.id).filter((id): id is number => id !== undefined);
      const assignedItems = assignedIds.length ? await witApi.getWorkItems(assignedIds) : [];

      // Step 3: Calculate workload per user
      const userEffortMap: Record<string, number> = {};
      for (const item of assignedItems) {
        const assignee = item.fields?.['System.AssignedTo']?.displayName || item.fields?.['System.AssignedTo'] || 'Unknown';
        const effort = item.fields?.['Microsoft.VSTS.Scheduling.Effort'] || 0;
        if (!userEffortMap[assignee]) userEffortMap[assignee] = 0;
        userEffortMap[assignee] += typeof effort === 'number' ? effort : 0;
      }

      // Step 4: Sort users by workload (ascending)
      const sortedUsers = Object.entries(userEffortMap).sort((a, b) => a[1] - b[1]);

      // Step 5: Suggest assignments
      const suggestions = unassignedItems.slice(0, top).map((task, i) => {
        const suggestedUser = sortedUsers[i % sortedUsers.length]?.[0] || 'No user available';
        return {
          id: task.id,
          title: task.fields?.['System.Title'] || '',
          effort: task.fields?.['Microsoft.VSTS.Scheduling.Effort'] || 0,
          suggestedAssignee: suggestedUser
        };
      });

      return {
        suggestions,
        message: `Suggested distribution for ${suggestions.length} unassigned tasks`
      };
    } catch (error) {
      console.error('Error suggesting task distribution:', error);
      throw error;
    }
  }

  // Listing tasks without effort in active user stories
  public async listTasksWithoutEffortInActiveUserStories(params: ListTasksWithoutEffortInActiveUserStoriesParams): Promise<any> {
    const witApi = await this.getWorkItemTrackingApi();
    const daysThreshold = params.daysThreshold || 1;

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysThreshold);
    const isoDateOnly = dateThreshold.toISOString().split("T")[0];

    // Ensure project value is available
    if (!this.config.project) {
      return { content: [], rawData: [], isError: true, message: "Project not configured" };
    }

    const query = `
    SELECT 
      [System.Id], 
      [System.Title], 
      [System.WorkItemType], 
      [System.State], 
      [System.AssignedTo], 
      [System.ChangedDate], 
      [System.CreatedDate]
    FROM WorkItems
    WHERE 
      [System.TeamProject] = @project
      AND [System.WorkItemType] = 'Task'
      AND [System.CreatedDate] < '${isoDateOnly}'
  `;

    const queryResult = await witApi.queryByWiql({ query }, { project: this.config.project });
    const taskIds = (queryResult.workItems ?? []).map(w => w.id).filter((id): id is number => id !== undefined);
    console.log("🧪 Found task IDs:", taskIds);


    if (!taskIds.length) {
      return { content: [], rawData: [], isError: false };
    }

    const detailedItems = await getWorkItemsByIds(witApi, taskIds, [], true);

    console.log("🔍 Sample task fields:", detailedItems[0]?.fields);
    console.log("🔗 Task relations:", detailedItems[0]?.relations);

    const filteredTasks = detailedItems.filter(task => {
      const fields = task.fields ?? {};
      const effort = fields['Microsoft.VSTS.Scheduling.RemainingWork']
              ?? fields['Microsoft.VSTS.Scheduling.OriginalEstimate']
              ?? fields['Microsoft.VSTS.Scheduling.CompletedWork']
              ?? fields['Microsoft.VSTS.Scheduling.Effort'];
      const parentRelation = task.relations?.find(r => r.rel === 'System.LinkTypes.Hierarchy-Reverse' && r.url);
      console.log("🔗 Task ID:", task.id, "Relations:", task.relations);
      const hasNoEffort = effort === null || effort === undefined;
      const hasParent = !!parentRelation?.url;

      return hasNoEffort && hasParent;
    });

    console.log("✅ Filtered tasks:", filteredTasks);

    const userStoryIds = [...new Set(
      filteredTasks.map(task => {
        const url = task.relations?.find(r => r.rel === 'System.LinkTypes.Hierarchy-Reverse')?.url;
        return url ? parseInt(url.split('/').pop() ?? '', 10) : null;
      }).filter((id): id is number => id !== null)
    )];
    console.log("🧪 Parent user story IDs:", userStoryIds);


    const userStories = userStoryIds.length ? await witApi.getWorkItems(userStoryIds) : [];

    const activeUserStoryIds = new Set(
      userStories
        .filter(story => story.fields?.["System.State"] === "Active")
        .map(story => story.id)
    );
    console.log("🧪 Active user story IDs:", [...activeUserStoryIds]);


    const result = [];

    for (const task of filteredTasks) {
      const parentRelation = task.relations?.find(r => r.rel === "System.LinkTypes.Hierarchy-Reverse" && r.url);
      if (!parentRelation?.url) continue;

      const parentId = parseInt(parentRelation.url.split("/").pop() || "", 10);
      if (!activeUserStoryIds.has(parentId)) continue;

      const fields = task.fields ?? {};
      const assignedTo = fields["System.AssignedTo"];
      const displayName = typeof assignedTo === "object" && assignedTo?.displayName ? assignedTo.displayName : "Unassigned";

      const commentText = displayName !== "Unassigned"
        ? `Hi ${displayName}, this task is missing effort hours. Please update it.`
        : `This task is missing effort hours. Please assign it and update.`;

      try {
        await witApi.addComment({ text: commentText }, this.config.project, task.id!);
      } catch (err) {
        console.error(`Error commenting on task ${task.id}:`, err);
      }
      console.log(`✅ Task ${task.id} has active parent ${parentId} and no effort`);


      result.push({
        id: task.id,
        title: fields["System.Title"] ?? "Untitled",
        state: fields["System.State"],
        assignedTo: displayName,
        changedDate: fields["System.ChangedDate"]
      });
    }

    return {
      content: result,
      rawData: result,
      isError: false
    };
  }





  // Get current date and time
  public async getCurrentDateTime(): Promise<any> {
    const now = new Date();
    return {
      iso: now.toISOString(),
      locale: now.toLocaleString(),
      time: now.toLocaleTimeString(),
      date: now.toDateString(),
      timestamp: now.getTime()
    };
  }

  // Comment on tasks without description
  public async commentOnTasksWithoutDescription(): Promise<any> {
    const witApi = await this.getWorkItemTrackingApi();

    // Step 1: Get all open tasks (because we can't filter by Description in WIQL)
    const query = `
    SELECT [System.Id], [System.Title], [System.AssignedTo]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
      AND [System.WorkItemType] = 'Task'
      AND [System.State] <> 'Closed'
  `;

    const queryResult = await witApi.queryByWiql({ query }, { project: this.config.project });
    const ids = (queryResult.workItems ?? [])
      .map(w => w.id)
      .filter((id): id is number => id !== undefined);

    if (!ids.length) {
      return [{ info: "No tasks found to check for description." }];
    }

    // Step 2: Get full details
    const detailedItems = await witApi.getWorkItems(ids);

    // Step 3: Filter tasks that are missing a description
    const tasksWithoutDescription = detailedItems.filter(task => {
      const description = task.fields?.["System.Description"];
      return !description || description.trim() === "";
    });

    if (!tasksWithoutDescription.length) {
      return [{ info: "All tasks have descriptions. No comments needed." }];
    }

    // Step 4: Add comments to each task
    for (const task of tasksWithoutDescription) {
      if (!task.id || !task.fields) continue;

      const fields = task.fields;
      const assignedTo = fields["System.AssignedTo"];
      const displayName =
        typeof assignedTo === "object" && assignedTo?.displayName
          ? assignedTo.displayName
          : null;

      const commentText = displayName
        ? `Hi ${displayName}, this task is missing a description. Please add it.`
        : `This task is missing a description. Please assign it and add a description.`;

      await witApi.addComment(
        { text: commentText },
        this.config.project,
        task.id
      );
    }

    return {
      success: true,
      message: `Comments added to ${tasksWithoutDescription.length} tasks without description.`
    };
  }

  // List stale unassigned or active bugs
  public async listStaleUnassignedOrActiveBugs(params: ListStaleUnassignedOrActiveBugsParams): Promise<any> {
    const witApi = await this.getWorkItemTrackingApi();
    const days = params.daysThreshold ?? 3;

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const isoDate = dateThreshold.toISOString().split('T')[0]; // Only keep 'YYYY-MM-DD'

    // WIQL to find stale bugs
    const query = `
    SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.CreatedDate], [System.ChangedDate]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
      AND [System.WorkItemType] = 'Bug'
      AND (
        ([System.State] = 'Active' AND [System.ChangedDate] <= '${isoDate}')
        OR ([System.AssignedTo] <> '' AND [System.CreatedDate] <= '${isoDate}')
      )
  `;

    const result = await witApi.queryByWiql({ query }, { project: this.config.project });
    const ids = (result.workItems ?? []).map(w => w.id).filter((id): id is number => id !== undefined);

    if (!ids.length) {
      return [{ info: "No stale unassigned or active bugs found." }];
    }

    const detailed = await witApi.getWorkItems(ids);
    const commentResults: any[] = [];

    for (const bug of detailed) {
      if (!bug?.id || !bug.fields) continue;

      const fields = bug.fields;
      const state = fields["System.State"];
      const title = fields["System.Title"] ?? "Untitled";
      const assignedTo = fields["System.AssignedTo"];
      const displayName =
        typeof assignedTo === "object" && assignedTo?.displayName
          ? assignedTo.displayName
          : null;

      const changedDate = new Date(fields["System.ChangedDate"]);
      const createdDate = new Date(fields["System.CreatedDate"]);

      const isActiveTooLong = state === "Active" && changedDate <= dateThreshold;
      const isUnassignedTooLong = !assignedTo && createdDate <= dateThreshold;

      if (!isActiveTooLong && !isUnassignedTooLong) continue;

      let commentText = "";

      if (isActiveTooLong) {
        commentText += displayName
          ? `Hi ${displayName}, this bug has been in 'Active' state for over ${days} days. Please review.`
          : `This bug has been in 'Active' state for over ${days} days. Please review.`;
      }

      if (isUnassignedTooLong) {
        commentText += commentText ? "\n" : "";
        commentText += `This bug has remained unassigned for more than ${days} days. Please assign it.`;
      }

      if (commentText) {
        await witApi.addComment(
          { text: commentText },
          this.config.project,
          bug.id
        );
      }

      commentResults.push({
        id: bug.id,
        title,
        state,
        assignedTo: displayName ?? "Unassigned",
        comment: commentText
      });
    }

    return commentResults.length
      ? commentResults
      : [{ info: "No bugs met the comment criteria." }];
  }

  // List bugs without triaged tag
  public async listBugsWithoutTriagedTag(params: ListBugsWithoutTriagedTagParams): Promise<any> {
    const witApi = await this.getWorkItemTrackingApi();

    const query = `
    SELECT [System.Id], [System.Title], [System.Tags], [System.AssignedTo], [System.State]
    FROM WorkItems
    WHERE [System.TeamProject] = @project
      AND [System.WorkItemType] = 'Bug'
  `;

    const result = await witApi.queryByWiql({ query }, { project: this.config.project });
    const ids = (result.workItems ?? []).map(w => w.id).filter((id): id is number => id !== undefined);

    if (!ids.length) {
      return [{ info: "No bugs found." }];
    }

    const detailed = await witApi.getWorkItems(ids);
    const bugsWithoutTriaged = [];

    for (const bug of detailed) {
      if (!bug.id || !bug.fields) continue;

      const tags = bug.fields["System.Tags"] || "";
      const hasTriagedTag = tags.toLowerCase().includes("triaged");

      if (!hasTriagedTag) {
        const assignedTo = bug.fields["System.AssignedTo"];
        const displayName = typeof assignedTo === "object" && assignedTo?.displayName
          ? assignedTo.displayName
          : "Unassigned";

        const comment = `Hi ${displayName}, this bug is missing the 'triaged' tag. Please review and update accordingly.`;

        await witApi.addComment({ text: comment }, this.config.project, bug.id);

        bugsWithoutTriaged.push({
          id: bug.id,
          title: bug.fields["System.Title"],
          assignedTo: displayName,
          state: bug.fields["System.State"],
          comment
        });
      }
    }

    return bugsWithoutTriaged.length
      ? bugsWithoutTriaged
      : [{ info: "All bugs have the 'triaged' tag." }];
  }

  // Flag reopened critical bugs
  public async flagReopenedCriticalBugs(params: FlagReopenedCriticalBugsParams): Promise<any> {
    const witApi = await this.getWorkItemTrackingApi();
    const project: string = this.config.project;

    // 1. Query all bugs
    const query = `
    SELECT [System.Id], [System.Title]
    FROM WorkItems
    WHERE [System.TeamProject] = @project AND [System.WorkItemType] = 'Bug'
  `;

    const result = await witApi.queryByWiql({ query }, { project });
    const ids = result.workItems?.map(w => w.id).filter((id): id is number => id !== undefined) ?? [];

    if (!ids.length) return [{ info: "No bugs found in the project." }];

    const bugs = await witApi.getWorkItems(ids);
    const flaggedBugs = [];

    for (const bug of bugs) {
      if (!bug.id || typeof bug.id !== "number") continue;
      const bugId = Number(bug.id);

      // ✅ Note: getRevisions expects (project: string, id: number)
      const revisions = await witApi.getRevisions(bugId); // ✅ correct
      let reopenCount = 0;
      for (let i = 1; i < revisions.length; i++) {
        const prev = revisions[i - 1];
        const curr = revisions[i];

        const oldState = prev.fields?.["System.State"];
        const newState = curr.fields?.["System.State"];

        if (oldState === "Closed" && newState === "Active") {
          reopenCount++;
        }
      }
      if (reopenCount > 3) {
        // Add 'Critical' tag
        const tags = bug.fields?.["System.Tags"] ?? "";
        const updatedTags = tags.includes("Critical") ? tags : `${tags}; Critical`;

        const patch = [
          {
            op: "add",
            path: "/fields/System.Tags",
            value: updatedTags
          }
        ];

        await witApi.updateWorkItem({}, patch, bugId);

        // Add comment
        const assignedTo = bug.fields?.["System.AssignedTo"];
        const displayName = typeof assignedTo === "object" && assignedTo?.displayName
          ? assignedTo.displayName
          : "Unassigned";

        const commentText = `Hi ${displayName}, this bug has been reopened more than 3 times and is now tagged as 'Critical'. Please investigate.`;

        await witApi.addComment({ text: commentText }, project, bugId);

        flaggedBugs.push({
          id: bugId,
          title: bug.fields?.["System.Title"] ?? "Untitled",
          reopenCount,
          comment: commentText
        });
      }
    }

    return flaggedBugs.length
      ? flaggedBugs
      : [{ info: "No bugs were reopened more than 3 times." }];
  }


}

// 👇 Add this at the bottom of your file (outside the class)
export async function getWorkItemsByIds(
  witApi: WorkItemTrackingApi,
  ids: number[],
  fields: string[] = [],
  includeRelations = false
): Promise<WorkItem[]> {
  const batchSize = 200;
  const result: WorkItem[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batchIds = ids.slice(i, i + batchSize);

    const batchResult = await witApi.getWorkItemsBatch({
      ids: batchIds,
      fields: fields.length > 0 ? fields : undefined,
      $expand: includeRelations ? WorkItemExpand.All : undefined
    });

    result.push(...(batchResult ?? [])); // ✅ fixed: batchResult is already WorkItem[]
  }

  return result;
}
