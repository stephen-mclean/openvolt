require("dotenv").config();

const START_DATE = new Date("01/01/2023");
const END_DATE = new Date(2023, 0, 1, 0, 30);
const GRANULARITY = "hh";

const API_KEY = process.env.API_KEY;
const METER_ID = process.env.METER_ID;
const OPENVOLT_API_BASE_URL = process.env.OPENVOLT_API_BASE_URL;
const CARBON_INTENSITY_API_BASE_URL = process.env.CARBON_INTENSITY_API_BASE_URL;

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

  const url = `${OPENVOLT_API_BASE_URL}/interval-data?${params}`;

  const response = await fetch(url, { headers });
  const json = await response.json();

  return json;
};

/**
 *
 * @param {*} dates ['2023-01-01T00:00:00.000Z', '2023-01-01T00:30:00.000Z']
 */
const loadCO2Emissions = async (dates) => {
  const promises = dates.map((d) => {
    const from = new Date(d);
    from.setMinutes(from.getMinutes() + 30);

    return fetch(
      `${CARBON_INTENSITY_API_BASE_URL}/intensity/${from.toISOString()}`
    );
  });

  return Promise.all(promises).then((results) =>
    Promise.all(results.map((r) => r.json()))
  );
};

const summarizeEnergyAndEmissionData = async () => {
  const energyIntervalData = await loadIntervals();
  const energyIntervals = energyIntervalData.data;

  const dateIntervals = energyIntervals.map((i) => i.start_interval);

  const co2Data = (await loadCO2Emissions(dateIntervals)).flatMap(
    (d) => d.data
  );

  const kwhConsumed = energyIntervals.reduce(
    (acc, val) => acc + Number(val.consumption),
    0
  );

  const co2EmittedPerInterval = energyIntervals.map((value, idx) => {
    const co2Interval = co2Data[idx];

    const consumption = Number(value.consumption);
    const intensity = co2Interval.intensity.actual;

    return consumption * intensity;
  });

  console.log(" ===== energy data ======", energyIntervals);
  console.log(" ===== co2 data ======", co2Data);
  console.log(" ===== co2 intervals =====", co2EmittedPerInterval);

  const co2Emitted = co2EmittedPerInterval.reduce((acc, val) => acc + val, 0);

  const results = [
    {
      title: `kWh consumed from ${START_DATE} to ${END_DATE}`,
      value: kwhConsumed,
    },
    {
      title: `co2 emitted (grams) from ${START_DATE} to ${END_DATE}`,
      value: co2Emitted,
    },
  ];

  console.table(results);
};

summarizeEnergyAndEmissionData();
