/**
 * Interface for getting a work item by ID
 */
export interface WorkItemByIdParams {
  id: number;
}

/**
 * Interface for searching work items
 */
export interface SearchWorkItemsParams {
  searchText?: string;
  top?: number;
  assignedTo?: string;
  severity?: string;
  workItemType?: string;
}

/**
 * Interface for recently updated work items
 */
export interface RecentWorkItemsParams {
  top?: number;
  skip?: number;
}

/**
 * Interface for work items assigned to current user
 */
export interface MyWorkItemsParams {
  state?: string;
  top?: number;
}

/**
 * Interface for creating a work item
 */
export interface CreateWorkItemParams {
  workItemType: string;
  title: string;
  description?: string;
  assignedTo?: string;
  state?: string;
  areaPath?: string;
  iterationPath?: string;
  additionalFields?: Record<string, any>;
  attachments?: { name: string; content: string }[]; // new

}

/**
 * Interface for updating a work item
 */
export interface UpdateWorkItemParams {
  id: number;
  fields: Record<string, any>;
}

/**
 * Interface for adding a comment to a work item
 */
export interface AddWorkItemCommentParams {
  id: number;
  text: string;
}

/**
 * Interface for updating a work item state
 */
export interface UpdateWorkItemStateParams {
  id: number;
  state: string;
  comment?: string;
}

/**
 * Interface for assigning a work item
 */
export interface AssignWorkItemParams {
  id: number;
  assignedTo: string;
}

/**
 * Interface for creating a link between work items
 */
export interface CreateLinkParams {
  sourceId: number;
  targetId: number;
  linkType: string;
  comment?: string;
}

/**
 * Interface for bulk operations on work items
 */
export interface BulkWorkItemParams {
  workItems: Array<CreateWorkItemParams | UpdateWorkItemParams>;
} 

// interface for checking user effort summary
export interface UserEffortSummaryParams {
  assignedTo: string; // Name or email of the user
}

//interface for listing task assigned to user
export interface ListAssignedTasksParams {
  // No parameters needed for now
}

// Interface for getiing all workitem comments
export interface GetAllWorkItemCommentsParams {
  top?: number; // Optional limit to avoid overload
}

//Interface for Listing bugs by Severity and Priority
export interface ListBugsBySeverityAndPriorityParams {
  severity?: string; // Optional
  priority?: string; // Optional
}

//Interface for suggesting task distribution
export interface SuggestTaskDistributionParams {
  top?: number; // Optional limit on number of suggestions
}

//Interface for Listing tasks without effort in active user stories 
export interface ListTasksWithoutEffortInActiveUserStoriesParams {
  daysThreshold?: number; // Optional: How many days to look back for missing effort
}

//Interface for getting current date and time
export interface GetCurrentDateTimeParams {}

// Interface for commenting on tasks without description
export interface CommentOnTasksWithoutDescriptionParams {}

// Interface for listing stale unassigned or active bugs 
export interface ListStaleUnassignedOrActiveBugsParams {
  daysThreshold?: number;
}

//Interface for listing bugs without triaged tag
export interface ListBugsWithoutTriagedTagParams {
  daysThreshold?: number;
}

// Interface for Flag reopened critical bugs
export interface FlagReopenedCriticalBugsParams {
  daysThreshold?: number; // Optional: For future use if you want to add time-based logic
}