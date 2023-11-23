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
 * @typedef {Object} GenerationMix - fuel generation mix measurement
 * @property {'gas' | 'coal' | 'biomass' | 'nuclear' | 'hydro' | 'imports' | 'other' | 'wind' | 'solar' } fuel - the fuel used
 * @property {number} perc - the percentage of the total that this fuel provided
 */

/**
 * @typedef {Object} GenerationMixInterval - a generation mix interval from the national grid API
 * @property {string} from - the start date of the interval
 * @property {string} to - the end date of the interval
 * @property {GenerationMix[]} generationmix - the list of fuels used to generate the energy for the interval
 */
