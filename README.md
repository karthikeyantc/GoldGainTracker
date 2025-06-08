# GoldenGain Tracker

This is a Next.js application designed to help users track their gold investments and plan jewellery purchases. The primary feature is a detailed gold value calculator that assists in understanding the final costs and savings associated with redeeming gold schemes for jewellery.

## Features

*   **Gold Value Calculator:**
    *   Calculates the value of accumulated gold.
    *   Determines additional gold needed for a desired jewellery weight.
    *   Provides a comprehensive invoice breakdown, including base cost, making charges, GST, and applicable discounts.
    *   Supports standard and premature redemption scenarios with adjustable discount caps.
    *   Offers a detailed summary of calculations and how the scheme discounts are applied.

## Tech Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** ShadCN UI Components, Tailwind CSS
*   **AI (Backend - currently unused):** Genkit

## Getting Started

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

## Project Structure

*   `src/app/page.tsx`: Main page component containing the calculator logic and UI.
*   `src/components/calculator/`: Components specific to the calculator feature.
*   `src/lib/`: Utility functions, constants, and formatters.
*   `src/ai/`: (Currently unused) Genkit flows for AI features.
