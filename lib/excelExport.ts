// Use xlsx-js-style for cell styling support (fills, fonts, borders, merges)
import * as XLSX from "xlsx-js-style";
import type { Tire, TireData } from "./calc";

type TirePosition = {
  id: string;
  loadDistribution: number;
  tiresPerPosition: 2 | 4;
};

type PositionResult = {
  position: TirePosition;
  row: { speed: number; psi: number; [key: string]: number };
  loadPerTire: number;
  limitLoad: number;
  ipByETRTO: number;
  resultLoad: string;
  resultIP: string;
  damage: { load: string; ip: string };
};

/**
 * Generates and downloads an Excel spreadsheet with a detailed tire load and inflation pressure analysis.
 * The spreadsheet includes vehicle settings, position-specific calculations, tire information,
 * results, damage analysis, a speed variation table, and a summary table.
 * It uses the 'xlsx-js-style' library to apply formatting and styling.
 *
 * @param {TireData} data - The complete tire dataset, including the speed table.
 * @param {Tire} selectedTire - The specific tire model selected for the calculation.
 * @param {number} totalLoad - The total vehicle load in tons.
 * @param {number} speed - The average vehicle speed in km/h.
 * @param {TirePosition[]} positions - An array of vehicle axle positions and their configurations.
 * @param {PositionResult[]} positionResults - An array of calculation results for each position.
 * @returns {void} This function does not return a value; it triggers a file download.
 */
