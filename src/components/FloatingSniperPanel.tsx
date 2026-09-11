import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Compass,
  Copy,
  Crosshair,
  GripHorizontal,
  Layers,
  Minus,
  Radar,
  RotateCcw,
  ShieldCheck,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { AssetPair, Candle, FractalDetection, SniperSignal } from '../types';
import { sound } from '../utils/audio';
import { 
  analyzeMarketTrendAndStructure, 
  calculateCci, 
  checkExhaustionCandle, 
  checkGapFilter, 
  getBrasiliaTime, 
  isCandleOpeningWindow 
} from '../utils/marketData';

interface FloatingSniperPanelProps {
  asset: AssetPair;
  candles: Candle[];
  currentPrice: number;
  fractal: FractalDetection;
  signal: SniperSignal | null;
  onExecuteTrade: (direction: 'CALL' | 'PUT') => void;
  onClose: () => void;
  dailyWinRate: number;
  onSimulateTrigger?: () => { success: boolean; title: string; detail: string } | void;
  autoTradeEnabled?: boolean;
  onToggleAutoTrade?: (enabled: boolean) => void;
  autoScannerEnabled?: boolean;
  onToggleAutoScanner?: (enabled: boolean) => void;
  pullbackEntryEnabled?: boolean;
  onTogglePullbackEntry?: (enabled: boolean) => void;
  autoAssetRotationEnabled?: boolean;
  onToggleAutoAssetRotation?: (enabled: boolean) => void;
}

