import React, { useEffect, useRef, useState } from 'react';
import { Activity, Compass, Eye, EyeOff, ShieldCheck, TrendingDown, TrendingUp, ZoomIn, ZoomOut } from 'lucide-react';
import { AssetPair, Candle, FractalDetection, SniperSignal } from '../types';
import { 
  analyzeMarketTrendAndStructure, 
  calculateCci, 
  calculateEmaSeries, 
  checkExhaustionCandle, 
  checkGapFilter, 
  detectMarketPivots, 
  getBrasiliaTime, 
  isCandleOpeningWindow 
} from '../utils/marketData';

interface ChartCanvasProps {
  asset: AssetPair;
  candles: Candle[];
  activeSignal: SniperSignal | null;
  currentPrice: number;
  fractal: FractalDetection;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({ asset, candles, activeSignal, currentPrice, fractal }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverData, setHoverData] = useState<{ candle: Candle; x: number; y: number } | null>(null);
  const [visibleCount, setVisibleCount] = useState(48);
  const [showFractals, setShowFractals] = useState(true);
  const [showCci, setShowCci] = useState(true);
  const [showStructure, setShowStructure] = useState(true);
  const [candleCountdown, setCandleCountdown] = useState(() => 60 - new Date().getSeconds());
  const [brasiliaTimeStr, setBrasiliaTimeStr] = useState(() => getBrasiliaTime());
  const [openingWindow, setOpeningWindow] = useState(() => isCandleOpeningWindow());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCandleCountdown(60 - new Date().getSeconds());
      setBrasiliaTimeStr(getBrasiliaTime());
      setOpeningWindow(isCandleOpeningWindow());
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  const cciAnalysis = React.useMemo(() => {
    return calculateCci(candles, 4, 4, 100, -100);
  }, [candles]);

  const exhaustionCheck = React.useMemo(() => {
    return checkExhaustionCandle(candles);
  }, [candles]);

  const gapCheck = React.useMemo(() => {
    return checkGapFilter(candles);
  }, [candles]);

