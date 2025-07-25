/**
 * Interface for getting boards
 */
export interface GetBoardsParams {
  teamId?: string;
}

/**
 * Interface for getting board columns
 */
export interface GetBoardColumnsParams {
  teamId?: string;
  boardId: string;
}

/**
 * Interface for getting board items
 */
export interface GetBoardItemsParams {
  teamId?: string;
  boardId: string;
}

/**
 * Interface for moving a card on board
 */
export interface MoveCardOnBoardParams {
  teamId?: string;
  boardId: string;
  workItemId: number;
  columnId: string;
  position?: number;
}

/**
 * Interface for getting sprints
 */
export interface GetSprintsParams {
   project?: string;
   team?: string;
}

/**
 * Interface for getting current sprint
 */
export interface GetCurrentSprintParams {
  team?: string;
}

/**
 * Interface for getting sprint work items
 */
export interface GetSprintWorkItemsParams {
  project?: string;
  sprint: string;
}

/**
 * Interface for getting sprint capacity
 */
export interface GetSprintCapacityParams {
  project?: string;
  sprint: number | string;
}

/**
 * Interface for getting team members
 */
export interface GetTeamMembersParams {
  project?: string;
} 

/**
 * Interface for listing tasks that are not moved to next sprint
 */
export interface ListTasksNotMovedToNextSprintParams {
  team: string;
}

// Interface for Checking for no active user stories in sprint
export interface CheckNoActiveUserStoriesInSprintParams {
  team: string;
}

//Interface for checking active user story ratio
export interface CheckActiveUserStoryRatioParams {
  project: string;
  team: string;
}