export function exportToExcelAdvanced(
  data: TireData,
  selectedTire: Tire,
  totalLoad: number,
  speed: number,
  positions: TirePosition[],
  positionResults: PositionResult[]
) {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};

  // Helper function to set cell
  const setCell = (
    ref: string,
    value: string | number,
    style?: {
      fill?: { fgColor: { rgb: string } };
      font?: { bold?: boolean; color?: { rgb: string } };
      alignment?: { horizontal?: string; vertical?: string };
      border?: Record<string, unknown>;
    }
  ) => {
    ws[ref] = {
      v: value,
      t: typeof value === "number" ? "n" : "s",
      s: style,
    };
  };

  const fmtPct = (val: number | null | undefined) =>
    val === null || val === undefined ? "" : `${(val * 100).toFixed(0)}%`;
  const fmtPsi = (val: number) => `${val.toFixed(1)} Psi`;
  const borderThin = {
    top: { style: "thin", color: { rgb: "999999" } },
    bottom: { style: "thin", color: { rgb: "999999" } },
    left: { style: "thin", color: { rgb: "999999" } },
    right: { style: "thin", color: { rgb: "999999" } },
  } as const;
  const headerFill = { fgColor: { rgb: "EDEDED" } } as const;
  const center = { horizontal: "center", vertical: "center" } as const;
  const right = { horizontal: "right", vertical: "center" } as const;

  // ===== TITLE =====
  // Title merged across A..I
  setCell("A1", "Load & I/P Calculation", {
    font: { bold: true },
    alignment: center,
  });
  ws["!merges"] = ws["!merges"] || [];
  ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } });

  // ===== TOTAL LOAD =====
  setCell("B3", "Total Load", { font: { bold: true } });
  setCell("C3", totalLoad, { alignment: right });
  setCell("D3", "Ton", { alignment: right });

  // ===== POSITION CALCULATIONS =====
  let row = 5;
  setCell(`B${row}`, "Load Distribution", { font: { bold: true }, fill: headerFill, border: borderThin, alignment: center });
  setCell(`C${row}`, "Load/Tire", { font: { bold: true }, fill: headerFill, border: borderThin, alignment: center });
  setCell(`D${row}`, "I/P by ETRTO", { font: { bold: true }, fill: headerFill, border: borderThin, alignment: center });
  row++;

  positionResults.forEach((result) => {
    const dist = (result.position.loadDistribution * 100).toFixed(0) + "%";
    setCell(`B${row}`, dist, { fill: { fgColor: { rgb: "0099FF" } }, border: borderThin, alignment: center });
    setCell(`C${row}`, result.loadPerTire.toFixed(0) + " Kg", { border: borderThin, alignment: right });
    setCell(`D${row}`, result.ipByETRTO.toFixed(1) + " Psi", { border: borderThin, alignment: right });
    row++;
  });

  // ===== TIRE INFO SECTION =====
  row += 2;
  const tireInfoRow = row;

  setCell(`E${row}`, "Tire size / Pattern:", { font: { bold: true } });
  setCell(`F${row}`, selectedTire["TIRE Size"], { fill: { fgColor: { rgb: "CDEFFF" } }, border: borderThin });
  setCell(`H${row}`, "Speed Symbol", { font: { bold: true } });
  row++;

  setCell(`E${row}`, "Load Index:", { font: { bold: true } });
  setCell(`F${row}`, selectedTire["LOAD INDEX"] + " Kg", { fill: { fgColor: { rgb: "CDEFFF" } }, border: borderThin });
  setCell(`H${row}`, selectedTire["Speed symbol"], { fill: { fgColor: { rgb: "FFF2B3" } }, border: borderThin, alignment: center });
  row++;

  setCell(`E${row}`, "Ave. Speed:", { font: { bold: true } });
  setCell(`F${row}`, speed + " Km/h", { fill: { fgColor: { rgb: "CDEFFF" } }, border: borderThin });
  row++;

  setCell(`E${row}`, "STD I/P:", { font: { bold: true } });
  setCell(`F${row}`, fmtPsi(selectedTire["STD I/P"]), { border: borderThin });
  row++;

  setCell(`E${row}`, "Result I/P", { font: { bold: true } });
  const overallResultIP = positionResults.some((r) => r.resultIP !== "OK")
    ? "CONSULT TO BS"
    : "OK";
  setCell(`F${row}`, overallResultIP, { fill: { fgColor: { rgb: overallResultIP === "OK" ? "B7E1CD" : "FFF2B3" } }, border: borderThin, alignment: center });

  // ===== RESULTS SECTION =====
  row = tireInfoRow;
  setCell(`I${row}`, "Result Load", { font: { bold: true }, fill: headerFill, border: borderThin, alignment: center });
  setCell(`J${row}`, "Result I/P", { font: { bold: true }, fill: headerFill, border: borderThin, alignment: center });
  row++;

  positionResults.forEach((result) => {
    setCell(`I${row}`, result.resultLoad, { fill: { fgColor: { rgb: result.resultLoad === "OK" ? "B7E1CD" : "FFC1C1" } }, border: borderThin, alignment: center });
    setCell(
      `J${row}`,
      result.resultIP === "OK" ? "OK" : "CONSULT TO BS",
      { fill: { fgColor: { rgb: result.resultIP === "OK" ? "B7E1CD" : "FFF2B3" } }, border: borderThin, alignment: center }
    );
    row++;
  });

  row += 2;
  setCell(`I${row}`, "Possibility Tire Damage by :", { font: { bold: true } });
  row++;
  setCell(`J${row}`, "I/P", { font: { bold: true }, fill: headerFill, border: borderThin, alignment: center });
  setCell(`K${row}`, "Load", { font: { bold: true }, fill: headerFill, border: borderThin, alignment: center });
  row++;

  positionResults.forEach((result) => {
    const ipPercent = result.damage.ip === "OK" ? "OK" : result.damage.ip;
    const loadPercent = result.damage.load === "OK" ? "OK" : result.damage.load;
    setCell(`I${row}`, result.resultIP === "OK" ? "OK" : result.resultIP, { border: borderThin, alignment: center, fill: { fgColor: { rgb: result.resultIP === "OK" ? "B7E1CD" : "FFFFFF" } } });
    setCell(`J${row}`, ipPercent, { border: borderThin, alignment: center, fill: { fgColor: { rgb: ipPercent === "OK" ? "B7E1CD" : "FFFFFF" } } });
    setCell(`K${row}`, loadPercent, { border: borderThin, alignment: center, fill: { fgColor: { rgb: loadPercent === "OK" ? "B7E1CD" : "FFFFFF" } } });
    row++;
  });

  // ===== SPEED TABLE (Right side) =====
  const speedTableStartCol = 13; // Column N
  let speedRow = 1;

  // Title
  ws[XLSX.utils.encode_cell({ r: speedRow, c: speedTableStartCol })] = {
    v: "Variasi Kapasitas Pembebanan (%)",
    t: "s",
    s: { font: { bold: true } },
  };

  speedRow += 2;

  // Headers
  const headers = ["Speed (km/h)", "F", "G", "J", "K", "L", "M", "Kompensasi Tekanan"];
  headers.forEach((header, idx) => {
    ws[XLSX.utils.encode_cell({ r: speedRow, c: speedTableStartCol + idx })] = {
      v: header,
      t: "s",
      s: { font: { bold: true }, fill: headerFill, alignment: center, border: borderThin },
    };
  });

  // Merge "Simbol Kecepatan" header across F..M columns (O..T)
  ws["!merges"] = ws["!merges"] || [];
  ws["!merges"].push({
    s: { r: speedRow - 1, c: speedTableStartCol + 1 }, // row above headers
    e: { r: speedRow - 1, c: speedTableStartCol + 6 },
  });

  speedRow++;

  // Speed table data
  data.speed_table.forEach((speedRowData) => {
    const isActive = speedRowData.speed === speed;
    ws[XLSX.utils.encode_cell({ r: speedRow, c: speedTableStartCol })] = {
      v: speedRowData.speed,
      t: "n",
      s: isActive ? { fill: { fgColor: { rgb: "FF9999" } }, font: { bold: true } } : undefined,
    };

    const cols = [
      speedRowData.F,
      speedRowData.G,
      speedRowData.J,
      speedRowData.K,
      speedRowData.L,
      speedRowData.M,
    ];
    cols.forEach((val, idx) => {
      if (val !== null && val !== undefined) {
        ws[XLSX.utils.encode_cell({ r: speedRow, c: speedTableStartCol + 1 + idx })] = {
          v: fmtPct(val),
          t: "s",
          s: { alignment: center, border: borderThin, ...(isActive ? { fill: { fgColor: { rgb: "FFEEEE" } } } : {}) },
        };
      }
    });

    ws[XLSX.utils.encode_cell({ r: speedRow, c: speedTableStartCol + 7 })] = {
      v: fmtPsi(speedRowData.psi),
      t: "s",
      s: { alignment: right, border: borderThin, ...(isActive ? { fill: { fgColor: { rgb: "FFEEEE" } } } : {}) },
    };

    speedRow++;
  });

  // ===== SUMMARY TABLE (Bottom) =====
  row = Math.max(speedRow, row) + 3;

  const summaryHeaders = [
    "Position",
    "Load Distribution",
    "Load/Tire",
    "I/P by ETRTO",
    "Result Load",
    "Result I/P",
    "Damage Load",
    "Damage I/P",
  ];

  summaryHeaders.forEach((header, idx) => {
    setCell(`${String.fromCharCode(66 + idx)}${row}`, header, { font: { bold: true }, fill: headerFill, border: borderThin, alignment: center });
  });
  row++;

  positionResults.forEach((result) => {
    setCell(`B${row}`, `Position ${result.position.id}`, { border: borderThin });
    setCell(`C${row}`, (result.position.loadDistribution * 100).toFixed(0) + "%", { alignment: center, border: borderThin });
    setCell(`D${row}`, result.loadPerTire.toFixed(2) + " Kg", { alignment: right, border: borderThin });
    setCell(`E${row}`, fmtPsi(result.ipByETRTO), { alignment: right, border: borderThin });
    setCell(`F${row}`, result.resultLoad, { alignment: center, border: borderThin });
    setCell(`G${row}`, result.resultIP, { alignment: center, border: borderThin });
    setCell(`H${row}`, result.damage.load, { alignment: center, border: borderThin });
    setCell(`I${row}`, result.damage.ip, { alignment: center, border: borderThin });
    row++;
  });

  // Set column widths
  ws["!cols"] = [
    { wch: 3 }, // A
    { wch: 18 }, // B
    { wch: 12 }, // C
    { wch: 12 }, // D
    { wch: 20 }, // E
    { wch: 18 }, // F
    { wch: 5 }, // G
    { wch: 15 }, // H
    { wch: 15 }, // I
    { wch: 12 }, // J
    { wch: 12 }, // K
    { wch: 3 }, // L
    { wch: 3 }, // M
    { wch: 12 }, // N
    { wch: 8 }, // O
    { wch: 8 }, // P
    { wch: 8 }, // Q
    { wch: 8 }, // R
    { wch: 8 }, // S
    { wch: 8 }, // T
    { wch: 20 }, // U
  ];

  // Set worksheet range
  const range: { s: { r: number; c: number }; e: { r: number; c: number } } = {
    s: { r: 0, c: 0 },
    e: { r: Math.max(row, speedRow) + 5, c: 20 },
  };
  ws["!ref"] = XLSX.utils.encode_range(range as unknown as XLSX.Range);

  XLSX.utils.book_append_sheet(wb, ws, "Calculation");

  // Generate filename
  const tireSizeClean = selectedTire["TIRE Size"].replace(/[\/\\]/g, "-");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `Load_IP_Calc_${tireSizeClean}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}
