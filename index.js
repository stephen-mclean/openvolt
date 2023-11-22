require("dotenv").config();

const START_DATE = new Date("01/31/2023");
const END_DATE = new Date(2023, 0, 31, 23, 30);
const GRANULARITY = "hh";

const API_KEY = process.env.API_KEY;
const METER_ID = process.env.METER_ID;
const API_BASE_URL = process.env.API_BASE_URL;

const loadIntervals = async (
  startDate = START_DATE,
  endDate = END_DATE,
  meterId = METER_ID,
  granularity = GRANULARITY
) => {
  const params = new URLSearchParams({
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    meter_id: meterId,
    granularity,
  }).toString();

  const headers = {
    accept: "application/json",
    "x-api-key": API_KEY,
  };

  const url = `${API_BASE_URL}/interval-data?${params}`;

  const response = await fetch(url, { headers });
  const json = await response.json();

  return json;
};

const summarizeEnergyAndEmissionData = async () => {
  const energyIntervalData = await loadIntervals();
  console.log(" === loaded energy data =====", energyIntervalData);
};

summarizeEnergyAndEmissionData();
