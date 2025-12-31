import { getLongCallPremiumTradier } from "../services/tradier.js";

export const getCallPremium = async (
  { underlying, exp, callStrike },
  { tradierToken } = {}
) => {
  const provider = (process.env.QUOTE_PROVIDER ?? "tradier").toLowerCase();

  if (provider !== "tradier") {
    throw new Error(`QUOTE_PROVIDER must be "tradier". Got: ${provider}`);
  }

  const result = await getLongCallPremiumTradier(
    {
      symbol: underlying,
      expiration: exp,
      strike: callStrike,
    },
    tradierToken
  );

  return result?.premium ?? null;
};
