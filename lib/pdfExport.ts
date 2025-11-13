import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
 * Generates and downloads a PDF document with a detailed tire load and inflation pressure analysis.
 * The PDF includes vehicle and tire information, a visual representation of the vehicle frame,
 * a table of position-specific calculations, and a speed variation table.
 * It uses jsPDF and jspdf-autotable to construct the document.
 *
 * @param {TireData} data - The complete tire dataset, including the speed table.
 * @param {Tire} selectedTire - The specific tire model selected for the calculation.
 * @param {number} totalLoad - The total vehicle load in tons.
 * @param {number} speed - The average vehicle speed in km/h.
 * @param {TirePosition[]} positions - An array of vehicle axle positions and their configurations.
 * @param {PositionResult[]} positionResults - An array of calculation results for each position.
 * @returns {void} This function does not return a value; it triggers a file download.
 */
export function exportToPDF(
  data: TireData,
  selectedTire: Tire,
  totalLoad: number,
  speed: number,
  positions: TirePosition[],
  positionResults: PositionResult[]
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Load & I/P Calculation", pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // Vehicle Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Vehicle Information", 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Load: ${totalLoad} Ton`, 14, yPos);
  yPos += 6;
  doc.text(`Speed: ${speed} km/h`, 14, yPos);
  yPos += 10;

  // Tire Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Tire Information", 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Tire Size / Pattern: ${selectedTire["TIRE Size"]}`, 14, yPos);
  yPos += 6;
  doc.text(`Load Index: ${selectedTire["LOAD INDEX"]} Kg`, 14, yPos);
  yPos += 6;
  doc.text(`STD I/P: ${selectedTire["STD I/P"]} Psi`, 14, yPos);
  yPos += 6;
  doc.text(`Speed Symbol: ${selectedTire["Speed symbol"]}`, 14, yPos);
  yPos += 10;

  // Vehicle Frame Visualization
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Vehicle Frame (${positions.length} positions)`, 14, yPos);
  yPos += 8;

  // Draw frame for each position
  const frameStartX = 25;
  const frameStartY = yPos;
  const wheelWidth = 4;
  const wheelHeight = 8;
  const wheelGap = 1;
  const tandemSetGap = 4;
  const positionSpacing = 16;
  const badgeRadius = 4;
  
  // Calculate fixed positions for alignment
  const maxLeftWheelsWidth = wheelWidth * 4 + wheelGap + tandemSetGap; // Tandem width
  const centerX = frameStartX + maxLeftWheelsWidth + 8; // Fixed center position
  const rightWheelsStartX = centerX + 8; // Fixed right wheels start

  positions.forEach((pos, idx) => {
    const currentY = frameStartY + idx * positionSpacing;
    const wheelCenterY = currentY + wheelHeight / 2;
    
    // Left wheels - aligned to right edge
    doc.setFillColor(60, 60, 60);
    if (pos.tiresPerPosition === 2) {
      // Single axle - 2 wheels (align right)
      const singleStartX = centerX - 8 - (wheelWidth * 2 + wheelGap);
      doc.rect(singleStartX, currentY, wheelWidth, wheelHeight, "F");
      doc.rect(singleStartX + wheelWidth + wheelGap, currentY, wheelWidth, wheelHeight, "F");
      
      // Left axle line
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.line(singleStartX + wheelWidth * 2 + wheelGap + 1, wheelCenterY, centerX - badgeRadius - 1, wheelCenterY);
    } else {
      // Tandem axle - 4 wheels (full width)
      const tandemStartX = frameStartX;
      doc.rect(tandemStartX, currentY, wheelWidth, wheelHeight, "F");
      doc.rect(tandemStartX + wheelWidth + wheelGap, currentY, wheelWidth, wheelHeight, "F");
      doc.rect(tandemStartX + wheelWidth * 2 + wheelGap + tandemSetGap, currentY, wheelWidth, wheelHeight, "F");
      doc.rect(tandemStartX + wheelWidth * 3 + wheelGap + tandemSetGap, currentY, wheelWidth, wheelHeight, "F");
      
      // Left axle line
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.line(tandemStartX + maxLeftWheelsWidth + 1, wheelCenterY, centerX - badgeRadius - 1, wheelCenterY);
    }

    // Position badge (fixed center)
    doc.setFillColor(66, 139, 202);
    doc.circle(centerX, wheelCenterY, badgeRadius, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`P${pos.id}`, centerX, wheelCenterY + 1, { align: "center" });
    doc.setTextColor(0, 0, 0);

    // Right wheels - aligned to left edge
    doc.setFillColor(60, 60, 60);
    if (pos.tiresPerPosition === 2) {
      // Single axle - 2 wheels
      doc.rect(rightWheelsStartX, currentY, wheelWidth, wheelHeight, "F");
      doc.rect(rightWheelsStartX + wheelWidth + wheelGap, currentY, wheelWidth, wheelHeight, "F");
      
      // Right axle line
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.line(centerX + badgeRadius + 1, wheelCenterY, rightWheelsStartX - 1, wheelCenterY);
    } else {
      // Tandem axle - 4 wheels
      doc.rect(rightWheelsStartX, currentY, wheelWidth, wheelHeight, "F");
      doc.rect(rightWheelsStartX + wheelWidth + wheelGap, currentY, wheelWidth, wheelHeight, "F");
      doc.rect(rightWheelsStartX + wheelWidth * 2 + wheelGap + tandemSetGap, currentY, wheelWidth, wheelHeight, "F");
      doc.rect(rightWheelsStartX + wheelWidth * 3 + wheelGap + tandemSetGap, currentY, wheelWidth, wheelHeight, "F");
      
      // Right axle line
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.line(centerX + badgeRadius + 1, wheelCenterY, rightWheelsStartX - 1, wheelCenterY);
    }

    // Position info text (fixed position)
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const textX = rightWheelsStartX + maxLeftWheelsWidth + 5;
    doc.text(
      `${(pos.loadDistribution * 100).toFixed(0)}% - ${pos.tiresPerPosition === 2 ? "Single" : "Tandem"}`,
      textX,
      wheelCenterY + 1
    );
  });

  yPos = frameStartY + positions.length * positionSpacing + 10;

  // Position Results Table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Position Calculations", 14, yPos);
  yPos += 5;

  const positionData = positionResults.map((result) => [
    `Position ${result.position.id}`,
    `${(result.position.loadDistribution * 100).toFixed(0)}%`,
    `${result.loadPerTire.toFixed(2)} Kg`,
    `${result.ipByETRTO.toFixed(1)} Psi`,
    result.resultLoad,
    result.resultIP === "OK" ? "OK" : "CONSULT TO BS",
    result.damage.load,
    result.damage.ip,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [
      [
        "Position",
        "Load Dist.",
        "Load/Tire",
        "I/P by ETRTO",
        "Result Load",
        "Result I/P",
        "Dmg Load",
        "Dmg I/P",
      ],
    ],
    body: positionData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 20 },
      2: { cellWidth: 22 },
      3: { cellWidth: 25 },
      4: { cellWidth: 22 },
      5: { cellWidth: 25 },
      6: { cellWidth: 20 },
      7: { cellWidth: 20 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 4) {
        if (data.cell.text[0] === "Over Load") {
          data.cell.styles.textColor = [255, 0, 0];
          data.cell.styles.fontStyle = "bold";
        } else if (data.cell.text[0] === "OK") {
          data.cell.styles.textColor = [0, 128, 0];
          data.cell.styles.fontStyle = "bold";
        }
      }
      if (data.section === "body" && data.column.index === 5) {
        if (data.cell.text[0] === "CONSULT TO BS") {
          data.cell.styles.textColor = [255, 140, 0];
          data.cell.styles.fontStyle = "bold";
        } else if (data.cell.text[0] === "OK") {
          data.cell.styles.textColor = [0, 128, 0];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // @ts-expect-error autoTable extends jsPDF
  yPos = doc.lastAutoTable.finalY + 15;

  // Speed Table
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Variasi Kapasitas Pembebanan (%)", 14, yPos);
  yPos += 5;

  const speedData = data.speed_table.map((row) => [
    row.speed.toString(),
    row.F ? `${(row.F * 100).toFixed(0)}%` : "",
    row.G ? `${(row.G * 100).toFixed(0)}%` : "",
    row.J ? `${(row.J * 100).toFixed(0)}%` : "",
    row.K ? `${(row.K * 100).toFixed(0)}%` : "",
    row.L ? `${(row.L * 100).toFixed(0)}%` : "",
    row.M ? `${(row.M * 100).toFixed(0)}%` : "",
    `${row.psi} Psi`,
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["Speed (km/h)", "F", "G", "J", "K", "L", "M", "Kompensasi Tekanan"]],
    body: speedData,
    styles: { fontSize: 7, cellPadding: 1.5, halign: "center" },
    headStyles: { fillColor: [100, 100, 100], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 20, fontStyle: "bold" },
    },
    didParseCell: (data) => {
      // Highlight current speed row
      if (data.section === "body" && data.row.index < data.table.body.length) {
        const rowSpeed = parseInt(speedData[data.row.index][0]);
        if (rowSpeed === speed) {
          data.cell.styles.fillColor = [255, 230, 230];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Generate filename
  const tireSizeClean = selectedTire["TIRE Size"].replace(/[\/\\]/g, "-");
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `Load_IP_Calc_${tireSizeClean}_${dateStr}.pdf`;

  doc.save(filename);
}