export const FloatingSniperPanel: React.FC<FloatingSniperPanelProps> = ({
  asset,
  candles,
  currentPrice,
  fractal,
  signal,
  onExecuteTrade,
  onClose,
  dailyWinRate,
  onSimulateTrigger,
  autoTradeEnabled = false,
  onToggleAutoTrade,
  autoScannerEnabled = false,
  onToggleAutoScanner,
  pullbackEntryEnabled = true,
  onTogglePullbackEntry,
  autoAssetRotationEnabled = true,
  onToggleAutoAssetRotation,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; title: string; detail: string } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sparklineRef = useRef<HTMLCanvasElement>(null);
  const priceHistoryRef = useRef<number[]>([]);
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('fractal_panel_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed;
      }
    } catch {}
    return { x: Math.max(16, window.innerWidth - 325), y: 70 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const miniCandles = candles.slice(-18);
  const candleMax = Math.max(...miniCandles.map((candle) => candle.high), currentPrice);
  const candleMin = Math.min(...miniCandles.map((candle) => candle.low), currentPrice);
  const candleRange = candleMax - candleMin || 0.0001;
  const center = fractal.centerCandle;
  const confirmation = fractal.confirmationCandle;
  const hasSignal = Boolean(signal);
  const isBuySignal = signal?.direction === 'CALL';

  const cciAnalysis = useMemo(() => calculateCci(candles, 4, 4, 100, -100), [candles]);
  const exhaustionCheck = useMemo(() => checkExhaustionCandle(candles), [candles]);
  const gapCheck = useMemo(() => checkGapFilter(candles), [candles]);
  const trendAnalysis = useMemo(() => analyzeMarketTrendAndStructure(candles), [candles]);
  const [brasiliaTime, setBrasiliaTime] = useState(() => getBrasiliaTime());
  const [openingWindow, setOpeningWindow] = useState(() => isCandleOpeningWindow());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBrasiliaTime(getBrasiliaTime());
      setOpeningWindow(isCandleOpeningWindow());
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const history = priceHistoryRef.current;
    history.push(currentPrice);
    if (history.length > 30) history.shift();
    const canvas = sparklineRef.current;
    if (!canvas || history.length < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 0.0001;
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    history.forEach((value, index) => {
      const x = (index / (history.length - 1)) * (width - 4) + 2;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = history[history.length - 1] >= history[0] ? '#00ff66' : '#ff4444';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 6;
    ctx.stroke();
  }, [currentPrice]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (event: MouseEvent) => {
      setPosition({
        x: Math.max(8, Math.min(window.innerWidth - 300, event.clientX - dragOffsetRef.current.x)),
        y: Math.max(8, Math.min(window.innerHeight - 80, event.clientY - dragOffsetRef.current.y)),
      });
    };
    const handleEnd = () => {
      setIsDragging(false);
      try { localStorage.setItem('fractal_panel_pos', JSON.stringify(position)); } catch {}
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [isDragging, position]);

  const handleDragStart = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('button')) return;
    setIsDragging(true);
    dragOffsetRef.current = { x: event.clientX - position.x, y: event.clientY - position.y };
  };

  const handleResetPosition = () => {
    const next = { x: Math.max(16, window.innerWidth - 325), y: 70 };
    setPosition(next);
    try { localStorage.setItem('fractal_panel_pos', JSON.stringify(next)); } catch {}
  };

  const handleAnalyze = () => {
    sound.playRadarPing();
    const result = onSimulateTrigger?.();
    if (result) {
      setFeedback({ type: result.success ? 'success' : 'error', title: result.title, detail: result.detail });
      window.setTimeout(() => setFeedback(null), 6500);
    }
  };

  const handleCopySignal = () => {
    if (!signal) return;
    const text = [
      'PRISMA IA — FRACTAL SEM LIMITES (PERÍODO 1)',
      `Ativo: ${signal.assetName}`,
      `Direção: ${isBuySignal ? 'COMPRA (CALL)' : 'VENDA (PUT)'}`,
      'Timeframe: M1',
      `Entrada: abertura da vela ${signal.entryTime}`,
      'Regra: vela fechada [1] comparada com [2] e [0]',
      `Assertividade registrada: ${dailyWinRate}%`,
    ].join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    sound.playClick();
    window.setTimeout(() => setCopied(false), 2000);
  };

  const fractalStatusClass = fractal.isBuyFractal
    ? 'border-rose-500/80 bg-rose-500/15 text-rose-300'
    : fractal.isSellFractal
    ? 'border-[#00ff66]/80 bg-[#00ff66]/15 text-[#00ff66]'
    : 'border-amber-400/50 bg-amber-400/10 text-amber-300';

  return (
    <div
      ref={panelRef}
      id="floating-fractal-radar"
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)`, touchAction: 'none' }}
      className={`fixed left-0 top-0 z-50 w-[306px] select-none rounded-2xl border-2 font-mono text-white ${isDragging ? 'cursor-grabbing shadow-[0_0_50px_rgba(0,255,102,0.5)]' : 'shadow-[0_0_35px_rgba(0,255,102,0.3),_0_20px_45px_rgba(0,0,0,0.9)]'} border-[#00ff66]/70 bg-gradient-to-b from-[#052b14]/98 via-[#021f0e]/98 to-[#011409]/98 backdrop-blur-2xl`}
    >
      <div onMouseDown={handleDragStart} className="flex cursor-grab items-center justify-between rounded-t-2xl border-b border-[#00ff66]/40 bg-gradient-to-r from-[#07381b] via-[#052b15] to-[#031e0e] px-3 py-2">
        <div className="flex items-center gap-1.5 pointer-events-none">
          <GripHorizontal className="h-3.5 w-3.5 text-[#00ff66]" />
          <img src="/assets/prisma_vector_logo.jpg" alt="Fractal" className="h-5 w-5 rounded border border-[#00ff66] object-cover" />
          <span className="text-[10px] font-black tracking-widest text-[#00ff66]">◈ FRACTAL SEM LIMITES</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex items-center gap-1 text-[9px] font-bold text-[#00ff66]"><span className="h-1.5 w-1.5 rounded-full bg-[#00ff66] animate-pulse" /> LIVE</span>
          <button onClick={handleResetPosition} className="rounded p-1 text-[#7a9587] hover:text-[#00ff66]" title="Redefinir posição"><RotateCcw className="h-3 w-3" /></button>
          <button onClick={() => setIsMinimized((value) => !value)} className="rounded p-1 text-[#7a9587] hover:text-white" title="Minimizar">{isMinimized ? <ChevronDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}</button>
          <button onClick={onClose} className="rounded p-1 text-[#7a9587] hover:text-rose-300" title="Fechar radar"><X className="h-3 w-3" /></button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[#00ff66]/25 bg-[#042412]/80 px-3 py-1.5 text-xs">
        <span className="flex items-center gap-1.5 font-extrabold tracking-wider text-white">{asset.name}<span className="rounded border border-[#00ff66]/40 bg-[#00ff66]/20 px-1.5 py-0.2 text-[9px] text-[#00ff66]">{asset.payout}%</span></span>
        <span className="text-[10px] text-[#a3d9b5]">Hist: <strong className="text-[#00ff66]">{dailyWinRate}%</strong></span>
      </div>

      {!isMinimized && (
        <div>
          <div className="flex items-center justify-between border-b border-[#00ff66]/30 bg-[#02180c] px-3 py-1.5 text-[9px]">
            <span className="flex items-center gap-1.5 font-bold text-white"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff66] opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#00ff66]" /></span>REGRA ATIVA: FRACTAL PERÍODO 1</span>
            <span className="rounded border border-[#00ff66]/40 bg-[#00ff66]/15 px-1.5 py-0.5 font-black text-[#00ff66]">M1</span>
          </div>

          <div className="border-b border-[#00ff66]/40 bg-gradient-to-r from-[#032b16] via-[#021f0e] to-[#032b16] p-2.5 shadow-[inset_0_1px_0_rgba(0,255,102,0.3)]">
            <div className="mb-1.5 flex items-center justify-between text-[9px] font-black">
              <span className="flex items-center gap-1 text-[#00ff66]"><Crosshair className="h-3 w-3 animate-pulse" /> CONFIRMAÇÃO NA ABERTURA</span>
              <span className="text-[8px] text-[#a3d9b5]">[1] ← [2] / [0] →</span>
            </div>
            <button id="fractal-analyzer-btn" onClick={handleAnalyze} className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[#00ff66] bg-[#00ff66]/20 py-2 text-[10px] font-black text-[#00ff66] shadow-[0_0_20px_rgba(0,255,102,0.25)] transition hover:bg-[#00ff66]/35 active:scale-95">
              <Zap className="h-3.5 w-3.5 fill-current" /> VERIFICAR FRACTAL AGORA
            </button>
            {feedback && (
              <div className={`mt-2 rounded-lg border p-2 text-[8px] ${feedback.type === 'success' ? 'border-[#00ff66]/60 bg-emerald-950/80 text-emerald-200' : 'border-rose-500/60 bg-rose-950/80 text-rose-200'}`}>
                <div className="flex items-center gap-1 font-black">{feedback.type === 'success' ? <CheckCircle2 className="h-3 w-3 text-[#00ff66]" /> : <X className="h-3 w-3 text-rose-300" />} {feedback.title}</div>
                <p className="mt-0.5 leading-tight opacity-90">{feedback.detail}</p>
              </div>
            )}
          </div>

          <div className="border-b border-[#00ff66]/30 bg-[#031f10]/95 px-3 py-1.5"><canvas ref={sparklineRef} width={274} height={32} className="block w-full" /></div>

          <div className="space-y-2 border-b border-[#00ff66]/30 bg-[#042412]/50 p-3">
            <div className="flex items-center justify-between text-[10px]"><span className="font-bold uppercase tracking-wider text-[#00ff66]">Leitura das 3 velas</span><span className="text-[8px] text-[#7a9587]">Preço {currentPrice.toFixed(asset.decimals)}</span></div>
            <div className={`rounded-lg border p-2 text-[9px] font-black leading-snug ${fractalStatusClass}`}>{fractal.message}</div>
            <div className="grid grid-cols-3 gap-1.5 text-[8px]">
              <div className="rounded border border-white/10 bg-black/40 p-1.5"><div className="text-[#7a9587]">[2] ANTERIOR</div><strong className="text-white">{fractal.leftCandle ? fractal.leftCandle.close.toFixed(asset.decimals) : '—'}</strong></div>
              <div className={`rounded border p-1.5 ${fractal.isBuyFractal ? 'border-[#00ff66]/60 bg-[#00ff66]/10' : fractal.isSellFractal ? 'border-rose-500/60 bg-rose-500/10' : 'border-white/10 bg-black/40'}`}><div className="text-[#7a9587]">[1] FECHADA</div><strong className="text-white">{center ? center.close.toFixed(asset.decimals) : '—'}</strong></div>
              <div className="rounded border border-[#00ff66]/40 bg-[#00ff66]/10 p-1.5"><div className="text-[#7a9587]">[0] ABERTA</div><strong className="text-white">{confirmation ? confirmation.open.toFixed(asset.decimals) : '—'}</strong></div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[8px]">
              <div className="flex items-center justify-between rounded border border-rose-500/40 bg-rose-500/10 p-1.5">
                <span className="text-rose-200">Fundo Suporte → VENDA</span>
                <strong className={fractal.isBuyFractal ? 'text-rose-400 font-bold' : 'text-zinc-500'}>{fractal.isBuyFractal ? 'PUT' : '—'}</strong>
              </div>
              <div className="flex items-center justify-between rounded border border-[#00ff66]/40 bg-[#00ff66]/10 p-1.5">
                <span className="text-[#a3d9b5]">Topo Resistência → COMPRA</span>
                <strong className={fractal.isSellFractal ? 'text-[#00ff66] font-bold' : 'text-zinc-500'}>{fractal.isSellFractal ? 'CALL' : '—'}</strong>
              </div>
            </div>
          </div>

          <div className="border-b border-[#00ff66]/30 bg-[#021b0d]/70 px-3 py-2">
            <div className="mb-1.5 flex items-center justify-between text-[8px] font-bold uppercase tracking-wider text-[#00ff66]"><span>Velas M1 recentes</span><span className="text-[#7a9587]">{miniCandles.length}</span></div>
            <div className="flex h-7 items-end gap-1">
              {miniCandles.map((candle, index) => <div key={`${candle.time}-${index}`} title={`O ${candle.open} • M ${candle.high} • B ${candle.low} • F ${candle.close}`} className={`flex-1 rounded-[1px] ${candle.close >= candle.open ? 'bg-[#00ff66] shadow-[0_0_4px_rgba(0,255,102,0.4)]' : 'bg-[#ff4444]'}`} style={{ height: `${Math.max(3, Math.round(((candle.high - candle.low) / candleRange) * 25))}px` }} />)}
            </div>
          </div>

          {/* Status dos Indicadores e Filtros Confluência */}
          <div className="space-y-1.5 border-b border-[#00ff66]/30 bg-[#02180d] p-2.5 text-[9px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-bold text-zinc-300">
                <Clock className="h-3 w-3 text-amber-400" /> Brasília (UTC-3):
              </span>
              <strong className="text-white">{brasiliaTime} ({openingWindow.second}s)</strong>
            </div>
            <div className="flex items-center justify-between rounded border p-1 border-white/10 bg-black/50">
              <span className="text-zinc-400">Janela de entrada:</span>
              <strong className={openingWindow.allowed ? 'text-[#00ff66]' : 'text-rose-400'}>
                {openingWindow.allowed ? '🟢 00s-03s (Abertura)' : '🔴 Bloqueado (Meio da vela)'}
              </strong>
            </div>
            <div className="flex items-center justify-between rounded border p-1 border-[#2CAC40]/30 bg-black/50">
              <span className="flex items-center gap-1 text-[#2CAC40]">
                <Activity className="h-3 w-3" /> CCI (4, Low):
              </span>
              <strong className="text-white">
                {cciAnalysis.currentState.value.toFixed(1)}
                {cciAnalysis.currentState.buyArrow && ' (▲ Compra)'}
                {cciAnalysis.currentState.sellArrow && ' (▼ Venda)'}
              </strong>
            </div>
            {/* Filtro de Tendência Macro e Micro + Estrutura (HL, LL, HH, LH) */}
            <div className="space-y-1 rounded border border-cyan-500/30 bg-black/60 p-1.5 text-[8.5px]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 font-bold text-cyan-300">
                  <Compass className="h-3 w-3" /> Tendência & Força:
                </span>
                <span className="font-mono font-black text-cyan-400">
                  {trendAnalysis.strengthPercent}% Força
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[8px]">
                <div className="flex items-center justify-between rounded bg-black/50 px-1.5 py-0.5">
                  <span className="text-zinc-400">Macro:</span>
                  <strong className={trendAnalysis.macroTrend === 'ALTA' ? 'text-[#00ff66]' : trendAnalysis.macroTrend === 'BAIXA' ? 'text-rose-400' : 'text-amber-400'}>
                    {trendAnalysis.macroTrend}
                  </strong>
                </div>
                <div className="flex items-center justify-between rounded bg-black/50 px-1.5 py-0.5">
                  <span className="text-zinc-400">Micro:</span>
                  <strong className={trendAnalysis.microTrend === 'ALTA' ? 'text-[#00ff66]' : trendAnalysis.microTrend === 'BAIXA' ? 'text-rose-400' : 'text-amber-400'}>
                    {trendAnalysis.microTrend}
                  </strong>
                </div>
              </div>
              <div className="flex items-center justify-between rounded bg-cyan-950/40 px-1.5 py-0.5 text-[8px]">
                <span className="text-zinc-300">Zonas Price Action:</span>
                <strong className={trendAnalysis.structure === 'HH_HL' ? 'text-[#00ff66]' : trendAnalysis.structure === 'LH_LL' ? 'text-rose-400' : 'text-amber-300'}>
                  {trendAnalysis.structure === 'HH_HL' ? 'Alta (HH / HL)' : trendAnalysis.structure === 'LH_LL' ? 'Baixa (LH / LL)' : 'Consolidação'}
                </strong>
              </div>
              {trendAnalysis.lastPivot && (
                <div className="flex items-center justify-between text-[7.5px] text-zinc-400 px-0.5">
                  <span>Último Pivô:</span>
                  <span className="font-mono text-white font-bold">{trendAnalysis.lastPivot.label} ({trendAnalysis.lastPivot.price.toFixed(asset.decimals)})</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1 text-[8px]">
              <div className="flex items-center justify-between rounded border border-white/10 bg-black/40 p-1">
                <span className="text-zinc-400">Filtro Exaustão:</span>
                <strong className={exhaustionCheck.passed ? 'text-[#00ff66]' : 'text-rose-400'}>
                  {exhaustionCheck.passed ? 'OK' : 'BARRADO'}
                </strong>
              </div>
              <div className="flex items-center justify-between rounded border border-white/10 bg-black/40 p-1">
                <span className="text-zinc-400">Filtro Gap:</span>
                <strong className={gapCheck.passed ? 'text-[#00ff66]' : 'text-rose-400'}>
                  {gapCheck.passed ? 'OK' : 'BARRADO'}
                </strong>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-b border-[#00ff66]/30 bg-[#02140a]/90 p-2.5">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/60 p-2">
              <div className="flex items-center gap-1.5"><Zap className={`h-4 w-4 ${autoTradeEnabled ? 'animate-pulse text-[#00ff66]' : 'text-zinc-400'}`} /><div><div className="text-[10px] font-black">ENTRADA AUTOMÁTICA</div><div className="text-[8px] text-[#7a9587]">Executa ordem na corretora</div></div></div>
              <button onClick={() => onToggleAutoTrade?.(!autoTradeEnabled)} className={`rounded px-2.5 py-1 text-[9px] font-black ${autoTradeEnabled ? 'bg-[#00ff66] text-black' : 'bg-zinc-800 text-zinc-400'}`}>{autoTradeEnabled ? 'LIGADO' : 'DESLIGADO'}</button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/60 p-2">
              <div className="flex items-center gap-1.5"><Radar className={`h-4 w-4 ${autoScannerEnabled ? 'animate-spin text-[#00ff66]' : 'text-zinc-400'}`} /><div><div className="text-[10px] font-black">SCANNER DE FRACTAIS</div><div className="text-[8px] text-[#7a9587]">Busca sinais M1 continuamente</div></div></div>
              <button onClick={() => onToggleAutoScanner?.(!autoScannerEnabled)} className={`rounded px-2.5 py-1 text-[9px] font-black ${autoScannerEnabled ? 'bg-[#00ff66] text-black' : 'bg-zinc-800 text-zinc-400'}`}>{autoScannerEnabled ? 'ATIVO' : 'PARADO'}</button>
            </div>
            {/* Opção Solicitada: Melhor Taxa Posicionada (Recuo antes dos 30s) */}
            <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-black/60 p-2">
              <div className="flex items-center gap-1.5">
                <Target className={`h-4 w-4 ${pullbackEntryEnabled ? 'text-amber-400 animate-pulse' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-[10px] font-black text-amber-300">TAXA POSICIONADA (RECUO &lt; 30s)</div>
                  <div className="text-[8px] text-amber-200/80">CALL espera vela vermelha • PUT espera vela verde</div>
                </div>
              </div>
              <button 
                onClick={() => onTogglePullbackEntry?.(!pullbackEntryEnabled)} 
                className={`rounded px-2.5 py-1 text-[9px] font-black transition-colors ${pullbackEntryEnabled ? 'bg-amber-400 text-black shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-zinc-800 text-zinc-400'}`}
              >
                {pullbackEntryEnabled ? 'LIGADO' : 'DESLIGADO'}
              </button>
            </div>
            {/* Opção Solicitada: Auto-Rotatividade de Ativos (Melhor Ativo) */}
            <div className="flex items-center justify-between rounded-lg border border-cyan-500/30 bg-black/60 p-2">
              <div className="flex items-center gap-1.5">
                <Layers className={`h-4 w-4 ${autoAssetRotationEnabled ? 'text-cyan-400 animate-bounce' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-[10px] font-black text-cyan-300">AUTO-ROTAÇÃO (MELHOR ATIVO)</div>
                  <div className="text-[8px] text-cyan-200/80">Troca automaticamente para o melhor par</div>
                </div>
              </div>
              <button 
                onClick={() => onToggleAutoAssetRotation?.(!autoAssetRotationEnabled)} 
                className={`rounded px-2.5 py-1 text-[9px] font-black transition-colors ${autoAssetRotationEnabled ? 'bg-cyan-400 text-black shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-zinc-800 text-zinc-400'}`}
              >
                {autoAssetRotationEnabled ? 'ATIVO' : 'PARADO'}
              </button>
            </div>
          </div>

          {hasSignal && signal ? (
            <div className="space-y-2 rounded-b-2xl border-t border-[#00ff66]/40 bg-gradient-to-b from-[#063319]/95 to-[#021f0e]/95 p-3">
              <div className="text-center text-[9px] font-extrabold tracking-wider text-[#00ff66]">SINAL FRACTAL CONFIRMADO • ENTRADA AGORA</div>
              
              {/* Feedback específico para o modo TAXA POSICIONADA */}
              {signal.pullbackEnabled && signal.pullbackStatus === 'WAITING_PULLBACK' && (
                <div className="rounded-lg border border-amber-500/60 bg-amber-950/70 p-2 text-center text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                  <div className="flex items-center justify-center gap-1.5 font-black text-[9.5px] text-amber-300">
                    <Clock className="h-3.5 w-3.5 animate-spin text-amber-400" />
                    AGUARDANDO TAXA POSICIONADA ({Math.max(0, 30 - openingWindow.second)}s RESTANTES)
                  </div>
                  <p className="mt-1 text-[8px] leading-tight text-amber-100">
                    {signal.direction === 'CALL' 
                      ? 'Esperando vela ficar VERMELHA (< abertura) para comprar com taxa excelente!' 
                      : 'Esperando vela ficar VERDE (> abertura) para vender no topo!'}
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-[8px]">
                    <span className="text-zinc-400">Estado da vela:</span>
                    <span className={`rounded px-1.5 py-0.5 font-bold ${
                      currentPrice < (signal.entryPrice || 0)
                        ? 'bg-rose-500 text-white'
                        : currentPrice > (signal.entryPrice || 0)
                        ? 'bg-[#00ff66] text-black'
                        : 'bg-zinc-700 text-zinc-200'
                    }`}>
                      {currentPrice < (signal.entryPrice || 0) 
                        ? '🔴 VERMELHA (Gatilho CALL Atingido!)' 
                        : currentPrice > (signal.entryPrice || 0) 
                        ? '🟢 VERDE (Gatilho PUT Atingido!)' 
                        : '⚪ ABERTURA'}
                    </span>
                  </div>
                  <div className="mt-1 text-[7.5px] text-amber-300/80">
                    Se não recuar até os 30s, o robô descarta a ordem por segurança.
                  </div>
                </div>
              )}

              {signal.pullbackEnabled && signal.pullbackStatus === 'EXECUTED_PULLBACK' && (
                <div className="rounded-lg border border-[#00ff66]/70 bg-emerald-950/80 p-2 text-center text-[9px] font-black text-[#00ff66]">
                  ✅ TAXA POSICIONADA ATINGIDA! ORDEM EXECUTADA NO RECUO PERFEITO
                </div>
              )}

              {signal.pullbackEnabled && signal.pullbackStatus === 'EXPIRED_PULLBACK' && (
                <div className="rounded-lg border border-rose-500/60 bg-rose-950/80 p-2 text-center text-[8.5px] font-bold text-rose-300">
                  ⏱️ TEMPO LIMITE DE 30s ESGOTADO: Vela não recuou para a cor ideal. Ordem cancelada!
                </div>
              )}

              <div className={`flex items-center justify-between rounded-xl border-2 p-2.5 ${isBuySignal ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66]' : 'border-rose-500 bg-rose-500/20 text-rose-300'}`}>
                <div className="flex items-center gap-2"><div className={`rounded-lg p-1.5 ${isBuySignal ? 'bg-[#00ff66] text-black' : 'bg-rose-500 text-white'}`}>{isBuySignal ? <ArrowUpRight className="h-5 w-5 stroke-[3]" /> : <ArrowDownRight className="h-5 w-5 stroke-[3]" />}</div><div><div className="text-lg font-black leading-none">{isBuySignal ? '▲ CALL' : '▼ PUT'}</div><div className="mt-0.5 text-[8.5px] font-bold text-white/95">Abertura da vela M1 • {signal.entryTime}</div></div></div>
                <div className="text-right"><div className="text-[8px] text-[#a3d9b5]">REGRA</div><div className="text-lg font-black text-white">P1</div></div>
              </div>
              <div className="space-y-0.5 rounded-lg border border-[#00ff66]/30 bg-[#032412]/90 p-2 text-[9px] text-[#a3d9b5]"><div>◆ Ativo: <strong className="text-white">{signal.assetName}</strong></div><div>◆ Entrada: <strong className="text-[#00ff66]">{signal.entryPrice?.toFixed(asset.decimals)}</strong> na abertura [0]</div>{signal.confluenceFactors.map((factor) => <div key={factor} className="text-[7.5px] text-zinc-300">• {factor}</div>)}{autoTradeEnabled && <div className="flex items-center gap-1 pt-0.5 font-bold text-[#00ff66]"><ShieldCheck className="h-3 w-3" /> Auto-trade pronto para esta abertura</div>}</div>
              <div className="grid grid-cols-2 gap-2"><button onClick={handleCopySignal} className="flex items-center justify-center gap-1 rounded-lg border border-[#00ff66]/50 bg-[#053319] py-1.5 text-[9px] font-bold text-[#00ff66]">{copied ? <><Check className="h-3 w-3" /> Copiado</> : <><Copy className="h-3 w-3" /> Copiar sinal</>}</button><button onClick={() => { sound.playClick(); onExecuteTrade(signal.direction); }} className={`flex items-center justify-center gap-1 rounded-lg py-1.5 text-[9px] font-black uppercase ${isBuySignal ? 'bg-[#00ff66] text-black' : 'bg-rose-500 text-white'}`}><Zap className="h-3 w-3 fill-current" /> Manual {signal.direction}</button></div>
            </div>
          ) : (
            <div className="space-y-1.5 rounded-b-2xl border-t border-[#00ff66]/25 bg-[#032412]/80 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-[9px] font-black tracking-wider text-[#00ff66]">
                <Crosshair className="h-3.5 w-3.5 animate-spin" /> MONITORANDO CONFLUÊNCIA M1
              </div>
              <p className="text-[8px] text-[#a3d9b5]">
                {pullbackEntryEnabled
                  ? 'Modo Taxa Posicionada ativo: sinal detectado espera a vela ficar vermelha (CALL) ou verde (PUT) antes dos 30s.'
                  : 'O robô aguarda confluência Fractal P1 + CCI (4, Low) e filtros, entrando estritamente na abertura (00s-03s de Brasília).'}
              </p>
              <div className="flex items-center justify-center gap-1 pt-0.5 text-[8px] text-zinc-400">
                <ShieldCheck className="h-3 w-3 text-[#00ff66]" /> {pullbackEntryEnabled ? 'Cancelamento automático se não recuar até 30s.' : 'Entrada apenas nos primeiros 3s da vela M1.'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FloatingSniperPanel;
