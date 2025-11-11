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

type TirePosition = {
  id: string;
  loadDistribution: number;
  tiresPerPosition: 2 | 4;
};

export default function Page() {
  const [data, setData] = useState<TireData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTireIndex, setSelectedTireIndex] = useState(0);
  const [totalLoad, setTotalLoad] = useState(50);
  const [speed, setSpeed] = useState(30);
  const [positions, setPositions] = useState<TirePosition[]>([
    { id: "1", loadDistribution: 0.13, tiresPerPosition: 2 },
  ]);

  useEffect(() => {
    fetch("/tire_data.json")
      .then((res) => res.json())
      .then((json: TireData) => {
        // Sort tires by name
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
      // Load per Position (Ton)
      const loadPerPositionTon = totalLoad * pos.loadDistribution;
      
      // Load per Tire (kg)
      const loadPerTire = (loadPerPositionTon / pos.tiresPerPosition) * 1000;
      
      // Number of Tires at this position
      const numTires = pos.tiresPerPosition;
      
      // Limit Load
      const limitLoad = getLimitLoad(
        selectedTire["LOAD INDEX"],
        row,
        speedSymbol
      );

      // I/P by ETRTO
      const ipByETRTO = calcIPByETRTO(
        loadPerTire,
        selectedTire["LOAD INDEX"],
        selectedTire["STD I/P"]
      );
      
      // Result Load & IP
      const resultLoad = calcResultLoad(loadPerTire, selectedTire["LOAD INDEX"]);
      const resultIP = calcResultIP(ipByETRTO, selectedTire["STD I/P"]);
      
      // Damage
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
        numTires,
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

  if (loading) return <main className="p-6">Loading data…</main>;
  if (!data || !data.tires.length)
    return <main className="p-6">Data tidak ditemukan.</main>;

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Load & I/P Calculation</h1>

      {/* Input Section */}
      <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Input Parameters</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Tire Size / Pattern
            </label>
            <select
              className="border p-2 rounded w-full"
              value={input.tireIndex}
              onChange={(e) =>
                setInput({ ...input, tireIndex: +e.target.value })
              }
            >
              {data.tires.map((tire, idx) => (
                <option key={idx} value={idx}>
                  {tire["TIRE Size"]} - Load: {tire["LOAD INDEX"]} kg, I/P:{" "}
                  {tire["STD I/P"]} psi, Symbol: {tire["Speed symbol"]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Total Load (Ton)
            </label>
            <input
              type="number"
              step="0.1"
              className="border p-2 rounded w-full"
              value={input.totalLoad}
              onChange={(e) =>
                setInput({ ...input, totalLoad: +e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Load Distribution (per tire ratio)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              className="border p-2 rounded w-full"
              value={input.loadDistribution}
              onChange={(e) =>
                setInput({ ...input, loadDistribution: +e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Contoh: 0.13 = 13% | 0.18 = 18% | 0.42 = 42%
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tires per Position
            </label>
            <select
              className="border p-2 rounded w-full"
              value={input.tiresPerPosition}
              onChange={(e) =>
                setInput({ ...input, tiresPerPosition: +e.target.value })
              }
            >
              <option value={2}>2 (Single Axle - Dual Tires)</option>
              <option value={4}>4 (Tandem Axle - Dual Tires)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              2 ban untuk single axle, 4 ban untuk tandem axle
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Average Speed (km/h)
            </label>
            <input
              type="number"
              className="border p-2 rounded w-full"
              value={input.speed}
              onChange={(e) => setInput({ ...input, speed: +e.target.value })}
            />
          </div>
        </div>

        {selectedTire && (
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <h3 className="text-sm font-semibold mb-2">Selected Tire Info:</h3>
            <div className="text-sm grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>
                <span className="font-medium">Load Index:</span>{" "}
                {selectedTire["LOAD INDEX"]} kg
              </div>
              <div>
                <span className="font-medium">STD I/P:</span>{" "}
                {selectedTire["STD I/P"]} psi
              </div>
              <div>
                <span className="font-medium">Speed Symbol:</span>{" "}
                {selectedTire["Speed symbol"]}
              </div>
              <div>
                <span className="font-medium">Tire Size:</span>{" "}
                {selectedTire["TIRE Size"]}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && selectedTire && (
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Calculation Results</h2>

          {/* Calculated Values */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Number of Tires</div>
              <div className="text-2xl font-bold">
                {result.numTires.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Load per Tire</div>
              <div className="text-2xl font-bold">
                {result.loadPerTire.toFixed(1)} kg
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ({input.totalLoad} × {input.loadDistribution} ÷ {input.tiresPerPosition} × 1000)
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Speed (from table)</div>
              <div className="text-2xl font-bold">{result.row.speed} km/h</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600">I/P by ETRTO</div>
              <div className="text-2xl font-bold">{result.ipByETRTO.toFixed(1)} psi</div>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-3 text-left">Parameter</th>
                  <th className="border p-3">Value / Comparison</th>
                  <th className="border p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3 font-medium">
                    <div>Result Load</div>
                    <div className="text-xs font-normal text-gray-500">
                      Load/Tire vs LOAD INDEX × 115%
                    </div>
                  </td>
                  <td className="border p-3 text-center">
                    <div>{result.loadPerTire.toFixed(1)} kg</div>
                    <div className="text-xs text-gray-600">
                      vs {(selectedTire["LOAD INDEX"] * 1.15).toFixed(1)} kg max
                    </div>
                  </td>
                  <td className="border p-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        result.resultLoad === "OK"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {result.resultLoad}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="border p-3 font-medium">
                    <div>Result I/P</div>
                    <div className="text-xs font-normal text-gray-500">
                      I/P by ETRTO vs STD I/P × 110%
                    </div>
                  </td>
                  <td className="border p-3 text-center">
                    <div>{result.ipByETRTO.toFixed(1)} psi</div>
                    <div className="text-xs text-gray-600">
                      vs {(selectedTire["STD I/P"] * 1.10).toFixed(1)} psi max
                    </div>
                  </td>
                  <td className="border p-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        result.resultIP === "OK"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {result.resultIP}
                    </span>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border p-3 font-medium">
                    <div>Limit Load at {result.row.speed} km/h</div>
                    <div className="text-xs font-normal text-gray-500">
                      LOAD INDEX × Speed Factor
                    </div>
                  </td>
                  <td className="border p-3 text-center" colSpan={2}>
                    <div>{result.limitLoad.toFixed(1)} kg</div>
                    <div className="text-xs text-gray-600">
                      (Factor: {result.row[selectedTire["Speed symbol"] as SpeedSymbol]?.toFixed(2)} for symbol {selectedTire["Speed symbol"]})
                    </div>
                  </td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="border p-3 font-medium">
                    Possibility Tire Damage
                  </td>
                  <td className="border p-3 text-center" colSpan={2}>
                    <div className="flex justify-center gap-8">
                      <div>
                        <span className="text-gray-600">By Load: </span>
                        <span
                          className={`font-bold ${
                            result.damage.load === "OK"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {result.damage.load}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">By I/P: </span>
                        <span
                          className={`font-bold ${
                            result.damage.ip === "OK"
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          {result.damage.ip}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Warning Messages */}
          {result.resultLoad !== "OK" && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">
                ⚠️ OVER LOAD Warning!
              </p>
              <p className="text-red-700 text-sm mt-1">
                Load per tire ({result.loadPerTire.toFixed(1)} kg) exceeds the
                limit load ({result.limitLoad.toFixed(1)} kg) for speed symbol{" "}
                {selectedTire["Speed symbol"]} at {result.row.speed} km/h.
                Damage by load: {result.damage.load}
              </p>
            </div>
          )}

          {result.resultIP !== "OK" && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 font-semibold">
                ⚠️ Pressure Warning!
              </p>
              <p className="text-orange-700 text-sm mt-1">
                {result.resultIP} - Damage by I/P: {result.damage.ip}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
