import { AzureDevOpsConfig } from '../Interfaces/AzureDevOps';
import { BoardsSprintsService } from '../Services/BoardsSprintsService';
import { formatMcpResponse, formatErrorResponse, McpResponse } from '../Interfaces/Common';
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
import getClassMethods from "../utils/getClassMethods";

export class BoardsSprintsTools {
  private boardsSprintsService: BoardsSprintsService;

  constructor(config: AzureDevOpsConfig) {
    this.boardsSprintsService = new BoardsSprintsService(config);
  }

  /**
   * Get all boards
   */
  public async getBoards(params: GetBoardsParams): Promise<McpResponse> {
    try {
      const boards = await this.boardsSprintsService.getBoards(params);
      return formatMcpResponse(boards, `Found ${boards.length} boards`);
    } catch (error) {
      console.error('Error in getBoards tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Get board columns
   */
  public async getBoardColumns(params: GetBoardColumnsParams): Promise<McpResponse> {
    try {
      const columns = await this.boardsSprintsService.getBoardColumns(params);
      return formatMcpResponse(columns, `Found ${columns.length} columns for board ${params.boardId}`);
    } catch (error) {
      console.error('Error in getBoardColumns tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Get board items
   */
  public async getBoardItems(params: GetBoardItemsParams): Promise<McpResponse> {
    try {
      const items = await this.boardsSprintsService.getBoardItems(params);
      return formatMcpResponse(items, `Retrieved items for board ${params.boardId}`);
    } catch (error) {
      console.error('Error in getBoardItems tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Move a card on board
   */
  public async moveCardOnBoard(params: MoveCardOnBoardParams): Promise<McpResponse> {
    try {
      const result = await this.boardsSprintsService.moveCardOnBoard(params);
      return formatMcpResponse(result, `Moved work item ${params.workItemId} to column ${params.columnId}`);
    } catch (error) {
      console.error('Error in moveCardOnBoard tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Get all sprints
   */
  public async getSprints(params: GetSprintsParams): Promise<McpResponse> {
    try {
      const sprints = await this.boardsSprintsService.getSprints(params);
      return formatMcpResponse(sprints, `Found ${sprints.length} sprints`);
    } catch (error) {
      console.error('Error in getSprints tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Get current sprint
   */
  public async getCurrentSprint(params: GetCurrentSprintParams): Promise<McpResponse> {
    try {
      const sprint = await this.boardsSprintsService.getCurrentSprint(params);
      return formatMcpResponse(sprint, sprint ? `Current sprint: ${sprint.name}` : 'No current sprint found');
    } catch (error) {
      console.error('Error in getCurrentSprint tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Get sprint work items
   */
  public async getSprintWorkItems(params: GetSprintWorkItemsParams): Promise<McpResponse> {
    try {
      const workItems = await this.boardsSprintsService.getSprintWorkItems(params);
      return formatMcpResponse(workItems, `Found ${workItems.workItems?.length || 0} work items in sprint ${params.sprint}`);
    } catch (error) {
      console.error('Error in getSprintWorkItems tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Get sprint capacity
   */
  public async getSprintCapacity(params: GetSprintCapacityParams): Promise<McpResponse> {
    try {
      const capacity = await this.boardsSprintsService.getSprintCapacity(params);
      return formatMcpResponse(capacity, `Retrieved capacity for sprint ${params.sprint}`);
    } catch (error) {
      console.error('Error in getSprintCapacity tool:', error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Get team members
   */
  public async getTeamMembers(params: GetTeamMembersParams): Promise<McpResponse> {
    try {
      const members = await this.boardsSprintsService.getTeamMembers(params);
      return formatMcpResponse(members, `Found ${members.length} team members`);
    } catch (error) {
      console.error('Error in getTeamMembers tool:', error);
      return formatErrorResponse(error);
    }
  }
  /**
   * List tasks that are not moved to next sprint
   */
  public async listTasksNotMovedToNextSprint(
    params: ListTasksNotMovedToNextSprintParams
  ): Promise<McpResponse> {
    try {
      const results = await this.boardsSprintsService.listTasksNotMovedToNextSprint(params);
      return formatMcpResponse(results, "Listed tasks not moved to the next sprint even after 1 day");
    } catch (error) {
      console.error("Error in listTasksNotMovedToNextSprint:", error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Check if there are no active user stories in the sprint
   */
  public async checkNoActiveUserStoriesInSprint(params: CheckNoActiveUserStoriesInSprintParams): Promise<any> {
    try {
      const results = await this.boardsSprintsService.checkNoActiveUserStoriesInSprint(params);
      return formatMcpResponse(results, "Checked for active user stories in the current sprint");
    } catch (error) {
      console.error("Error in checkNoActiveUserStoriesInSprint:", error);
      return formatErrorResponse(error);
    }
  }

  /**
   * Check for active user story ratio
   */
  public async checkActiveUserStoryRatio(params: { project: string; team: string }): Promise<any> {
    try {
      const result = await this.boardsSprintsService.checkActiveUserStoryRatio(params);
      return formatMcpResponse(result, "Checked if more than 50% user stories are still active after next sprint started");
    } catch (error) {
      console.error("Error in checkActiveUserStoryRatio:", error);
      return formatErrorResponse(error);
    }
  }

}

export const BoardsSprintsToolMethods = getClassMethods(BoardsSprintsTools.prototype);