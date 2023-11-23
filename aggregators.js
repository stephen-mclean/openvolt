/// <reference path="typedefs.js" />

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

module.exports = {
  getTotalKwhConsumed,
  getTotalCo2Emitted,
  getFuelGenerationAverage,
};
