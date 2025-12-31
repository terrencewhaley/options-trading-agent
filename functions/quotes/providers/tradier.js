import { getOptionChain } from "../../services/tradier.js";

const toNumber = (v) => {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
};

/**
 * Bull put credit spread credit using Tradier sandbox/live (read-only quotes).
 * Conservative fill assumption:
 *   creditPerShare = shortBid - longAsk
 * Returns credit in DOLLARS per spread (per contract), e.g. 42.50
 */
export const getBullPutSpreadCreditTradier = async (
  { symbol, expiration, shortStrike, longStrike },
  tradierToken
) => {
  if (!tradierToken) {
    return { credit: null, legs: null, reason: "Missing TRADIER_TOKEN" };
  }

  const chain = await getOptionChain({ symbol, expiration }, tradierToken);

  const shortLeg = chain.find(
    (o) =>
      o.option_type === "put" && toNumber(o.strike) === toNumber(shortStrike)
  );

  const longLeg = chain.find(
    (o) =>
      o.option_type === "put" && toNumber(o.strike) === toNumber(longStrike)
  );

  if (!shortLeg || !longLeg) {
    return {
      credit: null,
      legs: null,
      reason: "Selected strikes not found in chain",
    };
  }

  const shortBid = toNumber(shortLeg.bid);
  const longAsk = toNumber(longLeg.ask);

  // After-hours or illiquid strikes may have missing quotes
  if (shortBid == null || longAsk == null) {
    return {
      credit: null,
      legs: {
        short: {
          strike: shortStrike,
          bid: toNumber(shortLeg.bid),
          ask: toNumber(shortLeg.ask),
          symbol: shortLeg.symbol,
        },
        long: {
          strike: longStrike,
          bid: toNumber(longLeg.bid),
          ask: toNumber(longLeg.ask),
          symbol: longLeg.symbol,
        },
      },
      reason: "Missing bid/ask",
    };
  }

  const creditPerShare = shortBid - longAsk;
  const creditPerContract = Math.round(creditPerShare * 100 * 100) / 100; // dollars, 2 decimals

  return {
    credit: creditPerContract,
    legs: {
      short: {
        strike: shortStrike,
        bid: shortBid,
        ask: toNumber(shortLeg.ask),
        symbol: shortLeg.symbol,
      },
      long: {
        strike: longStrike,
        bid: toNumber(longLeg.bid),
        ask: longAsk,
        symbol: longLeg.symbol,
      },
    },
    reason: null,
  };
};

/**
 * Long call premium using Tradier (read-only quotes).
 * Conservative fill assumption:
 *   premiumPerShare = callAsk
 * Returns premium in DOLLARS per contract, e.g. 75 (means $75)
 */
export const getLongCallPremiumTradier = async (
  { symbol, expiration, strike },
  tradierToken
) => {
  if (!tradierToken) {
    return { premium: null, leg: null, reason: "Missing TRADIER_TOKEN" };
  }

  const chain = await getOptionChain({ symbol, expiration }, tradierToken);

  const callLeg = chain.find(
    (o) => o.option_type === "call" && toNumber(o.strike) === toNumber(strike)
  );

  if (!callLeg) {
    return {
      premium: null,
      leg: null,
      reason: "Selected call strike not found in chain",
    };
  }

  const ask = toNumber(callLeg.ask);
  if (ask == null) {
    return {
      premium: null,
      leg: {
        strike,
        bid: toNumber(callLeg.bid),
        ask: toNumber(callLeg.ask),
        symbol: callLeg.symbol,
      },
      reason: "Missing ask",
    };
  }

  const premium = Math.round(ask * 100); // dollars per contract, whole dollars

  return {
    premium,
    leg: {
      strike,
      bid: toNumber(callLeg.bid),
      ask,
      symbol: callLeg.symbol,
    },
    reason: null,
  };
};
