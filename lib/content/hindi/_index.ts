import { ramKathaSeries } from "./series/ram-katha";
import { hindiStandaloneContent } from "./standalone";

export const hindiSeries = {
  "ram-katha": {
    title: {
      hindi: "संपूर्ण राम कथा",
      english: "Sampoorn Ram Katha",
    },
    episodes: ramKathaSeries,
  },
};

export const hindiContent = [...ramKathaSeries, ...hindiStandaloneContent];
