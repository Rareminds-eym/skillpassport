import type { ICity, ICountry, IState } from 'country-state-city';

type CountryModule = typeof import('country-state-city/lib/country.js');
type StateModule = typeof import('country-state-city/lib/state.js');
type CityModule = typeof import('country-state-city/lib/city.js');

let countryModulePromise: Promise<CountryModule> | null = null;
let stateModulePromise: Promise<StateModule> | null = null;
let cityModulePromise: Promise<CityModule> | null = null;
const CITY_ENABLED_COUNTRIES = new Set(['IN']);

const loadCountryModule = () => {
  countryModulePromise ??= import('country-state-city/lib/country.js');
  return countryModulePromise;
};

const loadStateModule = () => {
  stateModulePromise ??= import('country-state-city/lib/state.js');
  return stateModulePromise;
};

const loadCityModule = () => {
  cityModulePromise ??= import('country-state-city/lib/city.js');
  return cityModulePromise;
};

export type CountryOption = ICountry;
export type StateOption = IState;
export type CityOption = ICity;

export const getAllCountries = async (): Promise<CountryOption[]> => {
  const { default: Country } = await loadCountryModule();
  return Country.getAllCountries();
};

export const getStatesOfCountry = async (countryCode: string): Promise<StateOption[]> => {
  const { default: State } = await loadStateModule();
  return State.getStatesOfCountry(countryCode);
};

export const getCitiesOfState = async (
  countryCode: string,
  stateCode: string
): Promise<CityOption[]> => {
  if (!CITY_ENABLED_COUNTRIES.has(countryCode.toUpperCase())) {
    return [];
  }

  const { default: City } = await loadCityModule();
  return City.getCitiesOfState(countryCode, stateCode);
};
