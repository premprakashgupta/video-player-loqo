import AdaptiveHLSTest from "@/components/adaptive-hls-test"

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Adaptive HLS System Test Suite</h1>
        <AdaptiveHLSTest />
      </div>
    </div>
  )
}
