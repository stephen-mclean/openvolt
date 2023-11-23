/// <reference path="typedefs.js" />

require("dotenv").config();
const {
  loadCO2Emissions,
  loadGenerationMix,
  loadIntervals,
} = require("./loaders");

const START_DATE = new Date("01/01/2023");
const END_DATE = new Date(2023, 0, 1, 0, 30);
const GRANULARITY = "hh";
const METER_ID = process.env.METER_ID;

const GRAMS_IN_KG = 1000;

/**
 * @param {EnergyInterval[]} intervals
 */
const getTotalKwhConsumed = (intervals) =>
  intervals.reduce((acc, current) => acc + Number(current.consumption), 0);

/**
 * @param {EnergyInterval[]} intervals
 * @param {CarbonIntensityInterval[]} co2Intervals
 */
const getTotalCo2Emitted = (intervals, co2Intervals) => {
  // First get the total grams of c02 emitted every interval
  const co2PerInterval = intervals.map((value, idx) => {
    const co2Interval = co2Intervals[idx];

    const consumption = Number(value.consumption);
    const intensity = co2Interval.intensity.actual;

    return consumption * intensity;
  });

  // Sum to get the total co2 in grams for the entire period
  const totalCo2EmittedGrams = co2PerInterval.reduce(
    (acc, val) => acc + val,
    0
  );

  // Convert to co2 emitted in KG
  return totalCo2EmittedGrams / GRAMS_IN_KG;
};

/**
 * @param {GenerationMixInterval[]} generationMix
 * @param {number} numberOfIntervals
 * @returns {Record<Fuel, number>}
 */
const getFuelGenerationAverage = (generationMix, numberOfIntervals) => {
  const fuelToTotalPercentage = generationMix
    .flatMap((g) => g.generationmix)
    .reduce((acc, current) => {
      const currentPercentage = acc[current.fuel] || 0;
      return {
        ...acc,
        [current.fuel]: currentPercentage + current.perc,
      };
    }, {});

  return Object.keys(fuelToTotalPercentage).reduce((acc, current) => {
    return {
      ...acc,
      [current]: fuelToTotalPercentage[current] / numberOfIntervals,
    };
  }, {});
};

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
