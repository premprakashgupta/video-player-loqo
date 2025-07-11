# Project Summary: LOQO AI

This is a Next.js web application bootstrapped with `create-next-app`.

## Core Technologies

*   **Framework:** [Next.js](https://nextjs.org/) 15.3.4 (with Turbopack for development)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Library:** [React](https://react.dev/) 19
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) 4
*   **UI Components:** [Shadcn/UI](https://ui.shadcn.com/) (indicated by `@radix-ui` dependencies and component structure)

## Key Features & Purpose

Based on the file structure and code, this project appears to be a **video streaming platform** with a focus on multilingual content and user engagement.

*   **Video Playback:** The application uses `hls.js` and a custom `HLSPlayer` component to stream video content. This suggests a focus on adaptive bitrate streaming for a smooth user experience.
*   **Content Management:** The `lib/content-manager.ts` and `lib/content-data.ts` files indicate a system for managing a library of video content, likely organized into series and episodes.
*   **Multilingual Support:** A significant feature is the ability to switch between languages (`hindi`, `english`, etc.). The UI and content adapt based on the selected language.
*   **User Interface:**
    *   The main page (`app/page.tsx`) features a primary video player and multiple `ContentCarousel` components to browse other content.
    *   The UI is designed to be responsive (`isMobile` checks) and includes modern components.
*   **Analytics & Tracking:** The application integrates analytics (`lib/analytics.ts`) to track user behavior such as:
    *   Page views
    *   Content selection
    *   Scroll depth
*   **Ad Integration:** The presence of `hooks/useAdManager.ts` and `lib/ad-manager.ts` suggests that the platform is designed to serve advertisements.

## Project Structure

The project follows a modern Next.js App Router structure:

*   `app/`: Contains the main application pages (`page.tsx`).
*   `components/`: Reusable React components. This includes both high-level components like `HLSPlayer` and `ContentCarousel`, and a `ui/` subdirectory for base components (likely from Shadcn/UI).
*   `hooks/`: Custom React hooks, such as `useAdManager`.
*   `lib/`: Core business logic, utilities, and data management modules.
*   `public/`: Static assets like images and SVGs.
*   `@types/`: TypeScript type definitions.

## How to Run

1.  Install dependencies: `npm install`
2.  Run the development server: `npm run dev`
3.  Open [http://localhost:3000](http://localhost:3000) in a browser.
