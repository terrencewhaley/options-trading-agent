import { getSpreadCreditStub } from "./providers/stub.js";

export const getSpreadCredit = async ({
  underlying,
  exp,
  sellStrike,
  buyStrike,
}) => {
  const provider = process.env.QUOTE_PROVIDER ?? "stub";

  if (provider === "stub") {
    return getSpreadCreditStub({ underlying, exp, sellStrike, buyStrike });
  }

  // We'll add "tradier" here later once your account is approved.
  throw new Error(`Unknown QUOTE_PROVIDER: ${provider}`);
};
