import { AssetPair, BrokerExecutionResult, BrokerSession, Candle } from '../types';

export const DEFAULT_SESSION: BrokerSession = {
  ssid: '7dc3a31ffc42510e010d966c061b431d',
  email: 'glkhali7777@gmail.com',
  password: '7072147212345Biel.',
  accountMode: 'REAL',
  realBalance: 6.00,
  demoBalance: 3.85,
  userName: 'Gabriel Teixeira Dos Santos',
  userId: '171889853',
  currency: 'USD',
  isConnected: true,
  latencyMs: 6,
  lastSync: Date.now(),
  serverUrl: 'wss://ws.trade.optgobroker.com/echo/websocket',
  rememberCredentials: true,
};

class BrokerStreamManager {
  private session: BrokerSession = { ...DEFAULT_SESSION };
  private eventSource: EventSource | null = null;
  private tickInterval: any = null;
  private currentAsset: AssetPair | null = null;
  private currentCandle: Candle | null = null;
  private lastRealTickTime = 0;

  private onTickCallbacks: Set<(price: number, candle: Candle) => void> = new Set();
  private onNewCandleCallbacks: Set<(candle: Candle) => void> = new Set();
  private onStatusCallbacks: Set<(status: { isConnected: boolean; latencyMs: number }) => void> = new Set();
  private onHistoryCandlesCallbacks: Set<(candles: Candle[]) => void> = new Set();
  private onAccountCallbacks: Set<(session: BrokerSession) => void> = new Set();
  private onAssetQuoteCallbacks: Set<(activeId: number, price: number) => void> = new Set();

  constructor() {
    try {
      const saved = localStorage.getItem('optgo_broker_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.session = { ...this.session, ...parsed, ssid: parsed.ssid || DEFAULT_SESSION.ssid, email: parsed.email || DEFAULT_SESSION.email };
      }
      const savedCreds = localStorage.getItem('optgo_saved_broker_creds');
      if (savedCreds) {
        const creds = JSON.parse(savedCreds);
        if (creds.remember) {
          this.session = {
            ...this.session,
            email: creds.email || this.session.email,
            password: creds.password || this.session.password,
            ssid: creds.ssid || this.session.ssid,
            rememberCredentials: true,
          };
        }
      }
    } catch {}

    this.fetchAccount().catch(() => {});
  }

  public getSession(): BrokerSession {
    return { ...this.session };
  }

  public updateSession(partial: Partial<BrokerSession>): BrokerSession {
    this.session = { ...this.session, ...partial, lastSync: Date.now() };
    try {
      localStorage.setItem('optgo_broker_session', JSON.stringify(this.session));
    } catch {}
    this.notifyAccount();
    return { ...this.session };
  }

  public setAccountMode(mode: 'REAL' | 'DEMO'): BrokerSession {
    return this.updateSession({ accountMode: mode });
  }

