// // routes/webhook.route.ts  (snippet)
// import { Router } from 'express';
// import { PipelineTools } from '../Tools/PipelineTools';
// import { azureDevOpsConfig } from "../config/azure";

// const router = Router();

// router.post("/service-hook", async (req, res) => {
//     const tools = new PipelineTools(azureDevOpsConfig);
//     await tools.handleBuildCompleted({ payload: req.body });
//     res.sendStatus(200);
//   });
  
//   export default router;
//   // http://localhost:8008/api/service-hook