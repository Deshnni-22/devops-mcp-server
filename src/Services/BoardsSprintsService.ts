import * as azdev from 'azure-devops-node-api';
import { WorkApi } from 'azure-devops-node-api/WorkApi';
import { CoreApi } from 'azure-devops-node-api/CoreApi';
import { AzureDevOpsConfig } from '../Interfaces/AzureDevOps';
import { AzureDevOpsService } from './AzureDevOpsService';
import {
  GetBoardsParams,
  GetBoardColumnsParams,
  GetBoardItemsParams,
  MoveCardOnBoardParams,
  GetSprintsParams,
  GetCurrentSprintParams,
  GetSprintWorkItemsParams,
  GetSprintCapacityParams,
  GetTeamMembersParams,
  ListTasksNotMovedToNextSprintParams,
  CheckNoActiveUserStoriesInSprintParams,
  CheckActiveUserStoryRatioParams
} from '../Interfaces/BoardsAndSprints';
import { TeamSettingsIteration,TimeFrame } from 'azure-devops-node-api/interfaces/WorkInterfaces';
import { CommentCreate } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces";
import { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces';
import { WebApi, getPersonalAccessTokenHandler } from 'azure-devops-node-api';


// Define TeamContext interface since it's not exported from WorkInterfaces
interface TeamContext {
  project: string;
  team?: string;
}

export class BoardsSprintsService extends AzureDevOpsService {
  azureService: any;
  constructor(config: AzureDevOpsConfig) {
    super(config);
    
  }
 
  /**
   * Get the Work API client
   */
  private async getWorkApi(): Promise<WorkApi> {
    return await this.connection.getWorkApi();
  }

  /**
   * Get the Core API client
   */
  private async getCoreApi(): Promise<CoreApi> {
    return await this.connection.getCoreApi();
  }

  /**
   * Get team context
   */
  private getTeamContext(team?: string, project?: string): TeamContext {
    return {
      project: this.config.project,
      team: team
    };
  }

  /**
   * Get all boards
   */
  public async getBoards(params: GetBoardsParams): Promise<any> {
    try {
      const workApi = await this.getWorkApi();
      const teamContext = this.getTeamContext(params.teamId);
      
      const boards = await workApi.getBoards(teamContext);
      return boards;
    } catch (error) {
      console.error('Error getting boards:', error);
      throw error;
    }
  }

  /**
   * Get board columns
   */
  public async getBoardColumns(params: GetBoardColumnsParams): Promise<any> {
    try {
      const workApi = await this.getWorkApi();
      const teamContext = this.getTeamContext(params.teamId);
      
      const columns = await workApi.getBoardColumns(teamContext, params.boardId);
      return columns;
    } catch (error) {
      console.error(`Error getting columns for board ${params.boardId}:`, error);
      throw error;
    }
  }

  /**
   * Get board items
   */
  public async getBoardItems(params: GetBoardItemsParams): Promise<any> {
    try {
      const workApi = await this.getWorkApi();
      const teamContext = this.getTeamContext(params.teamId);
      
      // Get board cards - use a different approach since getCardsBySettings doesn't exist
      // First get the board
      const board = await workApi.getBoard(teamContext, params.boardId);
      
      // Then get the board columns
      const columns = await workApi.getBoardColumns(teamContext, params.boardId);
      
      // Combine the data
      return {
        board,
        columns
      };
    } catch (error) {
      console.error(`Error getting board items for board ${params.boardId}:`, error);
      throw error;
    }
  }

  /**
   * Move a card on board
   */
  public async moveCardOnBoard(params: MoveCardOnBoardParams): Promise<any> {
    try {
      const workApi = await this.getWorkApi();
      const teamContext = this.getTeamContext(params.teamId);
      
      // We need to update the work item to change its board column
      // This often requires knowing the field mappings for the board
      // This is a simplified implementation that assumes standard mappings
      const updateData = {
        id: params.workItemId,
        fields: {
          "System.BoardColumn": params.columnId
        }
      };
      
      // The proper implementation would use the board's column mappings
      // For now, we return the update data as confirmation
      return updateData;
    } catch (error) {
      console.error(`Error moving card ${params.workItemId} on board ${params.boardId}:`, error);
      throw error;
    }
  }

  /**
   * Get all sprints
   */
  public async getSprints(params: GetSprintsParams): Promise<any> {
  try {
    const workApi = await this.getWorkApi();
    const teamContext = {
      project: params.project,
      team: params.team,
    };

    const sprints = await workApi.getTeamIterations(teamContext);

    if (!sprints || sprints.length === 0) {
      console.warn(`⚠️ No sprints found for project "${params.project}" and team "${params.team}".`);
      return [];
    }

    return sprints;
  } catch (error) {
    console.error('🚨 Error getting sprints:', error);
    throw error;
  }
}


  /**
   * Get current sprint
   */
  public async getCurrentSprint(params: GetCurrentSprintParams): Promise<any> {
    try {
      const workApi = await this.getWorkApi();
      const teamContext = this.getTeamContext(params.team);
      
      const currentIterations = await workApi.getTeamIterations(teamContext, "current");
      return currentIterations && currentIterations.length > 0 ? currentIterations[0] : null;
    } catch (error) {
      console.error('Error getting current sprint:', error);
      throw error;
    }
  }

  /**
   * Get sprint work items
   */
  public async getSprintWorkItems(params: GetSprintWorkItemsParams): Promise<any> {
    try {
      const workApi = await this.getWorkApi();
      const teamContext = this.getTeamContext(params.project);
      
      const workItems = await workApi.getIterationWorkItems(teamContext, params.sprint);
      return workItems;
    } catch (error) {
      console.error(`Error getting work items for sprint ${params.sprint}:`, error);
      throw error;
    }
  }

  /**
   * Get board cards
   */
  public async getBoardCards(params: GetBoardItemsParams): Promise<any> {
    try {
      const workApi = await this.getWorkApi();
      const teamContext = this.getTeamContext(params.teamId);
      
      // Get board charts instead of cards since getBoardCards doesn't exist
      const charts = await workApi.getBoardCharts(teamContext, params.boardId);
      
      return charts;
    } catch (error) {
      console.error(`Error getting board charts for board ${params.boardId}:`, error);
      throw error;
    }
  }

  /**
   * Get sprint capacity
   */
  public async getSprintCapacity(params: GetSprintCapacityParams): Promise<any> {
    try {
      const workApi = await this.getWorkApi();
      const teamContext = this.getTeamContext(params.project);
      
      // Get team settings instead of capacities since getCapacities doesn't exist
      const teamSettings = await workApi.getTeamSettings(teamContext);
      
      // Return team settings as a workaround
      return {
        teamSettings,
        sprintId: params.sprint,
        message: "Direct capacity API not available, returning team settings instead"
      };
    } catch (error) {
      console.error(`Error getting capacity for sprint ${params.sprint}:`, error);
      throw error;
    }
  }

  /**
   * Get team members
   */
  public async getTeamMembers(params: GetTeamMembersParams): Promise<any> {
    try {
      const coreApi = await this.getCoreApi();
      const teamId = params.project || this.config.project;
      
      // Get team members with a different approach since getTeamMembers doesn't exist
      // First get the team
      const team = await coreApi.getTeam(this.config.project, teamId);
      
      // Return team info as a workaround
      return {
        team,
        message: "Direct team members API not available, returning team info instead"
      };
    } catch (error) {
      console.error(`Error getting team members for team ${params.project}:`, error);
      throw error;
    }
  }

  /**
   * Helper to get default team ID
   */
  private async getDefaultTeamId(): Promise<string> {
    try {
      const coreApi = await this.getCoreApi();
      const teams = await coreApi.getTeams(this.config.project);
      
      // Find the default team, which often has the same name as the project
      const defaultTeam = teams.find(team => team.name === this.config.project) || teams[0];
      
      return defaultTeam.id!;
    } catch (error) {
      console.error('Error getting default team ID:', error);
      throw error;
    }
  }

  /**
   * List tasks that are not moved to next sprint
   */
  public async listTasksNotMovedToNextSprint(params: ListTasksNotMovedToNextSprintParams): Promise<any[]> {
    const coreApi = await this.getCoreApi();
    const workApi = await this.getWorkApi();
    const witApi = await this.getWorkItemTrackingApi();

    const teamContext = {
      project: this.config.project!,
      team: params.team.trim(),
    };

    let allSprints: TeamSettingsIteration[] = [];

    try {
      allSprints = await workApi.getTeamIterations(teamContext);
    } catch (err: any) {
      console.error("Failed to fetch all sprints:", err.message);
      return [{ error: "Failed to fetch all sprints.", details: err.message }];
    }

    const currentSprint = allSprints.find(
      s => s.attributes?.timeFrame === TimeFrame.Current
    );

    const pastSprints = allSprints
      .filter(s => s.attributes?.timeFrame === TimeFrame.Past && s.attributes?.finishDate)
      .sort((a, b) =>
        new Date(b.attributes!.finishDate!).getTime() - new Date(a.attributes!.finishDate!).getTime()
      );

    const previousSprint = pastSprints[0];

    if (!currentSprint || !previousSprint || !previousSprint.id || !previousSprint.path || !currentSprint.path) {
      console.warn("Cannot identify current or previous sprint.");
      return [{ info: "Sprint data is incomplete. Cannot proceed." }];
    }

    const sprintWorkItems = await workApi.getIterationWorkItems(teamContext, previousSprint.id);

    const ids: number[] =
      sprintWorkItems.workItemRelations
        ?.map(w => w.target?.id)
        .filter((id): id is number => typeof id === "number") ?? [];

    const detailed = ids.length ? await witApi.getWorkItems(ids) : [];

    const tasksToMove: any[] = [];

    for (const task of detailed) {
      const fields = task.fields ?? {};
      const state = fields["System.State"];
      const iterationPath = fields["System.IterationPath"];
      const isCompleted = state === "Done" || state === "Closed" || state === "Removed";

      if (isCompleted || iterationPath !== previousSprint.path) continue;

      const assignedTo = fields["System.AssignedTo"];
      const displayName = typeof assignedTo === "object" && assignedTo?.displayName
        ? assignedTo.displayName
        : null;

      const commentText = displayName
        ? `Hi ${displayName}, this task was not completed in the previous sprint. Moving it to the current sprint.`
        : `This task was not completed in the previous sprint. Moving it to the current sprint.`;

      try {
        await witApi.addComment({ text: commentText }, this.config.project!, task.id!);

        await witApi.updateWorkItem(
          null,
          [{ op: "add", path: "/fields/System.IterationPath", value: currentSprint.path }],
          task.id!,
          this.config.project!
        );

        tasksToMove.push({
          id: task.id,
          title: fields["System.Title"] ?? "Untitled",
          assignedTo: displayName ?? "Unassigned",
          state,
          fromSprint: previousSprint.name,
          movedTo: currentSprint.name,
        });
      } catch (err: any) {
        console.error(`Failed to move task ${task.id}`, err.message);
      }
    }

    return tasksToMove.length
      ? tasksToMove
      : [{ info: "All tasks from previous sprint are either completed or already moved." }];
  }



  // Check if there are no active user stories in the sprint
  public async checkNoActiveUserStoriesInSprint(params: CheckNoActiveUserStoriesInSprintParams): Promise<any> {
    const workApi = await this.getWorkApi();
    const witApi = await this.getWorkItemTrackingApi();

    const teamContext = {
      project: this.config.project,
      team: params.team
    };

    const currentSprints = await workApi.getTeamIterations(teamContext, "current");

    if (!currentSprints.length) {
      return [{ info: "No current sprint found for the specified team." }];
    }

    const currentSprint = currentSprints[0];
    const sprintId = currentSprint.id;
    const project = this.config.project;

    if (!sprintId || !project) {
      throw new Error("Missing sprint ID or project name.");
    }

    const sprintWorkItems = await workApi.getIterationWorkItems(teamContext, sprintId);
    const workItemIds =
      sprintWorkItems.workItemRelations
        ?.map((w) => w.target?.id)
        .filter((id): id is number => id !== undefined) ?? [];

    if (!workItemIds.length) {
      return [{ info: "No work items found in the current sprint." }];
    }

    const detailedItems = await witApi.getWorkItems(workItemIds);

    // Filter only user stories
    const userStories = detailedItems.filter(
      item => item.fields?.["System.WorkItemType"] === "User Story"
    );

    if (!userStories.length) {
      return [{ info: "There are no user stories in the current sprint." }];
    }

    // Filter user stories that are NOT active
    const inactiveStories = userStories.filter(
      item => item.fields?.["System.State"] !== "Active"
    );

    if (!inactiveStories.length) {
      return [{ info: "All user stories in the current sprint are active." }];
    }

    // Add comments to each non-active user story
    for (const story of inactiveStories) {
      if (!story.id || !story.fields) continue;

      const assignedTo = story.fields["System.AssignedTo"];
      const displayName =
        typeof assignedTo === "object" && assignedTo?.displayName
          ? assignedTo.displayName
          : null;

      const commentText = displayName
        ? `Hi ${displayName}, this user story is currently not active. Please review and update its status if needed.`
        : `This user story is not active. Please assign someone and update its state.`;

      await witApi.addComment(
        { text: commentText },
        project,
        story.id
      );
    }

    // Return details of user stories that were commented on
    return inactiveStories.map(story => ({
      id: story.id,
      title: story.fields?.["System.Title"] ?? "Untitled",
      state: story.fields?.["System.State"] ?? "Unknown",
      assignedTo: typeof story.fields?.["System.AssignedTo"] === "object"
        ? story.fields["System.AssignedTo"]?.displayName
        : story.fields?.["System.AssignedTo"] ?? "Unassigned",
      message: "Comment added to non-active user story."
    }));
  }

  //Check for active user story ratio

  public async checkActiveUserStoryRatio(params: CheckActiveUserStoryRatioParams): Promise<string> {
    const { project, team } = params;
    const ado = this.azureService;

    const workApi = await ado.getWorkApi();
    const witApi = await ado.getWitApi();

    const teamContext = { projectId: undefined, project, team };
    const sprints = await workApi.getTeamIterations(teamContext);
    const currentDate = new Date();

    const sortedSprints = sprints
      .filter((s: TeamSettingsIteration) => s.attributes?.startDate && s.attributes?.finishDate)
      .sort((a: TeamSettingsIteration, b: TeamSettingsIteration) =>
        new Date(a.attributes!.startDate!).getTime() - new Date(b.attributes!.startDate!).getTime()
      );

    const currentSprintIndex = sortedSprints.findIndex(
      (s: TeamSettingsIteration) =>
        currentDate >= new Date(s.attributes!.startDate!) &&
        currentDate <= new Date(s.attributes!.finishDate!)
    );
    if (currentSprintIndex === -1) {
      return "Couldn't identify the current sprint based on today's date.";
    }

    const previousSprint = sortedSprints[currentSprintIndex - 1];
    const nextSprint = sortedSprints[currentSprintIndex];

    if (!previousSprint || !nextSprint || !nextSprint.attributes?.startDate) {
      return "Previous or next sprint or their start dates are missing.";
    }

    const nextSprintStart = new Date(nextSprint.attributes.startDate!);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    if (nextSprintStart > oneDayAgo) {
      return "The next sprint hasn't been active for more than one day.";
    }

    const workItems = await ado.getWorkItemsByIteration(project, team, previousSprint.id);
    if (!workItems.length) {
      return "No work items found for the previous sprint.";
    }

    const userStories = workItems.filter((w: WorkItem) => w.fields?.["System.WorkItemType"] === "User Story");
    const activeUserStories = userStories.filter((w: WorkItem) => w.fields?.["System.State"] === "Active");

    const totalCount = userStories.length;
    const activeCount = activeUserStories.length;
    const ratio = activeCount / totalCount;

    if (ratio > 0.5) {
      for (const story of activeUserStories) {
         if (!story.fields) continue;
        const id = story.id!;
        const assignedTo = story.fields["System.AssignedTo"]?.displayName || "Unassigned";

        const comment: CommentCreate = {
          text: `⚠️ This user story is still active in the previous sprint even though the next sprint has started. Assigned to: ${assignedTo}`
        };

        await witApi.addComment(teamContext, id, comment);
      }

      return `⚠️ ${activeCount} of ${totalCount} user stories in the previous sprint are still active after the next sprint started. Comments added.`;
    }

    return "✅ Less than 50% of the user stories in the previous sprint are in active state.";
  }
}


