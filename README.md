# Tire Load & Inflation Pressure Calculator

This is a web application designed to calculate the appropriate tire inflation pressure based on vehicle load, speed, and tire specifications. It helps ensure tire safety and performance by providing recommendations based on ETRTO (European Tyre and Rim Technical Organisation) standards.

## Features

-   **Tire Selection**: Choose from a predefined list of tire sizes and patterns.
-   **Vehicle Configuration**: Set the total vehicle load and average speed.
-   **Axle Configuration**: Add, remove, and configure multiple vehicle axles (positions) with single or tandem tire setups.
-   **Load Distribution**: Specify the percentage of the total load distributed to each axle.
-   **Dynamic Calculations**: Instantly see the calculated load per tire and the required inflation pressure.
-   **Safety Checks**: The app flags conditions of "Over Load" or "CONSULT TO BS" if the calculated values exceed safety limits.
-   **Damage Assessment**: Provides a percentage indicator for potential tire damage from overloading or over-inflation.
-   **Data Export**: Export the complete analysis to both Excel (`.xlsx`) and PDF formats.
-   **Interactive Speed Table**: View a reference table for load capacity variations at different speeds.

## Getting Started

This is a [Next.js](https://nextjs.org/) project. To get a local copy up and running, follow these simple steps.

### Prerequisites

You need to have Node.js and a package manager (like npm, yarn, or pnpm) installed on your machine.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    ```
2.  Navigate to the project directory:
    ```bash
    cd your-repo-name
    ```
3.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Development Server

Once the dependencies are installed, you can run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application. The page will auto-update as you edit the source files.

## How to Use the Calculator

1.  **Select a Tire**: Choose a tire size/pattern from the dropdown menu. The tire's Load Index and Standard I/P will be displayed.
2.  **Set Vehicle Parameters**:
    -   Enter the **Total Load** of the vehicle in tons.
    -   Enter the average **Speed** in km/h.
3.  **Configure Vehicle Frame**:
    -   The application starts with a single axle ("Position 1").
    -   Click **+ Add Axle** to add more positions to the vehicle frame.
    -   For each position, you can:
        -   Adjust the **Load Distribution** percentage.
        -   Switch between **Single** (2 tires per axle) and **Tandem** (4 tires per axle) configurations.
        -   Remove an axle by clicking the **✕** button.
4.  **Review Results**:
    -   The **Position Configuration** cards show the calculated `Load/Tire`, required `I/P`, and the status for both.
    -   The **Summary** table at the bottom provides a complete overview of all positions.
5.  **Export Data**:
    -   Click **Export Excel** to download a styled `.xlsx` file.
    -   Click **Export PDF** to download a formatted `.pdf` document.
    -   Click **Speed Table** to view the load variation data.

## Project Structure

-   `app/`: Contains the main Next.js pages and layouts.
    -   `page.tsx`: The main component that renders the calculator interface.
    -   `layout.tsx`: The root layout for the application.
    -   `globals.css`: Global styles for the application.
-   `lib/`: Contains the core logic for calculations and data exports.
    -   `calc.ts`: Functions for calculating load, inflation pressure, and damage.
    -   `excelExport.ts`: Logic for generating the Excel file.
    -   `pdfExport.ts`: Logic for generating the PDF file.
-   `public/`: Static assets.
    -   `tire_data.json`: The raw data for tire specifications and speed tables.

## Built With

-   [Next.js](https://nextjs.org/) - The React framework for production.
-   [Tailwind CSS](https://tailwindcss.com/) - For styling the user interface.
-   [jsPDF](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jspdf-autotable) - For PDF generation.
-   [xlsx-js-style](https://github.com/gitbrent/xlsx-js-style) - For Excel generation with cell styling.
