import { 
  AssetPair, 
  AssetScore,
  Candle, 
  CciIndicatorState, 
  ExhaustionFilterResult, 
  FractalDetection, 
  GapFilterResult, 
  MarketPivot,
  MarketTrend,
  PivotType,
  PullbackStatus,
  ServerNode, 
  SignalDirection,
  SniperSignal,
  TrendAnalysisResult,
} from '../types';

export const ASSET_PAIRS: AssetPair[] = [
  { id: 'eur_usd_otc', name: 'EUR/USD (OTC)', symbol: 'EURUSD-OTC', type: 'OTC', payout: 89, basePrice: 1.17040, decimals: 5, change24h: 0.42, isHot: true, activeId: 76 },
  { id: 'usd_brl_otc', name: 'USD/BRL (OTC)', symbol: 'USDBRL-OTC', type: 'OTC', payout: 84, basePrice: 5.0747, decimals: 4, change24h: 1.18, isHot: true, activeId: 2298 },
  { id: 'gbp_usd_otc', name: 'GBP/USD (OTC)', symbol: 'GBPUSD-OTC', type: 'OTC', payout: 89, basePrice: 1.37890, decimals: 5, change24h: 0.37, isHot: true, activeId: 81 },
  { id: 'usd_jpy_otc', name: 'USD/JPY (OTC)', symbol: 'USDJPY-OTC', type: 'OTC', payout: 89, basePrice: 156.280, decimals: 3, change24h: -0.25, isHot: true, activeId: 85 },
  { id: 'eur_jpy_otc', name: 'EUR/JPY (OTC)', symbol: 'EURJPY-OTC', type: 'OTC', payout: 89, basePrice: 181.850, decimals: 3, change24h: 0.48, activeId: 79 },
  { id: 'gbp_jpy_otc', name: 'GBP/JPY (OTC)', symbol: 'GBPJPY-OTC', type: 'OTC', payout: 89, basePrice: 210.770, decimals: 3, change24h: 0.62, isHot: true, activeId: 84 },
  { id: 'eur_gbp_otc', name: 'EUR/GBP (OTC)', symbol: 'EURGBP-OTC', type: 'OTC', payout: 89, basePrice: 0.86480, decimals: 5, change24h: -0.12, activeId: 77 },
  { id: 'aud_cad_otc', name: 'AUD/CAD (OTC)', symbol: 'AUDCAD-OTC', type: 'OTC', payout: 89, basePrice: 0.99710, decimals: 5, change24h: -0.19, activeId: 86 },
  { id: 'aud_usd_otc', name: 'AUD/USD (OTC)', symbol: 'AUDUSD-OTC', type: 'OTC', payout: 84, basePrice: 0.65840, decimals: 5, change24h: 0.34, activeId: 2111 },
  { id: 'usd_cad_otc', name: 'USD/CAD (OTC)', symbol: 'USDCAD-OTC', type: 'OTC', payout: 84, basePrice: 1.37120, decimals: 5, change24h: 0.25, activeId: 2112 },
  { id: 'usd_chf_otc', name: 'USD/CHF (OTC)', symbol: 'USDCHF-OTC', type: 'OTC', payout: 89, basePrice: 0.81740, decimals: 5, change24h: -0.28, activeId: 78 },
  { id: 'nzd_usd_otc', name: 'NZD/USD (OTC)', symbol: 'NZDUSD-OTC', type: 'OTC', payout: 89, basePrice: 0.65750, decimals: 5, change24h: 0.15, activeId: 80 },
  { id: 'eur_cad_otc', name: 'EUR/CAD (OTC)', symbol: 'EURCAD-OTC', type: 'OTC', payout: 84, basePrice: 1.48800, decimals: 5, change24h: 0.41, activeId: 2117 },
  { id: 'gbp_aud_otc', name: 'GBP/AUD (OTC)', symbol: 'GBPAUD-OTC', type: 'OTC', payout: 84, basePrice: 1.95400, decimals: 5, change24h: 0.76, activeId: 2116 },
  { id: 'aud_jpy_otc', name: 'AUD/JPY (OTC)', symbol: 'AUDJPY-OTC', type: 'OTC', payout: 84, basePrice: 102.560, decimals: 3, change24h: -0.10, activeId: 2113 },
  { id: 'cad_jpy_otc', name: 'CAD/JPY (OTC)', symbol: 'CADJPY-OTC', type: 'OTC', payout: 84, basePrice: 112.480, decimals: 3, change24h: 0.22, activeId: 2136 },
  { id: 'xau_usd_otc', name: 'XAU/USD (Ouro OTC)', symbol: 'XAUUSD-OTC', type: 'COMMODITIES', payout: 88, basePrice: 4515.50, decimals: 2, change24h: 1.85, isHot: true, activeId: 1857 },
  { id: 'silver_otc', name: 'SILVER (Prata OTC)', symbol: 'XAGUSD-OTC', type: 'COMMODITIES', payout: 88, basePrice: 67.10, decimals: 2, change24h: 1.05, activeId: 1858 },
  { id: 'crude_oil_otc', name: 'CRUDE OIL (Petróleo WTI OTC)', symbol: 'USOUSD-OTC', type: 'COMMODITIES', payout: 88, basePrice: 92.78, decimals: 2, change24h: -0.92, activeId: 1859 },
  { id: 'brent_oil_otc', name: 'BRENT OIL (Petróleo Brent OTC)', symbol: 'UKOUSD-OTC', type: 'COMMODITIES', payout: 84, basePrice: 96.40, decimals: 2, change24h: -0.74, activeId: 1931 },
  { id: 'btc_usd_otc', name: 'BTC/USD (Bitcoin OTC)', symbol: 'BTCUSD-OTC', type: 'CRYPTO', payout: 89, basePrice: 78840.00, decimals: 2, change24h: 3.94, isHot: true, activeId: 2270 },
  { id: 'btc_usd_real', name: 'BTC/USD (Bitcoin Real)', symbol: 'BTCUSD-op', type: 'CRYPTO', payout: 88, basePrice: 79680.00, decimals: 2, change24h: 3.82, isHot: true, activeId: 1916 },
  { id: 'eth_usd_otc', name: 'ETH/USD (Ethereum OTC)', symbol: 'ETHUSD-OTC', type: 'CRYPTO', payout: 88, basePrice: 2197.50, decimals: 2, change24h: 2.15, activeId: 1941 },
  { id: 'sol_usd_otc', name: 'SOL/USD (Solana OTC)', symbol: 'SOLUSD-OTC', type: 'CRYPTO', payout: 88, basePrice: 93.90, decimals: 2, change24h: 5.40, activeId: 1978 },
  { id: 'xrp_usd_otc', name: 'XRP/USD (Ripple OTC)', symbol: 'XRPUSD-OTC', type: 'CRYPTO', payout: 84, basePrice: 2.1520, decimals: 4, change24h: 1.80, activeId: 2107 },
];