  const trendAnalysis = React.useMemo(() => {
    return analyzeMarketTrendAndStructure(candles);
  }, [candles]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => drawChart());
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    drawChart();
    return () => resizeObserver.disconnect();
  }, [candles, currentPrice, visibleCount, showFractals, showCci, showStructure, activeSignal, fractal, hoverData]);

  const drawTriangle = (ctx: CanvasRenderingContext2D, x: number, y: number, direction: 'up' | 'down', color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (direction === 'up') {
      ctx.moveTo(x, y - 11);
      ctx.lineTo(x - 8, y + 4);
      ctx.lineTo(x + 8, y + 4);
    } else {
      ctx.moveTo(x, y + 11);
      ctx.lineTo(x - 8, y - 4);
      ctx.lineTo(x + 8, y - 4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('F', x, direction === 'up' ? y + 17 : y - 14);
    ctx.restore();
  };

  const drawCciArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, direction: 'up' | 'down', color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (direction === 'up') {
      ctx.moveTo(x, y - 8);
      ctx.lineTo(x - 6, y + 4);
      ctx.lineTo(x + 6, y + 4);
    } else {
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x - 6, y - 4);
      ctx.lineTo(x + 6, y - 4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  const drawChart = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#020504';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.035)';
    for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    if (candles.length === 0) return;

    const count = Math.min(visibleCount, candles.length);
    const visibleCandles = candles.slice(-count);
    const startIndex = candles.length - count;

    const rightMargin = 86;
    const bottomMargin = 22;
    const cciHeight = showCci ? 88 : 0;
    const cciGap = showCci ? 8 : 0;
    const chartWidth = Math.max(1, width - rightMargin);
    const chartHeight = Math.max(1, height - bottomMargin - cciHeight - cciGap);
    const slotWidth = chartWidth / count;
    const bodyWidth = Math.max(3, slotWidth * 0.68);

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;
    visibleCandles.forEach((candle) => {
      minPrice = Math.min(minPrice, candle.low);
      maxPrice = Math.max(maxPrice, candle.high);
      maxVolume = Math.max(maxVolume, candle.volume);
    });
    const padding = (maxPrice - minPrice) * 0.14 || 0.001;
    minPrice -= padding;
    maxPrice += padding;
    const priceRange = maxPrice - minPrice || 1;

    const getY = (price: number) => chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    const getX = (index: number) => index * slotWidth + slotWidth / 2;

    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    for (let i = 0; i <= 6; i += 1) {
      const price = minPrice + (priceRange / 6) * i;
      const y = getY(price);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartWidth, y); ctx.stroke();
      ctx.fillStyle = '#7a9587';
      ctx.fillText(price.toFixed(asset.decimals), chartWidth + 8, y + 3);
    }

    const volumeHeight = chartHeight * 0.14;
    visibleCandles.forEach((candle, index) => {
      const x = getX(index);
      const volume = (candle.volume / (maxVolume || 1)) * volumeHeight;
      ctx.fillStyle = candle.close >= candle.open ? 'rgba(0,255,102,0.10)' : 'rgba(255,51,85,0.10)';
      ctx.fillRect(x - bodyWidth / 2, chartHeight - volume, bodyWidth, volume);
    });

    visibleCandles.forEach((candle, index) => {
      const x = getX(index);
      const color = candle.close >= candle.open ? '#00ff66' : '#ff3355';
      const highY = getY(candle.high);
      const lowY = getY(candle.low);
      const openY = getY(candle.open);
      const closeY = getY(candle.close);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x, highY); ctx.lineTo(x, lowY); ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(x - bodyWidth / 2, Math.min(openY, closeY), bodyWidth, Math.max(2, Math.abs(closeY - openY)));
    });

    if (showFractals && fractal.signalAtOpen && fractal.confirmationCandle) {
      const confirmationIndex = candles.findIndex((candle) => candle.time === fractal.confirmationCandle?.time);
      const visibleIndex = confirmationIndex - startIndex;
      if (visibleIndex >= 0 && visibleIndex < visibleCandles.length) {
        const candle = visibleCandles[visibleIndex];
        const x = getX(visibleIndex);
        const isBuy = fractal.isBuyFractal;
        drawTriangle(ctx, x, isBuy ? getY(candle.low) + 8 : getY(candle.high) - 8, isBuy ? 'up' : 'down', isBuy ? '#38bdf8' : '#fb923c');
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.fillStyle = isBuy ? '#ff3355' : '#00ff66';
        ctx.textAlign = isBuy ? 'left' : 'right';
        ctx.fillText(isBuy ? 'FUNDO SUPORTE → ENTRADA PUT' : 'TOPO RESISTÊNCIA → ENTRADA CALL', isBuy ? x + 12 : x - 12, isBuy ? getY(candle.low) + 28 : getY(candle.high) - 28);
      }
    }

    if (activeSignal && activeSignal.assetId === asset.id && fractal.confirmationCandle) {
      const confirmationIndex = candles.findIndex((candle) => candle.time === fractal.confirmationCandle?.time);
      const visibleIndex = confirmationIndex - startIndex;
      if (visibleIndex >= 0 && visibleIndex < visibleCandles.length) {
        const x = getX(visibleIndex);
        const y = activeSignal.direction === 'CALL' ? getY(visibleCandles[visibleIndex].low) + 32 : getY(visibleCandles[visibleIndex].high) - 32;
        ctx.save();
        ctx.strokeStyle = activeSignal.direction === 'CALL' ? '#00ff66' : '#ff3355';
        ctx.fillStyle = activeSignal.direction === 'CALL' ? 'rgba(0,255,102,0.15)' : 'rgba(255,51,85,0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + 20, y); ctx.moveTo(x, y - 20); ctx.lineTo(x, y + 20); ctx.stroke();
        ctx.font = 'bold 10px JetBrains Mono, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
        
        if (activeSignal.pullbackEnabled && activeSignal.pullbackStatus === 'WAITING_PULLBACK') {
          ctx.fillText(activeSignal.direction === 'CALL' ? '⏳ CALL • AGUARDE VELA FICAR VERMELHA' : '⏳ PUT • AGUARDE VELA FICAR VERDE', x, activeSignal.direction === 'CALL' ? y + 31 : y - 23);
          
          // Desenha linha de referência da abertura para o pullback
          const openPrice = activeSignal.entryPrice ?? visibleCandles[visibleIndex].open;
          const openY = getY(openPrice);
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, openY);
          ctx.lineTo(width - rightMargin, openY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = 'bold 9px JetBrains Mono, monospace';
          ctx.fillStyle = '#facc15';
          ctx.textAlign = 'left';
          ctx.fillText(`TAXA BASE ABERTURA [0]: ${openPrice.toFixed(asset.decimals)} (Recuo até 30s)`, 12, openY - 4);
        } else if (activeSignal.pullbackEnabled && activeSignal.pullbackStatus === 'EXECUTED_PULLBACK') {
          ctx.fillText(activeSignal.direction === 'CALL' ? '✅ CALL EXECUTADO (TAXA NO RECUO)' : '✅ PUT EXECUTADO (TAXA NO RECUO)', x, activeSignal.direction === 'CALL' ? y + 31 : y - 23);
        } else if (activeSignal.pullbackEnabled && activeSignal.pullbackStatus === 'EXPIRED_PULLBACK') {
          ctx.fillText('⏱️ TEMPO LIMITE 30s: ORDEM CANCELADA', x, activeSignal.direction === 'CALL' ? y + 31 : y - 23);
        } else {
          ctx.fillText(activeSignal.direction === 'CALL' ? 'CALL • ENTRADA M1' : 'PUT • ENTRADA M1', x, activeSignal.direction === 'CALL' ? y + 31 : y - 23);
        }
        ctx.restore();
      }
    }

    // ==========================================
    // MÉDIAS MÓVEIS (MICRO & MACRO) & PIVÔS (HH, HL, LH, LL)
    // ==========================================
    if (showStructure) {
      const closes = candles.map((c) => c.close);
      const microEmaSeries = calculateEmaSeries(closes, Math.min(14, Math.floor(closes.length / 2)));
      const macroEmaSeries = calculateEmaSeries(closes, Math.min(40, Math.max(10, Math.floor(closes.length * 0.7))));

      // 1. Linha EMA Micro (Cyan / #00e5ff)
      ctx.save();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let hasMicroStarted = false;
      for (let i = 0; i < count; i += 1) {
        const globalIdx = startIndex + i;
        const val = microEmaSeries[globalIdx];
        if (val !== undefined) {
          const px = getX(i);
          const py = getY(val);
          if (!hasMicroStarted) {
            ctx.moveTo(px, py);
            hasMicroStarted = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
      ctx.stroke();

      // 2. Linha EMA Macro (Amber / #ffaa00)
      ctx.strokeStyle = '#ffaa00';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let hasMacroStarted = false;
      for (let i = 0; i < count; i += 1) {
        const globalIdx = startIndex + i;
        const val = macroEmaSeries[globalIdx];
        if (val !== undefined) {
          const px = getX(i);
          const py = getY(val);
          if (!hasMacroStarted) {
            ctx.moveTo(px, py);
            hasMacroStarted = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
      ctx.stroke();
      ctx.restore();

      // 3. Pivôs de Price Action (HH, HL, LH, LL)
      trendAnalysis.pivots.forEach((pivot) => {
        const visibleIdx = pivot.candleIndex - startIndex;
        if (visibleIdx >= 0 && visibleIdx < count) {
          const px = getX(visibleIdx);
          const isHigh = pivot.type === 'HH' || pivot.type === 'LH';
          const py = isHigh ? getY(pivot.price) - 13 : getY(pivot.price) + 13;
          const isBull = pivot.type === 'HH' || pivot.type === 'HL';
          const bg = isBull ? '#00ff66' : '#ff3355';

          ctx.save();
          ctx.font = 'bold 8.5px JetBrains Mono, monospace';
          const text = pivot.type;
          const textW = ctx.measureText(text).width;
          const boxW = textW + 8;
          const boxH = 12;

          ctx.fillStyle = bg;
          ctx.fillRect(px - boxW / 2, py - boxH / 2, boxW, boxH);

          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, px, py);
          ctx.restore();
        }
      });
    }

    const priceY = getY(currentPrice);
    const lastCandle = visibleCandles[visibleCandles.length - 1];
    const priceColor = lastCandle && lastCandle.close >= lastCandle.open ? '#00ff66' : '#ff3355';
    ctx.strokeStyle = priceColor; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, priceY); ctx.lineTo(chartWidth, priceY); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = priceColor; ctx.fillRect(chartWidth + 4, priceY - 11, rightMargin - 8, 22);
    ctx.font = 'bold 11px JetBrains Mono, monospace'; ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.fillText(currentPrice.toFixed(asset.decimals), chartWidth + rightMargin / 2, priceY + 4);

    // ==========================================
    // PAINEL INFERIOR: CCI WITH ARROW (QCS SCRIPT)
    // ==========================================
    if (showCci && cciHeight > 0) {
      const cciTop = chartHeight + cciGap;
      const cciBottom = cciTop + cciHeight;
      const cciMin = -240;
      const cciMax = 240;
      const cciRange = cciMax - cciMin;

      const getCciY = (val: number) => {
        const clamped = Math.max(cciMin, Math.min(cciMax, val));
        return cciBottom - ((clamped - cciMin) / cciRange) * cciHeight;
      };

      // Fundo e divisor do sub-painel CCI
      ctx.fillStyle = '#010804';
      ctx.fillRect(0, cciTop, chartWidth, cciHeight);
      ctx.strokeStyle = 'rgba(0, 255, 102, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, cciTop); ctx.lineTo(chartWidth, cciTop); ctx.stroke();

      // Linhas de Nível horizontais conforme script Lua
      // hline(100, "Nível 100", "#D4AF37", 1)
      // hline(-100, "Nível -100", "#D4AF37", 1)
      // hline(0, "Nível 0", "#888888", 1)
      // hline(200, "Nível 200", "#DAA520", 1)
      // hline(-200, "Nível -200", "#DAA520", 1)
      const drawHLine = (level: number, color: string, label: string, dashed = true) => {
        const y = getCciY(level);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        if (dashed) ctx.setLineDash([3, 3]);
        else ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(chartWidth, y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.fillText(label, chartWidth + 6, y + 3);
      };

      drawHLine(200, '#DAA520', '+200');
      drawHLine(100, '#D4AF37', '+100', false);
      drawHLine(0, 'rgba(136, 136, 136, 0.6)', '0');
      drawHLine(-100, '#D4AF37', '-100', false);
      drawHLine(-200, '#DAA520', '-200');

      // Título do Oscilador
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillStyle = '#2CAC40';
      ctx.textAlign = 'left';
      ctx.fillText(`CCI (4, Low): ${cciAnalysis.currentState.value.toFixed(1)}`, 8, cciTop + 14);

      // Plotagem da Linha CCI (color_cci = "#2CAC40", espessura 2)
      ctx.strokeStyle = '#2CAC40';
      ctx.lineWidth = 2;
      ctx.beginPath();
      let hasStarted = false;
      const cciValues = cciAnalysis.values;

      for (let i = 0; i < count; i += 1) {
        const candleGlobalIndex = startIndex + i;
        const val = cciValues[candleGlobalIndex] ?? 0;
        const x = getX(i);
        const y = getCciY(val);
        if (!hasStarted) {
          ctx.moveTo(x, y);
          hasStarted = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Plotagem das Setas de Compra/Venda do script QCS
      // buy_signal: #00FFFF triangleup abaixo da linha
      // sell_signal: #FF3333 triangledown acima da linha
      for (let i = 2; i < count; i += 1) {
        const candleGlobalIndex = startIndex + i;
        const c1 = cciValues[candleGlobalIndex - 1] ?? 0;
        const c2 = cciValues[candleGlobalIndex - 2] ?? 0;
        const x = getX(i);

        const buySignal = (c2 <= -100 && c1 > -100) || (c1 <= -100 && (cciValues[candleGlobalIndex] ?? 0) > c1);
        const sellSignal = (c2 >= 100 && c1 < 100) || (c1 >= 100 && (cciValues[candleGlobalIndex] ?? 0) < c1);

        if (buySignal) {
          drawCciArrow(ctx, x, getCciY(c1) + 12, 'up', '#00FFFF');
        } else if (sellSignal) {
          drawCciArrow(ctx, x, getCciY(c1) - 12, 'down', '#FF3333');
        }
      }
    }

    if (hoverData) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.setLineDash([2, 2]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hoverData.x, 0); ctx.lineTo(hoverData.x, chartHeight); ctx.moveTo(0, hoverData.y); ctx.lineTo(chartWidth, hoverData.y); ctx.stroke(); ctx.setLineDash([]);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const count = Math.min(visibleCount, candles.length);
    const chartWidth = rect.width - 86;
    const slotWidth = chartWidth / count;
    if (x < chartWidth) {
      const index = Math.floor(x / slotWidth);
      const candleIndex = candles.length - count + index;
      if (candles[candleIndex]) setHoverData({ candle: candles[candleIndex], x, y });
    }
  };

  return (
    <div ref={containerRef} className="relative h-full w-full select-none overflow-hidden bg-[#020504]">
      <div className="absolute left-4 top-2 z-10 flex flex-wrap items-center gap-2 font-mono text-xs">
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/80 px-2.5 py-1 backdrop-blur-sm">
          <span className="font-extrabold text-white">{asset.name}</span>
          <span className="font-bold text-[#00ff66]">{currentPrice.toFixed(asset.decimals)}</span>
          <span className={`text-[10px] ${asset.change24h >= 0 ? 'text-[#00ff66]' : 'text-rose-400'}`}>
            {asset.change24h >= 0 ? '▲ +' : '▼ '}{asset.change24h}%
          </span>
        </div>

        {/* Relógio Oficial Brasília (UTC-3) & Janela de Entrada dos Primeiros 3s */}
        <div className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] backdrop-blur-sm ${openingWindow.allowed ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.3)]' : 'border-rose-500/40 bg-black/85 text-rose-300'}`}>
          <span className={`h-2 w-2 rounded-full ${openingWindow.allowed ? 'bg-[#00ff66] animate-ping' : 'bg-rose-500'}`} />
          <span className="text-zinc-300">Brasília:</span>
          <strong>{brasiliaTimeStr}</strong>
          <span className="rounded bg-black/50 px-1 text-[10px] font-black">
            {openingWindow.allowed ? '🟢 ABERTURA (00s-03s)' : `🔴 EM ANDAMENTO (${openingWindow.second}s)`}
          </span>
        </div>

        {/* Confluência CCI with Arrow */}
        <div className="flex items-center gap-1.5 rounded-md border border-[#2CAC40]/40 bg-black/85 px-2.5 py-1 text-[10px] text-[#2CAC40]">
          <Activity className="h-3 w-3" />
          <span>CCI (4, Low):</span>
          <strong className="text-white">{cciAnalysis.currentState.value.toFixed(1)}</strong>
          {cciAnalysis.currentState.buyArrow && <span className="rounded bg-cyan-400/20 px-1 text-cyan-300 font-extrabold">▲ Seta Compra</span>}
          {cciAnalysis.currentState.sellArrow && <span className="rounded bg-rose-500/20 px-1 text-rose-300 font-extrabold">▼ Seta Venda</span>}
        </div>

        {/* Filtro de Tendência Macro / Micro & Estrutura Price Action (HL, LL, HH, LH) */}
        <div className="flex items-center gap-1.5 rounded-md border border-cyan-500/30 bg-black/85 px-2.5 py-1 text-[10px]">
          <Compass className="h-3 w-3 text-cyan-400" />
          <span className="text-zinc-400">Tendência:</span>
          <span className={`font-bold ${trendAnalysis.macroTrend === 'ALTA' ? 'text-[#00ff66]' : trendAnalysis.macroTrend === 'BAIXA' ? 'text-rose-400' : 'text-amber-400'}`}>
            M:{trendAnalysis.macroTrend}
          </span>
          <span className="text-zinc-600">/</span>
          <span className={`font-bold ${trendAnalysis.microTrend === 'ALTA' ? 'text-[#00ff66]' : trendAnalysis.microTrend === 'BAIXA' ? 'text-rose-400' : 'text-amber-400'}`}>
            μ:{trendAnalysis.microTrend}
          </span>
          <span className="rounded bg-cyan-950/60 px-1 font-mono font-bold text-cyan-300">
            {trendAnalysis.structure === 'HH_HL' ? 'HH/HL (Alta)' : trendAnalysis.structure === 'LH_LL' ? 'LH/LL (Baixa)' : 'Lateral'}
          </span>
          <span className="text-[9px] text-zinc-400">({trendAnalysis.strengthPercent}%)</span>
        </div>

        {/* Filtros Anti-Exaustão e Anti-Gap */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-white/10 bg-black/80 px-2 py-1 text-[10px] text-zinc-300">
          <ShieldCheck className="h-3 w-3 text-[#00ff66]" />
          <span>Filtros:</span>
          <span className={exhaustionCheck.passed ? 'text-[#00ff66]' : 'text-rose-400'}>
            Exaustão {exhaustionCheck.passed ? '✓' : '✗'}
          </span>
          <span>•</span>
          <span className={gapCheck.passed ? 'text-[#00ff66]' : 'text-rose-400'}>
            Gap {gapCheck.passed ? '✓' : '✗'}
          </span>
        </div>

        {hoverData && (
          <div className="hidden items-center gap-3 rounded-md border border-[#00ff66]/30 bg-black/85 px-3 py-1 text-[11px] text-zinc-300 xl:flex">
            <span>O: <strong className="text-white">{hoverData.candle.open.toFixed(asset.decimals)}</strong></span>
            <span>M: <strong className="text-[#00ff66]">{hoverData.candle.high.toFixed(asset.decimals)}</strong></span>
            <span>B: <strong className="text-rose-400">{hoverData.candle.low.toFixed(asset.decimals)}</strong></span>
            <span>F: <strong className="text-white">{hoverData.candle.close.toFixed(asset.decimals)}</strong></span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverData(null)} className="block h-full w-full cursor-crosshair" />

      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-lg border border-[#00ff66]/20 bg-black/80 p-1 backdrop-blur-md">
        <button onClick={() => setVisibleCount((count) => Math.max(20, count - 6))} className="rounded p-1.5 text-[#7a9587] transition hover:text-[#00ff66]" title="Zoom in"><ZoomIn className="h-4 w-4" /></button>
        <button onClick={() => setVisibleCount((count) => Math.min(100, count + 6))} className="rounded p-1.5 text-[#7a9587] transition hover:text-[#00ff66]" title="Zoom out"><ZoomOut className="h-4 w-4" /></button>
        <button onClick={() => setShowFractals((value) => !value)} className={`rounded p-1.5 transition ${showFractals ? 'text-[#00ff66]' : 'text-zinc-600'}`} title="Exibir/ocultar fractais">{showFractals ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
        <button onClick={() => setShowCci((value) => !value)} className={`rounded px-2 py-1 font-mono text-[10px] font-extrabold transition ${showCci ? 'border border-[#2CAC40]/50 bg-[#2CAC40]/20 text-[#2CAC40]' : 'text-zinc-500'}`} title="Oscilador CCI com Arrow">CCI (4)</button>
        <button onClick={() => setShowStructure((value) => !value)} className={`rounded px-2 py-1 font-mono text-[10px] font-extrabold transition ${showStructure ? 'border border-cyan-400/50 bg-cyan-500/20 text-cyan-300' : 'text-zinc-500'}`} title="Pivôs HL/LL/HH/LH e Médias Móveis">Pivôs (HL/LL)</button>
      </div>

      {showStructure && (
        <div className="absolute bottom-3 right-24 z-10 hidden md:flex items-center gap-2 rounded-md border border-white/10 bg-black/80 px-2 py-1 font-mono text-[9px] text-zinc-400 backdrop-blur-sm">
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded bg-[#00e5ff]" /> EMA 14 (Micro)</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded bg-[#ffaa00]" /> EMA 40 (Macro)</span>
          <span className="text-zinc-500">|</span>
          <span className="text-[#00ff66] font-bold">HH / HL (Zonas de Alta)</span>
          <span className="text-rose-400 font-bold">LH / LL (Zonas de Baixa)</span>
        </div>
      )}
    </div>
  );
};

export default ChartCanvas;
