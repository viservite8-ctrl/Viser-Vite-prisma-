export type SignalDirection = 'CALL' | 'PUT';

export type Timeframe = 'M1';

export type SignalStatus = 'READY' | 'ANALYZING' | 'WIN' | 'LOSS';

export type AccountMode = 'REAL' | 'DEMO';

export type BrokerExecutionMode = 'OFF' | 'DEMO' | 'REAL';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FractalDetection {
  isBuyFractal: boolean;
  isSellFractal: boolean;
  centerCandle: Candle | null;
  confirmationCandle: Candle | null;
  leftCandle: Candle | null;
  signalAtOpen: boolean;
  message: string;
}

export interface CciIndicatorState {
  value: number;
  prevValue: number;
  prev2Value: number;
  period: number;
  sourceType: number;
  sourceName: string;
  isOverbought: boolean;
  isOversold: boolean;
  buyArrow: boolean;
  sellArrow: boolean;
  trendDirection: 'CALL' | 'PUT' | 'NEUTRAL';
  confluenceMatches: boolean;
  confluenceReason: string;
}

export interface ExhaustionFilterResult {
  passed: boolean;
  isExhaustion: boolean;
  candleRange: number;
  avgRange: number;
  ratio: number;
  message: string;
}

export interface GapFilterResult {
  passed: boolean;
  isStrongGap: boolean;
  gapSize: number;
  maxAllowedGap: number;
  message: string;
}

export type MarketTrend = 'ALTA' | 'BAIXA' | 'LATERAL';
export type PivotType = 'HH' | 'HL' | 'LH' | 'LL';
export type PullbackStatus = 'WAITING_PULLBACK' | 'EXECUTED_PULLBACK' | 'EXPIRED_PULLBACK' | 'IMMEDIATE';

export interface MarketPivot {
  type: PivotType;
  candleIndex: number;
  time: number;
  price: number;
  label: string;
}

export interface TrendAnalysisResult {
  macroTrend: MarketTrend;
  microTrend: MarketTrend;
  structure: 'HH_HL' | 'LH_LL' | 'LATERAL';
  pivots: MarketPivot[];
  lastPivot: MarketPivot | null;
  macroEma: number;
  microEma: number;
  strengthPercent: number;
  alignedDirection: SignalDirection | 'NEUTRAL';
  passed: boolean;
  message: string;
}

export interface AssetScore {
  asset: AssetPair;
  score: number;
  payout: number;
  trendStrength: number;
  reason: string;
  hasSetup: boolean;
}

export interface SniperSignal {
  id: string;
  assetId: string;
  assetName: string;
  direction: SignalDirection;
  timeframe: Timeframe;
  entryTime: string;
  countdownSeconds: number;
  confidence: number;
  entryPrice?: number;
  exitPrice?: number;
  confluenceFactors: string[];
  status: SignalStatus;
  result?: 'WIN' | 'LOSS';
  payout: number;
  createdAt: number;
  diff?: number;
  fractal?: FractalDetection;
  signalAtOpen?: boolean;
  cciState?: CciIndicatorState;
  exhaustionFilter?: ExhaustionFilterResult;
  gapFilter?: GapFilterResult;
  trendAnalysis?: TrendAnalysisResult;
  pullbackEnabled?: boolean;
  pullbackStatus?: PullbackStatus;
  pullbackRequiredColor?: 'RED' | 'GREEN';
  pullbackRemainingSeconds?: number;
  pullbackTriggerPrice?: number;
}

export interface AssetPair {
  id: string;
  name: string;
  symbol: string;
  type: 'OTC' | 'CRYPTO' | 'COMMODITIES' | 'FOREX';
  payout: number;
  basePrice: number;
  decimals: number;
  change24h: number;
  isHot?: boolean;
  activeId?: number;
}

export interface TradeOrder {
  id: string;
  assetName: string;
  direction: SignalDirection;
  amount: number;
  entryPrice: number;
  exitPrice?: number;
  payout: number;
  timeframe: Timeframe;
  timestamp: number;
  status: 'OPEN' | 'WON' | 'LOST';
  accountMode: AccountMode;
  profit?: number;
  brokerOptionId?: string | number;
  executedOnBroker?: boolean;
}

export interface ServerNode {
  id: string;
  name: string;
  location: string;
  country: string;
  ping: number;
  status: 'ONLINE' | 'OPTIMAL' | 'STANDBY';
  ipMasked: string;
  role: string;
}

export interface BrokerSession {
  ssid: string;
  email?: string;
  password?: string;
  rememberCredentials?: boolean;
  accountMode: AccountMode;
  realBalance: number;
  demoBalance: number;
  userName?: string;
  userId?: string | number;
  currency?: string;
  isConnected: boolean;
  latencyMs: number;
  lastSync: number;
  serverUrl?: string;
}

export interface BrokerExecutionResult {
  success: boolean;
  optionId?: string | number;
  activeId?: number;
  direction?: string;
  amount?: number;
  expired?: number;
  userBalanceId?: number;
  accountMode?: string;
  message?: string;
  error?: string;
}
