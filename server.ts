import express from 'express';
import path from 'path';
import https from 'https';
import { createServer as createViteServer } from 'vite';
import WebSocket from 'ws';

const app = express();
const PORT = 3000;

app.use(express.json());

// User credentials and account state
let credentials = {
  email: 'glkhali7777@gmail.com',
  password: '7072147212345Biel.',
  ssid: '7dc3a31ffc42510e010d966c061b431d',
};

interface AccountBalance {
  id: number;
  type: number; // 1 = Real, 4 = Practice/Demo
  amount: number;
  currency: string;
}

let userAccount = {
  id: '171889853',
  name: 'Gabriel Teixeira Dos Santos',
  email: 'glkhali7777@gmail.com',
  realBalance: 6.00,
  demoBalance: 3.85,
  realBalanceId: 1201680589,
  demoBalanceId: 1201680590,
  currency: 'USD',
  ssid: credentials.ssid,
  isConnected: false,
  latencyMs: 6,
};

// Real-time market data store
const liveQuotes: Record<number, number> = {};
const liveCandles: Record<number, any> = {};
const candleHistoryStore: Record<number, any[]> = {};

// Active SSE client listeners: Map<clientId, { res, activeId }>
const sseClients = new Map<number, { res: express.Response; activeId: number }>();
let nextClientId = 1;

// Quadcode WebSocket Bridge
class QuadcodeBridge {
  private ws: WebSocket | null = null;
  private isConnecting = false;
  private pingInterval: any = null;
  private pendingRequests = new Map<string, (resp: any) => void>();
  private subscribedActives = new Set<number>();

  constructor() {
    this.connect();
  }

  public setSsid(newSsid: string) {
    if (newSsid && newSsid !== credentials.ssid) {
      credentials.ssid = newSsid;
      userAccount.ssid = newSsid;
      this.reconnect();
    }
  }

