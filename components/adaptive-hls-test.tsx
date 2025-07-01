"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getFeatureFlags, type FeatureFlags } from "@/lib/feature-flags"
import { createQualityManager } from "@/lib/quality-manager"
import { shouldUseAdaptiveHLS } from "@/lib/adaptive-hls"

export default function AdaptiveHLSTest() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Initialize feature flags
    try {
      const flags = getFeatureFlags()

      setFeatureFlags(flags)

      console.log("🚩 Feature Flags:", flags)
    } catch (error) {
      console.error("Error initializing test:", error)
    }
  }, [])

  const runTests = async () => {
    setIsLoading(true)
    const results: any[] = []

    try {
      // Test 1: Feature Flags
      results.push({
        name: "Feature Flags",
        status: featureFlags ? "✅ PASS" : "❌ FAIL",
        details: featureFlags || "Failed to load feature flags",
      })

      // Test 2: Adaptive HLS Support
      const adaptiveHLSSupported = shouldUseAdaptiveHLS()
      results.push({
        name: "Adaptive HLS Support",
        status: adaptiveHLSSupported ? "✅ PASS" : "⚠️ DISABLED",
        details: {
          supported: adaptiveHLSSupported,
          reason: adaptiveHLSSupported
            ? "Feature enabled and HLS.js supported"
            : "Feature disabled or HLS.js not supported",
        },
      })

      // Test 3: Quality Manager
      try {
        const qualityManager = createQualityManager(["480p", "720p", "1080p", "4K"])
        const qualityOptions = qualityManager.getQualityOptions()
        const recommendation = qualityManager.getRecommendation()

        results.push({
          name: "Quality Manager",
          status: "✅ PASS",
          details: {
            currentQuality: qualityManager.getCurrentQuality(),
            recommendedQuality: recommendation.recommendedQuality,
            totalOptions: qualityOptions.length,
          },
        })
      } catch (error) {
        results.push({
          name: "Quality Manager",
          status: "❌ FAIL",
          details: `Error: ${error}`,
        })
      }

      // Test 4: Environment Variables
      const envVars = {
        NEXT_PUBLIC_ENABLE_ADAPTIVE_HLS: process.env.NEXT_PUBLIC_ENABLE_ADAPTIVE_HLS,
        NEXT_PUBLIC_ENABLE_DEVICE_OPTIMIZATION: process.env.NEXT_PUBLIC_ENABLE_DEVICE_OPTIMIZATION,
        NEXT_PUBLIC_ENABLE_PERFORMANCE_HINTS: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_HINTS,
        NEXT_PUBLIC_ENABLE_SMART_DEFAULTS: process.env.NEXT_PUBLIC_ENABLE_SMART_DEFAULTS,
        NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING,
        NEXT_PUBLIC_ENABLE_AUTO_QUALITY: process.env.NEXT_PUBLIC_ENABLE_AUTO_QUALITY,
        NEXT_PUBLIC_ENABLE_QUALITY_FILTERING: process.env.NEXT_PUBLIC_ENABLE_QUALITY_FILTERING,
      }

      results.push({
        name: "Environment Variables",
        status: "ℹ️ INFO",
        details: envVars,
      })

      setTestResults(results)
    } catch (error) {
      console.error("Error running tests:", error)
      results.push({
        name: "Test Suite",
        status: "❌ FAIL",
        details: `Error running tests: ${error}`,
      })
      setTestResults(results)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    if (status.includes("PASS")) return "bg-green-500"
    if (status.includes("FAIL")) return "bg-red-500"
    if (status.includes("DISABLED")) return "bg-yellow-500"
    return "bg-blue-500"
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Adaptive HLS System Test
            <Button onClick={runTests} disabled={isLoading}>
              {isLoading ? "Running Tests..." : "Run Tests"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {testResults.map((result, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{result.name}</h3>
                    <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {featureFlags && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Flags Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(featureFlags).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">{key}</span>
                  <Badge className={value ? "bg-green-500" : "bg-gray-500"}>{value ? "ENABLED" : "DISABLED"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
