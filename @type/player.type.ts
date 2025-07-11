type VideoQuality = "480p" | "720p" | "1080p" | "4K";

export interface EpisodeContent {
    id: string;
    videoId: string;
    title: string;
    episodeNumber: number;
    thumbnail: string;
    description: string;
    duration: string; // e.g., "3:21"
    availableLanguages: string[];
    baseViews: number;
    daysAgo: number;
    engagement: {
        views: number;
        likes: number;
        publishedDate: string; // ISO format
        timeAgo: string;
        viewsFormatted: string;
        likesFormatted: string;
    };
    videoUrls: Record<VideoQuality, string>;
}

export interface SeriesInfo {
    id: string
    title: string
    episodes: EpisodeContent[]
    type: "series" | "collection"
}
