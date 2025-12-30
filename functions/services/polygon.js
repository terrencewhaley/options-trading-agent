import axios from "axios";

const BASE_URL = "https://api.polygon.io";
const apiKey = process.env.POLYGON_API_KEY;

export const getDailyCandles = async (ticker, limit = 60) => {
  const url = `${BASE_URL}/v2/aggs/ticker/${ticker}/range/1/day/${getFromDate(
    limit
  )}/${getToDate()}?adjusted=true&sort=asc&apiKey=${apiKey}`;

  const res = await axios.get(url);
  return res.data.results;
};

export const getDailyCloseOnDate = async (ticker, yyyyMmDd) => {
  const url = `${BASE_URL}/v2/aggs/ticker/${ticker}/range/1/day/${yyyyMmDd}/${yyyyMmDd}?adjusted=true&sort=asc&apiKey=${apiKey}`;

  const res = await axios.get(url);
  const candle = res.data?.results?.[0];
  return candle?.c ?? null; // close
};

const getToDate = () => {
  return new Date().toISOString().split("T")[0];
};

const getFromDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days * 1.5); // buffer for weekends
  return d.toISOString().split("T")[0];
};
