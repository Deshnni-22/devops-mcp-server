import axios from "axios";
import { AzureDevOpsConfig } from "../Interfaces/AzureDevOps";

export interface AggregatedErrorLog {
  taskName: string;
  logContent: string; // Only error/exception lines
  logUrl: string;
}

export interface AggregatedErrorLogsResult {
  buildId: number;
  triggeredBy: string;
  pipelineName: string;
  timelineUrl: string;
  logs: AggregatedErrorLog[];
}

export class ErrorLogAggregatorTool {
  constructor(private config: AzureDevOpsConfig) {}

  /** Aggregates error lines from failed tasks' logs using buildId and uniqueName */
  public async getAggregatedErrorLogs(buildId: string | number, uniqueName: string): Promise<AggregatedErrorLogsResult> {
    const parsedBuildId = parseInt(buildId as string, 10);

    if (isNaN(parsedBuildId)) {
      throw new Error(`Invalid buildId: ${buildId}`);
    }

    console.log("🔍 Aggregating logs for build:", parsedBuildId);
    console.log("🔧 Triggered by:", uniqueName);

    const timelineUrl = `${this.config.orgUrl}/${this.config.project}/_apis/build/builds/${parsedBuildId}/timeline?api-version=7.1`;
    const buildUrl = `${this.config.orgUrl}/${this.config.project}/_apis/build/builds/${parsedBuildId}?api-version=7.1`;
    const auth = Buffer.from(":" + this.config.personalAccessToken).toString("base64");
    const headers = { Authorization: `Basic ${auth}` };

    // Get pipeline metadata (e.g., pipeline name)
    const buildResp = await axios.get(buildUrl, { headers });
    const pipelineName = buildResp.data?.definition?.name ?? "Unknown";

    // Fetch timeline
    const timelineResp = await axios.get(timelineUrl, { headers });
    const records = timelineResp.data.records ?? [];

    // Filter failed steps with log IDs
    const failedRecords = records.filter((rec: any) =>
      rec.result === "failed" && rec.log?.id
    );

    const logs: AggregatedErrorLog[] = [];

    for (const rec of failedRecords) {
      const logId = rec.log.id;
      const logUrl = `${this.config.orgUrl}/${this.config.project}/_apis/build/builds/${parsedBuildId}/logs/${logId}?api-version=7.1`;

      try {
        const logResp = await axios.get(logUrl, { headers });
        const rawContent = typeof logResp.data === "string"
          ? logResp.data
          : JSON.stringify(logResp.data);

        const errorLines = rawContent
          .split("\n")
          .filter(line =>
            line.toLowerCase().includes("error") ||
            line.toLowerCase().includes("exception") ||
            line.toLowerCase().includes("failed")
          );

        logs.push({
          taskName: rec.name,
          logContent: errorLines.join("\n").trim() || "[No specific error lines found]",
          logUrl
        });
      } catch (err) {
        console.warn(`⚠️ Failed to fetch log for task "${rec.name}" (logId: ${logId})`);
      }
    }

    return {
      buildId: parsedBuildId,
      triggeredBy: uniqueName,
      pipelineName,
      timelineUrl,
      logs
    };
  }
}
