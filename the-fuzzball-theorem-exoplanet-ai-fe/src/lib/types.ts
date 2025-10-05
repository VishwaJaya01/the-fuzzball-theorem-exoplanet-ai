/**
 * Type definitions for the ExoFind application
 */

// API Status Types
export interface ApiStatus {
  isOnline: boolean;
  modelVersion: string | null;
  lastChecked: Date | null;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  isOnline: boolean;
  modelVersion: string | null;
  timestamp: string;
  services?: {
    api: string;
    ml_model: string;
    database: string;
  };
  backend?: {
    url: string;
    mode: string | null;
    model: string | null;
    isProbability: boolean;
  };
  error?: string;
}

// Component Props Types
export interface HeaderProps {
  onOpenAbout: () => void;
  onUploadClick: () => void;
}

// TESS Data Types
export interface TessLightCurve {
  time: number[];
  flux: number[];
  flux_err?: number[];
  quality?: number[];
}

export interface TessTarget {
  tic_id: string;
  sector: number;
  ra?: number;
  dec?: number;
  magnitude?: number;
  teff?: number;
  radius?: number;
  crowding?: number;
}

// Analysis Types
export interface TransitDetection {
  period: number;
  epoch: number;
  duration: number;
  depth: number;
  confidence: number;
  snr: number;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  target: TessTarget;
  detections: TransitDetection[];
  lightCurve: TessLightCurve;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  explain?: ExplainData;
}

// Plot Data Types
export interface PlotData {
  x: number[];
  y: number[];
  label?: string;
  color?: string;
}

export interface PeriodogramData {
  period: number[]; // Changed from frequencies for clarity
  power: number[];
  bestPeriod: number;
  bestPower: number;
  method?: 'BLS' | 'TLS'; // Optional method identifier
}

export interface PhaseFoldData {
  phase: number[];
  flux: number[];
  bins?: number;
}

// Input Panel Types
export interface PredictPayload {
  ticId?: string;
  sector?: number;
  csvData?: {
    time: number[];
    flux: number[];
    flux_err?: number[];
  };
  source: 'tic' | 'csv';
}

export interface PredictResult {
  id: string;
  status: 'success' | 'error';
  data?: AnalysisResult;
  error?: string;
}

export interface UploadPreview {
  fileName: string;
  rowCount: number;
  columns: string[];
  preview: Array<Record<string, string | number | null>>;
  isValid: boolean;
  errors?: string[];
}

export interface Example {
  id: string;
  label: string;
  type: 'tic' | 'csv';
  ticId?: string;
  sector?: number;
  fileUrl?: string;
  description?: string;
}

export interface InputPanelProps {
  onAnalysisComplete: (result: PredictResult) => void;
  onPredict?: (payload: PredictPayload) => Promise<PredictResult>;
  onUploadFile?: (file: File) => Promise<UploadPreview>;
  examples?: Example[];
}

// Status and Alert Types
export type StatusType = 'idle' | 'fetching' | 'processing' | 'analyzing' | 'scoring' | 'success' | 'error' | 'warning' | 'no-detection';

export interface StatusState {
  status: StatusType;
  message?: string;
  progress?: number;
  details?: string;
}

export interface StatusAlertsProps {
  status: StatusType;
  message?: string;
  progress?: number;
  details?: string;
  onDismiss?: () => void;
  detectionCount?: number;
  errorMessage?: string;
}

export interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
  message?: string;
}

// Results Card Types
export interface ResultsCardProps {
  result?: PredictResult;
  detections?: TransitDetection[];
  onCopyJson?: () => void;
  onDownloadCsv?: () => void;
  onCopyApiCurl?: () => void;
}

export interface TransitMetrics {
  period: number;
  duration: number;
  depth: number;
  snr: number;
  epoch?: number;
  confidence: number;
}

export interface DataQualityBadges {
  cleanData: boolean;
  lowCrowding: boolean;
  highSnr: boolean;
  adequateCoverage?: boolean;
}

export interface DetectionScore {
  score: number; // 0-1
  label: 'Highly Likely Planet' | 'Likely Planet' | 'Possible Planet' | 'Unlikely Planet' | 'No Transit Detected';
  confidence: 'high' | 'medium' | 'low';
  threshold: number;
}

// Plot Panel Types
export interface PlotsPanelProps {
  raw: TessLightCurve;
  flattened?: TessLightCurve;
  phaseFolded?: PhaseFoldData;
  periodogram?: PeriodogramData;
  detections?: TransitDetection[];
}

export interface LightCurvePoint {
  time: number;
  flux: number;
  flux_err?: number;
}

export interface PlotDataPoint {
  x: number;
  y: number;
  error?: number;
}

export interface ChartExportOptions {
  filename: string;
  format: 'png' | 'jpg' | 'svg';
  quality?: number;
}

// Explainability Types
export interface FeatureContribution {
  name: string;
  value: number;
}

export interface ExplainData {
  type: 'tree' | 'cnn';
  contributions?: FeatureContribution[];
  text?: string;
}

export interface WhyPanelProps {
  explain?: ExplainData;
}

// Star Metadata Types
export interface StarMetadata {
  tic: string;
  tmag?: number;
  teff?: number;
  radius?: number;
  crowding?: number;
  links?: {
    mast?: string;
    toi?: string;
  };
}

export interface StarMetaCardProps {
  meta: StarMetadata;
}

// Actions Menu Types
export interface ActionsMenuProps {
  result: PredictResult;
  apiUrl: string;
}

// History Compare Types
export interface HistoryItem {
  id: string;
  timestamp: string;
  ticId: string;
  sector?: number;
  score: number;
  detectionCount: number;
  result: PredictResult;
}

export interface HistoryCompareProps {
  history: HistoryItem[];
  onSelect?: (items: HistoryItem[]) => void;
  maxCompare?: number;
}

// Planet Simulation Types
export interface PlanetSimulationProps {
  detections: TransitDetection[];
  ticId: string;
}

