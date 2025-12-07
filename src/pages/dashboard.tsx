import Footer from "@/components/Footer";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { FileUpload } from "@/components/file-upload";
import { OverallSummary } from "@/components/summary-cards";
import { SheetAnalysis } from "@/components/sheet-analysis";
import { MarketAnalysis } from "@/components/market-analysis";
import { RemovalAnalysis } from "@/components/removal-analysis";
import { ContentOwnerAnalysis, DetailedContentOwnerBreakdown } from "@/components/content-owner-analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, Upload, AlertCircle } from "lucide-react";
import type { FilterState, SheetData, WorkbookAnalysis } from "@/lib/schema";
import { filterRecords, calculateSheetStats, getRemovalRate, calculateContentOwners } from "@/lib/excel-utils";
import { useWorkbookStore } from "@/lib/storage";


function EmptyState({ onFileUpload, isUploading }: { onFileUpload: (file: File) => void; isUploading: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 mb-4">
            <FileSpreadsheet className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Workbook Analysis Dashboard</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Upload your Excel workbook to get comprehensive analysis of your data across all sheets
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <FileUpload onFileUpload={onFileUpload} isUploading={isUploading} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
          <Card className="text-center p-6">
            <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">Multi-Sheet Support</h3>
            <p className="text-sm text-muted-foreground">
              Analyze USR, ATSM, PSSM, and PSMP sheets automatically
            </p>
          </Card>

          <Card className="text-center p-6">
            <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold mb-2">Drag & Drop Upload</h3>
            <p className="text-sm text-muted-foreground">
              Simply drag your Excel file or click to browse
            </p>
          </Card>

          <Card className="text-center p-6">
            <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2">Auto-Detection</h3>
            <p className="text-sm text-muted-foreground">
              Automatically detect columns for Status, Market, and more
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    months: [],
    markets: [],
    contentOwners: [],
  });
  const [marketCountryFilter, setMarketCountryFilter] = useState("all");
  const workerRef = useRef<Worker | null>(null);

  const { workbookData, setWorkbookData } = useWorkbookStore();

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL('../lib/excel.worker.ts', import.meta.url), {
      type: 'module'
    });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!workerRef.current) return;

    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      
      workerRef.current.onmessage = (e) => {
        const { type, data, error } = e.data;
        
        if (type === "SUCCESS") {
          const analysis = data as WorkbookAnalysis;
          if (analysis.sheets.every(s => s.totalUrls === 0)) {
             toast({
              title: "Upload failed",
              description: "No valid data found in the uploaded file. Please ensure your Excel file contains sheets named 'Unauthorized Search Result', 'Ads Tutorials- Social Media', 'Password Sharing-Social Med.', or 'Password Sharing-Marketplace'.",
              variant: "destructive",
            });
            setIsUploading(false);
            return;
          }

          setWorkbookData(analysis);
          toast({
            title: "File uploaded successfully",
            description: "Your workbook has been analyzed",
          });
          setIsUploading(false);
        } else if (type === "ERROR") {
          toast({
            title: "Upload failed",
            description: error || "Failed to process file",
            variant: "destructive",
          });
          setIsUploading(false);
        }
      };

      workerRef.current.onerror = (error) => {
        console.error("Worker error:", error);
        toast({
          title: "Upload failed",
          description: "An error occurred while processing the file",
          variant: "destructive",
        });
        setIsUploading(false);
      };

      workerRef.current.postMessage({ fileBuffer: buffer }, [buffer]);

    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  }, [setWorkbookData, toast]);

  const handleFilterChange = useCallback((key: keyof FilterState, value: string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const filteredData = useMemo(() => {
    if (!workbookData) return null;

    const filteredSheets: SheetData[] = workbookData.sheets.map(sheet => {
      const filteredRecords = filterRecords(
        sheet.records,
        filters.months,
        filters.markets,
        filters.contentOwners
      );
      const stats = calculateSheetStats(filteredRecords);
      return {
        ...sheet,
        records: filteredRecords,
        totalUrls: filteredRecords.length,
        activeCount: stats.active,
        removedCount: stats.removed,
      };
    });

    const totalUrls = filteredSheets.reduce((sum, s) => sum + s.totalUrls, 0);
    const activeCount = filteredSheets.reduce((sum, s) => sum + s.activeCount, 0);
    const removedCount = filteredSheets.reduce((sum, s) => sum + s.removedCount, 0);
    const removalRate = getRemovalRate(removedCount, totalUrls);

    const usrSheet = filteredSheets.find(s => s.abbreviation === "USR");
    const atsmSheet = filteredSheets.find(s => s.abbreviation === "ATSM");
    const pssmSheet = filteredSheets.find(s => s.abbreviation === "PSSM");
    const psmpSheet = filteredSheets.find(s => s.abbreviation === "PSMP");

    const usrCount = usrSheet?.totalUrls || 0;
    const atsmCount = atsmSheet?.totalUrls || 0;
    const pssmCount = pssmSheet?.totalUrls || 0;
    const psmpCount = psmpSheet?.totalUrls || 0;

    const allRecords = filteredSheets.flatMap(s => s.records);
    const contentOwners = calculateContentOwners(allRecords);

    return {
      sheets: filteredSheets,
      totalUrls,
      activeCount,
      removedCount,
      removalRate,
      usrCount,
      atsmCount,
      pssmCount,
      psmpCount,
      contentOwners,
    };
  }, [workbookData, filters]);

  const allCountries = useMemo(() => {
    if (!workbookData) return [];
    const countries = new Set<string>();
    workbookData.sheets.forEach(sheet => {
      sheet.records.forEach(record => {
        if (record.market) countries.add(record.market);
      });
    });
    return Array.from(countries).sort();
  }, [workbookData]);

  if (!workbookData) {
    return (
      <EmptyState 
        onFileUpload={handleFileUpload} 
        isUploading={isUploading} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        filters={filters}
        onFilterChange={handleFilterChange}
        months={workbookData?.months || []}
        markets={workbookData?.markets || []}
        contentOwners={workbookData?.contentOwners || []}
        onFileUpload={handleFileUpload}
        isUploading={isUploading}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {filteredData ? (
          <div className="space-y-8">
            <OverallSummary
              totalUrls={filteredData.totalUrls}
              activeCount={filteredData.activeCount}
              removedCount={filteredData.removedCount}
              removalRate={filteredData.removalRate}
              usrCount={filteredData.usrCount}
              atsmCount={filteredData.atsmCount}
              pssmCount={filteredData.pssmCount}
              psmpCount={filteredData.psmpCount}
            />

            <SheetAnalysis sheets={filteredData.sheets} />

            <MarketAnalysis
              sheets={filteredData.sheets}
              selectedCountry={marketCountryFilter}
              onCountryChange={setMarketCountryFilter}
              allCountries={allCountries}
            />

            <RemovalAnalysis sheets={filteredData.sheets} />

            <ContentOwnerAnalysis
              sheets={filteredData.sheets}
              allContentOwners={filteredData.contentOwners}
            />

            <DetailedContentOwnerBreakdown sheets={filteredData.sheets} />
          </div>
//         ) : null}
//       </main>
//     </div>
//   );
// }

        ) : null}
      </main>

      <Footer />
    </div>
  );
}
