import { getBullPutSpreadCreditTradier } from "./providers/tradier.js";

export const getSpreadCredit = async (
  { underlying, exp, sellStrike, buyStrike },
  { tradierToken } = {}
) => {
  const provider = (process.env.QUOTE_PROVIDER ?? "tradier").toLowerCase();

  if (provider !== "tradier") {
    throw new Error(`QUOTE_PROVIDER must be "tradier". Got: ${provider}`);
  }

  const result = await getBullPutSpreadCreditTradier(
    {
      symbol: underlying,
      expiration: exp,
      shortStrike: sellStrike,
      longStrike: buyStrike,
    },
    tradierToken
  );

  return result?.credit ?? null;
};