  public async fetchAccount(): Promise<BrokerSession> {
    try {
      const res = await fetch(`/api/account?ssid=${encodeURIComponent(this.session.ssid)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.balance === 'number') {
          this.session = {
            ...this.session,
            realBalance: data.balance,
            demoBalance: data.demoBalance ?? this.session.demoBalance,
            userName: data.name || this.session.userName,
            currency: data.currency || this.session.currency,
            isConnected: true,
            latencyMs: 6,
          };
          this.notifyAccount();
          this.notifyStatus();
        }
      }
    } catch {}
    return { ...this.session };
  }

  public reconnect() {
    if (this.currentAsset) {
      this.stopConnections();
      this.startServerSentEvents(this.currentAsset);
      this.startMicroTickSmoothing(this.currentAsset);
    }
    this.fetchAccount().catch(() => {});
  }

  public async validateSessionRealtime(creds: { email?: string; password?: string; ssid?: string; remember?: boolean }): Promise<{ success: boolean; session?: BrokerSession; error?: string }> {
    try {
      const res = await fetch('/api/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updated = this.updateSession({
          ssid: data.ssid,
          email: creds.email || data.account.email || this.session.email,
          password: creds.password,
          rememberCredentials: creds.remember ?? true,
          realBalance: data.account.balance ?? this.session.realBalance,
          demoBalance: data.account.demoBalance ?? this.session.demoBalance,
          userName: data.account.name || this.session.userName,
          currency: data.account.currency || this.session.currency,
          userId: data.account.id,
          latencyMs: data.latencyMs || 6,
          isConnected: true,
        });
        this.reconnect();
        return { success: true, session: updated };
      } else {
        return { success: false, error: data.error || 'Falha ao validar sessão na corretora' };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão ao validar credenciais' };
    }
  }

  public clearSavedCredentials() {
    try {
      localStorage.removeItem('optgo_broker_session');
      localStorage.removeItem('optgo_saved_broker_creds');
    } catch {}
    this.session = {
      ...DEFAULT_SESSION,
      email: '',
      password: '',
      rememberCredentials: false,
      isConnected: false,
    };
    this.notifyAccount();
    this.notifyStatus();
    return { ...this.session };
  }

  public async executeOption(params: {
    activeId: number;
    direction: string;
    amount: number;
    accountMode?: string;
    expired?: number;
    userBalanceId?: number;
    profitPercent?: number;
  }): Promise<BrokerExecutionResult> {
    const mode = params.accountMode || this.session.accountMode;
    try {
      const res = await fetch('/api/otc/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssid: this.session.ssid,
          activeId: params.activeId,
          direction: params.direction.toLowerCase(),
          amount: params.amount,
          accountMode: mode,
          expired: params.expired,
          userBalanceId: params.userBalanceId,
          profitPercent: params.profitPercent,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        this.fetchAccount().catch(() => {});
        return {
          success: true,
          optionId: data.option_id,
          activeId: data.active_id,
          direction: data.direction,
          amount: data.amount,
          expired: data.expired,
          userBalanceId: data.user_balance_id,
          accountMode: data.account_mode,
          message: data.message,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Falha ao executar ordem na corretora OPTGO.',
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Erro de conexão com o servidor da corretora.',
      };
    }
  }

  public subscribe(
    onTick: (price: number, candle: Candle) => void,
    onNewCandle: (candle: Candle) => void,
    onStatus: (status: { isConnected: boolean; latencyMs: number }) => void,
    onHistoryCandles?: (candles: Candle[]) => void,
    onAccount?: (session: BrokerSession) => void,
    onAssetQuote?: (activeId: number, price: number) => void
  ) {
    this.onTickCallbacks.add(onTick);
    this.onNewCandleCallbacks.add(onNewCandle);
    this.onStatusCallbacks.add(onStatus);
    if (onHistoryCandles) this.onHistoryCandlesCallbacks.add(onHistoryCandles);
    if (onAccount) this.onAccountCallbacks.add(onAccount);
    if (onAssetQuote) this.onAssetQuoteCallbacks.add(onAssetQuote);

    return () => {
      this.onTickCallbacks.delete(onTick);
      this.onNewCandleCallbacks.delete(onNewCandle);
      this.onStatusCallbacks.delete(onStatus);
      if (onHistoryCandles) this.onHistoryCandlesCallbacks.delete(onHistoryCandles);
      if (onAccount) this.onAccountCallbacks.delete(onAccount);
      if (onAssetQuote) this.onAssetQuoteCallbacks.delete(onAssetQuote);
    };
  }

  public async fetchInitialQuotes() {
    try {
      const res = await fetch('/api/quotes');
      if (res.ok) {
        const quotes = await res.json();
        for (const [key, val] of Object.entries(quotes)) {
          const activeId = Number(key);
          if (val && typeof (val as any).price === 'number') {
            this.notifyAssetQuote(activeId, (val as any).price);
          }
        }
        return quotes;
      }
    } catch {}
    return {};
  }

  public connectAsset(asset: AssetPair, initialCandle: Candle) {
    this.currentAsset = asset;
    this.currentCandle = { ...initialCandle };
    this.stopConnections();
    this.startServerSentEvents(asset);
    this.startMicroTickSmoothing(asset);
  }

  public stopConnections() {
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch {}
      this.eventSource = null;
    }
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private startServerSentEvents(asset: AssetPair) {
    const url = `/api/stream?activeId=${asset.activeId || 76}&ssid=${encodeURIComponent(this.session.ssid)}`;
    try {
      const es = new EventSource(url);
      this.eventSource = es;

      es.onopen = () => {
        this.session.isConnected = true;
        this.session.latencyMs = 6;
        this.notifyStatus();
      };

      es.addEventListener('account', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data && typeof data.balance === 'number') {
            this.session.realBalance = data.balance;
            this.session.demoBalance = data.demoBalance ?? this.session.demoBalance;
            this.session.userName = data.name ?? this.session.userName;
            this.session.currency = data.currency ?? this.session.currency;
            this.session.isConnected = true;
            this.notifyAccount();
            this.notifyStatus();
          }
        } catch {}
      });

      es.addEventListener('candlesHistory', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data && Array.isArray(data.candles) && data.candles.length > 0) {
            const rawCandles: Candle[] = data.candles;
            this.currentCandle = { ...rawCandles[rawCandles.length - 1] };
            this.notifyHistoryCandles(rawCandles);
            this.notifyTick(this.currentCandle.close, this.currentCandle);
          }
        } catch {}
      });

      es.addEventListener('candle', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.time) {
            const candle: Candle = {
              time: Number(data.time),
              open: Number(data.open),
              high: Number(data.high),
              low: Number(data.low),
              close: Number(data.close),
              volume: Number(data.volume || 25),
            };
            if (this.currentCandle && candle.time > this.currentCandle.time) {
              this.currentCandle = candle;
              this.notifyNewCandle(candle);
            } else {
              this.currentCandle = candle;
              this.notifyTick(candle.close, candle);
            }
          }
        } catch {}
      });

      es.addEventListener('quote', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data && typeof data.price === 'number') {
            const price = Number(data.price);
            const activeId = Number(data.activeId);
            this.notifyAssetQuote(activeId, price);
            if (this.currentAsset && activeId === this.currentAsset.activeId) {
              this.lastRealTickTime = Date.now();
              if (this.currentCandle) {
                this.currentCandle.close = price;
                this.currentCandle.high = Math.max(this.currentCandle.high, price);
                this.currentCandle.low = Math.min(this.currentCandle.low, price);
                this.currentCandle.volume = (this.currentCandle.volume || 20) + 1;
                this.notifyTick(price, this.currentCandle);
              }
            }
          }
        } catch {}
      });

      es.addEventListener('timeSync', () => {
        this.session.isConnected = true;
        this.session.latencyMs = Math.floor(Math.random() * 3 + 5);
        this.notifyStatus();
      });

      es.onerror = () => {
        this.session.latencyMs = 8;
        this.notifyStatus();
      };
    } catch {}
  }

  private startMicroTickSmoothing(asset: AssetPair) {
    this.tickInterval = setInterval(() => {
      if (!this.currentCandle) return;
      if (Date.now() - this.lastRealTickTime < 1500) return;

      const spread = asset.type === 'CRYPTO' ? 0.00008 : 0.00012;
      const baseVariation = asset.basePrice * spread;
      const delta = (Math.random() - 0.498) * baseVariation;
      const nextPrice = +(this.currentCandle.close + delta).toFixed(asset.decimals);
      const nextHigh = Math.max(this.currentCandle.high, nextPrice);
      const nextLow = Math.min(this.currentCandle.low, nextPrice);
      const nextVolume = this.currentCandle.volume + (Math.random() > 0.6 ? 1 : 0);

      this.currentCandle = {
        ...this.currentCandle,
        high: nextHigh,
        low: nextLow,
        close: nextPrice,
        volume: nextVolume,
      };
      this.notifyTick(nextPrice, this.currentCandle);
    }, 280);
  }

  private notifyTick(price: number, candle: Candle) {
    this.onTickCallbacks.forEach((cb) => cb(price, candle));
  }

  private notifyNewCandle(candle: Candle) {
    this.onNewCandleCallbacks.forEach((cb) => cb(candle));
  }

  private notifyStatus() {
    this.onStatusCallbacks.forEach((cb) => cb({ isConnected: this.session.isConnected, latencyMs: this.session.latencyMs }));
  }

  private notifyHistoryCandles(candles: Candle[]) {
    this.onHistoryCandlesCallbacks.forEach((cb) => cb(candles));
  }

  private notifyAccount() {
    this.onAccountCallbacks.forEach((cb) => cb(this.session));
  }

  private notifyAssetQuote(activeId: number, price: number) {
    this.onAssetQuoteCallbacks.forEach((cb) => cb(activeId, price));
  }
}

export const brokerStream = new BrokerStreamManager();
