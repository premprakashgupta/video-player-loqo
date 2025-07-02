// Seeded random function for consistent engagement metrics
function seededRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  const x = Math.sin(Math.abs(hash)) * 10000
  return x - Math.floor(x)
}

// Memoization cache for engagement metrics
const engagementCache = new Map<string, any>()

// Enhanced getEngagementMetrics with seeded random and memoization
function getEngagementMetricsWithSeed(baseViews: number, daysAgo: number, contentId: string) {
  const cacheKey = `${contentId}-${baseViews}-${daysAgo}`

  // Return cached result if available
  if (engagementCache.has(cacheKey)) {
    return engagementCache.get(cacheKey)
  }

  // Generate seeded random values for consistency
  const seedBase = `${contentId}-${baseViews}`
  const growthSeed = seededRandom(seedBase + "-growth")
  const variationSeed = seededRandom(seedBase + "-variation")

  const daysSinceUpload = daysAgo

  // Steady growth: 3-6% daily increase (seeded)
  const dailyGrowthRate = 0.03 + growthSeed * 0.03

  // Weekend boost (20-30% higher)
  const weekendBoost = isWeekend(daysAgo) ? 1.25 : 1.0

  // Religious content evening boost
  const timeBoost = 1.1

  // Random daily variation (±10%) - now seeded
  const randomVariation = 0.9 + variationSeed * 0.2

  const views = Math.floor(
    baseViews * Math.pow(1 + dailyGrowthRate, daysSinceUpload) * weekendBoost * timeBoost * randomVariation,
  )

  const likes = generateLikesWithSeed(views, contentId)
  const publishedDate = getPublishedDate(daysAgo)
  const timeAgo = formatTimeAgo(daysAgo)

  const result = {
    views,
    likes,
    publishedDate,
    timeAgo,
    viewsFormatted: formatViews(views),
    likesFormatted: formatViews(likes),
  }

  // Cache the result
  engagementCache.set(cacheKey, result)
  return result
}

// Enhanced generateLikes with seeded random
function generateLikesWithSeed(viewCount: number, contentId: string): number {
  // Religious content: 10-14% like ratio
  const likeSeed = seededRandom(contentId + "-likes")
  const likeRatio = 0.1 + likeSeed * 0.04

  // Slight randomization for realism (seeded)
  const variationSeed = seededRandom(contentId + "-like-variation")
  const variation = 0.95 + variationSeed * 0.1

  return Math.floor(viewCount * likeRatio * variation)
}

// Utility functions for realistic engagement metrics
function isWeekend(daysAgo: number): boolean {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
}

function getPublishedDate(daysAgo: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date
}

function formatTimeAgo(daysAgo: number): string {
  if (daysAgo === 0) return "today"
  if (daysAgo === 1) return "1 day ago"
  if (daysAgo < 7) return `${daysAgo} days ago`
  if (daysAgo < 14) return "1 week ago"
  if (daysAgo < 21) return "2 weeks ago"
  if (daysAgo < 30) return "3 weeks ago"
  return "1 month ago"
}

function generateViews(baseViews: number, daysAgo: number): number {
  const daysSinceUpload = daysAgo

  // Steady growth: 3-6% daily increase
  const dailyGrowthRate = 0.03 + Math.random() * 0.03

  // Weekend boost (20-30% higher)
  const weekendBoost = isWeekend(daysAgo) ? 1.25 : 1.0

  // Religious content evening boost
  const timeBoost = 1.1

  // Random daily variation (±10%)
  const randomVariation = 0.9 + Math.random() * 0.2

  return Math.floor(
    baseViews * Math.pow(1 + dailyGrowthRate, daysSinceUpload) * weekendBoost * timeBoost * randomVariation,
  )
}

function generateLikes(viewCount: number): number {
  // Religious content: 10-14% like ratio
  const likeRatio = 0.1 + Math.random() * 0.04

  // Slight randomization for realism
  const variation = 0.95 + Math.random() * 0.1

  return Math.floor(viewCount * likeRatio * variation)
}

