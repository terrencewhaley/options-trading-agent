export const getTrendBias = (close, ema20, ema50) => {
  if (close > ema20 && close > ema50) return "Bullish";
  if (close < ema20 && close < ema50) return "Bearish";
  return "No Trade";
};
