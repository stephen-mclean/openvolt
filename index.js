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
const END_DATE = new Date(2023, 0, 1, 0, 30);
const GRANULARITY = "hh";
const METER_ID = process.env.METER_ID;

const summarizeEnergyAndEmissionData = async () => {
  console.time("load-and-summarize-data");

  const [energyIntervals, co2Data, generationMix] = await Promise.all([
    loadIntervals(START_DATE, END_DATE, METER_ID, GRANULARITY),
    loadCO2Emissions(START_DATE, END_DATE),
    loadGenerationMix(START_DATE, END_DATE),
  ]);

  const numberOfIntervals = energyIntervals.length;

  if (
    numberOfIntervals !== co2Data.length &&
    numberOfIntervals !== generationMix.length
  ) {
    console.error(
      "Mismatch in the number of intervals for the different data types."
    );
  }

  const kwhConsumed = getTotalKwhConsumed(energyIntervals);

  console.log(" ===== energy data ======", energyIntervals);
  console.log(" ===== co2 data ======", co2Data);
  console.log(" ===== generation mix data ======", generationMix);
  console.log(" ==== mix for interval 1 =====", generationMix[0].generationmix);
  console.log(" ==== mix for interval 2 =====", generationMix[1].generationmix);

  const co2Emitted = getTotalCo2Emitted(energyIntervals, co2Data);

  const fuelToAverage = getFuelGenerationAverage(
    generationMix,
    numberOfIntervals
  );

  const results = [
    {
      title: `kWh consumed from ${START_DATE} to ${END_DATE}`,
      value: kwhConsumed,
    },
    {
      title: `co2 emitted (kgs) from ${START_DATE} to ${END_DATE}`,
      value: co2Emitted,
    },
  ];

  console.table(results);
  console.table(fuelToAverage);

  console.timeEnd("load-and-summarize-data");
};

summarizeEnergyAndEmissionData();
