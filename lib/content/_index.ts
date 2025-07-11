import { defaultContent, defaultSeries } from "./default/_index";
import { englishContent, englishSeries } from "./english/_index";
import { hindiContent, hindiSeries } from "./hindi/_index";


export const allContent = [...hindiContent, ...englishContent, ...defaultContent];
export const allSeries = { ...hindiSeries, ...englishSeries, ...defaultSeries };

export const availableLanguages = ["hindi", "english", "default"];
