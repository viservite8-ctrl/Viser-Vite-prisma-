import React, { useMemo, useState } from 'react';
import {
  Activity,
  ChevronDown,
  Globe,
  History,
  KeyRound,
  Lock,
  Search,
  Server,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AssetPair, BrokerSession } from '../types';
import { sound } from '../utils/audio';

interface HeaderProps {
  currentAsset: AssetPair;
  allAssets: AssetPair[];
  onSelectAsset: (asset: AssetPair) => void;
  isFloatingOpen: boolean;
  onToggleFloating: () => void;
  onOpenServerModal: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  session: BrokerSession;
  onToggleAccountMode: (mode: 'REAL' | 'DEMO') => void;
  onOpenSsidModal: () => void;
  stats: { wins: number; losses: number; winrate: number };
}

export const Header: React.FC<HeaderProps> = ({
  currentAsset,
  allAssets,
  onSelectAsset,
  isFloatingOpen,
  onToggleFloating,
  onOpenServerModal,
  onOpenHistory,
  historyCount,
  session,
  onToggleAccountMode,
  onOpenSsidModal,
  stats,
}) => {
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(sound.enabled);

  const filteredAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return allAssets.filter((asset) => !query || asset.name.toLowerCase().includes(query) || asset.symbol.toLowerCase().includes(query));
  }, [allAssets, searchQuery]);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
    if (sound.enabled) sound.playClick();
  };

  const balance = session.accountMode === 'REAL' ? session.realBalance : session.demoBalance;
  const currency = session.currency === 'BRL' ? 'R$' : '$';

  return (
    <header id="fractal-header" className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-[#00ff66]/30 bg-[#02150a]/95 px-4 py-2.5 backdrop-blur-md shadow-[0_4px_25px_rgba(0,255,102,0.15)]">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-[#00ff66] bg-[#02150a] shadow-[0_0_20px_rgba(0,255,102,0.5)]">
          <div className="absolute -inset-1.5 rounded-xl bg-[#00ff66]/30 blur-md animate-pulse" />
          <img src="/assets/prisma_vector_logo.jpg" alt="Fractal Sem Limites" className="relative h-full w-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-lg font-black tracking-tight text-white">PRISMA IA</h1>
            <span className="rounded border border-[#00ff66]/50 bg-[#00ff66]/15 px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[#00ff66]">FRACTAL 1 • M1</span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[#00ff66]/40 bg-[#00ff66]/15 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-[#00ff66]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00ff66] animate-ping" />
              {session.isConnected ? 'FEED AO VIVO' : 'MODO LOCAL'}
            </span>
          </div>
          <p className="flex items-center gap-1.5 truncate font-mono text-[11px] font-semibold text-[#7a9587]">
            <Lock className="h-3 w-3 shrink-0 text-[#00ff66]" />
            <span className="text-[#00ff66]">SINAL CONFIRMADO</span>
            <span>• low/high da vela fechada [1] • entrada na abertura seguinte</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            id="asset-selector-btn"
            onClick={() => {
              sound.playClick();
              setAssetDropdownOpen((open) => !open);
            }}
            className="flex items-center gap-2 rounded-lg border border-[#00ff66]/30 bg-black/60 px-3 py-1.5 text-xs font-bold text-white transition hover:border-[#00ff66]/70 hover:bg-[#00ff66]/10"
          >
            <span className="font-mono text-[#00ff66] font-extrabold">{currentAsset.name}</span>
            <span className="rounded border border-[#00ff66]/30 bg-[#00ff66]/20 px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[#00ff66]">{currentAsset.payout}%</span>
            <ChevronDown className={`h-3.5 w-3.5 text-[#7a9587] transition-transform ${assetDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {assetDropdownOpen && (
            <div className="absolute right-0 mt-1 w-80 rounded-2xl border border-[#00ff66]/40 bg-[#020603]/98 p-3 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 font-mono text-[10px]">
                <span className="flex items-center gap-1 font-extrabold uppercase tracking-wider text-[#00ff66]"><Globe className="h-3 w-3" /> Ativos conectados</span>
                <span className="text-[#7a9587]">{allAssets.length}</span>
              </div>
              <div className="relative my-2">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7a9587]" />
                <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar ativo..." className="w-full rounded-lg border border-white/10 bg-black/80 py-1.5 pl-8 pr-3 font-mono text-xs text-white outline-none focus:border-[#00ff66]/60" />
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {filteredAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      sound.playClick();
                      onSelectAsset(asset);
                      setAssetDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border px-2.5 py-2 text-left text-xs transition ${currentAsset.id === asset.id ? 'border-[#00ff66]/50 bg-[#00ff66]/20 text-[#00ff66]' : 'border-transparent text-zinc-200 hover:bg-white/5'}`}
                  >
                    <span className="font-mono font-bold text-white">{asset.name}</span>
                    <span className="font-mono text-[10px] text-[#7a9587]">{asset.basePrice.toFixed(asset.decimals)} • {asset.payout}%</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[#00ff66]/30 bg-black/60 px-2.5 py-1.5 font-mono text-xs font-black text-[#00ff66]">
          <Activity className="h-3.5 w-3.5" />
          M1 FIXO
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center rounded-lg border border-white/15 bg-black/60 p-0.5 font-mono text-xs">
          <button onClick={() => { sound.playClick(); onToggleAccountMode('REAL'); }} className={`rounded-md px-2.5 py-1 transition ${session.accountMode === 'REAL' ? 'bg-[#00ff66] font-black text-black' : 'text-[#7a9587] hover:text-white'}`}>REAL {currency} {session.realBalance.toFixed(2)}</button>
          <button onClick={() => { sound.playClick(); onToggleAccountMode('DEMO'); }} className={`rounded-md px-2.5 py-1 transition ${session.accountMode === 'DEMO' ? 'bg-amber-400 font-black text-black' : 'text-[#7a9587] hover:text-white'}`}>DEMO {currency} {session.demoBalance.toFixed(2)}</button>
        </div>
        <button onClick={() => { sound.playClick(); onOpenSsidModal(); }} className="hidden items-center gap-1.5 rounded-lg border border-[#00ff66]/40 bg-black/60 px-2.5 py-1.5 text-xs font-mono font-bold text-[#00ff66] transition hover:bg-[#00ff66]/15 lg:flex" title="Gerenciar SSID">
          <KeyRound className="h-3.5 w-3.5" /> {session.ssid.substring(0, 6)}...{session.ssid.substring(session.ssid.length - 4)} <span className="text-[9px] text-white">{session.latencyMs}ms</span>
        </button>
        <div className="hidden items-center gap-1 rounded-lg border border-[#00ff66]/25 bg-black/50 px-2.5 py-1 font-mono text-[10px] xl:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-[#00ff66]" />
          <span className="text-[#7a9587]">{stats.wins}W / {stats.losses}L</span>
          <strong className="text-[#00ff66]">{stats.winrate}%</strong>
        </div>
        <button onClick={() => { sound.playClick(); onOpenHistory(); }} className="hidden items-center gap-1 rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 font-mono text-[10px] text-[#00ff66] hover:border-[#00ff66]/40 sm:flex"><History className="h-3.5 w-3.5" /> {historyCount}</button>
        <button onClick={() => { sound.playClick(); onOpenServerModal(); }} className="hidden items-center gap-1 rounded-lg border border-[#00ff66]/30 bg-[#00ff66]/10 px-2 py-1.5 font-mono text-[10px] font-bold text-[#00ff66] hover:bg-[#00ff66]/20 md:flex"><Server className="h-3.5 w-3.5" /> SERVIDORES</button>
        <button onClick={() => { sound.playClick(); onToggleFloating(); }} className={`rounded-lg border px-2 py-1.5 font-mono text-[10px] font-bold transition ${isFloatingOpen ? 'border-[#00ff66]/50 bg-[#00ff66]/15 text-[#00ff66]' : 'border-white/10 bg-black/60 text-zinc-400'}`}>{isFloatingOpen ? 'RADAR ON' : 'RADAR OFF'}</button>
        <button onClick={toggleSound} className="rounded-lg border border-white/10 bg-black/60 p-1.5 text-[#7a9587] hover:text-white" title="Som"><span className="sr-only">Som</span>{soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}</button>
      </div>
    </header>
  );
};

export default Header;
