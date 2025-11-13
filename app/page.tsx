"use client";

import { useEffect, useState, useMemo } from "react";
import type { TireData, SpeedSymbol, Tire } from "@/lib/calc";
import {
  lookupSpeedRow,
  calcResultLoad,
  calcResultIP,
  calcDamage,
  getLimitLoad,
  calcIPByETRTO,
} from "@/lib/calc";
import { exportToExcelAdvanced } from "@/lib/excelExport";
import { exportToPDF } from "@/lib/pdfExport";

type TirePosition = {
  id: string;
  loadDistribution: number;
  tiresPerPosition: 2 | 4;
};

/**
 * The main page component for the Tire Load and Inflation Pressure Calculator.
 * This component manages the application's state, handles user input,
 * performs calculations, and renders the user interface.
 *
 * @returns {JSX.Element} The rendered React component.
 */
export default function Page() {
  const [data, setData] = useState<TireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTireIndex, setSelectedTireIndex] = useState(0);
  const [totalLoad, setTotalLoad] = useState(35);
  const [speed, setSpeed] = useState(50);
  const [positions, setPositions] = useState<TirePosition[]>([
    { id: "1", loadDistribution: 0.18, tiresPerPosition: 2 },
  ]);
  const [showSpeedTable, setShowSpeedTable] = useState(false);

  useEffect(() => {
    fetch("/tire_data.json")
      .then((res) => res.json())
      .then((json: TireData) => {
        json.tires.sort((a, b) => a["TIRE Size"].localeCompare(b["TIRE Size"]));
        setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedTire: Tire | null = useMemo(() => {
    if (!data) return null;
    return data.tires[selectedTireIndex] || null;
  }, [data, selectedTireIndex]);

  const positionResults = useMemo(() => {
    if (!data || !selectedTire) return [];

    const row = lookupSpeedRow(data, speed);
    const speedSymbol = selectedTire["Speed symbol"] as SpeedSymbol;

    return positions.map((pos) => {
      const loadPerPositionTon = totalLoad * pos.loadDistribution;
      const loadPerTire = (loadPerPositionTon / pos.tiresPerPosition) * 1000;

      const limitLoad = getLimitLoad(
        selectedTire["LOAD INDEX"],
        row,
        speedSymbol
      );
      const ipByETRTO = calcIPByETRTO(
        loadPerTire,
        selectedTire["LOAD INDEX"],
        selectedTire["STD I/P"]
      );
      const resultLoad = calcResultLoad(
        loadPerTire,
        selectedTire["LOAD INDEX"]
      );
      const resultIP = calcResultIP(ipByETRTO, selectedTire["STD I/P"]);
      const damage = calcDamage(
        loadPerTire,
        selectedTire["LOAD INDEX"],
        ipByETRTO,
        selectedTire["STD I/P"]
      );

      return {
        position: pos,
        row,
        loadPerTire,
        limitLoad,
        ipByETRTO,
        resultLoad,
        resultIP,
        damage,
      };
    });
  }, [data, selectedTire, positions, totalLoad, speed]);

  const totalTires = useMemo(() => {
    return positions.reduce((sum, pos) => sum + pos.tiresPerPosition, 0);
  }, [positions]);

  const addPosition = () => {
    const newId = (positions.length + 1).toString();
    setPositions([
      ...positions,
      { id: newId, loadDistribution: 0.13, tiresPerPosition: 2 },
    ]);
  };

  const removePosition = (id: string) => {
    setPositions(positions.filter((p) => p.id !== id));
  };

  const updatePosition = (id: string, updates: Partial<TirePosition>) => {
    setPositions(
      positions.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const exportToExcel = () => {
    if (!data || !selectedTire) return;

    exportToExcelAdvanced(
      data,
      selectedTire,
      totalLoad,
      speed,
      positions,
      positionResults
    );
    return;
  };

  const exportPDF = () => {
    if (!data || !selectedTire) return;

    exportToPDF(
      data,
      selectedTire,
      totalLoad,
      speed,
      positions,
      positionResults
    );
  };

  if (loading) return <main className="p-6">Loading data…</main>;
  if (!data || !data.tires.length)
    return <main className="p-6">Data tidak ditemukan.</main>;

  return (
    <main className="p-3 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
          Load & I/P Calculation
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowSpeedTable(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 sm:py-2 rounded-lg font-medium text-sm touch-manipulation"
          >
            📊 Speed Table
          </button>
          <button
            onClick={exportToExcel}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 sm:py-2 rounded-lg font-medium text-sm touch-manipulation"
          >
            📥 Export Excel
          </button>
          <button
            onClick={exportPDF}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 sm:py-2 rounded-lg font-medium text-sm touch-manipulation"
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* Speed Table Modal */}
      {showSpeedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-3 sm:p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-base sm:text-xl font-bold">
                Speed Table (%)
              </h2>
              <button
                onClick={() => setShowSpeedTable(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold touch-manipulation p-2"
              >
                ✕
              </button>
            </div>
            <div className="p-2 sm:p-4 overflow-auto">
              <table className="w-full border-collapse border text-[10px] sm:text-xs">
                <thead className="sticky top-0 bg-gray-100 z-10">
                  <tr className="bg-gray-100">
                    <th className="border p-1 sm:p-2" rowSpan={2}>
                      Speed
                      <br />
                      (km/h)
                    </th>
                    <th className="border p-1 sm:p-2" colSpan={6}>
                      Simbol Kecepatan
                    </th>
                    <th className="border p-1 sm:p-2" rowSpan={2}>
                      Kompensasi
                      <br />
                      Tekanan
                    </th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="border p-1 sm:p-2">F</th>
                    <th className="border p-1 sm:p-2">G</th>
                    <th className="border p-1 sm:p-2">J</th>
                    <th className="border p-1 sm:p-2">K</th>
                    <th className="border p-1 sm:p-2">L</th>
                    <th className="border p-1 sm:p-2">M</th>
                  </tr>
                </thead>
                <tbody>
                  {data.speed_table.map((row) => (
                    <tr
                      key={row.speed}
                      className="text-center hover:bg-blue-50"
                    >
                      <td className="border p-1 sm:p-2 font-semibold">
                        {row.speed}
                      </td>
                      <td className="border p-1 sm:p-2">
                        {row.F ? `${(row.F * 100).toFixed(0)}%` : ""}
                      </td>
                      <td className="border p-1 sm:p-2">
                        {row.G ? `${(row.G * 100).toFixed(0)}%` : ""}
                      </td>
                      <td className="border p-1 sm:p-2">
                        {row.J ? `${(row.J * 100).toFixed(0)}%` : ""}
                      </td>
                      <td className="border p-1 sm:p-2">
                        {row.K ? `${(row.K * 100).toFixed(0)}%` : ""}
                      </td>
                      <td className="border p-1 sm:p-2">
                        {row.L ? `${(row.L * 100).toFixed(0)}%` : ""}
                      </td>
                      <td className="border p-1 sm:p-2">
                        {row.M ? `${(row.M * 100).toFixed(0)}%` : ""}
                      </td>
                      <td className="border p-1 sm:p-2">{row.psi} Psi</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Compact Layout: Settings + Frame + Config in one view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Left Column: Settings + Frame */}
        <div className="space-y-4 sm:space-y-6">
          {/* Vehicle Settings */}
          <div className="bg-white shadow-lg rounded-xl p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold mb-3">
              Vehicle Settings
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">
                  Tire Size / Pattern
                </label>
                <select
                  className="border p-2.5 sm:p-2 rounded w-full text-sm touch-manipulation"
                  value={selectedTireIndex}
                  onChange={(e) => setSelectedTireIndex(+e.target.value)}
                >
                  {data.tires.map((tire, idx) => (
                    <option key={idx} value={idx}>
                      {tire["TIRE Size"]} - {tire["LOAD INDEX"]}kg,{" "}
                      {tire["Speed symbol"]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">
                    Total Load (Ton)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="border p-2.5 sm:p-2 rounded w-full text-sm touch-manipulation"
                    value={totalLoad}
                    onChange={(e) => setTotalLoad(+e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1.5">
                    Speed (km/h)
                  </label>
                  <input
                    type="number"
                    className="border p-2.5 sm:p-2 rounded w-full text-sm touch-manipulation"
                    value={speed}
                    onChange={(e) => setSpeed(+e.target.value)}
                  />
                </div>
              </div>

              {selectedTire && (
                <div className="p-2 bg-blue-50 rounded border border-blue-200 text-xs sm:text-sm">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <b>Load Index:</b> {selectedTire["LOAD INDEX"]} kg
                    </div>
                    <div>
                      <b>STD I/P:</b> {selectedTire["STD I/P"]} psi
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Frame */}
          <div className="bg-white shadow-lg rounded-xl p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold mb-3">
              Vehicle Frame ({totalTires} tires)
            </h2>

            <div className="border-2 border-gray-300 rounded-lg p-2 sm:p-4 bg-gray-50 overflow-x-auto">
              <div className="flex flex-col gap-2 sm:gap-3 min-w-max">
                {positions.map((pos) => (
                  <div
                    key={pos.id}
                    className="flex items-center justify-center gap-2"
                  >
                    {/* Left Wheels */}
                    <div className="flex gap-0.5">
                      {pos.tiresPerPosition === 2 ? (
                        <>
                          <div className="w-5 sm:w-6 h-8 sm:h-10 bg-gray-700 rounded border border-gray-900"></div>
                          <div className="w-5 sm:w-6 h-8 sm:h-10 bg-gray-700 rounded border border-gray-900"></div>
                        </>
                      ) : (
                        <>
                          <div className="flex gap-0.5 mr-1.5 sm:mr-2">
                            <div className="w-5 sm:w-6 h-8 sm:h-10 bg-gray-700 rounded border border-gray-900"></div>
                            <div className="w-5 sm:w-6 h-8 sm:h-10 bg-gray-700 rounded border border-gray-900"></div>
                          </div>
                          <div className="flex gap-0.5">
                            <div className="w-5 sm:w-6 h-8 sm:h-10 bg-gray-700 rounded border border-gray-900"></div>
                            <div className="w-5 sm:w-6 h-8 sm:h-10 bg-gray-700 rounded border border-gray-900"></div>
                          </div>
                        </>
                      )}
                    </div>

                    <div
                      className={`h-0.5 bg-gray-400 ${
                        pos.tiresPerPosition === 2
                          ? "w-16 sm:w-20"
                          : "w-12 sm:w-16"
                      }`}
                    ></div>

                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-500 bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-[10px] sm:text-xs font-bold text-blue-700">
                        P{pos.id}
                      </span>
                    </div>

                    <div
                      className={`h-0.5 bg-gray-400 ${
                        pos.tiresPerPosition === 2
                          ? "w-16 sm:w-20"
                          : "w-12 sm:w-16"
                      }`}
                    ></div>

                    {/* Right Wheels */}
                    <div className="flex gap-0.5">
                      {pos.tiresPerPosition === 2 ? (
                        <>
                          <div className="w-5 sm:w-6 h-8 sm:h-10 bg-gray-700 rounded border border-gray-900"></div>
                          <div className="w-5 sm:w-6 h-8 sm:h-10 bg-gray-700 rounded border border-gray-900"></div>
                        </>
                      ) : (
                        <>
                          <div className="flex gap-0.5">
                            <div className="w-5 sm:w-6 h-8 sm:h-10 bg-gray-700 rounded border border-gray-900"></div>
                            <div className="w-5 sm:w-6 h-8 sm:h-10 bg-gray-700 rounded border border-gray-900"></div>
                          </div>
                          <div className="flex gap-0.5 ml-1.5 sm:ml-2">
                            <div className="w-5 sm:w-6 h-8 sm:h-10 bg-gray-700 rounded border border-gray-900"></div>
                            <div className="w-5 sm:w-6 h-8 sm:h-10 bg-gray-700 rounded border border-gray-900"></div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 sm:mt-4 text-center">
                <button
                  onClick={addPosition}
                  className="bg-blue-500 text-white px-4 py-2 sm:py-1.5 rounded hover:bg-blue-600 text-sm sm:text-xs touch-manipulation"
                >
                  + Add Axle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Position Cards */}
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-white shadow-lg rounded-xl p-3 sm:p-4">
            <h2 className="text-base sm:text-lg font-semibold mb-3">
              Position Configuration
            </h2>

            <div className="space-y-3 max-h-[500px] sm:max-h-[600px] overflow-y-auto pr-1 sm:pr-2">
              {positions.map((pos, idx) => {
                const result = positionResults[idx];
                return (
                  <div
                    key={pos.id}
                    className="border rounded-lg p-2.5 sm:p-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-blue-600 text-sm sm:text-base">
                        Position {pos.id}
                      </h3>
                      <div className="flex gap-1.5 sm:gap-2 items-center">
                        <button
                          onClick={() =>
                            updatePosition(pos.id, {
                              tiresPerPosition:
                                pos.tiresPerPosition === 2 ? 4 : 2,
                            })
                          }
                          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded touch-manipulation"
                        >
                          {pos.tiresPerPosition === 2 ? "Single" : "Tandem"}
                        </button>
                        {positions.length > 1 && (
                          <button
                            onClick={() => removePosition(pos.id)}
                            className="text-red-500 hover:text-red-700 text-lg sm:text-sm touch-manipulation p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-xs text-gray-600">
                          Load Dist.
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          className="border p-2 sm:p-1 rounded w-full text-sm touch-manipulation"
                          value={pos.loadDistribution}
                          onChange={(e) =>
                            updatePosition(pos.id, {
                              loadDistribution: +e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Tires</label>
                        <select
                          className="border p-2 sm:p-1 rounded w-full text-sm touch-manipulation"
                          value={pos.tiresPerPosition}
                          onChange={(e) =>
                            updatePosition(pos.id, {
                              tiresPerPosition: +e.target.value as 2 | 4,
                            })
                          }
                        >
                          <option value="2">2 (Single)</option>
                          <option value="4">4 (Tandem)</option>
                        </select>
                      </div>
                    </div>

                    {result && (
                      <div className="grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-1.5 text-[11px] sm:text-xs border-t pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Load/Tire:</span>
                          <span className="font-bold">
                            {result.loadPerTire.toFixed(0)} kg
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">I/P:</span>
                          <span className="font-bold">
                            {result.ipByETRTO.toFixed(1)} psi
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Load Status:</span>
                          <span
                            className={`font-bold ${
                              result.resultLoad === "OK"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {result.resultLoad}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">I/P Status:</span>
                          <span
                            className={`font-bold ${
                              result.resultIP === "OK"
                                ? "text-green-600"
                                : "text-orange-600"
                            }`}
                          >
                            {result.resultIP === "OK" ? "OK" : "CONSULT"}
                          </span>
                        </div>
                        <div className="flex justify-between col-span-2 pt-1 border-t">
                          <span className="text-gray-600">Damage:</span>
                          <span>
                            Load:{" "}
                            <b
                              className={
                                result.damage.load === "OK"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {result.damage.load}
                            </b>
                            {" | "}
                            I/P:{" "}
                            <b
                              className={
                                result.damage.ip === "OK"
                                  ? "text-green-600"
                                  : "text-orange-600"
                              }
                            >
                              {result.damage.ip}
                            </b>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      {positionResults.length > 0 && (
        <div className="bg-white shadow-lg rounded-xl p-3 sm:p-4">
          <h2 className="text-base sm:text-lg font-semibold mb-3">Summary</h2>

          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <table className="w-full border text-[10px] sm:text-xs min-w-max">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="border p-1 sm:p-2">Pos</th>
                  <th className="border p-1 sm:p-2">Tires</th>
                  <th className="border p-1 sm:p-2">Dist.</th>
                  <th className="border p-1 sm:p-2">Load/Tire</th>
                  <th className="border p-1 sm:p-2">I/P (psi)</th>
                  <th className="border p-1 sm:p-2">Result Load</th>
                  <th className="border p-1 sm:p-2">Result I/P</th>
                  <th className="border p-1 sm:p-2">Dmg Load</th>
                  <th className="border p-1 sm:p-2">Dmg I/P</th>
                </tr>
              </thead>
              <tbody>
                {positionResults.map((result) => (
                  <tr key={result.position.id} className="text-center">
                    <td className="border p-1 sm:p-2">{result.position.id}</td>
                    <td className="border p-1 sm:p-2">
                      {result.position.tiresPerPosition === 2 ? "4" : "8"}
                    </td>
                    <td className="border p-1 sm:p-2">
                      {(result.position.loadDistribution * 100).toFixed(0)}%
                    </td>
                    <td className="border p-1 sm:p-2">
                      {result.loadPerTire.toFixed(0)}
                    </td>
                    <td className="border p-1 sm:p-2">
                      {result.ipByETRTO.toFixed(1)}
                    </td>
                    <td
                      className={`border p-1 sm:p-2 font-semibold ${
                        result.resultLoad === "OK"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {result.resultLoad}
                    </td>
                    <td
                      className={`border p-1 sm:p-2 font-semibold ${
                        result.resultIP === "OK"
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {result.resultIP === "OK" ? "OK" : "CONSULT"}
                    </td>
                    <td className="border p-1 sm:p-2">{result.damage.load}</td>
                    <td className="border p-1 sm:p-2">{result.damage.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
