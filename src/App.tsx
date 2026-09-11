import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Clock,
  History,
  KeyRound,
  Layers,
  Radar,
  Server,
  ShieldCheck,
  Target,
} from 'lucide-react';
import {
  AccountMode,
  AssetPair,
  BrokerExecutionMode,
  BrokerExecutionResult,
  BrokerSession,
  Candle,
  FractalDetection,
  ServerNode,
  SignalDirection,
  SniperSignal,
  TradeOrder,
} from './types';
import {
  ASSET_PAIRS,
  INITIAL_SERVERS,
  analyzeMarketTrendAndStructure,
  calculateCci,
  checkExhaustionCandle,
  checkGapFilter,
  checkPullbackCondition,
  createFractalSignal,
  detectPeriodOneFractal,
  evaluateAssetQuality,
  generateCandles,
  getBrasiliaTime,
  isCandleOpeningWindow,
  isPullbackWindowValid,
  selectBestAsset,
} from './utils/marketData';
import { brokerStream } from './services/brokerStream';
import { Header } from './components/Header';
import { ChartCanvas } from './components/ChartCanvas';
import { FloatingSniperPanel } from './components/FloatingSniperPanel';
import { BrokerOrderPanel } from './components/BrokerOrderPanel';
import { ServerClusterModal } from './components/ServerClusterModal';
import { SignalHistoryDrawer } from './components/SignalHistoryDrawer';
import { SsidConnectionModal } from './components/SsidConnectionModal';
import { sound } from './utils/audio';

const M1_MS = 60_000;

function readBoolean(key: string, fallback: boolean): boolean {
  try {
    const saved = localStorage.getItem(key);
    return saved === null ? fallback : saved === 'true';
  } catch {
    return fallback;
  }
}