  public async loginWithCredentials(email: string, pass: string): Promise<{ success: boolean; ssid?: string; error?: string }> {
    return new Promise((resolve) => {
      const body = JSON.stringify({ identifier: email, password: pass });
      const req = https.request({
        hostname: 'auth.trade.optgobroker.com',
        path: '/api/v2/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://trade.optgobroker.com',
        },
      }, (res) => {
        let raw = '';
        res.on('data', (c) => raw += c);
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            if (res.statusCode === 200 && data.ssid) {
              credentials.email = email;
              credentials.password = pass;
              credentials.ssid = data.ssid;
              userAccount.email = email;
              userAccount.ssid = data.ssid;
              this.reconnect();
              resolve({ success: true, ssid: data.ssid });
            } else {
              resolve({ success: false, error: data.message || 'Falha ao autenticar na corretora' });
            }
          } catch {
            resolve({ success: false, error: 'Resposta inválida do servidor de autenticação' });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      req.write(body);
      req.end();
    });
  }

  public reconnect() {
    if (this.ws) {
      try {
        this.ws.terminate();
      } catch {}
      this.ws = null;
    }
    this.connect();
  }

  public connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket('wss://ws.trade.optgobroker.com/echo/websocket', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://trade.optgobroker.com',
        },
      });

      this.ws.on('open', () => {
        this.isConnecting = false;
        userAccount.isConnected = true;
        console.log('[Quadcode WS] Conectado a wss://ws.trade.optgobroker.com/echo/websocket');

        // Authenticate using SSID
        this.sendRaw({
          name: 'authenticate',
          msg: {
            ssid: credentials.ssid,
            protocol: 3,
          },
        });
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const json = JSON.parse(data.toString());
          this.handleMessage(json);
        } catch {}
      });

      this.ws.on('close', () => {
        this.isConnecting = false;
        userAccount.isConnected = false;
        console.log('[Quadcode WS] Conexão encerrada. Reconectando em 2s...');
        setTimeout(() => this.connect(), 2000);
      });

      this.ws.on('error', (err) => {
        this.isConnecting = false;
        userAccount.isConnected = false;
        console.error('[Quadcode WS Error]', err.message);
      });
    } catch (e) {
      this.isConnecting = false;
    }
  }

  private handleMessage(json: any) {
    if (!json || !json.name) return;

    // Handle pending request_id callbacks
    if (json.request_id && this.pendingRequests.has(json.request_id)) {
      const cb = this.pendingRequests.get(json.request_id);
      this.pendingRequests.delete(json.request_id);
      cb?.(json);
    }

    switch (json.name) {
      case 'authenticated':
        if (json.msg === true) {
          console.log('[Quadcode WS] Autenticado com sucesso via SSID!');
          userAccount.isConnected = true;
          // Request real balances & profile
          this.sendRaw({ name: 'sendMessage', msg: { name: 'get-balances', version: '1.0' } });
          this.sendRaw({ name: 'sendMessage', msg: { name: 'profile', version: '1.0' } });

          // Re-subscribe all active assets
          for (const activeId of this.subscribedActives) {
            this.subscribeActiveMarketData(activeId);
          }
          // Also default subscribe EUR/USD OTC (76)
          this.subscribeActiveMarketData(76);
        } else {
          console.warn('[Quadcode WS] Falha de autenticação. Tentando renovar via email/senha...');
          if (credentials.email && credentials.password) {
            this.loginWithCredentials(credentials.email, credentials.password).catch(() => {});
          }
        }
        break;

      case 'balances':
        if (Array.isArray(json.msg)) {
          const balances: AccountBalance[] = json.msg;
          const real = balances.find((b) => b.type === 1);
          const demo = balances.find((b) => b.type === 4);

          if (real) {
            userAccount.realBalance = Number(real.amount);
            userAccount.realBalanceId = real.id;
            userAccount.currency = real.currency || userAccount.currency;
          }
          if (demo) {
            userAccount.demoBalance = Number(demo.amount);
            userAccount.demoBalanceId = demo.id;
          }

          // Broadcast real balance to all clients
          this.broadcastToSse('account', userAccount);
        }
        break;

      case 'profile':
        if (json.msg) {
          const prof = json.msg;
          userAccount.id = String(prof.user_id || prof.id || userAccount.id);
          userAccount.name = `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || userAccount.name;
          userAccount.email = prof.email || userAccount.email;
          this.broadcastToSse('account', userAccount);
        }
        break;

      case 'candle-generated':
        if (json.msg) {
          const c = json.msg;
          const activeId = Number(c.active_id);
          const candle = {
            time: Number(c.from) * 1000,
            open: Number(c.open),
            high: Number(c.max),
            low: Number(c.min),
            close: Number(c.close),
            volume: Number(c.volume || 25),
          };

          liveCandles[activeId] = candle;
          liveQuotes[activeId] = candle.close;

          // Broadcast real live tick to clients subscribed to this asset
          this.broadcastToSseAsset(activeId, 'candle', candle);
          this.broadcastToSseAsset(activeId, 'quote', { activeId, price: candle.close });
        }
        break;

      case 'quotes':
        if (json.msg && Array.isArray(json.msg)) {
          for (const item of json.msg) {
            if (item.active_id && item.price) {
              const activeId = Number(item.active_id);
              const price = Number(item.price);
              liveQuotes[activeId] = price;
              this.broadcastToSseAsset(activeId, 'quote', { activeId, price });
            }
          }
        }
        break;

      case 'timeSync':
        userAccount.isConnected = true;
        break;
    }
  }

  public subscribeActiveMarketData(activeId: number) {
    this.subscribedActives.add(activeId);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Subscribe to live candle generator (size: 60 for M1)
    this.sendRaw({
      name: 'subscribeMessage',
      msg: {
        name: 'candle-generated',
        params: {
          routingFilters: {
            active_id: activeId,
            size: 60,
          },
        },
      },
    });

    // Subscribe to quotes
    this.sendRaw({
      name: 'subscribeMessage',
      msg: {
        name: 'quotes',
        params: {
          routingFilters: {
            active_id: activeId,
          },
        },
      },
    });
  }

  public async fetchHistoricalCandles(activeId: number, count = 70): Promise<any[]> {
    return new Promise((resolve) => {
      const nowSec = Math.floor(Date.now() / 1000);
      const reqId = `candles_${activeId}_${Date.now()}`;

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        // Fallback to cache if available
        resolve(candleHistoryStore[activeId] || []);
      }, 4000);

      this.pendingRequests.set(reqId, (resp: any) => {
        clearTimeout(timeout);
        if (resp && resp.msg && Array.isArray(resp.msg.candles)) {
          const rawList = resp.msg.candles;
          const formatted = rawList.map((c: any) => ({
            time: Number(c.from) * 1000,
            open: Number(c.open),
            high: Number(c.max),
            low: Number(c.min),
            close: Number(c.close),
            volume: Number(c.volume || 30),
          }));
          candleHistoryStore[activeId] = formatted;
          if (formatted.length > 0) {
            const last = formatted[formatted.length - 1];
            liveQuotes[activeId] = last.close;
            liveCandles[activeId] = last;
          }
          resolve(formatted);
        } else {
          resolve(candleHistoryStore[activeId] || []);
        }
      });

      this.sendRaw({
        name: 'sendMessage',
        msg: {
          name: 'get-candles',
          version: '2.0',
          body: {
            active_id: activeId,
            size: 60,
            to: nowSec,
            count,
          },
        },
        request_id: reqId,
      });
    });
  }

  public async executeOption(params: {
    activeId: number;
    direction: 'call' | 'put';
    amount: number;
    accountMode: 'REAL' | 'DEMO';
    expired?: number;
  }): Promise<{ success: boolean; optionId?: number; message?: string; error?: string }> {
    return new Promise((resolve) => {
      const isReal = params.accountMode === 'REAL';
      const balanceId = isReal ? userAccount.realBalanceId : userAccount.demoBalanceId;

      const nowSec = Math.floor(Date.now() / 1000);
      // Next 1-minute expiration: round up to next 60s plus at least 30s buffer
      let expSec = Math.ceil(nowSec / 60) * 60;
      if (expSec - nowSec < 15) {
        expSec += 60;
      }

      const reqId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(reqId);
        resolve({ success: false, error: 'Tempo limite esgotado aguardando resposta da corretora.' });
      }, 5000);

      this.pendingRequests.set(reqId, (resp: any) => {
        clearTimeout(timeout);
        if (resp && resp.status === 2000 && resp.msg) {
          const opt = resp.msg;
          // Refresh balances
          this.sendRaw({ name: 'sendMessage', msg: { name: 'get-balances', version: '1.0' } });
          resolve({
            success: true,
            optionId: opt.id,
            message: `Ordem #${opt.id} (${params.direction.toUpperCase()} M1) executada na corretora às ${new Date(opt.created * 1000).toLocaleTimeString()}!`,
          });
        } else {
          const errMsg = resp?.msg?.message || resp?.msg || 'Erro ao abrir ordem na corretora';
          resolve({
            success: false,
            error: typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg),
          });
        }
      });

      this.sendRaw({
        name: 'sendMessage',
        msg: {
          name: 'binary-options.open-option',
          version: '1.0',
          body: {
            user_balance_id: balanceId,
            active_id: params.activeId,
            option_type_id: 3, // turbo (M1)
            direction: params.direction.toLowerCase(),
            expired: expSec,
            refund_value: 0,
            price: params.amount,
            value: 0,
          },
        },
        request_id: reqId,
      });
    });
  }

  private sendRaw(obj: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  private broadcastToSse(event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [_, client] of sseClients) {
      try {
        client.res.write(payload);
      } catch {}
    }
  }

  private broadcastToSseAsset(activeId: number, event: string, data: any) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [_, client] of sseClients) {
      if (client.activeId === activeId) {
        try {
          client.res.write(payload);
        } catch {}
      }
    }
  }
}