export const INITIAL_SERVERS: ServerNode[] = [
  {
    id: 'srv-optgo-vip',
    name: 'Traderoom Gateway VIP',
    location: 'trade.optgobroker.com',
    country: 'GLOBAL',
    ping: 6,
    status: 'OPTIMAL',
    ipMasked: '104.26.***.18',
    role: 'Feed de cotações OTC e execução',
  },
  {
    id: 'srv-br-sp',
    name: 'Cluster Brasil (SP-01)',
    location: 'São Paulo, SP',
    country: 'BR',
    ping: 8,
    status: 'OPTIMAL',
    ipMasked: '177.54.***.12',
    role: 'Gateway de conexão',
  },
  {
    id: 'srv-us-ny',
    name: 'Cluster EUA (NYC-04)',
    location: 'New York',
    country: 'US',
    ping: 15,
    status: 'ONLINE',
    ipMasked: '198.51.***.44',
    role: 'Feed de mercado',
  },
  {
    id: 'srv-de-fra',
    name: 'Cluster Europa (FRA-02)',
    location: 'Frankfurt',
    country: 'DE',
    ping: 22,
    status: 'ONLINE',
    ipMasked: '194.12.***.89',
    role: 'Rota de contingência',
  },
];

export function generateCandles(asset: AssetPair, count = 60, intervalMs = 60_000): Candle[] {
  const result: Candle[] = [];
  const nowRounded = Math.floor(Date.now() / intervalMs) * intervalMs;
  const start = nowRounded - (count - 1) * intervalMs;
  let price = asset.basePrice;
  const volatility = Math.max(asset.basePrice * 0.0007, 10 ** -asset.decimals);

  for (let i = 0; i < count; i += 1) {
    const open = price;
    const change = (Math.random() - 0.49) * volatility;
    const close = +(open + change).toFixed(asset.decimals);
    const high = +(Math.max(open, close) + Math.random() * volatility * 0.7).toFixed(asset.decimals);
    const low = +(Math.min(open, close) - Math.random() * volatility * 0.7).toFixed(asset.decimals);

    result.push({
      time: start + i * intervalMs,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 400 + 80),
    });
    price = close;
  }
  return result;
}

/**
 * Retorna o horário atual formatado no Horário de Brasília (UTC-3)
 */
