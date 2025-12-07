import type { WorkbookAnalysis } from "./schema";
import { create } from 'zustand';

interface WorkbookStore {
  workbookData: WorkbookAnalysis | null;
  setWorkbookData: (data: WorkbookAnalysis) => void;
  clearWorkbookData: () => void;
}

export const useWorkbookStore = create<WorkbookStore>((set) => ({
  workbookData: null,
  setWorkbookData: (data) => set({ workbookData: data }),
  clearWorkbookData: () => set({ workbookData: null }),
}));