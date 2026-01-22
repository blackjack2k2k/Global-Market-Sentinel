export enum ImpactType {
  BULLISH = 'BULLISH',
  BEARISH = 'BEARISH',
  NEUTRAL = 'NEUTRAL',
  VOLATILE = 'VOLATILE'
}

export enum Severity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface StockTicker {
  symbol: string;
  name: string;
  impact: ImpactType;
  reasoning: string;
}

export interface MarketEvent {
  id: string;
  title: string;
  summary: string;
  region: string;
  timestamp: string;
  severity: Severity;
  affectedStocks: StockTicker[];
  sources: { title: string; uri: string }[];
}

export interface UserSettings {
  email: string;
  frequency: 'realtime' | 'daily' | 'weekly';
  regions: string[];
  keywords: string[];
  isMonitoring: boolean;
}

export type ViewMode = 'news' | 'trends';