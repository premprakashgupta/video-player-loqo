import { defaultRamKathaSeries } from "./series/ram-katha";
import { defaultStandaloneContent } from "./standalone";

export const defaultSeries = {
  "ram-katha": {
    title: {
      default: "Sampoorn Ram Katha",
    },
    episodes: defaultRamKathaSeries,
  },
};

export const defaultContent = [...defaultRamKathaSeries, ...defaultStandaloneContent];
