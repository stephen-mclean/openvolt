require("dotenv").config();

const START_DATE = new Date("01/01/2023");
const END_DATE = new Date(2023, 0, 1, 0, 30);
const GRANULARITY = "hh";

const API_KEY = process.env.API_KEY;
const METER_ID = process.env.METER_ID;
const OPENVOLT_API_BASE_URL = process.env.OPENVOLT_API_BASE_URL;
const CARBON_INTENSITY_API_BASE_URL = process.env.CARBON_INTENSITY_API_BASE_URL;

/**
 * @typedef {Object} EnergyInterval - a single piece of interval data from the OpenVolt API
 * @property {string} start_interval - the start date of the interval
 * @property {string} consumption - amount of energy consumed in this interval
 */

/**
 * @typedef {Object} CarbonIntensity - carbon intensity measurement
 * @property {number} actual - actual amount of co2 emitted
 */

/**
 * @typedef {Object} CarbonIntensityInterval - a carbon intensity interval from the national grid API
 * @property {string} from - the start date of the interval
 * @property {string} to - the end date of the interval
 * @property {CarbonIntensity} intensity - the intensity measurement for the interval
 */

/**
 * Load energy intervals from OpenVolt
 *
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} meterId
 * @param {string} granularity
 * @returns {Promise<EnergyInterval[]>}
 */
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

  return json.data;
};

/**
 * Load co2 emissions data from national grid API
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<CarbonIntensityInterval[]>}
 */
const loadCO2Emissions = async (startDate = START_DATE, endDate = END_DATE) => {
  const from = new Date(startDate.getTime());
  from.setMinutes(from.getMinutes() + 30);

  const to = new Date(endDate.getTime());
  to.setMinutes(to.getMinutes() + 30);

  const url = `${CARBON_INTENSITY_API_BASE_URL}/intensity/${from.toISOString()}/${to.toISOString()}`;

  const response = await fetch(url);
  const json = await response.json();

  return json.data;
};

const summarizeEnergyAndEmissionData = async () => {
  const energyIntervals = await loadIntervals();
  const co2Data = await loadCO2Emissions();

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
