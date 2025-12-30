import { config } from "../config.js";
import { getNextFridayExpiry } from "./expiry.js";

export const recommendTrade = ({
  bias,
  support,
  supportRejections,
  credit = null,
}) => {
  if (bias !== "Bullish") {
    return { decision: "NO TRADE", reason: `Bias is ${bias}` };
  }

  if (supportRejections < config.minSupportRejections) {
    return {
      decision: "NO TRADE",
      reason: `Support not confirmed (need >= ${config.minSupportRejections} rejections)`,
    };
  }

  // Sell strike below support (nearest whole-dollar below)
  const sellStrike = Math.floor(support);
  const buyStrike = sellStrike - config.spreadWidth;

  const exp = getNextFridayExpiry();

  // If we don't have live credit yet, we still return the shape
  if (credit == null) {
    return {
      decision: "TRADE",
      strategy: "Bull Put Credit Spread",
      sellStrike,
      buyStrike,
      exp: exp,
      credit: null,
      maxLoss: null,
      exit: "Close at $0.30–$0.40",
      note: "Credit/maxLoss pending live options data",
    };
  }

  const width = config.spreadWidth;
  const maxLoss = Number(((width - credit) * 100).toFixed(0));

  if (maxLoss > config.maxLossCap) {
    return {
      decision: "NO TRADE",
      reason: `Max loss $${maxLoss} exceeds cap $${config.maxLossCap}`,
      proposed: { sellStrike, buyStrike, credit, maxLoss },
    };
  }

  return {
    decision: "TRADE",
    strategy: "Bull Put Credit Spread",
    sellStrike,
    buyStrike,
    exp: exp,
    credit: Number(credit.toFixed(2)),
    maxLoss,
    exit: "Close at $0.30–$0.40",
  };
};
