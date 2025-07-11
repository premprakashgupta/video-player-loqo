import { EpisodeContent, SeriesInfo } from "@/@type/player.type";
import { allContent, allSeries } from "./content/_index";
import { hindiSeries, hindiContent } from "./content/hindi/_index";
import { englishSeries, englishContent } from "./content/english/_index";
import { defaultSeries, defaultContent } from "./content/default/_index";

const seriesForLanguage = (language: string) => {
  if (language === "hindi") return hindiSeries;
  if (language === "english") return englishSeries;
  return defaultSeries;
};

const contentForLanguage = (language: string) => {
  if (language === "hindi") return hindiContent;
  if (language === "english") return englishContent;
  return defaultContent;
};

export const getCarouselSeries = (language: string): Record<string, SeriesInfo> => {
  const seriesData = seriesForLanguage(language);
  const carousels: Record<string, SeriesInfo> = {};

  for (const [id, series] of Object.entries(seriesData)) {
    carousels[id] = {
      id,
      title: series.title,
      episodes: series.episodes,
      type: "series",
    };
  }
  return carousels;
};

export const findContentByVideoId = (
  videoId: string,
  language: string
): { content: EpisodeContent; series: SeriesInfo } | null => {
  const content = contentForLanguage(language);
  const episode = content.find((ep) => ep.videoId === videoId);

  if (!episode) return null;

  const seriesId = Object.keys(allSeries).find((key) =>
    allSeries[key].episodes.some((ep) => ep.id === episode.id)
  );

  if (!seriesId) return null;

  return {
    content: episode,
    series: {
      id: seriesId,
      title: allSeries[seriesId].title,
      episodes: allSeries[seriesId].episodes,
      type: "series",
    },
  };
};

export const getDefaultContent = (
  language: string
): { content: EpisodeContent; seriesId: string } | null => {
  const content = contentForLanguage(language);
  if (content.length === 0) return null;

  const episode = content[0];
  const seriesId = Object.keys(allSeries).find((key) =>
    allSeries[key].episodes.some((ep) => ep.id === episode.id)
  );

  if (!seriesId) return null;

  return {
    content: episode,
    seriesId,
  };
};