export function getBrasiliaTime(timestamp = Date.now()): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(timestamp));
  } catch {
    const d = new Date(timestamp - 3 * 3600 * 1000);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}`;
  }
}

/**
 * Verifica se estamos dentro da janela de abertura da vela M1 (primeiros 3 segundos: 00s a 03s).
 * O robô NUNCA entra se a vela já estiver em andamento (> 03s).
 */
export function isCandleOpeningWindow(timestamp = Date.now()): {
  allowed: boolean;
  second: number;
  reason?: string;
} {
  const d = new Date(timestamp);
  const second = d.getSeconds();
  const allowed = second <= 3;
  return {
    allowed,
    second,
    reason: allowed
      ? `Abertura confirmada (${second}s decorridos) • Execução permitida`
      : `Vela M1 já em andamento (${second}s decorridos) • Entrada bloqueada pelo robô`,
  };
}

/**
  * Janela de Entrada por Recuo/Pullback (Modo Melhor Taxa Posicionada):
  * O robô monitora a vela até o segundo 29 (antes dos 30s).
  * Aos 30s ou mais, se a vela não recuou para a cor favorável, a ordem expira por segurança.
  */
export function isPullbackWindowValid(timestamp = Date.now()): {
  allowed: boolean;
  second: number;
  remainingSeconds: number;
  reason: string;
} {
  const d = new Date(timestamp);
  const second = d.getSeconds();
  const allowed = second < 30;
  const remainingSeconds = Math.max(0, 30 - second);
  return {
    allowed,
    second,
    remainingSeconds,
    reason: allowed
      ? `Janela ativa (${remainingSeconds}s restantes antes dos 30s)`
      : `Tempo limite de 30s esgotado (${second}s decorridos) • Ordem cancelada para proteger capital`,
  };
}

/**
 * Valida se a vela atingiu a taxa posicionada (recuo favorável):
 * - Para COMPRA (CALL): Espera a vela ficar VERMELHA (preço atual < abertura) antes dos 30s.
 * - Para VENDA (PUT): Espera a vela ficar VERDE (preço atual > abertura) antes dos 30s.
 */
export function checkPullbackCondition(
  direction: SignalDirection,
  currentPrice: number,
  candleOpen: number,
  timestamp = Date.now()
): {
  satisfied: boolean;
  expired: boolean;
  second: number;
  remainingSeconds: number;
  candleColor: 'RED' | 'GREEN' | 'FLAT';
  message: string;
} {
  const d = new Date(timestamp);
  const second = d.getSeconds();
  const remainingSeconds = Math.max(0, 30 - second);
  const isExpired = second >= 30;

  const candleColor: 'RED' | 'GREEN' | 'FLAT' =
    currentPrice > candleOpen ? 'GREEN' : currentPrice < candleOpen ? 'RED' : 'FLAT';

  // Regra do Usuário:
  // CALL -> espera vela ficar vermelha (preço recuar abaixo da abertura)
  // PUT  -> espera vela ficar verde (preço esticar acima da abertura)
  const isTargetColor =
    (direction === 'CALL' && candleColor === 'RED') ||
    (direction === 'PUT' && candleColor === 'GREEN');

  if (isExpired) {
    return {
      satisfied: false,
      expired: true,
      second,
      remainingSeconds: 0,
      candleColor,
      message: `Tempo limite atingido (${second}s >= 30s). A vela não recuou para pegar a melhor taxa. Ordem cancelada!`,
    };
  }

  if (isTargetColor) {
    const diff = Math.abs(currentPrice - candleOpen);
    return {
      satisfied: true,
      expired: false,
      second,
      remainingSeconds,
      candleColor,
      message: direction === 'CALL'
        ? `Taxa ideal atingida! Vela ficou VERMELHA (${diff.toFixed(5)} abaixo da abertura). Executando COMPRA (CALL) com excelente taxa!`
        : `Taxa ideal atingida! Vela ficou VERDE (${diff.toFixed(5)} acima da abertura). Executando VENDA (PUT) no topo!`,
    };
  }

  return {
    satisfied: false,
    expired: false,
    second,
    remainingSeconds,
    candleColor,
    message: direction === 'CALL'
      ? `Aguardando vela ficar VERMELHA (< abertura) para melhor taxa de compra. Restam ${remainingSeconds}s.`
      : `Aguardando vela ficar VERDE (> abertura) para melhor taxa de venda. Restam ${remainingSeconds}s.`,
  };
}

/**
 * Indicador CCI with Arrow (conforme script Lua/QCS do usuário):
 * - Período: 4
 * - Fonte de Preço: 4 (Low)
 * - Nível Superior: 100
 * - Nível Inferior: -100
 * - Níveis Extremos: +200 / -200
 */
export function calculateCci(
  candles: Candle[],
  period = 4,
  sourceType = 4,
  levelHigh = 100,
  levelLow = -100
): { values: number[]; currentState: CciIndicatorState } {
  const getSrc = (c: Candle): number => {
    switch (sourceType) {
      case 1: return c.close;
      case 2: return c.open;
      case 3: return c.high;
      case 4: return c.low;
      case 5: return (c.high + c.low) / 2;
      case 6: return (c.high + c.low + c.close) / 3;
      case 7: return (c.open + c.high + c.low + c.close) / 4;
      default: return c.low;
    }
  };

  const srcValues = candles.map(getSrc);
  const cciValues: number[] = [];

  for (let i = 0; i < srcValues.length; i += 1) {
    if (i < period - 1) {
      cciValues.push(0);
      continue;
    }
    const window = srcValues.slice(i - period + 1, i + 1);
    const sma = window.reduce((a, b) => a + b, 0) / period;
    const mad = window.reduce((a, b) => a + Math.abs(b - sma), 0) / period;
    const cci = mad === 0 ? 0 : (srcValues[i] - sma) / (0.015 * mad);
    cciValues.push(+cci.toFixed(2));
  }

  const len = cciValues.length;
  const currentVal = len > 0 ? cciValues[len - 1] : 0;
  const prevVal = len > 1 ? cciValues[len - 2] : 0;
  const prev2Val = len > 2 ? cciValues[len - 3] : 0;

  // Sinais conforme script Lua oficial:
  // is_overbought = cci_val[1] >= level_high
  // is_oversold = cci_val[1] <= level_low
  // buy_signal = (crossunder(cci_val[1], level_low) or (cci_val[2] <= level_low and cci_val[1] > level_low))
  // sell_signal = (crossover(cci_val[1], level_high) or (cci_val[2] >= level_high and cci_val[1] < level_high))
  const isOverbought = prevVal >= levelHigh;
  const isOversold = prevVal <= levelLow;

  const buyArrow = (prev2Val <= levelLow && prevVal > levelLow) || (prevVal <= levelLow && currentVal > prevVal);
  const sellArrow = (prev2Val >= levelHigh && prevVal < levelHigh) || (prevVal >= levelHigh && currentVal < prevVal);

  let trendDirection: 'CALL' | 'PUT' | 'NEUTRAL' = 'NEUTRAL';
  if (buyArrow || (currentVal > prevVal && prevVal <= 0)) {
    trendDirection = 'CALL';
  } else if (sellArrow || (currentVal < prevVal && prevVal >= 0)) {
    trendDirection = 'PUT';
  }

  const currentState: CciIndicatorState = {
    value: currentVal,
    prevValue: prevVal,
    prev2Value: prev2Val,
    period,
    sourceType,
    sourceName: sourceType === 4 ? 'Low (Mínima)' : 'Close (Fechamento)',
    isOverbought,
    isOversold,
    buyArrow,
    sellArrow,
    trendDirection,
    confluenceMatches: false,
    confluenceReason: '',
  };

  return { values: cciValues, currentState };
}

/**
 * Filtro 1: Detecção de Vela de Exaustão (Vela muito grande anômala)
 * Se a vela que gerou o fractal for > 2.2x a média das últimas 14 velas, o robô rejeita.
 */
export function checkExhaustionCandle(candles: Candle[]): ExhaustionFilterResult {
  if (candles.length < 5) {
    return { passed: true, isExhaustion: false, candleRange: 0, avgRange: 0, ratio: 1, message: 'Histórico insuficiente' };
  }

  const fractalCandle = candles[candles.length - 2]; // Vela fechada [1]
  const candleRange = fractalCandle.high - fractalCandle.low;

  const sampleCandles = candles.slice(Math.max(0, candles.length - 16), candles.length - 2);
  const totalRange = sampleCandles.reduce((acc, c) => acc + (c.high - c.low), 0);
  const avgRange = sampleCandles.length > 0 ? totalRange / sampleCandles.length : candleRange;

  const ratio = avgRange > 0 ? +(candleRange / avgRange).toFixed(2) : 1;
  const isExhaustion = ratio >= 2.2;

  return {
    passed: !isExhaustion,
    isExhaustion,
    candleRange,
    avgRange,
    ratio,
    message: isExhaustion
      ? `Vela de exaustão detectada (${ratio}x maior que a média das últimas velas). Entrada cancelada por segurança.`
      : `Volume e amplitude de vela normais (${ratio}x a média).`,
  };
}

/**
 * Filtro 2: Detecção de Gap Forte na Abertura
 * Se houver gap expressivo entre o fechamento da vela anterior e a abertura da nova vela, cancela.
 */
export function checkGapFilter(candles: Candle[]): GapFilterResult {
  if (candles.length < 3) {
    return { passed: true, isStrongGap: false, gapSize: 0, maxAllowedGap: 0, message: 'Histórico insuficiente' };
  }

  const prev = candles[candles.length - 2];
  const current = candles[candles.length - 1];
  const gapSize = Math.abs(current.open - prev.close);

  const sampleCandles = candles.slice(Math.max(0, candles.length - 16), candles.length - 2);
  const totalRange = sampleCandles.reduce((acc, c) => acc + (c.high - c.low), 0);
  const avgRange = sampleCandles.length > 0 ? totalRange / sampleCandles.length : prev.high - prev.low;

  const maxAllowedGap = avgRange * 0.38;
  const isStrongGap = gapSize > maxAllowedGap && gapSize > 0.00015;

  return {
    passed: !isStrongGap,
    isStrongGap,
    gapSize,
    maxAllowedGap,
    message: isStrongGap
      ? `Gap forte detectado na abertura (${gapSize.toFixed(5)} > ${maxAllowedGap.toFixed(5)}). Entrada cancelada para evitar volatilidade de gap.`
      : `Abertura alinhada sem gap anômalo.`,
  };
}

/**
 * Calcula série EMA (Exponential Moving Average)
 */
export function calculateEmaSeries(values: number[], period: number): number[] {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    result.push(values[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

/**
 * Detecta pivôs de Price Action (Swing Highs e Swing Lows) e classifica:
 * - HH (Higher High / Topo Mais Alto)
 * - HL (Higher Low / Fundo Mais Alto)
 * - LH (Lower High / Topo Mais Baixo)
 * - LL (Lower Low / Fundo Mais Baixo)
 */
export function detectMarketPivots(candles: Candle[], lookback = 35): MarketPivot[] {
  if (candles.length < 5) return [];
  const subset = candles.slice(-lookback);
  const offset = candles.length - subset.length;
  const pivots: MarketPivot[] = [];

  let lastHighPrice: number | null = null;
  let lastLowPrice: number | null = null;

  for (let i = 2; i < subset.length - 1; i++) {
    const prev = subset[i - 1];
    const curr = subset[i];
    const next = subset[i + 1];

    // Swing High (Topo)
    if (curr.high > prev.high && curr.high >= next.high) {
      const isHigher = lastHighPrice === null || curr.high > lastHighPrice;
      const type: PivotType = isHigher ? 'HH' : 'LH';
      const label = isHigher ? 'HH (Topo +Alto)' : 'LH (Topo +Baixo)';
      lastHighPrice = curr.high;
      pivots.push({
        type,
        candleIndex: offset + i,
        time: curr.time,
        price: curr.high,
        label,
      });
    }

    // Swing Low (Fundo)
    if (curr.low < prev.low && curr.low <= next.low) {
      const isHigher = lastLowPrice === null || curr.low > lastLowPrice;
      const type: PivotType = isHigher ? 'HL' : 'LL';
      const label = isHigher ? 'HL (Fundo +Alto)' : 'LL (Fundo +Baixo)';
      lastLowPrice = curr.low;
      pivots.push({
        type,
        candleIndex: offset + i,
        time: curr.time,
        price: curr.low,
        label,
      });
    }
  }

  return pivots;
}

/**
 * Filtro de Tendência Macro e Micro + Estrutura Price Action (HL, LL, HH, LH)
 * Evita rigorosamente operar contra a força da tendência:
 * - CALL: permitida em Macro/Micro Alta ou quando há suporte em HL/HH
 * - PUT: permitida em Macro/Micro Baixa ou quando há resistência em LH/LL
 */
export function analyzeMarketTrendAndStructure(candles: Candle[]): TrendAnalysisResult {
  if (candles.length < 8) {
    return {
      macroTrend: 'LATERAL',
      microTrend: 'LATERAL',
      structure: 'LATERAL',
      pivots: [],
      lastPivot: null,
      macroEma: candles[candles.length - 1]?.close || 0,
      microEma: candles[candles.length - 1]?.close || 0,
      strengthPercent: 50,
      alignedDirection: 'NEUTRAL',
      passed: true,
      message: 'Histórico inicial para análise de tendência',
    };
  }

  const closes = candles.map((c) => c.close);
  const currentPrice = closes[closes.length - 1];

  // Micro Trend: EMA 14
  const microPeriod = Math.min(14, Math.floor(closes.length / 2));
  const microEmaSeries = calculateEmaSeries(closes, microPeriod);
  const currentMicroEma = microEmaSeries[microEmaSeries.length - 1];
  const prevMicroEma = microEmaSeries[Math.max(0, microEmaSeries.length - 3)];

  // Macro Trend: EMA 40 (ou proporcional ao histórico)
  const macroPeriod = Math.min(40, Math.max(10, Math.floor(closes.length * 0.7)));
  const macroEmaSeries = calculateEmaSeries(closes, macroPeriod);
  const currentMacroEma = macroEmaSeries[macroEmaSeries.length - 1];
  const prevMacroEma = macroEmaSeries[Math.max(0, macroEmaSeries.length - 5)];

  // Classificação Macro
  let macroTrend: MarketTrend = 'LATERAL';
  const macroDiff = currentPrice - currentMacroEma;
  const macroThreshold = currentMacroEma * 0.00015;
  if (macroDiff > macroThreshold && currentMacroEma >= prevMacroEma) {
    macroTrend = 'ALTA';
  } else if (macroDiff < -macroThreshold && currentMacroEma <= prevMacroEma) {
    macroTrend = 'BAIXA';
  }

  // Classificação Micro
  let microTrend: MarketTrend = 'LATERAL';
  const microDiff = currentPrice - currentMicroEma;
  const microThreshold = currentMicroEma * 0.0001;
  if (microDiff > microThreshold && currentMicroEma >= prevMicroEma) {
    microTrend = 'ALTA';
  } else if (microDiff < -microThreshold && currentMicroEma <= prevMicroEma) {
    microTrend = 'BAIXA';
  }

  // Análise de Estrutura Price Action (HL, LL, HH, LH)
  const pivots = detectMarketPivots(candles, 35);
  const recentPivots = pivots.slice(-4);
  const lastPivot = pivots[pivots.length - 1] || null;

  let hhCount = 0;
  let hlCount = 0;
  let lhCount = 0;
  let llCount = 0;

  for (const p of recentPivots) {
    if (p.type === 'HH') hhCount++;
    if (p.type === 'HL') hlCount++;
    if (p.type === 'LH') lhCount++;
    if (p.type === 'LL') llCount++;
  }

  let structure: 'HH_HL' | 'LH_LL' | 'LATERAL' = 'LATERAL';
  if ((hlCount >= 1 || hhCount >= 1) && hlCount + hhCount > lhCount + llCount) {
    structure = 'HH_HL'; // Bullish structure
  } else if ((lhCount >= 1 || llCount >= 1) && lhCount + llCount > hlCount + hlCount) {
    structure = 'LH_LL'; // Bearish structure
  }

  // Força / Momentum (%)
  let strength = 50;
  if (macroTrend === 'ALTA' && microTrend === 'ALTA') strength += 25;
  else if (macroTrend === 'BAIXA' && microTrend === 'BAIXA') strength += 25;
  else if (macroTrend === microTrend && macroTrend !== 'LATERAL') strength += 15;

  if (structure === 'HH_HL' && (macroTrend === 'ALTA' || microTrend === 'ALTA')) strength += 20;
  else if (structure === 'LH_LL' && (macroTrend === 'BAIXA' || microTrend === 'BAIXA')) strength += 20;

  strength = Math.min(99, Math.max(35, strength));

  let alignedDirection: SignalDirection | 'NEUTRAL' = 'NEUTRAL';
  if ((macroTrend === 'ALTA' || microTrend === 'ALTA') && structure !== 'LH_LL') {
    alignedDirection = 'CALL';
  } else if ((macroTrend === 'BAIXA' || microTrend === 'BAIXA') && structure !== 'HH_HL') {
    alignedDirection = 'PUT';
  }

  const message = `Macro: ${macroTrend} • Micro: ${microTrend} • Estrutura: ${structure === 'HH_HL' ? 'Alta (HH/HL)' : structure === 'LH_LL' ? 'Baixa (LH/LL)' : 'Lateral'}`;

  return {
    macroTrend,
    microTrend,
    structure,
    pivots,
    lastPivot,
    macroEma: currentMacroEma,
    microEma: currentMicroEma,
    strengthPercent: strength,
    alignedDirection,
    passed: true,
    message,
  };
}

/**
 * Period 1 Fractal:
 * [2] Left candle
 * [1] Center closed candle
 * [0] Newly opened confirmation candle
 *
 * Buy Fractal:  low[1] < low[2] && low[1] < low[0]  => Call on open of [0]
 * Sell Fractal: high[1] > high[2] && high[1] > high[0] => Put on open of [0]
 */
export function detectPeriodOneFractal(candles: Candle[]): FractalDetection {
  if (!candles || candles.length < 3) {
    return {
      isBuyFractal: false,
      isSellFractal: false,
      centerCandle: null,
      confirmationCandle: candles?.[candles.length - 1] ?? null,
      leftCandle: null,
      signalAtOpen: false,
      message: 'Aguardando três velas M1 para confirmar o fractal...',
    };
  }

  const current = candles[candles.length - 1]; // [0]
  const prev1 = candles[candles.length - 2];   // [1]
  const prev2 = candles[candles.length - 3];   // [2]

  const isBuy = prev1.low < prev2.low && prev1.low < current.low;
  const isSell = prev1.high > prev2.high && prev1.high > current.high;

  let message = 'Sem fractal confirmado nesta abertura M1.';
  if (isBuy && isSell) {
    message = 'Fractal de compra e venda simultâneos: mercado indefinido.';
  } else if (isBuy) {
    message = 'Fractal de compra (fundo suporte na vela [1]): Estratégia ativada para VENDA (PUT) na abertura.';
  } else if (isSell) {
    message = 'Fractal de venda (topo resistência na vela [1]): Estratégia ativada para COMPRA (CALL) na abertura.';
  }

  return {
    isBuyFractal: isBuy,
    isSellFractal: isSell,
    centerCandle: prev1,
    confirmationCandle: current,
    leftCandle: prev2,
    signalAtOpen: isBuy !== isSell,
    message,
  };
}

/**
 * Cria o sinal Sniper com Confluência Fractal P1 + Indicador CCI with Arrow + Filtros de Exaustão, Gap e Tendência Macro/Micro
 * 
 * ESTRATÉGIA SOLICITADA PELO USUÁRIO:
 * - Quando aparece Fractal de Compra (fundo virou suporte na vela fechada [1]) -> Robô entra em VENDA (PUT) na abertura da vela [0]
 * - Quando aparece Fractal de Venda (topo virou resistência na vela fechada [1]) -> Robô entra em COMPRA (CALL) na abertura da vela [0]
 */
export function createFractalSignal(
  asset: AssetPair, 
  candles: Candle[], 
  openPrice?: number,
  pullbackMode = false
): SniperSignal | null {
  const fractal = detectPeriodOneFractal(candles);
  // Inversão estratégica conforme solicitação do usuário:
  // Fractal de Compra (fundo suporte) => ENTRADA EM VENDA (PUT)
  // Fractal de Venda (topo resistência) => ENTRADA EM COMPRA (CALL)
  const direction: SignalDirection | null = fractal.isBuyFractal ? 'PUT' : fractal.isSellFractal ? 'CALL' : null;
  if (!direction || !fractal.confirmationCandle || !fractal.centerCandle) return null;

  // 1. Filtro de Vela de Exaustão
  const exhaustionFilter = checkExhaustionCandle(candles);
  if (!exhaustionFilter.passed) {
    console.log(`[Filtro Exaustão] Sinal ${direction} descartado: ${exhaustionFilter.message}`);
    return null;
  }

  // 2. Filtro de Gap Forte
  const gapFilter = checkGapFilter(candles);
  if (!gapFilter.passed) {
    console.log(`[Filtro Gap] Sinal ${direction} descartado: ${gapFilter.message}`);
    return null;
  }

  // 3. Confluência com CCI with Arrow
  const { currentState: cciState } = calculateCci(candles, 4, 4, 100, -100);

  const isCall = direction === 'CALL';
  const level = fractal.isBuyFractal ? fractal.centerCandle.low : fractal.centerCandle.high;

  // Validação da confluência: o CCI deve apontar na direção da operação a ser executada
  const cciConfirmed = isCall
    ? (cciState.buyArrow || cciState.value > cciState.prevValue || cciState.isOversold)
    : (cciState.sellArrow || cciState.value < cciState.prevValue || cciState.isOverbought);

  if (!cciConfirmed) {
    console.log(`[Confluência CCI] Sinal ${direction} rejeitado: CCI (${cciState.value}) não aponta para ${direction}`);
    return null;
  }

  // 4. Filtro de Tendência Macro e Micro + Estrutura (HH, HL, LH, LL)
  const trendAnalysis = analyzeMarketTrendAndStructure(candles);

  // Regra Anti-Contra-Tendência: O robô JAMAIS opera contra a força da tendência principal
  if (direction === 'CALL') {
    if (trendAnalysis.macroTrend === 'BAIXA' && trendAnalysis.microTrend === 'BAIXA') {
      console.log(`[Filtro Tendência] CALL bloqueado: Mercado em tendência forte de baixa (Macro e Micro BAIXA). Operação contra a força.`);
      return null;
    }
    if (trendAnalysis.structure === 'LH_LL' && trendAnalysis.macroTrend === 'BAIXA') {
      console.log(`[Filtro Tendência] CALL bloqueado: Estrutura de topos e fundos descendentes (LH/LL).`);
      return null;
    }
  } else if (direction === 'PUT') {
    if (trendAnalysis.macroTrend === 'ALTA' && trendAnalysis.microTrend === 'ALTA') {
      console.log(`[Filtro Tendência] PUT bloqueado: Mercado em tendência forte de alta (Macro e Micro ALTA). Operação contra a força.`);
      return null;
    }
    if (trendAnalysis.structure === 'HH_HL' && trendAnalysis.macroTrend === 'ALTA') {
      console.log(`[Filtro Tendência] PUT bloqueado: Estrutura de topos e fundos ascendentes (HH/HL).`);
      return null;
    }
  }

  cciState.confluenceMatches = true;
  cciState.confluenceReason = isCall
    ? `CCI (${cciState.value.toFixed(1)}) confirmando COMPRA (CALL) originada de Fractal de Venda (Fonte Low)`
    : `CCI (${cciState.value.toFixed(1)}) confirmando VENDA (PUT) originada de Fractal de Compra (Fonte Low)`;

  const brasiliaTime = getBrasiliaTime(fractal.confirmationCandle.time);

  const factors = [
    `Gatilho Fractal: ${fractal.isBuyFractal ? 'Fractal Compra (Fundo Suporte)' : 'Fractal Venda (Topo Resistência)'} em ${level.toFixed(asset.decimals)}`,
    `Estratégia Invertida: Entrada em ${isCall ? 'COMPRA (CALL)' : 'VENDA (PUT)'}`,
    `CCI with Arrow (P4, Low): ${cciState.value.toFixed(1)} ${cciState.buyArrow ? '▲ Seta Compra' : cciState.sellArrow ? '▼ Seta Venda' : 'alinhado'}`,
    `Tendência: Macro ${trendAnalysis.macroTrend} • Micro ${trendAnalysis.microTrend} (Força ${trendAnalysis.strengthPercent}%)`,
    `Estrutura Price Action: ${trendAnalysis.structure === 'HH_HL' ? 'Zonas de Alta (HH/HL)' : trendAnalysis.structure === 'LH_LL' ? 'Zonas de Baixa (LH/LL)' : 'Consolidação'}`,
    trendAnalysis.lastPivot ? `Pivô: ${trendAnalysis.lastPivot.label} (${trendAnalysis.lastPivot.price.toFixed(asset.decimals)})` : 'Pivô inicial rastreado',
    `Filtro Anti-Exaustão Aprovado (${exhaustionFilter.ratio}x a média)`,
    `Filtro Anti-Gap Aprovado (Sem gap de abertura)`,
  ];

  if (pullbackMode) {
    factors.push(
      isCall
        ? 'Taxa Posicionada: Aguardando vela ficar VERMELHA (< abertura) antes dos 30s'
        : 'Taxa Posicionada: Aguardando vela ficar VERDE (> abertura) antes dos 30s'
    );
    factors.push('Filtro Limite 30s: Se não recuar até os 30s da vela, a ordem é cancelada pelo robô');
  } else {
    factors.push('Entrada direta sincronizada nos primeiros 3s da abertura M1 (Horário de Brasília)');
  }

  return {
    id: `sig-fractal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    assetId: asset.id,
    assetName: asset.name,
    direction,
    timeframe: 'M1',
    entryTime: `${brasiliaTime} (UTC-3)`,
    countdownSeconds: 60,
    confidence: Math.min(100, Math.round(trendAnalysis.strengthPercent)),
    entryPrice: openPrice ?? fractal.confirmationCandle.open,
    confluenceFactors: factors,
    status: 'READY',
    payout: asset.payout,
    createdAt: Date.now(),
    fractal,
    signalAtOpen: !pullbackMode,
    cciState,
    exhaustionFilter,
    gapFilter,
    trendAnalysis,
    pullbackEnabled: pullbackMode,
    pullbackStatus: pullbackMode ? 'WAITING_PULLBACK' : 'IMMEDIATE',
    pullbackRequiredColor: isCall ? 'RED' : 'GREEN',
    pullbackRemainingSeconds: 30,
  };
}