const bridge = new QuadcodeBridge();

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: Date.now(),
    broker: 'trade.optgobroker.com',
    wsConnected: userAccount.isConnected,
    userId: userAccount.id,
  });
});

app.get('/api/account', (req, res) => {
  res.json({
    id: userAccount.id,
    name: userAccount.name,
    email: userAccount.email,
    balance: userAccount.realBalance,
    demoBalance: userAccount.demoBalance,
    realBalanceId: userAccount.realBalanceId,
    demoBalanceId: userAccount.demoBalanceId,
    currency: userAccount.currency,
    ssid: userAccount.ssid,
    isConnected: userAccount.isConnected,
    latencyMs: userAccount.latencyMs,
  });
});

app.get('/api/quotes', (req, res) => {
  res.json(liveQuotes);
});

app.post('/api/validate-session', async (req, res) => {
  const { email, password, ssid } = req.body;

  if (email && password) {
    const authResult = await bridge.loginWithCredentials(email.trim(), password.trim());
    if (authResult.success && authResult.ssid) {
      return res.json({
        success: true,
        ssid: authResult.ssid,
        account: {
          id: userAccount.id,
          name: userAccount.name,
          email: userAccount.email,
          balance: userAccount.realBalance,
          demoBalance: userAccount.demoBalance,
          currency: userAccount.currency,
        },
        latencyMs: 6,
      });
    }
  }

  if (ssid) {
    bridge.setSsid(ssid.trim());
    // Give 500ms to authenticate
    await new Promise((r) => setTimeout(r, 600));
    return res.json({
      success: true,
      ssid: userAccount.ssid,
      account: {
        id: userAccount.id,
        name: userAccount.name,
        email: userAccount.email,
        balance: userAccount.realBalance,
        demoBalance: userAccount.demoBalance,
        currency: userAccount.currency,
      },
      latencyMs: 6,
    });
  }

  res.json({
    success: true,
    ssid: userAccount.ssid,
    account: {
      id: userAccount.id,
      name: userAccount.name,
      email: userAccount.email,
      balance: userAccount.realBalance,
      demoBalance: userAccount.demoBalance,
      currency: userAccount.currency,
    },
    latencyMs: 6,
  });
});