function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(0)}K`
  }
  return views.toString()
}

function getEngagementMetrics(baseViews: number, daysAgo: number) {
  const views = generateViews(baseViews, daysAgo)
  const likes = generateLikes(views)
  const publishedDate = getPublishedDate(daysAgo)
  const timeAgo = formatTimeAgo(daysAgo)

  return {
    views,
    likes,
    publishedDate,
    timeAgo,
    viewsFormatted: formatViews(views),
    likesFormatted: formatViews(likes),
  }
}

// Remove watchProgress from all episodes in seriesData
export const seriesData = {
  "ram-katha": {
    title: {
      hindi: "संपूर्ण राम कथा",
      english: "Sampoorn Ram Katha",
      tamil: "ராமாயண வரலாறுகள்",
      telugu: "రామాయణ చరిత్రలు",
      malayalam: "രാമായണ ചരിത്രങ്ങൾ",
      bengali: "রামায়ণ ইতিহাস",
      indonesia: "Kronik Ramayana",
    },
    availableLanguages: ["hindi"],
    episodes: [
      {
        id: "ram-janm",
        videoId: "ram-katha_ram-janm",
        title: {
          hindi: "श्रीराम जन्म: धर्म युग का प्रारंभ",
          english: "Birth of Shree Ram: Dawn of a Divine Era",
          tamil: "ஸ்ரீராம் பிறப்பு: தெய்வீக யுகத்தின் விடியல்",
          telugu: "శ్రీరామ జన్మ: దైవిక యుగం ప్రారంభం",
          malayalam: "ശ്രീരാമ ജന്മം: ദൈവിക യുഗത്തിന്റെ ആരംഭം",
          bengali: "শ্রীরাম জন্ম: দৈবিক যুগের সূচনা",
          indonesia: "Kelahiran Shree Ram: Fajar Era Ilahi",
        },
        episodeNumber: 1,
        thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/RamKatha_1_RamJanm_thumnail.jpg",
        videoQualityUrls: {
          hindi: {
            "480p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/iYi4EgjUZFA.m3u8",
            "720p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/glJoaEcOK1x.m3u8",
            "1080p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/5KeHSr6Y5bF.m3u8",
            "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_janm_4K/Ram_janm_4K.m3u8",
          },
        },
        description: {
          hindi: "जब अयोध्या में जन्मे राम, तो स्वर्ग भी गा उठा धर्म की ��िजय का गीत।",
          english: "On the day Ram was born, even the heavens bowed to dharma's light.",
          tamil: "ராம் பிறந்த நாளில், சொர்க்கமும் தர்மத்தின் ஒளிக்கு வணங்கியது।",
          telugu: "రామ జన్మించిన రోజున, స్వర్గం కూడా ధర్మ వెలుగుకు నమస్కరించింది।",
          malayalam: "രാമൻ ജനിച്ച ദിവസം, സ്വർഗ്ഗം പോലും ധർമ്മത്തിന്റെ പ്രകാശത്തിന് കുമ്പിട്ടു।",
          bengali: "শ্রীরাম জন্ম: দৈবিক যুগের সূচনা",
          indonesia: "Pada hari Ram lahir, bahkan surga pun tunduk pada cahaya dharma।",
        },
        duration: "4:10",
        availableLanguages: ["hindi"],
        baseViews: 850000,
        daysAgo: 1,
        get engagement() {
          return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
        },
      },
      {
        id: "ram-childhood",
        videoId: "ram-katha_ram-childhood",
        title: {
          hindi: "बचपन की रामकथा",
          english: "Childhood: Jewels of Ayodhya",
          tamil: "குழந்தைப் பருவம்: அயோத்தியின் ரத்தினங்கள்",
          telugu: "బాల్యం: అయోధ్య రత్నాలు",
          malayalam: "ബാല്യം: അയോധ്യയുടെ രത്നങ്ങൾ",
          bengali: "শৈশব: অযোধ্যার রত্ন",
          indonesia: "Masa Kecil: Permata Ayodhya",
        },
        episodeNumber: 2,
        thumbnail:
          "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/RamKatha_2_RamChildhood_thumbnail-1.jpg",
        videoQualityUrls: {
          hindi: {
            "480p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/5ygC9b8IxrJ.m3u8",
            "720p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/thYRuJEQnCA.m3u8",
            "1080p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/SsRAE9TGWGL.m3u8",
            "4K": "https://g-mob.glance-cdn.com/public/videos/abr/hls/nfcIWnr_Fw5.m3u8",
          },
        },
        description: {
          hindi: "जब अयोध्या में गूंजती थी चार रत्नों की हँसी, धर्म quietly सीख रहा था चलना।",
          english: "In every playful step of Shree Ram and his brothers, a divine legacy was quietly unfolding.",
          tamil: "ஸ்ரீராம் மற்றும் அவரது சகோதரர்களின் ஒவ்வொரு விளையாட்டு அடியிலும், ஒரு தெய்வீக மரபு அமைதியாக வெளிப்பட்டது।",
          telugu: "శ్రీరామ మరియు అతని సోదరుల ప్రతి ఆట అడుగులో, ఒక దైవిక వారసత్వం నిశ్శబ్దంగా విప్పుతోంది।",
          malayalam: "ശ്രീരാമന്റെയും അവന്റെ സഹോദരന്മാരുടെയും ഓരോ കളിയാട്ട ചുവടിലും, ഒരു ദൈവിക പാരമ്പര്യം നിശബ്ദമായി വികസിച്ചുകൊണ്ടിരുന്നു।",
          bengali: "শ্রীরাম এবং তার ভাইদের প্রতিটি খেলার পদক্ষেপে, একটি দৈবিক উত্তরাধিকার নীরবে উন্মোচিত হচ্ছিল।",
          indonesia:
            "Di setiap langkah bermain Shree Ram dan saudara-saudaranya, warisan ilahi sedang terungkap dengan tenang।",
        },
        duration: "3:11",
        availableLanguages: ["hindi"],
        baseViews: 320000,
        daysAgo: 5,
        get engagement() {
          return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
        },
      },
      {
        id: "ram-gurukul",
        videoId: "ram-katha_ram-gurukul",
        title: {
          hindi: "गुरुकुल की लीलाएं",
          english: "Gurukul Leelas: The First Steps of Dharma",
          tamil: "குருகுல லீலைகள்: தர்மத்தின் முதல் படிகள்",
          telugu: "గురుకుల లీలలు: ధర్మం యొక్క మొదటి అడుగులు",
          malayalam: "ഗുരുകുല ലീലകൾ: ധർമ്മത്തിന്റെ ആദ്യ ചുവടുകൾ",
          bengali: "গুরুকুল লীলা: ধর্মের প্রথম পদক্ষেপ",
          indonesia: "Gurukul Leelas: Langkah Pertama Dharma",
        },
        episodeNumber: 3,
        thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/RamKatha_3_gurukul_thumbnail.jpg",
        videoQualityUrls: {
          hindi: {
            "480p": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_480p/Ram_in_gurukul_480p.m3u8",
            "720p": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_720p/Ram_in_gurukul_720p.m3u8",
            "1080p":
              "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_1080p/Ram_in_gurukul_1080p.m3u8",
            "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_4K/Ram_in_gurukul_4K.m3u8",
          },
        },
        description: {
          hindi: "चारों राजकुमार, एक गुरुकुल — जहां विद्या बनी धर्म का आधार।",
          english: "In the sacred forest, four princes discovered wisdom, grace, and destiny.",
          tamil: "புனித காட்டில், நான்கு இளவரசர்கள் ஞானம், அருள் மற்றும் விதியைக் கண்டுபிடித்தனர்।",
          telugu: "పవిత్ర అడవిలో, నలుగురు రాజకుమారులు జ్ఞానం, దయ మరియు విధిని కనుగొన్నారు।",
          malayalam: "പവിത്രമായ വനത്തിൽ, നാല് രാജകുമാരന്മാർ ജ്ഞാനം, കൃപ, വിധി എന്നിവ കണ്ടെത്തി।",
          bengali: "পবিত্র বনে, চার রাজকুমার জ্ঞান, অনুগ্রহ এবং নিয়তি আবিষ্কার করেছিলেন।",
          indonesia: "Di hutan suci, empat pangeran menemukan kebijaksanaan, rahmat, dan takdir।",
        },
        duration: "3:21",
        availableLanguages: ["hindi"],
        baseViews: 280000,
        daysAgo: 8,
        get engagement() {
          return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
        },
      },
      {
        id: "yagya_raksha",
        videoId: "ram-katha_yagya_raksha",
        title: {
          hindi: "श्रीराम, लक्ष्मण और ताड़का",
          english: "Shree Ram, Lakshman and Tadaka",
          tamil: "ஸ்ரீராம், லக்ஷ்மண் மற்றும் தாடகா",
          telugu: "శ్రీరామ్, లక్ష్మణ్ మరియు తాడకా",
          malayalam: "ശ്രീരാമ്, ലക്ഷ്മണ് ആൻഡ് താടകാ",
          bengali: "শ্রীরাম, লক্ষ্মণ এবং তাড়কা",
          indonesia: "Shree Ram, Lakshman dan Tadaka",
        },
        episodeNumber: 4,
        thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/RamKatha_4_yagyaRaksha_thumbnail.jpg",
        videoQualityUrls: {
          hindi: {
            "480p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part4_Yagya_raksha_HINDI_480p/Ram_katha_part4_Yagya_raksha_HINDI_480p.m3u8",
            "720p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part4_Yagya_raksha_HINDI_720p/Ram_katha_part4_Yagya_raksha_HINDI_720p.m3u8",
            "1080p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part4_Yagya_raksha_HINDI_1080p/Ram_katha_part4_Yagya_raksha_HINDI_1080p.m3u8",
            "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part4_Yagya_raksha_HINDI_4K/Ram_katha_part4_Yagya_raksha_HINDI_4K.m3u8",
          },
        },
        description: {
          hindi: "राम और लक्ष्मण ने ताड़का को हराकर यज्ञ की रक्षा की।",
          english: "Ram and Lakshman defeated Tadaka and protected the yagna.",
          tamil: "ராம் மற்றும் லக்ஷ்மண் தாடகாவை தோற்கடித்து யாகத்தை பாதுகாத்தனர்।",
          telugu: "రామ్ మరియు లక్ష్మణ్ తాడకాను ఓడించి యజ్ఞాన్ని రక్షించారు।",
          malayalam: "രാമനും ലക്ഷ്മണനും താടകയെ പരാജയപ്പെടുത്തി യജ്ഞത്തെ സംരക്ഷിച്ചു।",
          bengali: "রাম এবং লক্ষ্মণ তাড়কাকে পরাজিত করে যজ্ঞ রক্ষা করেছিলেন।",
          indonesia: "Ram dan Lakshman mengalahkan Tadaka dan melindungi yagna।",
        },
        duration: "4:20",
        availableLanguages: ["hindi"],
        baseViews: 380000,
        daysAgo: 6,
        get engagement() {
          return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
        },
      },
      {
        id: "ram_sita_milan_05",
        videoId: "ram-katha_ram_sita_milan_05",
        title: {
          hindi: "श्री सीता-राम मिलन",
          english: "Shree Sita-Ram Milan",
          tamil: "ஸ்ரீ சீதா-ராம் மிலன்",
          telugu: "శ్రీ సీతా-రామ్ మిలన",
          malayalam: "ശ്രീ സീതാ-രാമ് മിലൻ",
          bengali: "শ্রী সীতা-রাম মিলন",
          indonesia: "Shree Sita-Ram Milan",
        },
        episodeNumber: 5,
        thumbnail:
          "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/ram_katha_5_thumbnail_v3_compressed.jpg",
        videoQualityUrls: {
          hindi: {
            "480p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part5_Ram_sita_pushpvatika_480p/Ram_katha_part5_Ram_sita_pushpvatika_480p.m3u8",
            "720p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part5_Ram_sita_pushpvatika_720p/Ram_katha_part5_Ram_sita_pushpvatika_720p.m3u8",
            "1080p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part5_Ram_sita_pushpvatika_1080p/Ram_katha_part5_Ram_sita_pushpvatika_1080p.m3u8",
            "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part5_Ram_sita_pushpvatika_4K/Ram_katha_part5_Ram_sita_pushpvatika_4K.m3u8",
          },
        },
        description: {
          hindi: "एक नजर में सब कुछ बदल गया। उनकी पहली मुलाकात ने भविष्य को आकार दिया।",
          english: "Everything changed in one glance. Their first meeting shaped the future.",
          tamil: "ஒரே பார்வையில் எல்லாம் மாறிவிட்டது. அவர்களின் முதல் சந்திப்பு எதிர்காலத்தை வடிவமைத்தது।",
          telugu: "ఒక చూపులోనే అంతా మారిపోయింది. వారి మొదటి కలయిక భవిష్యత్తును రూపొందించింది।",
          malayalam: "ഒരു നോട്ടത്തിൽ എല്ലാം മാറിപ്പോയി. അവരുടെ ആദ്യ കൂടിക്കാഴ്ച ഭാവിയെ രൂപപ്പെടുത്തി।",
          bengali: "এক নজরেই সব কিছু বদলে গেল। তাদের প্রথম সাক্ষাৎ ভবিষ্যৎকে আকার দিয়েছিল।",
          indonesia: "Semuanya berubah dalam satu pandangan. Pertemuan pertama mereka membentuk masa depan।",
        },
        duration: "4:15",
        availableLanguages: ["hindi"],
        baseViews: 420000,
        daysAgo: 4,
        get engagement() {
          return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
        },
      },
      {
        id: "shiv_dhanush_06",
        videoId: "ram-katha_shiv_dhanush_06",
        title: {
          hindi: "शिवधनुष और स्वयंवर",
          english: "Shiv Dhanush and Swayamvar",
          tamil: "சிவ தனுஷ் மற்றும் சுயம்வர்",
          telugu: "శివ ధనుష్ మరియు స్వయంవర్",
          malayalam: "ശിവ ധനുഷ് ആൻഡ് സ്വയംവര്",
          bengali: "শিব ধনুষ এবং স্বয়ংবর",
          indonesia: "Shiv Dhanush dan Swayamvar",
        },
        episodeNumber: 6,
        thumbnail:
          "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/ram_katha_part_6_shiv_dhanush_thumbnail_compressed.jpg",
        videoQualityUrls: {
          hindi: {
            "480p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part6_Dhanush_480p/Ram_katha_part6_Dhanush_480p.m3u8",
            "720p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part6_Dhanush_720p/Ram_katha_part6_Dhanush_720p.m3u8",
            "1080p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part6_Dhanush_1080p/Ram_katha_part6_Dhanush_1080p.m3u8",
            "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part6_Dhanush_4K/Ram_katha_part6_Dhanush_4K.m3u8",
          },
        },
        description: {
          hindi: "महाविवाह का अद्भुत क्षण, प्रेम और धर्म का प्रतीक बन गया!",
          english: "The magnificent moment of the great wedding became a symbol of love and dharma!",
          tamil: "மகா திருமணத்தின் அற்புதமான தருணம், அன்பு மற்றும் தர்மத்தின் அடையாளமாக மாறியது!",
          telugu: "మహా వివాహం యొక్క అద్భుతమైన క్షణం, ప్రేమ మరియు ధర్మం యొక్క చిహ్నంగా మారింది!",
          malayalam: "മഹാവിവാഹത്തിന്റെ അത്ഭുതകരമായ നിമിഷം, സ്നേഹത്തിന്റ���യും ധർമ്മത്തിന്റെയും പ്രതീകമായി മാറി!",
          bengali: "মহাবিবাহের অপূর্ব মুহূর্ত, প্রেম এবং ধর্মের প্রতীক হয়ে উঠেছে!",
          indonesia: "Momen luar biasa dari pernikahan agung menjadi simbol cinta dan dharma!",
        },
        duration: "4:30",
        availableLanguages: ["hindi"],
        baseViews: 450000,
        daysAgo: 2,
        get engagement() {
          return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
        },
      },
      {
        id: "sita_vidai_07",
        videoId: "ram-katha_sita_vidai_07",
        title: {
          hindi: "सीता की विदाई: जनक का अन्तिम आशीर्वाद",
          english: "Sita's Farewell: Janak's Final Blessing",
          tamil: "சீதையின் பிரியாவிடை: ஜனகனின் இறுதி ஆசீர்வாதம்",
          telugu: "సీత వీడ్కోలు: జనక చివరి ఆశీర్వాదం",
          malayalam: "സീതയുടെ വിടവാങ്ങൽ: ജനകന്റെ അവസാന അനുഗ്രഹം",
          bengali: "সীতার বিদায়: জনকের শেষ আশীর্বাদ",
          indonesia: "Perpisahan Sita: Berkah Terakhir Janak",
        },
        episodeNumber: 7,
        thumbnail:
          "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/Ram_katha_part_7_Sita_vida_thumbnail_compressed.jpg",
        videoQualityUrls: {
          hindi: {
            "480p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part7_Vida_HINDI_480p/Ram_katha_part7_Vida_HINDI_480p.m3u8",
            "720p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part7_Vida_HINDI_720p/Ram_katha_part7_Vida_HINDI_720p.m3u8",
            "1080p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part7_Vida_HINDI_1080p/Ram_katha_part7_Vida_HINDI_1080p.m3u8",
            "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part7_Vida_HINDI_4K/Ram_katha_part7_Vida_HINDI_4K.m3u8",
          },
        },
        description: {
          hindi: "पिता के काँपते शब्दों में धर्म, और सीता की मौन मुस्कान में अडिग मर्यादा झलकती है।",
          english: "In father's trembling words lies dharma, and in Sita's silent smile shines unwavering grace.",
          tamil: "தந்தையின் நடுங்கும் வார்த்தைகளில் தர்மம், சீதையின் மௌன புன்னகையில் அசைக்க முடியாத கருணை ஒளிர்கிறது।",
          telugu: "తండ్రి వణుకు మాటలలో ధర్మం, సీత మౌన చిరునవ్వులో అచంచల మర్యాద మెరుస్తుంది।",
          malayalam: "പിതാവിന്റെ വിറയ്ക്കുന്ന വാക്കുകളിൽ ധർമ്മം, സീതയുടെ നിശബ്ദ പുഞ്ചിരിയിൽ അചഞ്ചലമായ കൃപ തിളങ്ങുന്നു।",
          bengali: "পিতার কাঁপা কথায় ধর্ম, এবং সীতার নীরব হাসিতে অটল মর্যাদা ঝলমল করে।",
          indonesia:
            "Dalam kata-kata gemetar ayah terdapat dharma, dan dalam senyum diam Sita bersinar rahmat yang tak tergoyahkan।",
        },
        duration: "4:25",
        availableLanguages: ["hindi"],
        baseViews: 390000,
        daysAgo: 3,
        get engagement() {
          return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
        },
      },
      {
        id: "ram_sita_ayodhya_08",
        videoId: "ram-katha_ram_sita_ayodhya_08",
        title: {
          hindi: "राम-सीता आगमन: अयोध्या में धर्म और प्रेम का संगम",
          english: "Ram-Sita's Arrival: Union of Dharma and Love in Ayodhya",
          tamil: "ராம்-சீதா வருகை: அயோத்தியாவில் தர்மம் மற்றும் அன்பின் ஒன்றிணைவு",
          telugu: "రామ్-సీత రాక: అయోధ్యలో ధర్మం మరియు ప్రేమ కలయిక",
          malayalam: "രാം-സീത വരവ്: അയോധ്യയിൽ ധർമ്മവും സ്നേഹവും ഒന്നിക്കുന്നു",
          bengali: "রাম-সীতার আগমন: অযোধ্যায় ধর্ম ও প্রেমের মিলন",
          indonesia: "Kedatangan Ram-Sita: Persatuan Dharma dan Cinta di Ayodhya",
        },
        episodeNumber: 8,
        thumbnail:
          "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/ram_katha_part_8_ayodhya_pravesh_thumbnail_compressed.jpg",
        videoQualityUrls: {
          hindi: {
            "480p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part8_Ayodhya_Pravesh_HINDI_480p/Ram_katha_part8_Ayodhya_Pravesh_HINDI_480p.m3u8",
            "720p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part8_Ayodhya_Pravesh_HINDI_720p/Ram_katha_part8_Ayodhya_Pravesh_HINDI_720p.m3u8",
            "1080p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part8_Ayodhya_Pravesh_HINDI_1080p/Ram_katha_part8_Ayodhya_Pravesh_HINDI_1080p.m3u8",
            "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part8_Ayodhya_Pravesh_HINDI_4K/Ram_katha_part8_Ayodhya_Pravesh_HINDI_4K.m3u8",
          },
        },
        description: {
          hindi: "रथ रुका, हाथ बढ़ा, और मिट्टी ने मुस्कुरा-कर अपने गौरवमय अतीत को थाम लिया।",
          english: "The chariot stopped, hands reached out, and the earth smiled as it embraced its glorious past.",
          tamil: "தேர் நின்றது, கைகள் நீண்டன, பூமி புன்னகைத்து தனது மகிமையான கடந்த காலத்தை அணைத்துக் கொண்டது।",
          telugu: "రథం ఆగింది, చేతులు చాచాయి, భూమి నవ్వుతూ తన గౌరవప్రదమైన గతాన్ని ఆలింగనం చేసుకుంది।",
          malayalam: "രഥം നിന്നു, കൈകൾ നീട്ടി, ഭൂമി പുഞ്ചിരിച്ചുകൊണ്ട് തന്റെ മഹത്തായ ഭൂതകാലത്തെ ആലിംഗനം ചെയ്തു।",
          bengali: "রথ থামল, হাত বাড়াল, এবং মাটি হেসে তার গৌরবময় অতীতকে আলিঙ্গন করল।",
          indonesia: "Kereta berhenti, tangan terulur, dan bumi tersenyum sambil memeluk masa lalu yang mulia।",
        },
        duration: "4:35",
        availableLanguages: ["hindi"],
        baseViews: 410000,
        daysAgo: 1,
        get engagement() {
          return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
        },
      },
      {
        id: "kaikeyi_decision_09",
        videoId: "ram-katha_kaikeyi_decision_09",
        title: {
          hindi: "कैकेयी: एक निर्णय, एक युग",
          english: "Kaikeyi: One Decision, One Era",
          tamil: "கைகேயி: ஒரு முடிவு, ஒரு யுகம்",
          telugu: "కైకేయి: ఒక నిర్ణయం, ఒక యుగం",
          malayalam: "കൈകേയി: ഒരു തീരുമാനം, ഒരു യുഗം",
          bengali: "কৈকেয়ী: একটি সিদ্ধান্ত, একটি যুগ",
          indonesia: "Kaikeyi: Satu Keputusan, Satu Era",
        },
        episodeNumber: 9,
        thumbnail:
          "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/ram_katha_part_9_raj_tilak_thumbnail.jpg",
        videoQualityUrls: {
          hindi: {
            "480p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part9_rajtilak_HINDI/Ram_katha_part9_rajtilak_HINDI_480p/Ram_katha_part9_rajtilak_HINDI_480p.m3u8",
            "720p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part9_rajtilak_HINDI/Ram_katha_part9_rajtilak_HINDI_720p/Ram_katha_part9_rajtilak_HINDI_720p.m3u8",
            "1080p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part9_rajtilak_HINDI/Ram_katha_part9_rajtilak_HINDI_1080p/Ram_katha_part9_rajtilak_HINDI_1080p.m3u8",
            "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part9_rajtilak_HINDI/Ram_katha_part9_rajtilak_HINDI_4K/Ram_katha_part9_rajtilak_HINDI_4K.m3u8",
          },
        },
        description: {
          hindi: "नियति का मोड़, श्रीराम राम जानते थे।",
          english: "The turn of destiny, Shree Ram knew.",
          tamil: "விதியின் திருப்பம், ஸ்ரீராம் அறிந்திருந்தார்।",
          telugu: "విధి మలుపు, శ్రీరాము తెలుసుకున్నాడు।",
          malayalam: "വിധിയുടെ വഴിത്തിരിവ്, ശ്രീരാമൻ അറിഞ്ഞിരുന്നു।",
          bengali: "নিয়তির মোড়, শ্রীরাম জানতেন।",
          indonesia: "Belokan takdir, Shree Ram tahu।",
        },
        duration: "4:40",
        availableLanguages: ["hindi"],
        baseViews: 460000,
        daysAgo: 0,
        get engagement() {
          return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
        },
      },
      {
        id: "ram_vanvas_10",
        videoId: "ram-katha_ram_vanvas_10",
        title: {
          hindi: "श्रीराम का अद्वितीय संतुलन: नियति, धर्म और वनवास",
          english: "Shree Ram's Unique Balance: Destiny, Dharma and Exile",
          tamil: "ஸ்ரீராமின் தனித்துவமான சமநிலை: விதி, தர்மம் மற்றும் வனவாசம்",
          telugu: "శ్రీరాముని ప్రత్యేక సమతుల్యత: విధి, ధర్మం మరియు వనవాసం",
          malayalam: "ശ്രീരാമന്റെ അതുല്യമായ സന്തുലനം: വിധി, ധർമ്മം, വനവാസം",
          bengali: "শ্রীরামের অনন্য ভারসাম্য: নিয়তি, ধর্ম এবং বনবাস",
          indonesia: "Keseimbangan Unik Shree Ram: Takdir, Dharma dan Pengasingan",
        },
        episodeNumber: 10,
        thumbnail:
          "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/ram_katha_part_10_van_gaman_thumbnail.jpg",
        videoQualityUrls: {
          hindi: {
            "480p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part10_van_gaman_HINDI/Ram_katha_part10_van_gaman_HINDI_480p/Ram_katha_part10_van_gaman_HINDI_480p.m3u8",
            "720p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part10_van_gaman_HINDI/Ram_katha_part10_van_gaman_HINDI_720p/Ram_katha_part10_van_gaman_HINDI_720p.m3u8",
            "1080p":
              "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part10_van_gaman_HINDI/Ram_katha_part10_van_gaman_HINDI_1080p/Ram_katha_part10_van_gaman_HINDI_1080p.m3u8",
            "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part10_van_gaman_HINDI/Ram_katha_part10_van_gaman_HINDI_4K/Ram_katha_part10_van_gaman_HINDI_4K.m3u8",
          },
        },
        description: {
          hindi: "राजतिलक की तैयारी में, श्री राम ने धर्म के लिए वनवास का संकल्प लिया।",
          english: "In preparation for the coronation, Shree Ram resolved to go into exile for dharma.",
          tamil: "முடிசூட்டு விழாவிற்கான தயாரிப்பில், ஸ்ரீராம் தர்மத்திற்காக வனவாசம் செல்ல தீர்மானித்தார்।",
          telugu: "పట్టాభిషేక సన్నాహాలలో, శ్రీరాము ధర్మం కోసం వనవాసం వెళ్ళాలని నిర్ణయించుకున్నాడు।",
          malayalam: "രാജ്യാഭിഷേക തയ്യാറെടുപ്പിൽ, ശ്രീരാമൻ ധർമ്മത്തിനായി വനവാസം പോകാൻ തീരുമാനിച്ചു।",
          bengali: "রাজ্যাভিষেকের প্রস্তুতিতে, শ্রীরাম ধর্মের জন্য বনবাসে যাওয়ার সংকল্প নিয়েছিলেন।",
          indonesia: "Dalam persiapan penobatan, Shree Ram bertekad untuk pergi ke pengasingan demi dharma।",
        },
        duration: "4:50",
        availableLanguages: ["hindi"],
        baseViews: 480000,
        daysAgo: 0,
        get engagement() {
          return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
        },
      },
    ],
  },
}

// Update latestReleases with latest episodes from specified series
export const latestReleases = [
  {
    id: "ram-gurukul",
    videoId: "latest-releases_ram-gurukul",
    title: {
      hindi: "गुरुकुल की लीलाएं",
      english: "Gurukul Leelas: The First Steps of Dharma",
      tamil: "குருகுல லீலைகள்: தர்மத்தின் முதல் படிகள்",
      telugu: "గురుకుల లీలలు: ధర్మం యొక్క మొదటి అడుగులు",
      malayalam: "ഗുരുകുല ലീലകൾ: ധർമ്മത്തിന്റെ ആദ്യ ചുവടുകൾ",
      bengali: "গুরুকুল লীলা: ধর্মের প্রথম পদক্ষেপ",
      indonesia: "Gurukul Leelas: Langkah Pertama Dharma",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/RamKatha_3_gurukul_thumbnail.jpg",
    videoQualityUrls: {
      hindi: {
        "480p": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_480p/Ram_in_gurukul_480p.m3u8",
        "720p": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_720p/Ram_in_gurukul_720p.m3u8",
        "1080p": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_1080p/Ram_in_gurukul_1080p.m3u8",
        "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_4K/Ram_in_gurukul_4K.m3u8",
      },
    },
    description: {
      hindi: "चारों राजकुमार, एक गुरुकुल — जहां विद्या बनी धर्म का आधार।",
      english: "In the sacred forest, four princes discovered wisdom, grace, and destiny.",
      tamil: "புனித காட்டில், நான்கு இளவரசர்கள் ஞானம், அருள் மற்றும் விதியைக் கண்டுபிடித்தனர்।",
      telugu: "పవిత్ర అడవిలో, నలుగురు రాజకుమారులు జ్ఞానం, దయ మరియు విధిని కనుగొన్నారు।",
      malayalam: "പവിത്രമായ വനത്തിൽ, നാല് രാജകുമാരന്മാർ ജ്ഞാനം, കൃപ, വിധി എന്നിവ കണ്ടെത്തി।",
      bengali: "পবিত্র বনে, চার রাজকুমার জ্ঞান, অনুগ্রহ এবং নিয়তি আবিষ্কার করেছিলেন।",
      indonesia: "Di hutan suci, empat pangeran menemukan kebijaksanaan, rahmat, dan takdir।",
    },
    duration: "3:21",
    rating: 9.1,
    year: 2024,
    genre: "Mythology",
    availableLanguages: ["hindi"],
    baseViews: 280000,
    daysAgo: 8,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "bheem-hanuman",
    videoId: "latest-releases_bheem-hanuman",
    title: {
      hindi: "भीम और हनुमान",
      english: "Bheem and Hanuman",
      tamil: "பீம் மற்றும் அனுமான்",
      telugu: "భీమ్ మరియు హనుమాన్",
      malayalam: "ഭീം ആൻഡ് ഹനുമാൻ",
      bengali: "ভীম এবং হনুমান",
      indonesia: "Bheem dan Hanuman",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/BhimVsHanumanThumbnail-Compressed.jpg",
    videoQualityUrls: {
      hindi: {
        "480p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/EaWpJG-z7aH.m3u8",
        "720p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Bheem_vs_Hanuman_HINDI_720p/Bheem_vs_Hanuman_HINDI_720p.m3u8",
        "1080p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/JCxnYvpg6rQ.m3u8",
        "4K": "https://g-mob.glance-cdn.com/public/videos/abr/hls/nfcIWnr_Fw5.m3u8",
      },
    },
    description: {
      hindi: "जब भीम का अभिमान हनुमान की विनम्रता से टकराया, तब प्रकट हुआ सच्चे बल का अर्थ।",
      english: "When Bheem's pride meets Hanuman's grace, the true meaning of strength is revealed.",
      tamil: "பீமின் பெருமை அனுமானின் அருளைச் சந்திக்கும்போது, வலிமையின் உண்மையான அர்த்தம் வெளிப்படுகிறது।",
      telugu: "భీముని అహంకారం హనుమాన్ కృపను కలుసుకున్నప్పుడు, బలం యొక్క నిజమైన అర్థం వెల్లవుతుంది।",
      malayalam: "ഭീമന്റെ അഹങ്കാരം ഹനുമാന്റെ കൃപയെ കണ്ടുമുട്ടുമ്പോൾ, ശക്തിയുടെ യഥാർത്ഥ അർത്ഥം വെളിപ്പെടുന്നു।",
      bengali: "যখন ভীমের অহংকার হনুমানের অনুগ্রহের সাথে মিলিত হয়, তখন শক্তির প্রকৃত অর্থ প্রকাশিত হয়।",
      indonesia: "Ketika kesombongan Bheem bertemu dengan rahmat Hanuman, makna sebenarnya dari kekuatan terungkap।",
    },
    duration: "4:05",
    rating: 8.9,
    year: 2024,
    genre: "Mythology",
    availableLanguages: ["hindi"],
    baseViews: 480000,
    daysAgo: 15,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "ram-setu",
    videoId: "latest-releases_ram-setu",
    title: {
      hindi: "राम सेतु: विश्वास का पुल",
      english: "Ram Setu: Bridge of Devotion",
      tamil: "ராம் சேது: பக்தியின் பாலம்",
      telugu: "రామ్ సేతు: భక్తి వంతెన",
      malayalam: "രാം സേതു: ഭക്തിയുടെ പാലം",
      bengali: "রাম সেতু: ভক্তির সেতু",
      indonesia: "Ram Setu: Jembatan Pengabdian",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/Ramsetu_thumbnail_1.jpg",
    videoQualityUrls: {
      hindi: {
        "480p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_setu_HINDI_subtitles_480p/Ram_setu_HINDI_subtitles_480p.m3u8",
        "720p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_Setu_with_subtitles_720p/Ram_Setu_with_subtitles_720p.m3u8",
        "1080p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_Setu_with_subtitles_1080p/Ram_Setu_with_subtitles_1080p.m3u8",
        "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_Setu_with_subtitles_4K/Ram_Setu_with_subtitles_4K.m3u8",
      },
    },
    description: {
      hindi: "जब वानर, पत्थर और भक्ति ने मिलकर रचा धर्म का अद्भुत सेतु।",
      english: "Built with faith, led by purpose — the sacred path to Lanka began here.",
      tamil: "நம்பிக்கையுடன் கட்டப்பட்டது, நோக்கத்தால் வழிநடத்தப்பட்டது — இலங்கைக்கான புனித பாதை இங்கே தொடங்கியது।",
      telugu: "విశ్వాసంతో నిర్మించబడింది, ఉద్దేశ్యంతో నడిపించబడింది — లంకకు పవిత్రమైన మార్గం ఇక్కడ ప్రారంభమైంది।",
      malayalam: "വിശ്വാസത്തോടെ നിർമ്മിച്ചത്, ലക്ഷ്യത്താൽ നയിക്കപ്പെട്ടത് — ലങ്കയിലേക്കുള്ള പുണ്യമാർഗ്ഗം ഇവിടെ ആരംഭിച്ചു।",
      bengali: "বিশ্বাসের সাথে নির্মিত, উদ্দেশ্য দ্বারা পরিচালিত — লঙ্কার পবিত্র পথ এখানে শুরু হয়েছিল।",
      indonesia: "Dibangun dengan iman, dipimpin oleh tujuan — jalan suci ke Lanka dimulai di sini।",
    },
    duration: "4:45",
    rating: 9.2,
    year: 2024,
    genre: "Adventure",
    availableLanguages: ["hindi"],
    baseViews: 580000,
    daysAgo: 8,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
]

// Update contentData array with new videoId format:

export const contentData = [
  {
    id: "bheem-hanuman",
    videoId: "popular-stories_bheem-hanuman",
    title: {
      hindi: "भीम और हनुमान",
      english: "Bheem and Hanuman",
      tamil: "பீம் மற்றும் அனுமான்",
      telugu: "భీమ్ మరియు హనుమాన్",
      malayalam: "ഭീം ആൻഡ് ഹനുമാൻ",
      bengali: "ভীম এবং হনুমান",
      indonesia: "Bheem dan Hanuman",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/BhimVsHanumanThumbnail-Compressed.jpg",
    videoQualityUrls: {
      hindi: {
        "480p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/EaWpJG-z7aH.m3u8",
        "720p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/thYRuJEQnCA.m3u8",
        "1080p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/SsRAE9TGWGL.m3u8",
        "4K": "https://g-mob.glance-cdn.com/public/videos/abr/hls/nfcIWnr_Fw5.m3u8",
      },
    },
    description: {
      hindi: "जब भीम का अभिमान हनुमान की विनम्रता से टकराया, तब प्रकट हुआ सच्चे बल का अर्थ।",
      english: "When Bheem's pride meets Hanuman's grace, the true meaning of strength is revealed.",
      tamil: "பீமின் பெருமை அனுமானின் அருளைச் சந்திக்கும்போது, வலிமையின் உண்மையான அர்த்தம் வெளிப்படுகிறது।",
      telugu: "భీముని అహంకారం హనుమాన్ కృపను కలుసుకున్నప్పుడు, బలం యొక్క నిజమైన అర్థం వెల్లవుతుంది।",
      malayalam: "ഭീമന്റെ അഹങ്കാരം ഹനുമാന്റെ കൃപയെ കണ്ടുമുട്ടുമ്പോൾ, ശക്തിയുടെ യഥാർത്ഥ അർത്ഥം വെളിപ്പെടുന്നു।",
      bengali: "যখন ভীমের অহংকার হনুমানের অনুগ্রহের সাথে মিলিত হয়, তখন শক্তির প্রকৃত অর্থ প্রকাশিত হয়।",
      indonesia: "Ketika kesombongan Bheem bertemu dengan rahmat Hanuman, makna sebenarnya dari kekuatan terungkap।",
    },
    duration: "4:05",
    rating: 8.9,
    year: 2024,
    genre: "Mythology",
    availableLanguages: ["hindi"],
    baseViews: 480000,
    daysAgo: 15,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "ram-setu",
    videoId: "popular-stories_ram-setu",
    title: {
      hindi: "राम सेतु: विश्वास का पुल",
      english: "Ram Setu: Bridge of Devotion",
      tamil: "ராம் சேது: பக்தியின் பாலம்",
      telugu: "రామ్ సేతు: భక్తి వంతెన",
      malayalam: "രാം സേതു: ഭക്തിയുടെ പാലം",
      bengali: "রাম সেতু: ভক্তির সেতু",
      indonesia: "Ram Setu: Jembatan Pengabdian",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/Ramsetu_thumbnail_1.jpg",
    videoQualityUrls: {
      hindi: {
        "480p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_setu_HINDI_subtitles_480p/Ram_setu_HINDI_subtitles_480p.m3u8",
        "720p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_Setu_with_subtitles_720p/Ram_Setu_with_subtitles_720p.m3u8",
        "1080p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_Setu_with_subtitles_1080p/Ram_Setu_with_subtitles_1080p.m3u8",
        "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_Setu_with_subtitles_4K/Ram_Setu_with_subtitles_4K.m3u8",
      },
    },
    description: {
      hindi: "जब वानर, पत्थर और भक्ति ने मिलकर रचा धर्म का अद्भुत सेतु।",
      english: "Built with faith, led by purpose — the sacred path to Lanka began here.",
      tamil: "நம்பிக்கையுடன் கட்டப்பட்டது, நோக்கத்தால் வழிநடத்தப்பட்டது — இலங்கைக்கான புனித பாதை இங்கே தொடங்கியது।",
      telugu: "విశ్వాసంతో నిర్మించబడింది, ఉద్దేశ్యంతో నడిపించబడింది — లంకకు పవిత్రమైన మార్గం ఇక్కడ ప్రారంభమైంది।",
      malayalam: "വിശ്വാസത്തോടെ നിർമ്മിച്ചത്, ലക്ഷ്യത്താൽ നയിക്കപ്പെട്ടത് — ലങ്കയിലേക്കുള്ള പുണ്യമാർഗ്ഗം ഇവിടെ ആരംഭിച്ചു।",
      bengali: "বিশ্বাসের সাথে নির্মিত, উদ্দেশ্য দ্বারা পরিচালিত — লঙ্কার পবিত্র পথ এখানে শুরু হয়েছিল।",
      indonesia: "Dibangun dengan iman, dipimpin oleh tujuan — jalan suci ke Lanka dimulai di sini।",
    },
    duration: "4:45",
    rating: 9.2,
    year: 2024,
    genre: "Adventure",
    availableLanguages: ["hindi"],
    baseViews: 580000,
    daysAgo: 8,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "krishna-govardhan",
    videoId: "popular-stories_krishna-govardhan",
    title: {
      hindi: "श्रीकृष्ण गोवर्धन लीला",
      english: "Shree Krishna: The Govardhan Leela",
      tamil: "ஸ்ரீகிருஷ்ணா: கோவர்தன லீலை",
      telugu: "శ్రీకృష్ణ: గోవర్ధన లీల",
      malayalam: "ശ്രീകൃഷ്ണ: ഗോവർധന ലీల",
      bengali: "শ্রীকৃষ্ণ: গোবর্ধন লীলা",
      indonesia: "Shree Krishna: Govardhan Leela",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/Krishna_goverdhan_thumbnail-compressed.jpg",
    videoQualityUrls: {
      hindi: {
        "480p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/quIAzhu_3A6.m3u8",
        "720p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/WRm45BML42O.m3u8",
        "1080p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Shreeram_leaving_earth_with_subtitles_1080p/Shreeram_leaving_earth_with_subtitles_1080p.m3u8",
        "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Krishna_govardhan_subtitles_4K/Krishna_govardhan_subtitles_4K.m3u8",
      },
    },
    description: {
      hindi: "जब महादेव ने तप और तितिक्षा के रूप से प्रकट की दिव्यता और सौंदर्य की झलक।",
      english: "On the sacred day, the Lord of Kailash transformed — revealing the divine grace behind his austerity.",
      tamil:
        "புனித நாளில், கைலாசத்தின் அதிபதி மாற்றம் பெற்றார் — அவரது துறவியிலிருந்து ஒளிமயமானவர் வரை பெற்ற தெய்வீக அருள் வெளிப்படுத்தப்பட்டது।",
      telugu: "విశ్వాసంతో నిర్మించబడింది, ఉద్దేశ్యంతో నడిపించబడింది — లంకకు పవిత్రమైన మార్గం ఇక్కడ ప్రారంభమైంది।",
      malayalam: "పవిత్రమైన వనంల��, నలుగురు రాజకుమారులు జ్ఞానం, కృప, విధి എന്നിവ കണ്ടെത്തി।",
      bengali: "পবিত্র বনে, চার রাজকুমার জ্ঞান, অনুগ্রহ এবং নিয়তি আবিষ্কার করেছিলেন।",
      indonesia: "Di hutan suci, empat pangeran menemukan kebijaksanaan, rahmat, dan takdir।",
    },
    duration: "3:05",
    rating: 9.1,
    year: 2024,
    genre: "Mythology",
    availableLanguages: ["hindi"],
    baseViews: 520000,
    daysAgo: 12,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "ram-departure",
    videoId: "popular-stories_ram-departure",
    title: {
      hindi: "श्रीराम का वैकुंठ प्रस्थान",
      english: "Shree Ram's Divine Departure",
      tamil: "ஸ்ரீராமின் தெய்வீக புறப்பாடு",
      telugu: "రామ్ దైవిక ప్రయాణం",
      malayalam: "ശ്രീരാമന്റെ ദൈവിക യാത്ര",
      bengali: "শ্রীরামের দৈবিক প্রস্থান",
      indonesia: "Kepergian Ilahi Shree Ram",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/Ram_leaving_earth_thumbnail.jpg",
    videoQualityUrls: {
      hindi: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_leaving_earth_HINDI_480p/Ram_leaving_earth_HINDI_480p.m3u8",
        "720p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Shreeram_leaving_earth_with_subtitles_720p/Shreeram_leaving_earth_with_subtitles_720p.m3u8",
        "1080p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Shreeram_leaving_earth_with_subtitles_1080p/Shreeram_leaving_earth_with_subtitles_1080p.m3u8",
        "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Shreeram_leaving_earth_with_subtitles_4K/Shreeram_leaving_earth_with_subtitles_4K.m3u8",
      },
      english: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Shreeram_leaving_earth_subtitles_ENGLISH_480p/Shreeram_leaving_earth_subtitles_ENGLISH_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Shreeram_leaving_earth_subtitles_ENGLISH_720p/Shreeram_leaving_earth_subtitles_ENGLISH_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Shreeram_leaving_earth_subtitles_ENGLISH_1080p/Shreeram_leaving_earth_subtitles_ENGLISH_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Shreeram_leaving_earth_subtitles_ENGLISH_4K/Shreeram_leaving_earth_subtitles_ENGLISH_4K.m3u8",
      },
    },
    description: {
      hindi: "जब धरती ने विदा लिया धर्म के अवतार को, और राम लौटे अपने परम धाम।",
      english: "As dharma fulfilled its course, Ram returned to his eternal abode — Vaikunth.",
      tamil: "தர்மம் அதன் பாதையை நிறைவேற்றியபோது, ராம் தனது நித்திய வாசஸ்தலமான வைகுண்டத்திற்குத் திரும்பினார்।",
      telugu: "ధర్మం తన మార్గాన్ని పూర్తి చేసినప్పుడు, రామ తన శాశ్వత నివాసమైన వైకుంఠానికి తిరిగి వెళ్ళాడు।",
      malayalam: "ധർമ്മം അതിന്റെ ഗതി പൂർത്തിയാക്കിയപ്പോൾ, രാമൻ തന്റെ ശാശ്വത വാസസ്ഥലമായ വൈകുണ്ടത്തിലേക്ക് മടങ്ങി।",
      bengali: "যখন ধর্ম তার পথ সম্পূর্ণ করল, রাম তার শাশ্বত আবাস বৈকুণ্ঠে ফিরে গেলেন।",
      indonesia: "Ketika dharma memenuhi jalannya, Ram kembali ke tempat tinggal abadinya — Vaikunth।",
    },
    duration: "4:01",
    rating: 9.5,
    year: 2024,
    genre: "Mythology",
    availableLanguages: ["hindi", "english"],
    baseViews: 420000,
    daysAgo: 18,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "shiv-wedding",
    videoId: "popular-stories_shiv-wedding",
    title: {
      hindi: "शिव विवाह: तपस्वी से तेजस्वी रूप तक",
      english: "Shiv-Parvati Vivah: From Ascetic to Radiant",
      tamil: "சிவ-பார்வதி விவாஹ்: துறவியிலிருந்து ஒளிமயமானவர் வரை",
      telugu: "శివ-పార్వతి వివాహ్: సన్యాసి నుండి ప్రకాశవంతుడు వరకు",
      malayalam: "ശിവ-പാർവതി വിവാഹ്: സന്യാസിയിൽ നിന്ന് പ്രകാശമാനനിലേക്ക്",
      bengali: "শিব-পার্বতী বিবাহ: সন্ন্যাসী থেকে উজ্জ্বল পর্যন্ত",
      indonesia: "Shiv-Parvati Vivah: Dari Pertapa hingga Bercahaya",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/shiv_wedding_thumbnail.jpg",
    videoQualityUrls: {
      hindi: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Shiva_wedding_HINDI_subtitles_480p/Shiva_wedding_HINDI_subtitles_480p.m3u8",
        "720p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Shiva_wedding_subtitles_720p/Shiva_wedding_subtitles_720p.m3u8",
        "1080p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Shiva_wedding_subtitles_1080p/Shiva_wedding_subtitles_1080p.m3u8",
        "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Shiva_wedding_subtitles_4K/Shiva_wedding_subtitles_4K.m3u8",
      },
      english: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Shiva_wedding_ENGLISH_subtitles_480p/Shiva_wedding_ENGLISH_subtitles_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Shiva_wedding_ENGLISH_subtitles_720p/Shiva_wedding_ENGLISH_subtitles_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Shiva_wedding_ENGLISH_subtitles_1080p/Shiva_wedding_ENGLISH_subtitles_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Shiva_wedding_ENGLISH_subtitles_4K/Shiva_wedding_ENGLISH_subtitles_4K.m3u8",
      },
    },
    description: {
      hindi: "जब महादेव ने तप और तितिक्षा के रूप से प्रकट की दिव्यता और सौंदर्य की झलक।",
      english: "On the sacred day, the Lord of Kailash transformed — revealing the divine grace behind his austerity.",
      tamil:
        "புனித நாளில், கைலாசத்தின் அதிபதி மாற்றம் பெற்றார் — அவரது துறவியிலிருந்து ஒளிமயமானவர் வரை பெற்ற தெய்வீக அருள் வெளிப்படுத்தப்பட்டது।",
      telugu: "విశ్వాసంతో నిర్మించబడింది, ఉద్దేశ్యంతో నడిపించబడింది — లంకకు పవిత్రమైన మార్గం ఇక్కడ ప్రారంభమైంది।",
      malayalam: "పవిత్రమైన వనంలో, నలుగురు రాజకుమారులు జ్ఞానం, కృప, విధి എന്നിവ കണ്ടെത്തി।",
      bengali: "পবিত্র বনে, চার রাজকুমার জ্ঞান, অনুগ্রহ এবং নিয়তি আবিষ্কার করেছিলেন।",
      indonesia: "Di hutan suci, empat pangeran menemukan kebijaksanaan, rahmat, dan takdir।",
    },
    duration: "4:01",
    rating: 9.5,
    year: 2024,
    genre: "Mythology",
    availableLanguages: ["hindi", "english"],
    baseViews: 420000,
    daysAgo: 18,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "ram-vs-ravan",
    videoId: "popular-stories_ram-vs-ravan",
    title: {
      hindi: "राम रावण युद्ध: धर्म की अंतिम परीक्षा",
      english: "Ram vs Ravan: The Final Battle",
      tamil: "ராம் vs ராவண்: இறுதிப் போர்",
      telugu: "రామ్ vs రావణ్: చివరి యుద్ధం",
      malayalam: "രാമ് vs രാവണ്: അവസാന യുദ്ധം",
      bengali: "রাম vs রাবণ: চূড়ান্ত যুদ্ধ",
      indonesia: "Ram vs Ravan: Pertempuran Terakhir",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/Ram_vs_Ravan_thumbnail_1.jpg",
    videoQualityUrls: {
      hindi: {
        "480p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/AYvpekgAI5M.m3u8",
        "720p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_vs_Raavan_with_subtitles_720p/Ram_vs_Raavan_with_subtitles_720p.m3u8",
        "1080p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_vs_Raavan_with_subtitles_1080p/Ram_vs_Raavan_with_subtitles_1080p.m3u8",
        "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_vs_Raavan_with_subtitles_4K/Ram_vs_Raavan_with_subtitles_4K.m3u8",
      },
    },
    description: {
      hindi: "जब राम रावण के बीच युद्ध हुआ, तो धर्म की जीत निर्णय हुई।",
      english: "When Ram faced Ravan in battle, the victory of dharma was sealed.",
      tamil: "பொறுத்தில் ராம் மற்றும் ராவண் செல்வது தெய்வீகத்தின் வெற்றிக்காலம் வெற்றிக்கொள்வது தெரிவித்தது।",
      telugu: "పోరంలో రాము మరియు రావణు చూద్దారు, ధర్మం యొక్క విజయం ప్రతిప్పు చూద్దారు।",
      malayalam: "പോരിൽ രാമൻ മറ്റും രാവണൻ ചൂട്ടുന്നത്, ധർമ്മത്തിന്റെ വിജയം പുറത്തു ചൂട്ടുന്നത്.",
      bengali: "যখন রাম রাবণের সাথে যুদ্ধ করেছিল, তখন ধর্মের জয় নির্ণয় হয়েছিল।",
      indonesia: "Ketika Ram berhadapan dengan Ravan dalam pertempuran, kemenangan dharma ditentukan.",
    },
    duration: "4:45",
    rating: 9.2,
    year: 2024,
    genre: "Adventure",
    availableLanguages: ["hindi"],
    baseViews: 580000,
    daysAgo: 8,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
]

// English-exclusive content
export const englishExclusiveContent = [
  {
    id: "first-spark",
    videoId: "evolution-humans-fire_first-spark",
    title: {
      english: "The First Spark",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/Human_fire_EP01_thumbnail_compressed.jpg",
    videoQualityUrls: {
      english: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Human_evolution_fire_part1_480p/Human_evolution_fire_part1_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Human_evolution_fire_part1_720p/Human_evolution_fire_part1_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Human_evolution_fire_part1_1080p/Human_evolution_fire_part1_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Human_evolution_fire_part1_4K/Human_evolution_fire_part1_4K.m3u8",
      },
    },
    description: {
      english:
        "A lightning strike ignites the ancient forest—early humans face fire for the very first time, fear turning to fascination",
    },
    duration: "4:15",
    rating: 8.7,
    year: 2024,
    genre: "Documentary",
    availableLanguages: ["english"],
    baseViews: 320000,
    daysAgo: 3,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "first-touch",
    videoId: "evolution-humans-fire_first-touch",
    title: {
      english: "First Touch",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/Human_fire_EP02_thumbnail_compressed.jpg",
    videoQualityUrls: {
      english: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/part2_ember_subtitles_480p/part2_ember_subtitles_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/part2_ember_subtitles_720p/part2_ember_subtitles_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/part2_ember_subtitles_1080p/part2_ember_subtitles_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/part2_ember_subtitles_4K/part2_ember_subtitles_4K.m3u8",
      },
    },
    description: {
      english:
        "In the ashes of destruction, the first spark of curiosity toward fire ignites a new path for humankind.",
    },
    duration: "3:58",
    rating: 8.9,
    year: 2024,
    genre: "Documentary",
    availableLanguages: ["english"],
    baseViews: 280000,
    daysAgo: 5,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "flicker-of-hope",
    videoId: "evolution-humans-fire_flicker-of-hope",
    title: {
      english: "The Flicker of Hope: Humanity's Turning Point",
    },
    thumbnail:
      "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/human_evolution_3_flicker_of_hope_thumbnail_compressed.jpg",
    videoQualityUrls: {
      english: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Human_evolution_flicker_of_ho_Episode_3_ENGLISH_subtitles_480p/Human_evolution_flicker_of_ho_Episode_3_ENGLISH_subtitles_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Human_evolution_flicker_of_ho_Episode_3_ENGLISH_subtitles_720p/Human_evolution_flicker_of_ho_Episode_3_ENGLISH_subtitles_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Human_evolution_flicker_of_ho_Episode_3_ENGLISH_subtitles_1080p/Human_evolution_flicker_of_ho_Episode_3_ENGLISH_subtitles_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Human_evolution_flicker_of_ho_Episode_3_ENGLISH_subtitles_4K/Human_evolution_flicker_of_ho_Episode_3_ENGLISH_subtitles_4K.m3u8",
      },
    },
    description: {
      english: "Witness the single ember that changed fear into power and night into history",
    },
    duration: "4:22",
    rating: 9.0,
    year: 2024,
    genre: "Documentary",
    availableLanguages: ["english"],
    baseViews: 250000,
    daysAgo: 7,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "firebound",
    videoId: "evolution-humans-fire_firebound",
    title: {
      english: "Firebound: Tribe Forged by Flames of Unity",
    },
    thumbnail:
      "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/human_evolution_4_flame_of_unity_thumbnail_compressed.jpg",
    videoQualityUrls: {
      english: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Human_evolution_Episode_4_flames_of_unity_ENGLISH_subtitles_480p/Human_evolution_Episode_4_flames_of_unity_ENGLISH_subtitles_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Human_evolution_Episode_4_flames_of_unity_ENGLISH_subtitles_720p/Human_evolution_Episode_4_flames_of_unity_ENGLISH_subtitles_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Human_evolution_Episode_4_flames_of_unity_ENGLISH_subtitles_1080p/Human_evolution_Episode_4_flames_of_unity_ENGLISH_subtitles_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Human_evolution_Episode_4_flames_of_unity_ENGLISH_subtitles_4K/Human_evolution_Episode_4_flames_of_unity_ENGLISH_subtitles_4K.m3u8",
      },
    },
    description: {
      english: "United by sparks, we thaw the night's chill.",
    },
    duration: "4:18",
    rating: 8.8,
    year: 2024,
    genre: "Documentary",
    availableLanguages: ["english"],
    baseViews: 220000,
    daysAgo: 9,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "nightfall-victory",
    videoId: "evolution-humans-fire_nightfall-victory",
    title: {
      english: "Humanity's Nightfall Victory",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/human_evolution_part_5_thumbnail.jpg",
    videoQualityUrls: {
      english: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Episode_5_fire_to_protect/Human_evolution_Episode_5_fire_to_protect_ENGLISH_subtitles_480p/Human_evolution_Episode_5_fire_to_protect_ENGLISH_subtitles_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Episode_5_fire_to_protect/Human_evolution_Episode_5_fire_to_protect_ENGLISH_subtitles_720p/Human_evolution_Episode_5_fire_to_protect_ENGLISH_subtitles_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Episode_5_fire_to_protect/Human_evolution_Episode_5_fire_to_protect_ENGLISH_subtitles_1080p/Human_evolution_Episode_5_fire_to_protect_ENGLISH_subtitles_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Episode_5_fire_to_protect/Human_evolution_Episode_5_fire_to_protect_ENGLISH_subtitles_4K/Human_evolution_Episode_5_fire_to_protect_ENGLISH_subtitles_4K.m3u8",
      },
    },
    description: {
      english: "From terror to triumph: our fire became first shield against the night.",
    },
    duration: "4:12",
    rating: 8.6,
    year: 2024,
    genre: "Documentary",
    availableLanguages: ["english"],
    baseViews: 190000,
    daysAgo: 11,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "stone-and-fire",
    videoId: "evolution-humans-fire_stone-and-fire",
    title: {
      english: "Stone and Fire: A New Dawn",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/human_evolution_part_6_stone_and_fire_thumbnail.jpg",
    videoQualityUrls: {
      english: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Episode_6_the_spark_of_discovery/Human_evolution_Episode_6_the_spark_of_discovery_ENGLISH_subtitles_480p/Human_evolution_Episode_6_the_spark_of_discovery_ENGLISH_subtitles_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Episode_6_the_spark_of_discovery/Human_evolution_Episode_6_the_spark_of_discovery_ENGLISH_subtitles_720p/Human_evolution_Episode_6_the_spark_of_discovery_ENGLISH_subtitles_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Episode_6_the_spark_of_discovery/Human_evolution_Episode_6_the_spark_of_discovery_ENGLISH_subtitles_1080p/Human_evolution_Episode_6_the_spark_of_discovery_ENGLISH_subtitles_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Episode_6_the_spark_of_discovery/Human_evolution_Episode_6_the_spark_of_discovery_ENGLISH_subtitles_4K/Human_evolution_Episode_6_the_spark_of_discovery_ENGLISH_subtitles_4K.m3u8",
      },
    },
    description: {
      english: "Frustration led to fire—marking the moment when humanity conquered the flame.",
    },
    duration: "4:28",
    rating: 8.8,
    year: 2024,
    genre: "Documentary",
    availableLanguages: ["english"],
    baseViews: 160000,
    daysAgo: 13,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
]

// Remove watchProgress from defaultExclusiveContent
export const defaultExclusiveContent = [
  {
    id: "ram-janm-default",
    videoId: "default-ram-katha_ram-janm",
    title: {
      default: "Birth of Shree Ram: Dawn of a Divine Era",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/RamKatha_1_RamJanm_thumnail.jpg",
    videoQualityUrls: {
      default: {
        "480p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/iYi4EgjUZFA.m3u8",
        "720p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/glJoaEcOK1x.m3u8",
        "1080p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/5KeHSr6Y5bF.m3u8",
        "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_janm_4K/Ram_janm_4K.m3u8",
      },
    },
    description: {
      default: "On the day Ram was born, even the heavens bowed to dharma's light.",
    },
    duration: "4:10",
    availableLanguages: ["default"],
    baseViews: 850000,
    daysAgo: 1,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "ram-childhood-default",
    videoId: "default-ram-katha_ram-childhood",
    title: {
      default: "Childhood: Jewels of Ayodhya",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/RamKatha_2_RamChildhood_thumbnail-1.jpg",
    videoQualityUrls: {
      default: {
        "480p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/5ygC9b8IxrJ.m3u8",
        "720p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/thYRuJEQnCA.m3u8",
        "1080p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/SsRAE9TGWGL.m3u8",
        "4K": "https://g-mob.glance-cdn.com/public/videos/abr/hls/nfcIWnr_Fw5.m3u8",
      },
    },
    description: {
      default: "In every playful step of Shree Ram and his brothers, a divine legacy was quietly unfolding.",
    },
    duration: "3:11",
    availableLanguages: ["default"],
    baseViews: 320000,
    daysAgo: 5,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "ram-gurukul-default",
    videoId: "default-ram-katha_ram-gurukul",
    title: {
      default: "Gurukul Leelas: The First Steps of Dharma",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/RamKatha_3_gurukul_thumbnail.jpg",
    videoQualityUrls: {
      default: {
        "480p": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_480p/Ram_in_gurukul_480p.m3u8",
        "720p": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_720p/Ram_in_gurukul_720p.m3u8",
        "1080p": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_1080p/Ram_in_gurukul_1080p.m3u8",
        "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_4K/Ram_in_gurukul_4K.m3u8",
      },
    },
    description: {
      default: "In the sacred forest, four princes discovered wisdom, grace, and destiny.",
    },
    duration: "3:21",
    availableLanguages: ["default"],
    baseViews: 280000,
    daysAgo: 8,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "yagya_raksha-default",
    videoId: "default-ram-katha_yagya_raksha",
    title: {
      default: "Shree Ram, Lakshman and Tadaka",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/RamKatha_4_yagyaRaksha_thumbnail.jpg",
    videoQualityUrls: {
      default: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part4_Yagya_raksha_HINDI_480p/Ram_katha_part4_Yagya_raksha_HINDI_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part4_Yagya_raksha_HINDI_720p/Ram_katha_part4_Yagya_raksha_HINDI_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part4_Yagya_raksha_HINDI_1080p/Ram_katha_part4_Yagya_raksha_HINDI_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part4_Yagya_raksha_HINDI_4K/Ram_katha_part4_Yagya_raksha_HINDI_4K.m3u8",
      },
    },
    description: {
      default: "Ram and Lakshman defeated Tadaka and protected the yagna.",
    },
    duration: "4:20",
    availableLanguages: ["default"],
    baseViews: 380000,
    daysAgo: 6,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "ram_sita_milan_05-default",
    videoId: "default-ram-katha_ram_sita_milan_05",
    title: {
      default: "Shree Sita-Ram Milan",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/ram_katha_5_thumbnail_v3_compressed.jpg",
    videoQualityUrls: {
      default: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part5_Ram_sita_pushpvatika_480p/Ram_katha_part5_Ram_sita_pushpvatika_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part5_Ram_sita_pushpvatika_720p/Ram_katha_part5_Ram_sita_pushpvatika_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part5_Ram_sita_pushpvatika_1080p/Ram_katha_part5_Ram_sita_pushpvatika_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part5_Ram_sita_pushpvatika_4K/Ram_katha_part5_Ram_sita_pushpvatika_4K.m3u8",
      },
    },
    description: {
      default: "Everything changed in one glance. Their first meeting shaped the future.",
    },
    duration: "4:15",
    availableLanguages: ["default"],
    baseViews: 420000,
    daysAgo: 4,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "shiv_dhanush_06-default",
    videoId: "default-ram-katha_shiv_dhanush_06",
    title: {
      default: "Shiv Dhanush and Swayamvar",
    },
    thumbnail:
      "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/ram_katha_part_6_shiv_dhanush_thumbnail_compressed.jpg",
    videoQualityUrls: {
      default: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part6_Dhanush_480p/Ram_katha_part6_Dhanush_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part6_Dhanush_720p/Ram_katha_part6_Dhanush_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part6_Dhanush_1080p/Ram_katha_part6_Dhanush_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part6_Dhanush_4K/Ram_katha_part6_Dhanush_4K.m3u8",
      },
    },
    description: {
      default: "The magnificent moment of the great wedding became a symbol of love and dharma!",
    },
    duration: "4:30",
    availableLanguages: ["default"],
    baseViews: 450000,
    daysAgo: 2,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "sita_vidai_07-default",
    videoId: "default-ram-katha_sita_vidai_07",
    title: {
      default: "Sita's Farewell: Janak's Final Blessing",
    },
    thumbnail:
      "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/Ram_katha_part_7_Sita_vida_thumbnail_compressed.jpg",
    videoQualityUrls: {
      default: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part7_Vida_HINDI_480p/Ram_katha_part7_Vida_HINDI_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part7_Vida_HINDI_720p/Ram_katha_part7_Vida_HINDI_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part7_Vida_HINDI_1080p/Ram_katha_part7_Vida_HINDI_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part7_Vida_HINDI_4K/Ram_katha_part7_Vida_HINDI_4K.m3u8",
      },
    },
    description: {
      default: "In father's trembling words lies dharma, and in Sita's silent smile shines unwavering grace.",
    },
    duration: "4:25",
    availableLanguages: ["default"],
    baseViews: 390000,
    daysAgo: 3,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "ram_sita_ayodhya_08-default",
    videoId: "default-ram-katha_ram_sita_ayodhya_08",
    title: {
      default: "Ram-Sita's Arrival: Union of Dharma and Love in Ayodhya",
    },
    thumbnail:
      "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/ram_katha_part_8_ayodhya_pravesh_thumbnail_compressed.jpg",
    videoQualityUrls: {
      default: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part8_Ayodhya_Pravesh_HINDI_480p/Ram_katha_part8_Ayodhya_Pravesh_HINDI_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part8_Ayodhya_Pravesh_HINDI_720p/Ram_katha_part8_Ayodhya_Pravesh_HINDI_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part8_Ayodhya_Pravesh_HINDI_1080p/Ram_katha_part8_Ayodhya_Pravesh_HINDI_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part8_Ayodhya_Pravesh_HINDI_4K/Ram_katha_part8_Ayodhya_Pravesh_HINDI_4K.m3u8",
      },
    },
    description: {
      default: "The chariot stopped, hands reached out, and the earth smiled as it embraced its glorious past.",
    },
    duration: "4:35",
    availableLanguages: ["default"],
    baseViews: 410000,
    daysAgo: 1,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "kaikeyi_decision_09-default",
    videoId: "default-ram-katha_kaikeyi_decision_09",
    title: {
      default: "Kaikeyi: One Decision, One Era",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/ram_katha_part_9_raj_tilak_thumbnail.jpg",
    videoQualityUrls: {
      default: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part9_rajtilak_HINDI/Ram_katha_part9_rajtilak_HINDI_480p/Ram_katha_part9_rajtilak_HINDI_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part9_rajtilak_HINDI/Ram_katha_part9_rajtilak_HINDI_720p/Ram_katha_part9_rajtilak_HINDI_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part9_rajtilak_HINDI/Ram_katha_part9_rajtilak_HINDI_1080p/Ram_katha_part9_rajtilak_HINDI_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part9_rajtilak_HINDI/Ram_katha_part9_rajtilak_HINDI_4K/Ram_katha_part9_rajtilak_HINDI_4K.m3u8",
      },
    },
    description: {
      default: "The turn of destiny, Shree Ram knew.",
    },
    duration: "4:40",
    availableLanguages: ["default"],
    baseViews: 460000,
    daysAgo: 0,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "ram_vanvas_10-default",
    videoId: "default-ram-katha_ram_vanvas_10",
    title: {
      default: "Shree Ram's Unique Balance: Destiny, Dharma and Exile",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/ram_katha_part_10_van_gaman_thumbnail.jpg",
    videoQualityUrls: {
      default: {
        "480p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part10_van_gaman_HINDI/Ram_katha_part10_van_gaman_HINDI_480p/Ram_katha_part10_van_gaman_HINDI_480p.m3u8",
        "720p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part10_van_gaman_HINDI/Ram_katha_part10_van_gaman_HINDI_720p/Ram_katha_part10_van_gaman_HINDI_720p.m3u8",
        "1080p":
          "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part10_van_gaman_HINDI/Ram_katha_part10_van_gaman_HINDI_1080p/Ram_katha_part10_van_gaman_HINDI_1080p.m3u8",
        "4K": "https://d1t76x8dt2bju7.cloudfront.net/HLS-Streamings/Ram_katha_part10_van_gaman_HINDI/Ram_katha_part10_van_gaman_HINDI_4K/Ram_katha_part10_van_gaman_HINDI_4K.m3u8",
      },
    },
    description: {
      default: "In preparation for the coronation, Shree Ram resolved to go into exile for dharma.",
    },
    duration: "4:50",
    availableLanguages: ["default"],
    baseViews: 480000,
    daysAgo: 0,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
]

// Default popular stories (Hindi content with English titles)
export const defaultPopularStories = [
  {
    id: "bheem-hanuman-default",
    videoId: "default-popular-stories_bheem-hanuman",
    title: {
      default: "Bheem and Hanuman",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/BhimVsHanumanThumbnail-Compressed.jpg",
    videoQualityUrls: {
      default: {
        "480p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/EaWpJG-z7aH.m3u8",
        "720p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/thYRuJEQnCA.m3u8",
        "1080p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/SsRAE9TGWGL.m3u8",
        "4K": "https://g-mob.glance-cdn.com/public/videos/abr/hls/nfcIWnr_Fw5.m3u8",
      },
    },
    description: {
      default: "When Bheem's pride meets Hanuman's grace, the true meaning of strength is revealed.",
    },
    duration: "4:05",
    rating: 8.9,
    year: 2024,
    genre: "Mythology",
    availableLanguages: ["default"],
    baseViews: 480000,
    daysAgo: 15,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "ram-setu-default",
    videoId: "default-popular-stories_ram-setu",
    title: {
      default: "Ram Setu: Bridge of Devotion",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/Ramsetu_thumbnail_1.jpg",
    videoQualityUrls: {
      default: {
        "480p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_setu_HINDI_subtitles_480p/Ram_setu_HINDI_subtitles_480p.m3u8",
        "720p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_Setu_with_subtitles_720p/Ram_Setu_with_subtitles_720p.m3u8",
        "1080p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_Setu_with_subtitles_1080p/Ram_Setu_with_subtitles_1080p.m3u8",
        "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_Setu_with_subtitles_4K/Ram_Setu_with_subtitles_4K.m3u8",
      },
    },
    description: {
      default: "Built with faith, led by purpose — the sacred path to Lanka began here.",
    },
    duration: "4:45",
    rating: 9.2,
    year: 2024,
    genre: "Adventure",
    availableLanguages: ["default"],
    baseViews: 580000,
    daysAgo: 8,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
  {
    id: "krishna-govardhan-default",
    videoId: "default-popular-stories_krishna-govardhan",
    title: {
      default: "Shree Krishna: The Govardhan Leela",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/Krishna_goverdhan_thumbnail-compressed.jpg",
    videoQualityUrls: {
      default: {
        "480p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/quIAzhu_3A6.m3u8",
        "720p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/WRm45BML42O.m3u8",
        "1080p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Shreeram_leaving_earth_with_subtitles_1080p/Shreeram_leaving_earth_with_subtitles_1080p.m3u8",
        "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Krishna_govardhan_subtitles_4K/Krishna_govardhan_subtitles_4K.m3u8",
      },
    },
    description: {
      default: "On the sacred day, the Lord of Kailash transformed — revealing the divine grace behind his austerity.",
    },
    duration: "3:05",
    rating: 9.1,
    year: 2024,
    genre: "Mythology",
    availableLanguages: ["default"],
    baseViews: 520000,
    daysAgo: 12,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
]

// Default latest releases (Hindi content with English titles)
export const defaultLatestReleases = [
  {
    id: "ram-gurukul-latest-default",
    videoId: "default-latest-releases_ram-gurukul",
    title: {
      default: "Gurukul Leelas: The First Steps of Dharma",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/RamKatha_3_gurukul_thumbnail.jpg",
    videoQualityUrls: {
      default: {
        "480p": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_480p/Ram_in_gurukul_480p.m3u8",
        "720p": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_720p/Ram_in_gurukul_720p.m3u8",
        "1080p": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_1080p/Ram_in_gurukul_1080p.m3u8",
        "4K": "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Ram_in_gurukul_4K/Ram_in_gurukul_4K.m3u8",
      },
    },
    description: {
      default: "In the sacred forest, four princes discovered wisdom, grace, and destiny.",
    },
    duration: "3:21",
    rating: 9.1,
    year: 2024,
    genre: "Mythology",
    availableLanguages: ["default"],
    baseViews: 280000,
    daysAgo: 8,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.baseViews, this.id)
    },
  },
  {
    id: "bheem-hanuman-latest-default",
    videoId: "default-latest-releases_bheem-hanuman",
    title: {
      default: "Bheem and Hanuman",
    },
    thumbnail: "https://d1t76x8dt2bju7.cloudfront.net/Thumbnails/compressed/BhimVsHanumanThumbnail-Compressed.jpg",
    videoQualityUrls: {
      default: {
        "480p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/EaWpJG-z7aH.m3u8",
        "720p":
          "https://d2asf24s4fljij.cloudfront.net/HLS-Streamings/Bheem_vs_Hanuman_HINDI_720p/Bheem_vs_Hanuman_HINDI_720p.m3u8",
        "1080p": "https://g-mob.glance-cdn.com/public/videos/abr/hls/JCxnYvpg6rQ.m3u8",
        "4K": "https://g-mob.glance-cdn.com/public/videos/abr/hls/nfcIWnr_Fw5.m3u8",
      },
    },
    description: {
      default: "When Bheem's pride meets Hanuman's grace, the true meaning of strength is revealed.",
    },
    duration: "4:05",
    rating: 8.9,
    year: 2024,
    genre: "Mythology",
    availableLanguages: ["default"],
    baseViews: 480000,
    daysAgo: 15,
    get engagement() {
      return getEngagementMetricsWithSeed(this.baseViews, this.daysAgo, this.id)
    },
  },
]

// Add these imports back since they're still needed for the LANGUAGE_SPECIFIC_COLLECTIONS

// Utility function to get localized text
function getLocalizedText(textObj: any, language: string, fallback = "english") {
  if (typeof textObj === "string") return textObj
  if (typeof textObj === "object" && textObj !== null) {
    return textObj[language] || textObj[fallback] || textObj["hindi"] || Object.values(textObj)[0] || ""
  }
  return ""
}

// Utility function to get section titles
function getSectionTitles(language: string) {
  const titles = {
    continueWatching: {
      hindi: "देखना जारी रखें",
      english: "Continue Watching",
      tamil: "பார்ப்பதைத் தொடரவும்",
      telugu: "చూడటం కొనసాగించండి",
      malayalam: "കാണുന്നത് തുടരുക",
      bengali: "দেখা চালিয়ে যান",
      indonesia: "Lanjutkan Menonton",
    },
    popularTales: {
      hindi: "प्रसिद्ध कथाएँ",
      english: "Popular Stories",
      tamil: "பிரபலமான கதைகள்",
      telugu: "ప్రసిద్ధ కథలు",
      malayalam: "ജനപ്രിയ കഥകൾ",
      bengali: "জনপ্রিয় গল্প",
      indonesia: "Cerita Populer",
    },
    latestReleases: {
      hindi: "नवीनतम रिलीज़",
      english: "Latest Releases",
      tamil: "சமீபத்திய வெளியீடுகள்",
      telugu: "తాజా విడుదలలు",
      malayalam: "ഏറ്റവും പുതിയ റിലീസുകൾ",
      bengali: "সর্বশেষ রিলিজ",
      indonesia: "Rilis Terbaru",
    },
  }

  return {
    continueWatching: getLocalizedText(titles.continueWatching, language),
    popularTales: getLocalizedText(titles.popularTales, language),
    latestReleases: getLocalizedText(titles.latestReleases, language),
  }
}

// Utility function to find content by videoId
function findContentByVideoId(videoId: string) {
  // Search in series data
  for (const [seriesKey, seriesInfo] of Object.entries(seriesData)) {
    const episode = seriesInfo.episodes.find((ep) => ep.videoId === videoId)
    if (episode) {
      return { content: episode, series: seriesKey, type: "series" }
    }
  }

  // Search in latest releases
  const latestRelease = latestReleases.find((item) => item.videoId === videoId)
  if (latestRelease) {
    return { content: latestRelease, series: null, type: "standalone" }
  }

  // Search in popular stories
  const popularStory = contentData.find((item) => item.videoId === videoId)
  if (popularStory) {
    return { content: popularStory, series: null, type: "standalone" }
  }

  return null
}

// Export popularStories as an alias for backward compatibility
export const popularStories = contentData

export { getLocalizedText, getSectionTitles, findContentByVideoId }
