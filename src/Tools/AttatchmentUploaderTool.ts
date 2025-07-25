import axios from "axios";
import { AzureDevOpsConfig } from "../Interfaces/AzureDevOps";

export class AttachmentUploaderTool {
  constructor(private config: AzureDevOpsConfig) {}

  /**
   * Uploads a virtual attachment to a work item using in-memory content.
   *
   * @param workItemId The Azure DevOps work item ID
   * @param content The file content as a plain string (will be converted to binary)
   * @param fileName The name of the file to appear in Azure DevOps (e.g., "log.txt")
   */
  public async attachContentAsFile(workItemId: number, content: string, fileName: string): Promise<void> {
    const fileBuffer = Buffer.from(content, "utf-8"); // Convert string to binary
    const base64Auth = Buffer.from(":" + this.config.personalAccessToken).toString("base64");

    const headers = {
      Authorization: `Basic ${base64Auth}`,
      "Content-Type": "application/octet-stream"
    };

    // Upload the attachment to Azure DevOps
    const uploadUrl = `${this.config.orgUrl}/${this.config.project}/_apis/wit/attachments?fileName=${fileName}&api-version=7.1`;

    const uploadResp = await axios.post(uploadUrl, fileBuffer, { headers });
    const attachmentUrl = uploadResp.data.url;

    // Attach the uploaded file to the specified work item
    const patchUrl = `${this.config.orgUrl}/${this.config.project}/_apis/wit/workitems/${workItemId}?api-version=7.1`;
    const patchHeaders = {
      ...headers,
      "Content-Type": "application/json-patch+json"
    };

    const patchBody = [
      {
        op: "add",
        path: "/relations/-",
        value: {
          rel: "AttachedFile",
          url: attachmentUrl,
          attributes: {
            comment: `Attached virtual file: ${fileName}`
          }
        }
      }
    ];

    await axios.patch(patchUrl, patchBody, { headers: patchHeaders });
    console.log(`✅ Successfully attached '${fileName}' to work item #${workItemId}`);
  }
}
