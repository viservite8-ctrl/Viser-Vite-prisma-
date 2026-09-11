import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock,
  KeyRound,
  Radio,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { AssetPair, BrokerExecutionMode, BrokerExecutionResult, BrokerSession, SignalDirection, TradeOrder } from '../types';
import { sound } from '../utils/audio';
import { getBrasiliaTime, isCandleOpeningWindow } from '../utils/marketData';

interface BrokerOrderPanelProps {
  asset: AssetPair;
  session: BrokerSession;
  onToggleAccountMode: (mode: 'REAL' | 'DEMO') => void;
  onToggleCurrency?: (currency: 'USD' | 'BRL') => void;
  brokerExecutionMode: BrokerExecutionMode;
  onToggleBrokerExecutionMode: (mode: BrokerExecutionMode) => void;
  autoTradeEnabled: boolean;
  onToggleAutoTrade: (enabled: boolean) => void;
  isExecutingBrokerOrder: boolean;
  lastBrokerResult: BrokerExecutionResult | null;
  onPlaceTrade: (direction: SignalDirection, amount: number) => void;
  recentOrders: TradeOrder[];
  onOpenSsidModal: () => void;
  tradeAmount?: number;
  onChangeTradeAmount?: (amount: number) => void;
}

export const BrokerOrderPanel: React.FC<BrokerOrderPanelProps> = ({
  asset,
  session,
  onToggleAccountMode,
  onToggleCurrency,
  brokerExecutionMode,
  onToggleBrokerExecutionMode,
  autoTradeEnabled,
  onToggleAutoTrade,
  isExecutingBrokerOrder,
  lastBrokerResult,
  onPlaceTrade,
  recentOrders,
  onOpenSsidModal,
  tradeAmount,
  onChangeTradeAmount,
}) => {
  const isRealSelected = session.accountMode === 'REAL';
  const isUSD = (session.currency || 'USD') === 'USD';
  const currencySymbol = isUSD ? '$' : 'R$';
  const minAmount = isUSD ? 1 : 5;
  const balance = isRealSelected ? session.realBalance : session.demoBalance;
  const quickAmounts = isUSD ? [1, 5, 10, 25, 50] : [5, 10, 20, 50, 100];
  const [amountStr, setAmountStr] = useState(String(tradeAmount || (isUSD ? 5 : 10)));
  const [brasiliaTime, setBrasiliaTime] = useState(() => getBrasiliaTime());
  const [openingWindow, setOpeningWindow] = useState(() => isCandleOpeningWindow());
  const [strictOpeningOnly, setStrictOpeningOnly] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBrasiliaTime(getBrasiliaTime());
      setOpeningWindow(isCandleOpeningWindow());
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof tradeAmount === 'number' && tradeAmount > 0) setAmountStr(String(tradeAmount));
  }, [tradeAmount]);

  const amount = Number.parseFloat(amountStr) || 0;
  const belowMinimum = amount < minAmount;
  const aboveBalance = amount > balance;
  const timingBlocked = strictOpeningOnly && !openingWindow.allowed;
  const invalid = belowMinimum || aboveBalance;
  const profit = amount * (asset.payout / 100);

  const updateAmount = (value: string) => {
    setAmountStr(value);
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed > 0) onChangeTradeAmount?.(parsed);
  };

  const switchCurrency = (currency: 'USD' | 'BRL') => {
    sound.playClick();
    onToggleCurrency?.(currency);
    const nextMinimum = currency === 'USD' ? 1 : 5;
    if (amount < nextMinimum) {
      const next = currency === 'USD' ? 5 : 10;
      setAmountStr(String(next));
      onChangeTradeAmount?.(next);
    }
  };

  const placeOrder = (direction: SignalDirection) => {
    if (invalid || timingBlocked) {
      sound.playError();
      return;
    }
    sound.playClick();
    onPlaceTrade(direction, amount);
  };

  return (
    <div id="broker-order-panel" className="flex w-full shrink-0 flex-col justify-between overflow-y-auto border-t border-[#00ff66]/20 bg-[rgba(1,4,3,0.95)] p-4 backdrop-blur-md md:w-80 md:border-l md:border-t-0">
      <div className="space-y-3.5">
        <div className={`rounded-xl border p-3.5 ${isRealSelected ? 'border-[#00ff66]/40 shadow-[0_0_20px_rgba(0,255,102,0.1)]' : 'border-amber-400/40'}`}>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex gap-1 rounded-lg border border-white/10 bg-black/80 p-0.5 font-mono text-[10px] font-extrabold">
              <button onClick={() => { sound.playClick(); onToggleAccountMode('REAL'); }} className={`rounded px-2 py-0.5 ${isRealSelected ? 'bg-[#00ff66] text-black' : 'text-[#7a9587]'}`}>CONTA REAL</button>
              <button onClick={() => { sound.playClick(); onToggleAccountMode('DEMO'); }} className={`rounded px-2 py-0.5 ${!isRealSelected ? 'bg-amber-400 text-black' : 'text-[#7a9587]'}`}>DEMO</button>
            </div>
            <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-extrabold ${isRealSelected ? 'bg-[#00ff66]/20 text-[#00ff66]' : 'bg-amber-400/20 text-amber-400'}`}><span className="mr-1 inline-block h-1.5 w-1.5 animate-ping rounded-full bg-current" />{isRealSelected ? 'AO VIVO' : 'TREINO'}</span>
          </div>
          <div className="font-mono text-2xl font-black text-white">{currencySymbol} {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          {session.userName && <div className="mt-0.5 font-mono text-[10px] text-zinc-400">Titular: <span className="font-bold text-[#00ff66]">{session.userName}</span></div>}
          <button onClick={() => { sound.playClick(); onOpenSsidModal(); }} className="mt-2 flex w-full items-center justify-between border-t border-white/10 pt-2 text-[11px] font-mono text-[#7a9587] hover:text-white"><span className="flex items-center gap-1"><KeyRound className="h-3 w-3 text-[#00ff66]" /> SSID: <strong className="text-zinc-300">{session.ssid.substring(0, 8)}...{session.ssid.substring(session.ssid.length - 4)}</strong></span><span className="font-bold text-[#00ff66]">{session.isConnected ? 'Conectado' : 'Offline'}</span></button>
        </div>

        {/* Status de Horário de Brasília & Bloqueio de Meio de Vela */}
        <div className={`rounded-xl border p-2.5 font-mono text-xs ${openingWindow.allowed ? 'border-[#00ff66]/60 bg-[#00ff66]/10 text-[#00ff66]' : 'border-rose-500/40 bg-rose-950/20 text-rose-300'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold">
              <Clock className="h-3.5 w-3.5" />
              <span>Brasília (UTC-3): <strong>{brasiliaTime}</strong></span>
            </div>
            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-black">
              {openingWindow.second}s / 60s
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px]">
            <span>{openingWindow.allowed ? '🟢 Janela de Abertura (0-3s)' : '🔴 Vela em andamento'}</span>
            <span className="font-extrabold">{openingWindow.allowed ? 'LIBERADO' : 'BLOQUEADO'}</span>
          </div>
          {!openingWindow.allowed && (
            <div className="mt-1 text-[9px] text-zinc-400">
              O robô não entra no meio da vela. Aguardando abertura da próxima vela.
            </div>
          )}
        </div>

        <div className="space-y-2.5 rounded-xl border border-[#00ff66]/40 bg-gradient-to-b from-[#00ff66]/10 to-transparent p-3 font-mono text-xs">
          <div className="flex items-center justify-between"><div className="flex items-center gap-1.5 text-[11px] font-extrabold text-white"><Radio className={`h-3.5 w-3.5 ${brokerExecutionMode !== 'OFF' ? 'animate-pulse text-[#00ff66]' : 'text-zinc-400'}`} /> EXECUÇÃO M1 FRACTAL</div><span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${brokerExecutionMode === 'REAL' ? 'border-rose-500/40 bg-rose-500/20 text-rose-400' : brokerExecutionMode === 'DEMO' ? 'border-amber-400/40 bg-amber-400/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'}`}>{brokerExecutionMode === 'REAL' ? 'OPTGO REAL' : brokerExecutionMode === 'DEMO' ? 'OPTGO DEMO' : 'SIMULADO'}</span></div>
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/80 p-1 text-center text-[9px] font-bold"><button onClick={() => onToggleBrokerExecutionMode('OFF')} className={`rounded py-1.5 ${brokerExecutionMode === 'OFF' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>SIMULADO</button><button onClick={() => onToggleBrokerExecutionMode('DEMO')} className={`rounded py-1.5 ${brokerExecutionMode === 'DEMO' ? 'bg-amber-400 text-black' : 'text-amber-400/70'}`}>OPTGO DEMO</button><button onClick={() => onToggleBrokerExecutionMode('REAL')} className={`rounded py-1.5 ${brokerExecutionMode === 'REAL' ? 'bg-[#00ff66] text-black' : 'text-[#00ff66]/70'}`}>OPTGO REAL</button></div>
          <div className="flex items-center justify-between border-t border-white/10 pt-2"><div className="flex items-center gap-1.5"><Bot className={`h-4 w-4 ${autoTradeEnabled ? 'animate-pulse text-[#00ff66]' : 'text-zinc-400'}`} /><div><span className="block text-[10px] font-extrabold text-white">Entrada automática</span><span className="block text-[8px] text-[#7a9587]">Somente nos primeiros 3s da abertura</span></div></div><button onClick={() => onToggleAutoTrade(!autoTradeEnabled)} className={`rounded px-2.5 py-1 text-[10px] font-black ${autoTradeEnabled ? 'bg-[#00ff66] text-black' : 'border border-white/15 bg-black/60 text-zinc-400'}`}>{autoTradeEnabled ? 'LIGADO' : 'DESLIGADO'}</button></div>
          {isExecutingBrokerOrder && <div className="flex items-center gap-1.5 rounded-lg border border-[#00ff66]/50 bg-[#00ff66]/20 p-1.5 text-[9px] text-[#00ff66]"><RefreshCw className="h-3 w-3 animate-spin" /> Enviando ordem M1 para a corretora...</div>}
          {lastBrokerResult && <div className={`rounded-lg border p-1.5 text-[9px] ${lastBrokerResult.success ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300' : 'border-rose-500/40 bg-rose-950/60 text-rose-300'}`}><div className="flex items-center gap-1 font-bold">{lastBrokerResult.success ? <CheckCircle2 className="h-3 w-3 text-[#00ff66]" /> : <AlertTriangle className="h-3 w-3" />}{lastBrokerResult.message || lastBrokerResult.error}</div></div>}
        </div>

        <div className="space-y-2 rounded-xl border border-white/10 bg-black/40 p-3">
          <div className="flex items-center justify-between"><label className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-200"><Wallet className="h-3.5 w-3.5 text-[#00ff66]" /> Valor da entrada</label><div className="flex gap-1 rounded-lg border border-white/15 bg-black/90 p-0.5 font-mono text-[10px] font-extrabold"><button onClick={() => switchCurrency('USD')} className={`rounded px-2 py-0.5 ${isUSD ? 'bg-[#00ff66] text-black' : 'text-[#7a9587]'}`}>USD</button><button onClick={() => switchCurrency('BRL')} className={`rounded px-2 py-0.5 ${!isUSD ? 'bg-[#00ff66] text-black' : 'text-[#7a9587]'}`}>BRL</button></div></div>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-black text-[#00ff66]">{currencySymbol}</span><input id="trade-amount-input" type="number" min={minAmount} step="any" value={amountStr} onChange={(event) => updateAmount(event.target.value)} onBlur={() => { if (belowMinimum) updateAmount(String(minAmount)); }} className={`w-full rounded-lg border bg-black/80 py-2 pl-10 pr-14 font-mono text-sm font-black text-white outline-none ${belowMinimum ? 'border-amber-400/80' : aboveBalance ? 'border-rose-500/80' : 'border-[#00ff66]/40'}`} /><span className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[11px] font-bold text-zinc-400">{isUSD ? 'USD' : 'BRL'}</span></div>
          <div className="flex items-center justify-between font-mono text-[10px]"><span className={belowMinimum ? 'font-bold text-amber-400' : 'text-[#7a9587]'}>Mínimo: <strong className="text-white">{currencySymbol} {minAmount}</strong></span><span className="text-[#7a9587]">Saldo: <strong className="text-zinc-300">{currencySymbol} {balance.toFixed(2)}</strong></span></div>
          {invalid && <div className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] ${aboveBalance ? 'border-rose-500/50 bg-rose-950/50 text-rose-300' : 'border-amber-500/50 bg-amber-950/50 text-amber-300'}`}><AlertTriangle className="h-3 w-3" />{aboveBalance ? 'Saldo insuficiente.' : `Mínimo obrigatório: ${currencySymbol} ${minAmount}.`}</div>}
          <div className="flex gap-1.5">{quickAmounts.map((value) => <button key={value} onClick={() => updateAmount(String(value))} className={`flex-1 rounded py-1 font-mono text-[10px] font-bold ${amount === value ? 'bg-[#00ff66] text-black' : 'border border-white/10 bg-black/60 text-zinc-300'}`}>{currencySymbol}{value}</button>)}</div>
        </div>

        <div className="space-y-2 rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs">
          <div className="flex items-center justify-between text-zinc-300"><span>Ativo</span><strong className="text-white">{asset.name}</strong></div>
          <div className="flex items-center justify-between text-zinc-300"><span>Estratégia</span><strong className="text-[#00ff66]">Fractal P1 + CCI (4)</strong></div>
          <div className="flex items-center justify-between text-zinc-300"><span>Filtros ativos</span><strong className="text-emerald-400">Anti-Exaustão + Gap</strong></div>
          <div className="flex items-center justify-between text-zinc-300"><span>Entrada</span><strong className="text-white">Abertura da vela (0-3s)</strong></div>
          <div className="flex items-center justify-between border-t border-white/10 pt-2 font-bold text-white"><span>Lucro estimado</span><span className="text-sm font-black text-[#00ff66]">+{currencySymbol} {profit.toFixed(2)}</span></div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            id="order-call-btn"
            onClick={() => placeOrder('CALL')}
            disabled={isExecutingBrokerOrder || invalid || timingBlocked}
            className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-[#00ff66]/80 bg-gradient-to-b from-[#00ff66] to-[#00cc52] px-3 py-3.5 font-extrabold text-black shadow-[0_0_20px_rgba(0,255,102,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="flex items-center gap-1"><ArrowUpRight className="h-5 w-5 stroke-[3]" /><span className="font-display text-base font-black">ACIMA</span></div>
            <span className="font-mono text-[10px] font-black uppercase">CALL • M1</span>
          </button>
          <button
            id="order-put-btn"
            onClick={() => placeOrder('PUT')}
            disabled={isExecutingBrokerOrder || invalid || timingBlocked}
            className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-rose-500/80 bg-gradient-to-b from-[#ff3355] to-[#cc1433] px-3 py-3.5 font-extrabold text-white shadow-[0_0_20px_rgba(255,51,85,0.35)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <div className="flex items-center gap-1"><ArrowDownRight className="h-5 w-5 stroke-[3]" /><span className="font-display text-base font-black">ABAIXO</span></div>
            <span className="font-mono text-[10px] font-black uppercase">PUT • M1</span>
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-white/10 pt-3"><div className="flex items-center justify-between font-mono text-[11px]"><span className="font-bold uppercase text-[#7a9587]">Ordens recentes</span><span className="text-[10px] text-zinc-400">{recentOrders.length}</span></div><div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">{recentOrders.length === 0 ? <div className="py-4 text-center font-mono text-[11px] text-[#7a9587]">Nenhuma ordem em andamento.</div> : recentOrders.slice(0, 5).map((order) => <div key={order.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/40 px-2.5 py-1.5 font-mono text-[11px]"><div className="flex items-center gap-2"><span className={`rounded px-1 py-0.5 text-[10px] font-black ${order.direction === 'CALL' ? 'bg-[#00ff66]/20 text-[#00ff66]' : 'bg-rose-500/20 text-rose-400'}`}>{order.direction}</span><div><span className="block text-[10px] text-zinc-200">{order.assetName}</span>{order.brokerOptionId && <span className="block text-[8px] text-[#00ff66]">OPTGO #{order.brokerOptionId}</span>}</div></div><div className="flex items-center gap-2"><span className="text-zinc-400">{currencySymbol}{order.amount}</span>{order.status === 'OPEN' ? <span className="animate-pulse text-[10px] text-amber-400">ABERTA</span> : order.status === 'WON' ? <span className="text-[10px] font-bold text-[#00ff66]">+{currencySymbol}{order.profit?.toFixed(2)}</span> : <span className="text-[10px] font-bold text-rose-400">-{currencySymbol}{order.amount}</span>}</div></div>)}</div></div>
      <div className="mt-3 flex items-center gap-1.5 text-[9px] text-[#7a9587]"><ShieldCheck className="h-3 w-3 text-[#00ff66]" /> Entradas manuais e automáticas só são enviadas na abertura da vela (0-3s).</div>
    </div>
  );
};

export default BrokerOrderPanel;
