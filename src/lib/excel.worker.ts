import { parseExcelFile } from "./excel-parser";

self.onmessage = async (e: MessageEvent) => {
  const { fileBuffer } = e.data;
  
  try {
    const result = parseExcelFile(fileBuffer);
    self.postMessage({ type: "SUCCESS", data: result });
  } catch (error) {
    self.postMessage({ 
      type: "ERROR", 
      error: error instanceof Error ? error.message : "Unknown error during parsing" 
    });
  }
};