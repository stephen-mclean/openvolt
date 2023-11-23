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

const summarizeEnergyAndEmissionData = async () => {
  console.time("load-and-summarize-data");
  const energyIntervals = await loadIntervals(
    START_DATE,
    END_DATE,
    METER_ID,
    GRANULARITY
  );
  const co2Data = await loadCO2Emissions(START_DATE, END_DATE);
  const generationMix = await loadGenerationMix(START_DATE, END_DATE);

  const numberOfIntervals = energyIntervals.length;

  if (
    numberOfIntervals !== co2Data.length &&
    numberOfIntervals !== generationMix.length
  ) {
    console.error(
      "Mismatch in the number of intervals for the different data types."
    );
  }

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
  console.log(" ===== generation mix data ======", generationMix);
  console.log(" ==== mix for interval 1 =====", generationMix[0].generationmix);
  console.log(" ==== mix for interval 2 =====", generationMix[1].generationmix);
  console.log(" ===== co2 intervals =====", co2EmittedPerInterval);

  const co2Emitted = co2EmittedPerInterval.reduce((acc, val) => acc + val, 0);

  const fuelToTotalPercentage = generationMix
    .flatMap((g) => g.generationmix)
    .reduce((acc, current) => {
      const currentPercentage = acc[current.fuel] || 0;
      return {
        ...acc,
        [current.fuel]: currentPercentage + current.perc,
      };
    }, {});

  const fuelToAverage = Object.keys(fuelToTotalPercentage).reduce(
    (acc, current) => {
      return {
        ...acc,
        [current]: fuelToTotalPercentage[current] / numberOfIntervals,
      };
    },
    {}
  );

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
  console.table(fuelToAverage);

  console.timeEnd("load-and-summarize-data");
};

summarizeEnergyAndEmissionData();
