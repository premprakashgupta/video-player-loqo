// lib/ad-manager.ts

import { v4 as uuidv4 } from "uuid"

/**
 * Utilities for generating targeting and PPID
 */
export const AdUtils = {
    generatePPID: () => uuidv4(),
    getSampleAdTagUrl(): string {
        return `https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250,728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=${Date.now()}`;
    },

    buildTargeting: ({
        id,
        title,
        duration,
        thumbnail,
    }: {
        id: string
        title: string
        duration: number
        thumbnail?: string
    }) => {
        return {
            id,
            title,
            duration: Math.floor(duration),
            ...(thumbnail && { thumbnail }),
        }
    },
}

// lib/googleAdManager.ts

/**
 * Google Ad Manager integration with IMA SDK (Client Only)
 */

declare global {
    interface Window {
        google: typeof google;
    }
}

export interface AdBreak {
    id: string;
    timeOffset: number;
    adTagUrl: string;
    type: "preroll" | "midroll" | "postroll";
    duration?: number;
    skipOffset?: number;
    mandatory?: boolean;
}

export interface AdConfig {
    adBreaks: AdBreak[];
    adTagUrl?: string;
    enablePreroll?: boolean;
    enableMidroll?: boolean;
    enablePostroll?: boolean;
    ppid?: string;
    targeting?: Record<string, string>;
}

export interface AdEventCallbacks {
    onAdLoaded?: (ad: any) => void;
    onAdStarted?: (ad: any) => void;
    onAdCompleted?: (ad: any) => void;
    onAdSkipped?: (ad: any) => void;
    onAdError?: (error: any) => void;
    onAdBreakCompleted?: (adBreak: AdBreak) => void;
}

export class GoogleAdManager {

    private video: HTMLVideoElement;
    private container: HTMLElement;
    private adsLoader: google.ima.AdsLoader;
    private adsManager: google.ima.AdsManager | null = null;
    private adDisplayContainer: google.ima.AdDisplayContainer;
    private callbacks: AdEventCallbacks;
    private adConfig: AdConfig;
    private adBreaks: AdBreak[] = [];
    private currentAdBreak: AdBreak | null = null;
    private initialized = false;

    constructor(config: AdConfig, callbacks: AdEventCallbacks) {
        this.adConfig = config;
        this.callbacks = callbacks;
    }

    async initialize(videoEl: HTMLVideoElement, containerEl: HTMLElement) {
        this.video = videoEl;
        this.container = containerEl;

        if (!window.google?.ima) await this.loadIMASDK();

        window.google.ima.settings.setVpaidMode(window.google.ima.ImaSdkSettings.VpaidMode.ENABLED);
        window.google.ima.settings.setDisableCustomPlaybackForIOS10Plus(true);

        this.adDisplayContainer = new google.ima.AdDisplayContainer(containerEl, videoEl);
        this.adsLoader = new google.ima.AdsLoader(this.adDisplayContainer);

        this.adsLoader.addEventListener(
            google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
            (e) => this.onAdsManagerLoaded(e),
        );

        this.adsLoader.addEventListener(
            google.ima.AdErrorEvent.Type.AD_ERROR,
            (e) => this.callbacks.onAdError?.(e.getError()),
        );

        this.initialized = true;
    }

    private loadIMASDK(): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://imasdk.googleapis.com/js/sdkloader/ima3.js";
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject("IMA SDK load failed");
            document.head.appendChild(script);
        });
    }

    scheduleAdBreaks(duration: number): AdBreak[] {
        const breaks: AdBreak[] = [];
        if (this.adConfig.enablePreroll) {
            breaks.push({ id: "preroll", type: "preroll", timeOffset: 0, adTagUrl: this.getAdTag() });
        }
        if (this.adConfig.enableMidroll && duration > 120) {
            breaks.push({
                id: "midroll-1",
                type: "midroll",
                timeOffset: Math.floor(duration / 2),
                adTagUrl: this.getAdTag(),
            });
        }
        if (this.adConfig.enablePostroll) {
            breaks.push({ id: "postroll", type: "postroll", timeOffset: duration - 1, adTagUrl: this.getAdTag() });
        }
        this.adBreaks = breaks;
        return breaks;
    }

    shouldPlayAd(currentTime: number): AdBreak | null {
        return this.adBreaks.find((b) => Math.abs(b.timeOffset - currentTime) <= 1) || null;
    }

    async playAd(adBreak: AdBreak) {
        if (!this.initialized || this.adsManager) return;

        this.currentAdBreak = adBreak;
        this.adDisplayContainer.initialize();

        const request = new google.ima.AdsRequest();
        request.adTagUrl = adBreak.adTagUrl;
        request.linearAdSlotWidth = this.video.clientWidth;
        request.linearAdSlotHeight = this.video.clientHeight;
        request.nonLinearAdSlotWidth = this.video.clientWidth;
        request.nonLinearAdSlotHeight = 150;

        this.adsLoader.requestAds(request);
    }

    private onAdsManagerLoaded(e: google.ima.AdsManagerLoadedEvent) {
        const settings = new google.ima.AdsRenderingSettings();
        this.adsManager = e.getAdsManager(this.video, settings);

        this.adsManager.addEventListener(google.ima.AdEvent.Type.LOADED, (e) => this.callbacks.onAdLoaded?.(e.getAd()));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, (e) => this.callbacks.onAdStarted?.(e.getAd()));
        this.adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, (e) => {
            this.callbacks.onAdCompleted?.(e.getAd());
            if (this.currentAdBreak) this.callbacks.onAdBreakCompleted?.(this.currentAdBreak);
            this.adsManager = null;
            this.currentAdBreak = null;
        });
        this.adsManager.addEventListener(google.ima.AdEvent.Type.SKIPPED, (e) => this.callbacks.onAdSkipped?.(e.getAd()));
        this.adsManager.init(this.video.clientWidth, this.video.clientHeight, google.ima.ViewMode.NORMAL);
        this.adsManager.start();
    }

    private getAdTag(): string {
        if (this.adConfig.adTagUrl && !this.adConfig.adTagUrl.includes("correlator=")) {
            const sep = this.adConfig.adTagUrl.includes("?") ? "&" : "?";
            return `${this.adConfig.adTagUrl}${sep}correlator=${Date.now()}`;
        }

        // fallback
        return AdUtils.getSampleAdTagUrl();
    }
    public getCurrentAdBreak(): AdBreak | null {
        return this.currentAdBreak;
    }

    destroy() {
        this.adsManager?.destroy();
        this.adsManager = null;
        this.adBreaks = [];
        this.currentAdBreak = null;
        this.initialized = false;
    }
}

