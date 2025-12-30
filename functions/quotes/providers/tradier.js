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