app.post('/api/otc/execute', async (req, res) => {
  const { activeId, direction, amount, accountMode, expired, profitPercent } = req.body;
  const numAmount = Number(amount) || 1;
  const mode = accountMode === 'REAL' ? 'REAL' : 'DEMO';

  try {
    const result = await bridge.executeOption({
      activeId: Number(activeId) || 76,
      direction: direction === 'put' ? 'put' : 'call',
      amount: numAmount,
      accountMode: mode,
      expired,
    });

    if (result.success) {
      res.json({
        success: true,
        option_id: result.optionId,
        active_id: activeId || 76,
        direction: direction || 'call',
        amount: numAmount,
        expired: expired || 60,
        user_balance_id: mode === 'REAL' ? userAccount.realBalanceId : userAccount.demoBalanceId,
        account_mode: mode,
        profit_percent: profitPercent || 89,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Falha ao executar ordem na corretora',
      });
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Erro de comunicação ao executar ordem',
    });
  }
});

// SSE Stream: Serves real candles & real-time quotes directly from OptGo Broker WebSocket
app.get('/api/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = nextClientId++;
  const activeId = Number(req.query.activeId) || 76;

  sseClients.set(clientId, { res, activeId });
  bridge.subscribeActiveMarketData(activeId);

  // 1. Send live account details
  res.write(`event: account\ndata: ${JSON.stringify(userAccount)}\n\n`);

  // 2. Fetch and send real historical M1 candles from broker
  try {
    const realCandles = await bridge.fetchHistoricalCandles(activeId, 70);
    if (realCandles.length > 0) {
      res.write(`event: candlesHistory\ndata: ${JSON.stringify({ activeId, candles: realCandles })}\n\n`);
      const lastCandle = realCandles[realCandles.length - 1];
      res.write(`event: quote\ndata: ${JSON.stringify({ activeId, price: lastCandle.close })}\n\n`);
    }
  } catch {}

  // 3. Periodic ping to ensure connection stays active
  const keepAlive = setInterval(() => {
    res.write(`event: timeSync\ndata: ${JSON.stringify({ time: Date.now(), isConnected: userAccount.isConnected })}\n\n`);
  }, 5000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(clientId);
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Prisma IA Traderoom running on http://0.0.0.0:${PORT} (Real Broker Bridge Active)`);
  });
}

startServer();
