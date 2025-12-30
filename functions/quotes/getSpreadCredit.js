import { getSpreadCreditStub } from "./providers/stub.js";
import { getBullPutSpreadCreditTradier } from "./providers/tradier.js";

export const getSpreadCredit = async (
  { underlying, exp, sellStrike, buyStrike },
  { tradierToken } = {}
) => {
  const provider = process.env.QUOTE_PROVIDER ?? "stub";

  if (provider === "stub") {
    return getSpreadCreditStub({ underlying, exp, sellStrike, buyStrike });
  }

  if (provider === "tradier") {
    const result = await getBullPutSpreadCreditTradier(
      {
        symbol: underlying,
        expiration: exp,
        shortStrike: sellStrike,
        longStrike: buyStrike,
      },
      tradierToken
    );

    // IMPORTANT: return just the credit number
    return result?.credit ?? null;
  }

  throw new Error(`Unknown QUOTE_PROVIDER: ${provider}`);
};
