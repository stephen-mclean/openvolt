/// <reference path="typedefs.js" />

const API_KEY = process.env.API_KEY;
const OPENVOLT_API_BASE_URL = process.env.OPENVOLT_API_BASE_URL;
const CARBON_INTENSITY_API_BASE_URL = process.env.CARBON_INTENSITY_API_BASE_URL;

/**
 * Load energy intervals from OpenVolt
 *
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} meterId
 * @param {string} granularity
 * @returns {Promise<EnergyInterval[]>}
 */
const loadIntervals = async (startDate, endDate, meterId, granularity) => {
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
const loadCO2Emissions = async (startDate, endDate) => {
  const from = new Date(startDate.getTime());
  from.setMinutes(from.getMinutes() + 30);

  const to = new Date(endDate.getTime());
  to.setMinutes(to.getMinutes() + 30);

  const url = `${CARBON_INTENSITY_API_BASE_URL}/intensity/${from.toISOString()}/${to.toISOString()}`;

  const response = await fetch(url);
  const json = await response.json();

  return json.data;
};

/**
 * Load co2 emissions data from national grid API
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Promise<GenerationMixInterval[]>}
 */
const loadGenerationMix = async (startDate, endDate) => {
  const from = new Date(startDate.getTime());
  from.setMinutes(from.getMinutes() + 30);

  const to = new Date(endDate.getTime());
  to.setMinutes(to.getMinutes() + 30);

  const url = `${CARBON_INTENSITY_API_BASE_URL}/generation/${from.toISOString()}/${to.toISOString()}`;

  const response = await fetch(url);
  const json = await response.json();

  return json.data;
};

module.exports = { loadCO2Emissions, loadIntervals, loadGenerationMix };
