"use client"

import { useState } from "react"

interface BehaviorTestProps {
  currentLanguage: string
  onLanguageChange: (language: string) => void
  onPlayContent: (content: any) => void
  currentPlayingContent: any
  currentSeries: string
}

export default function BehaviorTest({
  currentLanguage,
  onLanguageChange,
  onPlayContent,
  currentPlayingContent,
  currentSeries,
}: BehaviorTestProps) {
  const [testLanguage, setTestLanguage] = useState(currentLanguage)

  const handleTestLanguageChange = (e: any) => {
    setTestLanguage(e.target.value)
  }

  return (
    <div className="fixed top-4 left-4 bg-white text-black p-4 rounded-md z-50">
      <h2 className="text-lg font-bold mb-2">Behavior Test</h2>
      <div>
        <label htmlFor="test-language">Language:</label>
        <select
          id="test-language"
          value={testLanguage}
          onChange={(e) => {
            handleTestLanguageChange(e)
            onLanguageChange(e.target.value)
          }}
          className="ml-2 p-1 rounded"
        >
          <option value="hindi">Hindi</option>
          <option value="english">English</option>
          <option value="tamil">Tamil</option>
          <option value="default">Default</option>
        </select>
      </div>
      <div className="mt-2">
        <p>Current Language: {currentLanguage}</p>
        <p>Current Playing Content: {currentPlayingContent?.title}</p>
        <p>Current Series: {currentSeries}</p>
      </div>
    </div>
  )
}
