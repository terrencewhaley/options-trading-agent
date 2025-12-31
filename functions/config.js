export const config = {
  maxLossCap: Number(process.env.MAX_LOSS_CAP ?? 200),
  spreadWidth: Number(process.env.SPREAD_WIDTH ?? 2),
  minSupportRejections: Number(process.env.MIN_SUPPORT_REJECTIONS ?? 2),
  // Long option settings (single-leg)
  maxPremiumCap: Number(process.env.MAX_PREMIUM_CAP ?? 100), // dollars per contract
  minDte: Number(process.env.MIN_DTE ?? 21),
  maxDte: Number(process.env.MAX_DTE ?? 35),
  takeProfitPct: Number(process.env.TAKE_PROFIT_PCT ?? 0.6), // +60%
  stopLossPct: Number(process.env.STOP_LOSS_PCT ?? 0.5), // -50%
};