/**
 * Avalia a qualidade de um par de ativos para determinar se é o melhor momento para negociá-lo.
 * Considera:
 * 1. Payout (25% peso)
 * 2. Força e Alinhamento de Tendência Macro/Micro (35% peso)
 * 3. Presença de setup Fractal / CCI em andamento (30% peso)
 * 4. Penalidades de exaustão e gap (10% peso)
 */
export function evaluateAssetQuality(asset: AssetPair, candles: Candle[]): AssetScore {
  if (!candles || candles.length < 5) {
    return {
      asset,
      score: 40,
      payout: asset.payout,
      trendStrength: 50,
      reason: 'Histórico de velas curto',
      hasSetup: false,
    };
  }

  const trend = analyzeMarketTrendAndStructure(candles);
  const fractal = detectPeriodOneFractal(candles);
  const exhaustion = checkExhaustionCandle(candles);
  const gap = checkGapFilter(candles);

  let score = 0;

  // 1. Payout (até 25 pts)
  const payoutScore = (asset.payout / 100) * 25;
  score += payoutScore;

  // 2. Tendência e Força (até 35 pts)
  const trendScore = (trend.strengthPercent / 100) * 25;
  score += trendScore;
  if (trend.macroTrend === trend.microTrend && trend.macroTrend !== 'LATERAL') {
    score += 10; // Macro e micro perfeitamente alinhadas
  }

  // 3. Setup Fractal ativo / próximo (até 30 pts)
  let hasSetup = false;
  let setupReason = 'Monitorando formação';
  if (fractal.isBuyFractal || fractal.isSellFractal) {
    score += 30;
    hasSetup = true;
    setupReason = fractal.isBuyFractal 
      ? 'Fractal de Fundo ativo (Oportunidade VENDA/PUT)' 
      : 'Fractal de Topo ativo (Oportunidade COMPRA/CALL)';
  } else {
    // Verifica se a vela anterior já está fazendo topo/fundo potencial
    const last1 = candles[candles.length - 2];
    const last2 = candles[candles.length - 3];
    if (last1 && last2 && Math.abs(last1.high - last2.high) > 0.0002) {
      score += 10;
      setupReason = 'Formação de padrão em andamento';
    }
  }

  // 4. Penalidades
  if (!exhaustion.passed) score -= 25;
  if (!gap.passed) score -= 25;

  const finalScore = Math.max(10, Math.min(100, Math.round(score)));

  return {
    asset,
    score: finalScore,
    payout: asset.payout,
    trendStrength: trend.strengthPercent,
    reason: setupReason,
    hasSetup,
  };
}

/**
 * Seleciona o melhor ativo da lista para rotação inteligente.
 */
export function selectBestAsset(
  assets: AssetPair[], 
  candlesGetter: (asset: AssetPair) => Candle[], 
  currentAssetId?: string
): { bestAsset: AssetPair; score: AssetScore; allScores: AssetScore[] } | null {
  if (!assets || assets.length === 0) return null;

  const scores: AssetScore[] = assets.map((asset) => {
    const candles = candlesGetter(asset);
    return evaluateAssetQuality(asset, candles);
  });

  scores.sort((a, b) => {
    // Prioriza os que têm setup confirmado
    if (a.hasSetup && !b.hasSetup) return -1;
    if (!a.hasSetup && b.hasSetup) return 1;
    // Em seguida pelo score geral
    return b.score - a.score;
  });

  const bestScore = scores[0];
  return {
    bestAsset: bestScore.asset,
    score: bestScore,
    allScores: scores,
  };
}
