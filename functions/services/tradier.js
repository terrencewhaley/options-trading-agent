const getBaseUrl = () => {
  const env = process.env.TRADIER_ENV?.toLowerCase();
  if (process.env.TRADIER_BASE_URL) return process.env.TRADIER_BASE_URL;
  return env === "live"
    ? "https://api.tradier.com/v1"
    : "https://sandbox.tradier.com/v1";
};

const tradierFetch = async (path, token) => {
  if (!token) throw new Error("Missing TRADIER_TOKEN");

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const text = await res.text();

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.errors ? JSON.stringify(json.errors) : text;
    throw new Error(`Tradier error ${res.status}: ${msg}`);
  }

  return json;
};

/**
 * Fetch the options chain for an underlying + expiration (YYYY-MM-DD).
 * Returns a flat array of option objects.
 */
export const getOptionChain = async ({ symbol, expiration }, token) => {
  const qs = new URLSearchParams({
    symbol,
    expiration,
    greeks: "false",
  });

  const json = await tradierFetch(
    `/markets/options/chains?${qs.toString()}`,
    token
  );

  const options = json?.options?.option;
  if (!options) return [];

  return Array.isArray(options) ? options : [options];
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
