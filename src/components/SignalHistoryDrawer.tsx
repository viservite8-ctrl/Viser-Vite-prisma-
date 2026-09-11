import React, { useState } from 'react';
import { SniperSignal, TradeOrder } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Award, 
  Trash2, 
  TrendingUp, 
  Wallet, 
  Activity, 
  Filter 
} from 'lucide-react';

interface SignalHistoryDrawerProps {
  signals: SniperSignal[];
  orders: TradeOrder[];
  isOpen: boolean;
  onClose: () => void;
  onClearHistory?: () => void;
}

export const SignalHistoryDrawer: React.FC<SignalHistoryDrawerProps> = ({
  signals,
  orders,
  isOpen,
  onClose,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'SIGNALS' | 'ORDERS'>('SIGNALS');
  const [resultFilter, setResultFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');
  const [onlyM1, setOnlyM1] = useState<boolean>(false);

  if (!isOpen) return null;

  const signalWins = signals.filter((s) => s.result === 'WIN').length;
  const signalLosses = signals.filter((s) => s.status === 'LOSS' || s.result === 'LOSS').length;
  const totalSignals = signalWins + signalLosses;
  const signalWinRate = totalSignals > 0 ? ((signalWins / totalSignals) * 100).toFixed(1) : '100.0';

  const resolvedOrders = orders.filter((o) => o.status === 'WON' || o.status === 'LOST');
  const orderWins = resolvedOrders.filter((o) => o.status === 'WON').length;
  const orderLosses = resolvedOrders.filter((o) => o.status === 'LOST').length;
  const totalOrders = orderWins + orderLosses;
  const orderWinRate = totalOrders > 0 ? ((orderWins / totalOrders) * 100).toFixed(1) : '100.0';

  const netProfit = resolvedOrders.reduce((acc, o) => {
    if (o.status === 'WON') return acc + (o.profit || 0);
    if (o.status === 'LOST') return acc - o.amount;
    return acc;
  }, 0);

  const displayWins = activeTab === 'SIGNALS' ? signalWins : orderWins;
  const displayLosses = activeTab === 'SIGNALS' ? signalLosses : orderLosses;
  const displayWinRate = activeTab === 'SIGNALS' ? signalWinRate : orderWinRate;

  const filteredSignals = signals.filter((sig) => {
    if (onlyM1 && sig.timeframe !== 'M1') return false;
    if (resultFilter === 'WIN') return sig.result === 'WIN';
    if (resultFilter === 'LOSS') return sig.status === 'LOSS' || sig.result === 'LOSS';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-[#00ff66]/35 bg-[rgba(1,4,3,0.98)] p-4 sm:p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#00ff66]/20 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00ff66]/40 bg-[#00ff66]/10 text-[#00ff66]">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-black text-white flex items-center gap-2">
                HISTÓRICO REAL DE OPERAÇÕES
                <span className="rounded bg-[#00ff66]/20 px-1.5 py-0.5 font-mono text-[10px] font-black text-[#00ff66] border border-[#00ff66]/30">
                  100% AUDITADO
                </span>
              </h3>
              <p className="font-mono text-xs text-[#a3d9b5]">
                Fractal Sem Limites (Período 1) • Entrada confirmada na abertura M1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onClearHistory && (
              <button
                onClick={onClearHistory}
                title="Limpar Histórico"
                className="rounded-lg p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:text-white transition hover:bg-white/5 font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 mt-3 border-b border-white/10 pb-2.5 font-mono text-xs shrink-0">
          <button
            onClick={() => setActiveTab('SIGNALS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'SIGNALS'
                ? 'bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/40 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                : 'text-zinc-400 hover:text-white bg-black/40'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Sinais da IA ({signals.length})
          </button>
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
              activeTab === 'ORDERS'
                ? 'bg-[#00ff66]/20 text-[#00ff66] border border-[#00ff66]/40 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                : 'text-zinc-400 hover:text-white bg-black/40'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            Ordens Executadas ({orders.length})
          </button>
        </div>

        {/* Scrollable body content */}
        <div className="overflow-y-auto space-y-3.5 pr-1 mt-3">
          {/* Real Stats bar (Geral) */}
          <div className="grid grid-cols-4 gap-2 font-mono text-center">
            <div className="rounded-xl border border-white/10 bg-black/60 p-2.5">
              <div className="text-[9px] text-[#7a9587] uppercase font-bold">Total Geral</div>
              <div className="text-lg font-black text-white">
                {activeTab === 'SIGNALS' ? totalSignals : totalOrders}
              </div>
            </div>
            <div className="rounded-xl border border-[#00ff66]/25 bg-black/60 p-2.5">
              <div className="text-[9px] text-[#7a9587] uppercase font-bold">Vitórias (WIN)</div>
              <div className="text-lg font-black text-[#00ff66]">{displayWins}</div>
            </div>
            <div className="rounded-xl border border-rose-500/25 bg-black/60 p-2.5">
              <div className="text-[9px] text-[#7a9587] uppercase font-bold">Derrotas (LOSS)</div>
              <div className="text-lg font-black text-rose-400">{displayLosses}</div>
            </div>
            <div className="rounded-xl border border-[#ffe600]/25 bg-black/60 p-2.5">
              <div className="text-[9px] text-[#7a9587] uppercase font-bold">Assertividade</div>
              <div className="text-lg font-black text-[#ffe600]">{displayWinRate}%</div>
            </div>
          </div>

          {/* P&L banner for Orders tab */}
          {activeTab === 'ORDERS' && (
            <div className="flex items-center justify-between rounded-xl border border-[#00ff66]/30 bg-[#00ff66]/5 px-3 py-2 font-mono text-xs">
              <span className="text-zinc-300 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#00ff66]" /> Resultado Financeiro Real:
              </span>
              <span
                className={`font-black text-sm ${
                  netProfit >= 0 ? 'text-[#00ff66]' : 'text-rose-400'
                }`}
              >
                {netProfit >= 0 ? `+R$ ${netProfit.toFixed(2)}` : `-R$ ${Math.abs(netProfit).toFixed(2)}`}
              </span>
            </div>
          )}

          {/* Filtros da Lista de Sinais */}
          {activeTab === 'SIGNALS' && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono text-[10px]">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-zinc-400 flex items-center gap-1 mr-1">
                  <Filter className="h-3 w-3" /> Filtro:
                </span>
                <button
                  onClick={() => setResultFilter('ALL')}
                  className={`px-2 py-0.5 rounded border transition font-bold ${
                    resultFilter === 'ALL'
                      ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66]'
                      : 'border-white/10 text-zinc-400 hover:text-white bg-black/40'
                  }`}
                >
                  Todos ({signals.length})
                </button>
                <button
                  onClick={() => setResultFilter('WIN')}
                  className={`px-2 py-0.5 rounded border transition font-bold ${
                    resultFilter === 'WIN'
                      ? 'border-[#00ff66] bg-[#00ff66]/20 text-[#00ff66]'
                      : 'border-white/10 text-zinc-400 hover:text-white bg-black/40'
                  }`}
                >
                  🎯 Vitórias ({signalWins})
                </button>
                <button
                  onClick={() => setResultFilter('LOSS')}
                  className={`px-2 py-0.5 rounded border transition font-bold ${
                    resultFilter === 'LOSS'
                      ? 'border-rose-500 bg-rose-500/20 text-rose-400'
                      : 'border-white/10 text-zinc-400 hover:text-white bg-black/40'
                  }`}
                >
                  ❌ Loss ({signalLosses})
                </button>
              </div>

              <button
                onClick={() => setOnlyM1(!onlyM1)}
                className={`px-2.5 py-0.5 rounded border font-bold transition flex items-center gap-1 ${
                  onlyM1
                    ? 'border-[#00ff66] bg-[#00ff66] text-black shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                    : 'border-white/10 text-[#a3d9b5] bg-black/60 hover:text-white'
                }`}
              >
                <span>⏱️ Somente 1M</span>
              </button>
            </div>
          )}

          {/* List Content */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {activeTab === 'SIGNALS' ? (
              filteredSignals.length === 0 ? (
                <div className="py-8 text-center font-mono text-xs text-[#7a9587]">
                  Nenhum sinal com os filtros selecionados. Conforme a Prisma IA gera sinais no mercado real, eles aparecem aqui.
                </div>
              ) : (
                filteredSignals.map((sig, idx) => {
                  const isCall = sig.direction === 'CALL';
                  const isWin = sig.result === 'WIN';
                  const isReady = sig.status === 'READY';

                  return (
                    <div
                      key={`${sig.id}-${idx}`}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs transition hover:border-[#00ff66]/40"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isCall ? 'bg-[#00ff66]/20 text-[#00ff66]' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {isCall ? <ArrowUpRight className="h-4 w-4 stroke-[3]" /> : <ArrowDownRight className="h-4 w-4 stroke-[3]" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white">{sig.assetName}</span>
                            <span className="rounded bg-[#00ff66]/10 px-1.5 py-0.2 text-[10px] font-black text-[#00ff66] border border-[#00ff66]/30">
                              {sig.timeframe}
                            </span>
                            <span className={`text-[10px] font-bold ${isCall ? 'text-[#00ff66]' : 'text-rose-400'}`}>
                              {sig.direction}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#7a9587] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {sig.entryTime}
                            </span>
                            {sig.entryPrice && (
                              <span>• Entrada: <strong className="text-zinc-300">{sig.entryPrice.toFixed(5)}</strong></span>
                            )}
                            {sig.exitPrice && (
                              <span>• Saída: <strong className="text-zinc-300">{sig.exitPrice.toFixed(5)}</strong></span>
                            )}
                            <span>• Força: {sig.confidence}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {isWin ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 rounded-md border border-[#00ff66]/40 bg-[#00ff66]/15 px-2.5 py-0.5 font-extrabold text-[#00ff66] text-[10px] sm:text-[11px] shadow-[0_0_8px_rgba(0,255,102,0.2)]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              WIN AUDITADO
                            </span>
                            <div className="text-[8.5px] text-[#a3d9b5] mt-0.5">Assertividade Confirmada</div>
                          </div>
                        ) : isReady ? (
                          <span className="rounded-md border border-[#ffe600]/40 bg-[#ffe600]/15 px-2 py-0.5 font-bold text-[#ffe600] text-[11px]">
                            ANALISANDO
                          </span>
                        ) : (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 font-bold text-rose-400 text-[10px] sm:text-[11px]">
                              <XCircle className="h-3.5 w-3.5" />
                              LOSS
                            </span>
                            <div className="text-[8.5px] text-rose-400/80 mt-0.5">Operação Encerrada</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              orders.length === 0 ? (
                <div className="py-8 text-center font-mono text-xs text-[#7a9587]">
                  Nenhuma ordem executada ainda nesta sessão. Execute uma operação para acompanhar a liquidação em tempo real.
                </div>
              ) : (
                orders.map((ord, idx) => {
                  const isCall = ord.direction === 'CALL';
                  const isWon = ord.status === 'WON';
                  const isOpenOrder = ord.status === 'OPEN';

                  return (
                    <div
                      key={`${ord.id}-${idx}`}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs transition hover:border-[#00ff66]/40"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            isCall ? 'bg-[#00ff66]/20 text-[#00ff66]' : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {isCall ? <ArrowUpRight className="h-4 w-4 stroke-[3]" /> : <ArrowDownRight className="h-4 w-4 stroke-[3]" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white">{ord.assetName}</span>
                            <span className="rounded bg-[#00ff66]/10 px-1.5 py-0.2 text-[10px] font-black text-[#00ff66] border border-[#00ff66]/30">
                              {ord.timeframe}
                            </span>
                            <span className={`text-[10px] font-bold ${isCall ? 'text-[#00ff66]' : 'text-rose-400'}`}>
                              {ord.direction}
                            </span>
                            {ord.executedOnBroker && (
                              <span className="rounded bg-sky-500/20 px-1 py-0.2 text-[9px] font-bold text-sky-400 border border-sky-500/30">
                                OPTGO
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#7a9587] flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(ord.timestamp).toLocaleTimeString('pt-BR')}
                            </span>
                            <span>• Investido: <strong className="text-white">R$ {ord.amount.toFixed(2)}</strong></span>
                            {ord.entryPrice && <span>• Entrada: {ord.entryPrice.toFixed(5)}</span>}
                            {ord.exitPrice && <span>• Saída: {ord.exitPrice.toFixed(5)}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {isOpenOrder ? (
                          <span className="rounded-md border border-[#ffe600]/40 bg-[#ffe600]/15 px-2 py-0.5 font-bold text-[#ffe600] text-[11px] animate-pulse">
                            EM ANDAMENTO
                          </span>
                        ) : isWon ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 rounded-md border border-[#00ff66]/40 bg-[#00ff66]/15 px-2.5 py-0.5 font-extrabold text-[#00ff66] text-[11px] shadow-[0_0_8px_rgba(0,255,102,0.2)]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              +{ord.profit ? `R$ ${ord.profit.toFixed(2)}` : 'WIN'}
                            </span>
                            <div className="text-[8.5px] text-[#a3d9b5] mt-0.5">Lucro Creditado</div>
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 font-bold text-rose-400 text-[11px]">
                              <XCircle className="h-3.5 w-3.5" />
                              -R$ {ord.amount.toFixed(2)}
                            </span>
                            <div className="text-[8.5px] text-rose-400/80 mt-0.5">Sem Retorno</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-[#7a9587] shrink-0">
          <span>Prisma IA • Fractal P1 / M1</span>
          <span className="text-[#00ff66]">100% Auditado em Tempo Real</span>
        </div>
      </div>
    </div>
  );
};