export default function App() {
  const [allAssets, setAllAssets] = useState<AssetPair[]>(ASSET_PAIRS);
  const [currentAsset, setCurrentAsset] = useState<AssetPair>(ASSET_PAIRS[0]);
  const [candles, setCandles] = useState<Candle[]>(() => generateCandles(ASSET_PAIRS[0], 70));
  const [currentPrice, setCurrentPrice] = useState<number>(ASSET_PAIRS[0].basePrice);
  const [session, setSession] = useState<BrokerSession>(() => brokerStream.getSession());
  const [ssidModalOpen, setSsidModalOpen] = useState(false);
  const [serverModalOpen, setServerModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [isFloatingOpen, setIsFloatingOpen] = useState(true);
  const [servers, setServers] = useState<ServerNode[]>(INITIAL_SERVERS);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(() => readBoolean('fractal_auto_trade_enabled', true));
  const [autoScannerEnabled, setAutoScannerEnabled] = useState(() => readBoolean('fractal_auto_scanner_enabled', true));
  const [pullbackEntryEnabled, setPullbackEntryEnabled] = useState(() => readBoolean('fractal_pullback_entry_enabled', true));
  const [autoAssetRotationEnabled, setAutoAssetRotationEnabled] = useState(() => readBoolean('fractal_auto_asset_rotation_enabled', true));
  const [rotationNotice, setRotationNotice] = useState<string | null>(null);
  const [brokerExecutionMode, setBrokerExecutionMode] = useState<BrokerExecutionMode>(() => {
    try {
      const saved = localStorage.getItem('fractal_execution_mode');
      return saved === 'OFF' || saved === 'DEMO' || saved === 'REAL' ? saved : 'DEMO';
    } catch {
      return 'DEMO';
    }
  });
  const [activeSignal, setActiveSignal] = useState<SniperSignal | null>(null);
  const [fractal, setFractal] = useState<FractalDetection>(() => detectPeriodOneFractal(candles));
  const [isExecutingBroker, setIsExecutingBroker] = useState(false);
  const [lastBrokerResult, setLastBrokerResult] = useState<BrokerExecutionResult | null>(null);
  const [tradeAmount, setTradeAmount] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('fractal_trade_amount'));
      return Number.isFinite(saved) && saved > 0 ? saved : 5;
    } catch {
      return 5;
    }
  });
  const [recentOrders, setRecentOrders] = useState<TradeOrder[]>(() => {
    try {
      const saved = localStorage.getItem('fractal_m1_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [signalHistory, setSignalHistory] = useState<SniperSignal[]>(() => {
    try {
      const saved = localStorage.getItem('fractal_m1_signals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const candlesRef = useRef(candles);
  const currentAssetRef = useRef(currentAsset);
  const allAssetsRef = useRef(allAssets);
  const currentPriceRef = useRef(currentPrice);
  const sessionRef = useRef(session);
  const executionModeRef = useRef(brokerExecutionMode);
  const autoTradeRef = useRef(autoTradeEnabled);
  const autoScannerRef = useRef(autoScannerEnabled);
  const pullbackEntryRef = useRef(pullbackEntryEnabled);
  const autoAssetRotationRef = useRef(autoAssetRotationEnabled);
  const recentOrdersRef = useRef(recentOrders);
  const activeSignalRef = useRef(activeSignal);
  const fractalRef = useRef(fractal);
  const tradeAmountRef = useRef(tradeAmount);
  const processedCandleTimeRef = useRef<number | null>(null);
  const clearSignalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const assetCandlesMapRef = useRef<Record<string, Candle[]>>({});

  candlesRef.current = candles;
  currentAssetRef.current = currentAsset;
  allAssetsRef.current = allAssets;
  currentPriceRef.current = currentPrice;
  sessionRef.current = session;
  executionModeRef.current = brokerExecutionMode;
  autoTradeRef.current = autoTradeEnabled;
  autoScannerRef.current = autoScannerEnabled;
  pullbackEntryRef.current = pullbackEntryEnabled;
  autoAssetRotationRef.current = autoAssetRotationEnabled;
  recentOrdersRef.current = recentOrders;
  activeSignalRef.current = activeSignal;
  fractalRef.current = fractal;
  tradeAmountRef.current = tradeAmount;

  const stats = useMemo(() => {
    const resolvedSignals = signalHistory.filter((signal) => signal.status === 'WIN' || signal.status === 'LOSS');
    const resolvedOrders = recentOrders.filter((order) => order.status === 'WON' || order.status === 'LOST');
    const wins = resolvedSignals.filter((signal) => signal.status === 'WIN').length + resolvedOrders.filter((order) => order.status === 'WON').length;
    const losses = resolvedSignals.filter((signal) => signal.status === 'LOSS').length + resolvedOrders.filter((order) => order.status === 'LOST').length;
    const total = wins + losses;
    return { wins, losses, winrate: total ? +((wins / total) * 100).toFixed(1) : 100 };
  }, [recentOrders, signalHistory]);

  useEffect(() => {
    try { localStorage.setItem('fractal_m1_orders', JSON.stringify(recentOrders)); } catch {}
  }, [recentOrders]);

  useEffect(() => {
    try { localStorage.setItem('fractal_m1_signals', JSON.stringify(signalHistory)); } catch {}
  }, [signalHistory]);

  useEffect(() => {
    try { localStorage.setItem('fractal_auto_trade_enabled', String(autoTradeEnabled)); } catch {}
  }, [autoTradeEnabled]);

  useEffect(() => {
    try { localStorage.setItem('fractal_auto_scanner_enabled', String(autoScannerEnabled)); } catch {}
  }, [autoScannerEnabled]);

  useEffect(() => {
    try { localStorage.setItem('fractal_pullback_entry_enabled', String(pullbackEntryEnabled)); } catch {}
  }, [pullbackEntryEnabled]);

  useEffect(() => {
    try { localStorage.setItem('fractal_auto_asset_rotation_enabled', String(autoAssetRotationEnabled)); } catch {}
  }, [autoAssetRotationEnabled]);

  useEffect(() => {
    if (candles.length > 0) brokerStream.connectAsset(currentAsset, candles[candles.length - 1]);
  }, [currentAsset]);

  const handlePlaceTrade = async (
    direction: SignalDirection,
    amount: number,
    targetAsset: AssetPair = currentAssetRef.current,
    options?: { isPullback?: boolean }
  ) => {
    if (options?.isPullback) {
      const pbCheck = isPullbackWindowValid();
      if (!pbCheck.allowed) {
        sound.playError();
        setLastBrokerResult({
          success: false,
          error: `Entrada bloqueada: tempo de recuo esgotado (${pbCheck.second}s >= 30s).`,
        });
        return;
      }
    } else {
      const openingCheck = isCandleOpeningWindow();
      if (!openingCheck.allowed) {
        sound.playError();
        setLastBrokerResult({
          success: false,
          error: `Entrada bloqueada: vela M1 já em andamento (${openingCheck.second}s). O robô só entra nos primeiros 3s da abertura (00s-03s, Horário de Brasília UTC-3).`,
        });
        return;
      }
    }

    const mode = executionModeRef.current;
    const currentSession = sessionRef.current;
    const isReal = mode === 'REAL' || (mode === 'OFF' && currentSession.accountMode === 'REAL');
    const availableBalance = isReal ? currentSession.realBalance : currentSession.demoBalance;
    const minimum = currentSession.currency === 'BRL' ? 5 : 1;
    if (amount < minimum || (mode !== 'OFF' && amount > availableBalance)) {
      sound.playError();
      return;
    }

    const entryPrice = currentPriceRef.current;
    const order: TradeOrder = {
      id: `ord-fractal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      assetName: targetAsset.name,
      direction,
      amount,
      entryPrice,
      payout: targetAsset.payout,
      timeframe: 'M1',
      timestamp: Date.now(),
      status: 'OPEN',
      accountMode: isReal ? 'REAL' : 'DEMO',
      executedOnBroker: mode !== 'OFF',
    };
    setRecentOrders((orders) => [order, ...orders]);

    const updatedBalance = isReal
      ? brokerStream.updateSession({ realBalance: +(currentSession.realBalance - amount).toFixed(2) })
      : brokerStream.updateSession({ demoBalance: +(currentSession.demoBalance - amount).toFixed(2) });
    setSession(updatedBalance);

    if (mode !== 'OFF') {
      setIsExecutingBroker(true);
      try {
        const result = await brokerStream.executeOption({
          activeId: targetAsset.activeId || 76,
          direction,
          amount,
          accountMode: mode === 'REAL' ? 'REAL' : 'DEMO',
          expired: 60,
          profitPercent: targetAsset.payout,
        });
        setLastBrokerResult(result);
        setIsExecutingBroker(false);
        if (result.success) {
          sound.playBeep();
          setRecentOrders((orders) => orders.map((item) => item.id === order.id ? { ...item, brokerOptionId: result.optionId, executedOnBroker: true } : item));
        } else {
          sound.playError();
        }
      } catch (error: any) {
        setIsExecutingBroker(false);
        setLastBrokerResult({ success: false, error: error?.message || 'Erro de comunicação com a corretora' });
      }
    }

    window.setTimeout(() => {
      const exitPrice = currentPriceRef.current;
      const isWin = direction === 'CALL' ? exitPrice > entryPrice : exitPrice < entryPrice;
      const isTie = exitPrice === entryPrice;
      const profit = isWin ? +(amount * (targetAsset.payout / 100)).toFixed(2) : 0;
      if (isWin) sound.playWinChime();
      setRecentOrders((orders) => orders.map((item) => item.id === order.id ? { ...item, exitPrice, status: isWin ? 'WON' : isTie ? 'OPEN' : 'LOST', profit: isWin ? profit : undefined } : item));
      if (isWin || isTie) {
        setSession((previous) => {
          const returned = isWin ? amount + profit : amount;
          const balanceUpdate = isReal ? { realBalance: +(previous.realBalance + returned).toFixed(2) } : { demoBalance: +(previous.demoBalance + returned).toFixed(2) };
          return brokerStream.updateSession(balanceUpdate);
        });
      }
      if (mode !== 'OFF') brokerStream.fetchAccount().then(setSession).catch(() => {});
    }, M1_MS);
  };

  const emitFractalSignal = (nextCandles: Candle[], targetAsset: AssetPair, shouldAutoTrade = autoTradeRef.current) => {
    const isPullback = pullbackEntryRef.current;
    const newSignal = createFractalSignal(targetAsset, nextCandles, nextCandles[nextCandles.length - 1]?.open, isPullback);
    if (!newSignal) return null;
    if (processedCandleTimeRef.current === newSignal.fractal?.confirmationCandle?.time) return newSignal;
    processedCandleTimeRef.current = newSignal.fractal?.confirmationCandle?.time ?? null;
    setActiveSignal(newSignal);
    sound.playCharge();
    newSignal.direction === 'CALL' ? sound.playCallSound() : sound.playPutSound();

    if (isPullback) {
      // Modo Taxa Posicionada: aguarda a vela ficar da cor contrária antes dos 30s
      setLastBrokerResult({
        success: true,
        message: `🎯 Sinal de ${newSignal.direction} detectado! [Modo Taxa Posicionada]: aguardando vela ficar ${newSignal.direction === 'CALL' ? 'VERMELHA (< abertura)' : 'VERDE (> abertura)'} antes dos 30s para taxa perfeita.`,
      });
      if (clearSignalTimerRef.current) clearTimeout(clearSignalTimerRef.current);
      clearSignalTimerRef.current = window.setTimeout(() => setActiveSignal(null), M1_MS);
      return newSignal;
    }

    if (shouldAutoTrade) {
      const openingCheck = isCandleOpeningWindow();
      if (!openingCheck.allowed) {
        console.warn(`[Auto-Trade Ignorado] Vela M1 já em andamento (${openingCheck.second}s). O robô só entra nos primeiros 3s da abertura.`);
        setLastBrokerResult({
          success: false,
          error: `Auto-Trade recusado: vela M1 já em andamento (${openingCheck.second}s). O robô só entra nos primeiros 3s da abertura (Horário de Brasília).`,
        });
        return newSignal;
      }
      const minimum = sessionRef.current.currency === 'BRL' ? 5 : 1;
      handlePlaceTrade(newSignal.direction, Math.max(minimum, tradeAmountRef.current), targetAsset);
    }
    if (clearSignalTimerRef.current) clearTimeout(clearSignalTimerRef.current);
    clearSignalTimerRef.current = window.setTimeout(() => setActiveSignal(null), M1_MS);
    return newSignal;
  };

  const getCandlesForAsset = (asset: AssetPair): Candle[] => {
    if (asset.id === currentAssetRef.current.id) {
      return candlesRef.current;
    }
    if (!assetCandlesMapRef.current[asset.id] || assetCandlesMapRef.current[asset.id].length === 0) {
      assetCandlesMapRef.current[asset.id] = generateCandles(asset, 70);
    }
    return assetCandlesMapRef.current[asset.id];
  };

  const handleRotateToBestAsset = () => {
    if (!autoScannerRef.current || !autoAssetRotationRef.current) return;
    if (activeSignalRef.current && activeSignalRef.current.pullbackStatus === 'WAITING_PULLBACK') return;
    const hasOpenOrder = recentOrdersRef.current.some((o) => o.status === 'OPEN');
    if (hasOpenOrder) return;

    const selection = selectBestAsset(allAssetsRef.current, getCandlesForAsset, currentAssetRef.current.id);
    if (!selection) return;

    const { bestAsset, score } = selection;
    if (bestAsset.id !== currentAssetRef.current.id) {
      const currentEval = evaluateAssetQuality(currentAssetRef.current, candlesRef.current);
      if (!currentEval.hasSetup || score.score > currentEval.score + 10) {
        setRotationNotice(`🔄 Auto-Rotação: Selecionado ${bestAsset.name} (Payout ${bestAsset.payout}% • Score ${score.score} • ${score.reason})`);
        sound.playBeep();
        handleSelectAsset(bestAsset);
        window.setTimeout(() => setRotationNotice(null), 5000);
      }
    }
  };

  const handleNewCandle = (newCandle: Candle) => {
    const nextCandles = [...candlesRef.current.slice(-69), newCandle];
    candlesRef.current = nextCandles;
    setCandles(nextCandles);
    const openingFractal = detectPeriodOneFractal(nextCandles);
    fractalRef.current = openingFractal;
    setFractal(openingFractal);
    setCurrentPrice(newCandle.open);
    if (autoScannerRef.current) {
      const sig = emitFractalSignal(nextCandles, currentAssetRef.current);
      if (!sig && autoAssetRotationRef.current) {
        handleRotateToBestAsset();
      }
    }
  };

  useEffect(() => {
    const unsubscribe = brokerStream.subscribe(
      (livePrice, updatedCandle) => {
        currentPriceRef.current = livePrice;
        setCurrentPrice(livePrice);
        const updated = candlesRef.current.length ? [...candlesRef.current.slice(0, -1), updatedCandle] : [updatedCandle];
        candlesRef.current = updated;
        setCandles(updated);

        // Verificação em tempo real da Taxa Posicionada (Recuo antes dos 30s)
        const currentSig = activeSignalRef.current;
        if (currentSig && currentSig.pullbackEnabled && currentSig.pullbackStatus === 'WAITING_PULLBACK') {
          const check = checkPullbackCondition(currentSig.direction, livePrice, updatedCandle.open);
          if (check.expired) {
            const expiredSig: SniperSignal = { ...currentSig, pullbackStatus: 'EXPIRED_PULLBACK' };
            activeSignalRef.current = expiredSig;
            setActiveSignal(expiredSig);
            sound.playError();
            setLastBrokerResult({
              success: false,
              error: `⏱️ Tempo de recuo esgotado (${check.second}s >= 30s): vela não recuou para ${currentSig.pullbackRequiredColor === 'RED' ? 'VERMELHA' : 'VERDE'}. Ordem cancelada!`,
            });
            if (clearSignalTimerRef.current) clearTimeout(clearSignalTimerRef.current);
            clearSignalTimerRef.current = window.setTimeout(() => {
              setActiveSignal(null);
              activeSignalRef.current = null;
            }, 3500);
          } else if (check.satisfied) {
            const executedSig: SniperSignal = {
              ...currentSig,
              pullbackStatus: 'EXECUTED_PULLBACK',
              entryPrice: livePrice,
            };
            activeSignalRef.current = executedSig;
            setActiveSignal(executedSig);
            sound.playWinChime();
            setLastBrokerResult({
              success: true,
              message: `✅ Taxa posicionada atingida no recuo! Vela ficou ${check.candleColor} aos ${check.second}s. Ordem disparada no preço ${livePrice.toFixed(currentAssetRef.current.decimals)}!`,
            });
            if (autoTradeRef.current) {
              const minimum = sessionRef.current.currency === 'BRL' ? 5 : 1;
              handlePlaceTrade(currentSig.direction, Math.max(minimum, tradeAmountRef.current), currentAssetRef.current, { isPullback: true });
            }
          }
        }
      },
      handleNewCandle,
      (status) => setSession((previous) => ({ ...previous, isConnected: status.isConnected, latencyMs: status.latencyMs })),
      (historyCandles) => {
        if (!historyCandles?.length) return;
        candlesRef.current = historyCandles;
        setCandles(historyCandles);
        if (!activeSignalRef.current && processedCandleTimeRef.current === null) {
          const historyFractal = detectPeriodOneFractal(historyCandles);
          fractalRef.current = historyFractal;
          setFractal(historyFractal);
        }
        currentPriceRef.current = historyCandles[historyCandles.length - 1].close;
        setCurrentPrice(historyCandles[historyCandles.length - 1].close);
      },
      (updatedSession) => setSession(updatedSession),
      (activeId, price) => setAllAssets((assets) => assets.map((asset) => asset.activeId === activeId ? { ...asset, basePrice: price } : asset)),
    );
    brokerStream.fetchAccount().then(setSession).catch(() => {});
    brokerStream.fetchInitialQuotes();
    return () => unsubscribe();
  }, []);

  // Periodic multi-asset rotation check
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (autoScannerRef.current && autoAssetRotationRef.current) {
        handleRotateToBestAsset();
      }
    }, 12000);
    return () => window.clearInterval(timer);
  }, []);

  // Fallback local: only when disconnected from broker WebSocket
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (sessionRef.current.isConnected) return;
      const latest = candlesRef.current[candlesRef.current.length - 1];
      const currentBucket = Math.floor(Date.now() / M1_MS) * M1_MS;
      if (!latest || latest.time >= currentBucket) return;
      const open = currentPriceRef.current;
      handleNewCandle({ time: currentBucket, open, high: open, low: open, close: open, volume: 0 });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (clearSignalTimerRef.current) clearTimeout(clearSignalTimerRef.current);
  }, []);

  const handleSelectAsset = (asset: AssetPair) => {
    const nextCandles = generateCandles(asset, 70);
    currentAssetRef.current = asset;
    candlesRef.current = nextCandles;
    setCurrentAsset(asset);
    setCandles(nextCandles);
    const openingFractal = detectPeriodOneFractal(nextCandles);
    fractalRef.current = openingFractal;
    setFractal(openingFractal);
    setCurrentPrice(nextCandles[nextCandles.length - 1].close);
    setActiveSignal(null);
    processedCandleTimeRef.current = null;
    brokerStream.connectAsset(asset, nextCandles[nextCandles.length - 1]);
  };

  const handleSimulateTrigger = () => {
    const nextCandles = candlesRef.current;
    const targetAsset = currentAssetRef.current;

    // Verificar filtros primeiro para feedback ao usuário
    const exCheck = checkExhaustionCandle(nextCandles);
    if (!exCheck.passed) {
      return {
        success: false,
        title: 'FILTRO DE EXAUSTÃO ATIVO',
        detail: `Vela fractal é uma vela de exaustão (${exCheck.ratio.toFixed(1)}x a média de 14 velas, máx permitido 2.2x). Sinal descartado pelo robô.`,
      };
    }

    const gCheck = checkGapFilter(nextCandles);
    if (!gCheck.passed) {
      return {
        success: false,
        title: 'FILTRO DE GAP ATIVO',
        detail: `Gap forte detectado na abertura (${gCheck.gapSize.toFixed(5)} > ${gCheck.maxAllowedGap.toFixed(5)}). Sinal descartado pelo robô.`,
      };
    }

    const fractal = detectPeriodOneFractal(nextCandles);
    const trendAnalysis = analyzeMarketTrendAndStructure(nextCandles);
    // Estratégia solicitada: Fractal de Compra (fundo suporte) -> VENDA (PUT); Fractal de Venda (topo resistência) -> COMPRA (CALL)
    const direction = fractal.isBuyFractal ? 'PUT' : fractal.isSellFractal ? 'CALL' : null;

    if (direction === 'CALL') {
      if (trendAnalysis.macroTrend === 'BAIXA' && trendAnalysis.microTrend === 'BAIXA') {
        return {
          success: false,
          title: 'FILTRO DE TENDÊNCIA ATIVO (ANTI-CONTRA-TENDÊNCIA)',
          detail: `Sinal de CALL barrado: Mercado em tendência forte de baixa (Macro: BAIXA / Micro: BAIXA). O robô não opera contra a força.`,
        };
      }
      if (trendAnalysis.structure === 'LH_LL' && trendAnalysis.macroTrend === 'BAIXA') {
        return {
          success: false,
          title: 'FILTRO DE ESTRUTURA ATIVO (LH / LL)',
          detail: `Sinal de CALL barrado: Estrutura de Price Action em queda com Topos e Fundos Descendentes (LH/LL). Entrada contra a força bloqueada.`,
        };
      }
    } else if (direction === 'PUT') {
      if (trendAnalysis.macroTrend === 'ALTA' && trendAnalysis.microTrend === 'ALTA') {
        return {
          success: false,
          title: 'FILTRO DE TENDÊNCIA ATIVO (ANTI-CONTRA-TENDÊNCIA)',
          detail: `Sinal de PUT barrado: Mercado em tendência forte de alta (Macro: ALTA / Micro: ALTA). O robô não opera contra a força.`,
        };
      }
      if (trendAnalysis.structure === 'HH_HL' && trendAnalysis.macroTrend === 'ALTA') {
        return {
          success: false,
          title: 'FILTRO DE ESTRUTURA ATIVO (HH / HL)',
          detail: `Sinal de PUT barrado: Estrutura de Price Action em alta com Topos e Fundos Ascendentes (HH/HL). Entrada contra a força bloqueada.`,
        };
      }
    }

    const cci = calculateCci(nextCandles, 4, 4, 100, -100);
    const newSignal = emitFractalSignal(nextCandles, targetAsset, autoTradeRef.current);
    if (newSignal) {
      return {
        success: true,
        title: `SINAL ${newSignal.direction === 'CALL' ? 'DE COMPRA (CALL)' : 'DE VENDA (PUT)'} CONFIRMADO`,
        detail: `Fractal P1 + CCI (${cci.currentState.value.toFixed(1)}) + Tendência a favor (Macro: ${trendAnalysis.macroTrend}, Micro: ${trendAnalysis.microTrend}, ${trendAnalysis.structure === 'HH_HL' ? 'HH/HL' : trendAnalysis.structure === 'LH_LL' ? 'LH/LL' : 'Lateral'}).`,
      };
    }

    return {
      success: false,
      title: 'AGUARDANDO CONFLUÊNCIA',
      detail: `Para entrada na abertura: Fractal P1 e indicador CCI (4, Low) precisam apontar para a mesma direção. CCI atual: ${cci.currentState.value.toFixed(1)}.`,
    };
  };

  const handleToggleAutoTrade = (enabled: boolean) => {
    setAutoTradeEnabled(enabled);
    autoTradeRef.current = enabled;
    if (enabled) sound.playBeep();
  };

  const handleToggleAutoScanner = (enabled: boolean) => {
    setAutoScannerEnabled(enabled);
    autoScannerRef.current = enabled;
    if (enabled) sound.playBeep();
  };

  const handleTogglePullbackEntry = (enabled: boolean) => {
    setPullbackEntryEnabled(enabled);
    pullbackEntryRef.current = enabled;
    if (enabled) sound.playBeep();
  };

  const handleToggleAutoAssetRotation = (enabled: boolean) => {
    setAutoAssetRotationEnabled(enabled);
    autoAssetRotationRef.current = enabled;
    if (enabled) sound.playBeep();
  };

  const handleToggleAccountMode = (mode: AccountMode) => setSession(brokerStream.setAccountMode(mode));
  const handleToggleBrokerExecutionMode = (mode: BrokerExecutionMode) => {
    setBrokerExecutionMode(mode);
    executionModeRef.current = mode;
    try { localStorage.setItem('fractal_execution_mode', mode); } catch {}
  };
  const handleToggleCurrency = (currency: 'USD' | 'BRL') => setSession(brokerStream.updateSession({ currency }));
  const handleUpdateSession = (partial: Partial<BrokerSession>) => {
    const previousSsid = session.ssid;
    const updated = brokerStream.updateSession(partial);
    setSession(updated);
    if (partial.ssid && partial.ssid !== previousSsid) brokerStream.reconnect();
  };
  const handleTradeAmountChange = (amount: number) => {
    setTradeAmount(amount);
    tradeAmountRef.current = amount;
    try { localStorage.setItem('fractal_trade_amount', String(amount)); } catch {}
  };
  const handleClearHistory = () => {
    setRecentOrders([]);
    setSignalHistory([]);
    try { localStorage.removeItem('fractal_m1_orders'); localStorage.removeItem('fractal_m1_signals'); } catch {}
  };
  const handleRefreshPings = () => setServers((items) => items.map((server) => ({ ...server, ping: Math.floor(Math.random() * 8 + 8) })));

  // Evaluate the radar signal after its one-minute M1 window.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const signal = activeSignalRef.current;
      if (!signal || signal.status !== 'READY') return;
      const createdAt = signal.createdAt;
      if (Date.now() - createdAt < M1_MS) return;
      const entryPrice = signal.entryPrice ?? currentPriceRef.current;
      const exitPrice = currentPriceRef.current;
      const isWin = signal.direction === 'CALL' ? exitPrice >= entryPrice : exitPrice <= entryPrice;
      const resolved: SniperSignal = { ...signal, countdownSeconds: 0, exitPrice, diff: +(exitPrice - entryPrice).toFixed(currentAssetRef.current.decimals), status: isWin ? 'WIN' : 'LOSS', result: isWin ? 'WIN' : 'LOSS' };
      activeSignalRef.current = resolved;
      setActiveSignal(resolved);
      setSignalHistory((history) => history.some((item) => item.id === resolved.id) ? history : [resolved, ...history.slice(0, 49)]);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#020504] text-[#e5f7ed]">
      <Header
        currentAsset={currentAsset}
        allAssets={allAssets}
        onSelectAsset={handleSelectAsset}
        isFloatingOpen={isFloatingOpen}
        onToggleFloating={() => setIsFloatingOpen((open) => !open)}
        onOpenServerModal={() => setServerModalOpen(true)}
        onOpenHistory={() => setHistoryModalOpen(true)}
        historyCount={signalHistory.length}
        session={session}
        onToggleAccountMode={handleToggleAccountMode}
        onOpenSsidModal={() => setSsidModalOpen(true)}
        stats={stats}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <div className="relative flex flex-1 flex-col overflow-hidden">
          {rotationNotice && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full border border-cyan-400/50 bg-[#021814]/95 px-4 py-1.5 text-[11px] font-bold text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.3)] backdrop-blur transition-all">
              <Layers className="h-3.5 w-3.5 animate-spin text-cyan-400" />
              <span>{rotationNotice}</span>
            </div>
          )}
          <ChartCanvas asset={currentAsset} candles={candles} fractal={fractal} activeSignal={activeSignal} currentPrice={currentPrice} />
          {isFloatingOpen && (
            <FloatingSniperPanel
              asset={currentAsset}
              candles={candles}
              currentPrice={currentPrice}
              fractal={fractal}
              signal={activeSignal}
              onExecuteTrade={(direction) => handlePlaceTrade(direction, Math.max(session.currency === 'BRL' ? 5 : 1, tradeAmount), currentAsset)}
              onClose={() => setIsFloatingOpen(false)}
              dailyWinRate={stats.winrate}
              onSimulateTrigger={handleSimulateTrigger}
              autoTradeEnabled={autoTradeEnabled}
              onToggleAutoTrade={handleToggleAutoTrade}
              autoScannerEnabled={autoScannerEnabled}
              onToggleAutoScanner={handleToggleAutoScanner}
              pullbackEntryEnabled={pullbackEntryEnabled}
              onTogglePullbackEntry={handleTogglePullbackEntry}
              autoAssetRotationEnabled={autoAssetRotationEnabled}
              onToggleAutoAssetRotation={handleToggleAutoAssetRotation}
            />
          )}
        </div>
        <BrokerOrderPanel
          asset={currentAsset}
          session={session}
          onToggleAccountMode={handleToggleAccountMode}
          onToggleCurrency={handleToggleCurrency}
          brokerExecutionMode={brokerExecutionMode}
          onToggleBrokerExecutionMode={handleToggleBrokerExecutionMode}
          autoTradeEnabled={autoTradeEnabled}
          onToggleAutoTrade={handleToggleAutoTrade}
          isExecutingBrokerOrder={isExecutingBroker}
          lastBrokerResult={lastBrokerResult}
          onPlaceTrade={handlePlaceTrade}
          recentOrders={recentOrders}
          onOpenSsidModal={() => setSsidModalOpen(true)}
          tradeAmount={tradeAmount}
          onChangeTradeAmount={handleTradeAmountChange}
        />
      </div>

      <footer id="traderoom-status-bar" className="flex items-center justify-between border-t border-[#00ff66]/20 bg-[rgba(1,4,3,0.98)] px-4 py-2 text-xs font-mono">
        <div className="flex items-center gap-3"><div className="flex items-center gap-1.5 text-[#00ff66]"><ShieldCheck className="h-4 w-4" /><span className="font-bold">FRACTAL M1 • SINAL NA ABERTURA</span></div><span className="hidden text-[#7a9587] md:inline">|</span><div className="hidden items-center gap-2 text-[#7a9587] md:flex"><span className="flex items-center gap-1"><Bot className={`h-3 w-3 ${autoTradeEnabled ? 'text-[#00ff66]' : 'text-zinc-500'}`} /> Auto-trade: <strong className={autoTradeEnabled ? 'text-[#00ff66]' : 'text-zinc-500'}>{autoTradeEnabled ? 'LIGADO' : 'DESLIGADO'}</strong></span><span className="flex items-center gap-1"><Radar className={`h-3 w-3 ${autoScannerEnabled ? 'text-[#00ff66]' : 'text-zinc-500'}`} /> Scanner: <strong className={autoScannerEnabled ? 'text-[#00ff66]' : 'text-zinc-500'}>{autoScannerEnabled ? 'ATIVO' : 'PARADO'}</strong></span><span className="flex items-center gap-1"><Target className={`h-3 w-3 ${pullbackEntryEnabled ? 'text-amber-400' : 'text-zinc-500'}`} /> Recuo &lt;30s: <strong className={pullbackEntryEnabled ? 'text-amber-400' : 'text-zinc-500'}>{pullbackEntryEnabled ? 'LIGADO' : 'DESLIGADO'}</strong></span><span className="flex items-center gap-1"><Layers className={`h-3 w-3 ${autoAssetRotationEnabled ? 'text-cyan-400' : 'text-zinc-500'}`} /> Rotação: <strong className={autoAssetRotationEnabled ? 'text-cyan-400' : 'text-zinc-500'}>{autoAssetRotationEnabled ? 'ATIVO' : 'PARADO'}</strong></span><span className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-400" /> Regra: <strong className="text-white">P1</strong></span></div></div>
        <div className="flex items-center gap-2"><button onClick={() => setSsidModalOpen(true)} className="hidden items-center gap-1 rounded-md border border-[#00ff66]/30 bg-[#00ff66]/10 px-2 py-1 text-xs text-[#00ff66] transition hover:bg-[#00ff66]/20 sm:flex"><KeyRound className="h-3.5 w-3.5" /> SSID</button><button onClick={() => setHistoryModalOpen(true)} className="flex items-center gap-1 rounded-md border border-[#00ff66]/30 bg-black/60 px-2.5 py-1 text-xs text-[#00ff66] transition hover:bg-[#00ff66]/15"><History className="h-3.5 w-3.5" /> Histórico ({signalHistory.length})</button><button onClick={() => setServerModalOpen(true)} className="hidden items-center gap-1 rounded-md border border-white/10 bg-black/60 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-[#00ff66]/40 hover:text-white sm:flex"><Server className="h-3.5 w-3.5 text-[#00ff66]" /> Servidores</button></div>
      </footer>

      <SsidConnectionModal isOpen={ssidModalOpen} onClose={() => setSsidModalOpen(false)} session={session} onUpdateSession={handleUpdateSession} />
      <ServerClusterModal isOpen={serverModalOpen} onClose={() => setServerModalOpen(false)} servers={servers} onRefreshPings={handleRefreshPings} />
      <SignalHistoryDrawer isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} signals={signalHistory} orders={recentOrders} onClearHistory={handleClearHistory} />
    </div>
  );
}

