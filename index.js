/// <reference path="typedefs.js" />

require("dotenv").config();
const {
  loadCO2Emissions,
  loadGenerationMix,
  loadIntervals,
} = require("./loaders");

const {
  getTotalCo2Emitted,
  getTotalKwhConsumed,
  getFuelGenerationAverage,
} = require("./aggregators");

const START_DATE = new Date("01/01/2023");
const END_DATE = new Date(2023, 0, 31, 23, 30);
const GRANULARITY = "hh";
const METER_ID = process.env.METER_ID;

const summarizeEnergyAndEmissionData = async () => {
  console.log("Loading OpenVolt and NationalGrid data...");
  console.time("load-data");

  const [energyIntervals, co2Data, generationMix] = await Promise.all([
    loadIntervals(START_DATE, END_DATE, METER_ID, GRANULARITY),
    loadCO2Emissions(START_DATE, END_DATE),
    loadGenerationMix(START_DATE, END_DATE),
  ]);

  console.timeEnd("load-data");

  const numberOfIntervals = energyIntervals.length;

  if (
    numberOfIntervals !== co2Data.length &&
    numberOfIntervals !== generationMix.length
  ) {
    console.error(
      "Mismatch in the number of intervals for the different data types."
    );
  }

  console.log("Summarizing data...");
  console.time("aggregate-data");

  const kwhConsumed = getTotalKwhConsumed(energyIntervals);
  const co2Emitted = getTotalCo2Emitted(energyIntervals, co2Data);
  const fuelGenerationResults = getFuelGenerationAverage(
    generationMix,
    numberOfIntervals
  );

  console.timeEnd("aggregate-data");

  console.log(
    `Results for the period from ${START_DATE.toISOString()} to ${END_DATE.toISOString()}`
  );

  const results = {
    "kWh consumed": kwhConsumed,
    "CO2 emitted (kgs)": co2Emitted,
  };

  console.table(results);

  console.log(
    "Average percentages of fuel used to generate the energy consumed from above:"
  );
  console.table(fuelGenerationResults);
};

summarizeEnergyAndEmissionData();
