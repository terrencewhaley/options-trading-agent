export const config = {
  maxLossCap: Number(process.env.MAX_LOSS_CAP ?? 200),
  spreadWidth: Number(process.env.SPREAD_WIDTH ?? 2),
  minSupportRejections: Number(process.env.MIN_SUPPORT_REJECTIONS ?? 2),
};
