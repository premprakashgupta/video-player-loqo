import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Suspense } from "react"
import "./globals.css"
import { Footer } from "../components/footer"
// import { Analytics } from "@vercel/analytics/react"

export const metadata: Metadata = {
  title: "LOQO AI",
  description: "New episodes and shows every day. Fresh content, Nonstop entertainment.",
  generator: "LOQO",
  openGraph: {
    type: "website",
    title: "LOQO AI",
    description: "New episodes and shows every day. Fresh content, Nonstop entertainment.",
    siteName: "LOQO AI",
    url: "https://loqo.ai",
    images: [
      {
        url: "https://loqo.ai/og-image.jpg", // Replace with your actual OG image URL
        width: 1200,
        height: 630,
        alt: "LOQO AI - Nonstop entertainment",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LOQO AI",
    description: "New episodes and shows every day. Fresh content, Nonstop entertainment.",
    images: ["https://loqo.ai/twitter-image.jpg"], // Replace with your actual Twitter image URL
    creator: "@loqoai",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        {/* URL Normalization Script - Must be placed before other scripts */}
        <Script id="url-normalizer" strategy="beforeInteractive">
          {`
            (function() {
              // Check if URL contains HTML entities
              if (window.location.search.indexOf('&amp;') !== -1) {
                // Normalize the URL by replacing HTML entities
                var normalizedUrl = window.location.href
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"');
                
                // Update the URL without reloading the page
                window.history.replaceState({}, '', normalizedUrl);
              }
            })();
          `}
        </Script>
        {/* Google tag (gtag.js) */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-9HSJES1HRQ" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9HSJES1HRQ');
          `}
        </Script>
        {/* Meta Pixel Code */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '686844750859573');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=686844750859573&ev=PageView&noscript=1"
          />
        </noscript>
        {/* End Meta Pixel Code */}
      </head>
      <body suppressHydrationWarning>
        <Suspense fallback={null}>{children}</Suspense>
        <Footer />
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
