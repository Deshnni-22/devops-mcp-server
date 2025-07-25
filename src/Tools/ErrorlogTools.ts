import axios from "axios";
import { AzureDevOpsConfig } from "../Interfaces/AzureDevOps";

export interface ErrorLogResult {
  errorText: string;     // joined by \n
  errors: string[];      // individual lines
  timelineUrl: string;
  buildId: number;
  pipelineName: string;
}

export class ErrorLogTool {
  constructor(private config: AzureDevOpsConfig) {}

  /** Pull and parse errors from the build’s timeline API */
  public async extractErrors(payload: any): Promise<ErrorLogResult> {
    console.log("calling errorlogs");
    const r = payload?.resource;
    if (!r) throw new Error("Payload is missing resource object");

    const timelineUrl = `${this.config.orgUrl}/${this.config.project}/_apis/build/builds/${r.id}/timeline?api-version=7.1`;
    const auth = Buffer.from(":" + this.config.personalAccessToken).toString("base64");

    const resp = await axios.get(timelineUrl, {
      headers: { Authorization: `Basic ${auth}` }
    });

    const records = resp.data.records ?? [];
    const errors = records
      .filter((rec: any) => rec.result === "failed" && rec.issues?.length)
      .flatMap((rec: any) =>
        rec.issues.map((i: any) => `➤ [${rec.name}]: ${i.message}`)
      );

    return {
      timelineUrl,
      buildId: r.id,
      pipelineName: r.definition.name,
      errors,
      errorText: errors.join("\n")
    };
  }
}
