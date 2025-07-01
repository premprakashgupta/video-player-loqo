"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  VolumeX,
  Volume2,
  Maximize,
  SkipForward,
  Minimize,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  Settings,
  PictureInPicture,
  Check,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface VideoControlsProps {
  isPlaying: boolean
  isMobile: boolean
  isFullscreen: boolean
  volume: number
  isMuted: boolean
  showVolumeSlider: boolean
  setShowVolumeSlider: (show: boolean) => void
  currentTime: number
  duration: number
  availableQualities: Array<{ id: string; label: string }>
  currentQuality: { id: string; label: string } | undefined
  showQualityMenu: boolean
  setShowQualityMenu: (show: boolean) => void
  formatTime: (time: number) => string
  onTogglePlay: () => void
  onSkip: (seconds: number) => void
  onVolumeChange: (value: number[]) => void
  onToggleMute: () => void
  onToggleFullscreen: () => void
  onTogglePictureInPicture: () => void
  onQualityChange: (quality: { id: string; label: string }) => void
  onPreviousEpisode: () => void
  onNextEpisode: () => void
  createButtonHandler: (callback: (e?: React.MouseEvent) => void) => any
  currentSeriesData?: any
  currentPlayingContent: any
  currentLanguage: string
  getLocalizedText: (text: any, language: string) => string
  getUILanguage: (language: string) => string
}

export default function VideoControls({
  isPlaying,
  isMobile,
  isFullscreen,
  volume,
  isMuted,
  showVolumeSlider,
  setShowVolumeSlider,
  currentTime,
  duration,
  availableQualities,
  currentQuality,
  showQualityMenu,
  setShowQualityMenu,
  formatTime,
  onTogglePlay,
  onSkip,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onTogglePictureInPicture,
  onQualityChange,
  onPreviousEpisode,
  onNextEpisode,
  createButtonHandler,
  currentSeriesData,
  currentPlayingContent,
  currentLanguage,
  getLocalizedText,
  getUILanguage,
}: VideoControlsProps) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        position: "relative",
        zIndex: 5,
        marginBottom: `${isMobile ? "16px" : "20px"}`,
      }}
    >
      <div className={`flex items-center ${isMobile ? "space-x-2" : "space-x-3"}`}>
        {isMobile ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              {...createButtonHandler(() => onSkip(-10))}
              className="text-white hover:bg-white-transparent w-8 h-8"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              {...createButtonHandler(onTogglePlay)}
              className="text-white hover:bg-white-transparent w-10 h-10"
              data-button="play-control"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              {...createButtonHandler(() => onSkip(10))}
              className="text-white hover:bg-white-transparent w-8 h-8"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <div className="text-white text-xs font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              {...createButtonHandler(onPreviousEpisode)}
              className="text-white hover:bg-white-transparent"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              {...createButtonHandler(onTogglePlay)}
              className="text-white hover:bg-white-transparent"
              data-button="play-control"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              {...createButtonHandler(onNextEpisode)}
              className="text-white hover:bg-white-transparent"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              {...createButtonHandler(() => onSkip(10))}
              className="text-white hover:bg-white-transparent"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <div
              className="flex items-center space-x-2 relative"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <Button
                variant="ghost"
                size="icon"
                {...createButtonHandler(onToggleMute)}
                className="text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <div className={`w-20 transition-all duration-300 ${showVolumeSlider ? "opacity-100" : "opacity-0"}`}>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.1}
                  onValueChange={onVolumeChange}
                  className="[&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&_[role=slider]]:bg-white [&_[role=slider]]:w-3 [&_[role=slider]]:h-3 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-white"
                />
              </div>
            </div>

            <div className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </>
        )}
      </div>

      <div className={`flex items-center ${isMobile ? "space-x-1" : "space-x-2"}`}>
        {availableQualities.length > 1 && (
          <DropdownMenu open={showQualityMenu} onOpenChange={setShowQualityMenu}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowQualityMenu(!showQualityMenu)
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40 bg-black/90 border-white/10">
              <DropdownMenuLabel className="text-white/70">Quality</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />

              {availableQualities.map((quality) => (
                <DropdownMenuItem
                  key={quality.id}
                  className="text-white hover:bg-white/10 cursor-pointer"
                  onClick={() => onQualityChange(quality)}
                >
                  <span className="flex items-center justify-between w-full">
                    <span>{quality.label}</span>
                    {currentQuality?.id === quality.id && <Check className="h-4 w-4" />}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            {...createButtonHandler(onTogglePictureInPicture)}
            className="text-white hover:bg-white/20"
          >
            <PictureInPicture className="w-4 h-4" />
          </Button>
        )}

        {isFullscreen && !isMobile && (
          <div className="text-white text-sm mr-4">
            <div className="font-semibold">
              {currentSeriesData?.title
                ? getLocalizedText(currentSeriesData.title, getUILanguage(currentLanguage))
                : getLocalizedText(currentPlayingContent.title, getUILanguage(currentLanguage))}
            </div>
            <div className="text-gray-300 text-xs">
              {currentPlayingContent.episodeNumber
                ? `Episode ${currentPlayingContent.episodeNumber}`
                : getLocalizedText(currentPlayingContent.description, getUILanguage(currentLanguage))}
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          {...createButtonHandler(onToggleFullscreen)}
          className={`text-white hover:bg-white/20 ${isMobile ? "w-8 h-8" : ""}`}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}
