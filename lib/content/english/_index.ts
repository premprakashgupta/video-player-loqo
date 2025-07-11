import { evolutionOfFireSeries } from "./series/evolution-of-fire";
import { englishStandaloneContent } from "./standalone";

export const englishSeries = {
  "evolution-of-fire": {
    title: {
      english: "Evolution of Fire",
    },
    episodes: evolutionOfFireSeries,
  },
};

export const englishContent = [...evolutionOfFireSeries, ...englishStandaloneContent];
