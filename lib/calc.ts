export type SpeedRow = {
  speed: number;
  F: number; G: number; J: number; K: number; L: number; M: number;
  psi: number;
};

export type SpeedSymbol = "F" | "G" | "J" | "K" | "L" | "M";

export type Tire = {
  "TIRE Size": string;
  "LOAD INDEX": number;
  "STD I/P": number;
  "Speed symbol": string;
};

export type TireData = {
  tires: Tire[];
  speed_table: SpeedRow[];
};

/**
 * Finds the appropriate speed table row for a given speed.
 * It returns the row with the highest speed that is less than or equal to the target speed.
 * @param {TireData} data - The entire tire data object, including the speed table.
 * @param {number} speed - The target speed in km/h.
 * @returns {SpeedRow} The matching speed table row.
 */
export function lookupSpeedRow(data: TireData, speed: number): SpeedRow {
  const sorted = [...data.speed_table].sort((a, b) => a.speed - b.speed);
  // find the closest row at or below the given speed
  let row = sorted[0];
  for (const r of sorted) {
    if (r.speed <= speed) row = r;
  }
  return row;
}

/**
 * Determines if the load per tire is within the acceptable limit.
 * The limit is 115% of the tire's specified load index.
 * @param {number} loadPerTire - The actual load on a single tire in kg.
 * @param {number} loadIndex - The tire's load index value in kg.
 * @returns {"OK" | "Over Load"} The load status.
 */
export function calcResultLoad(loadPerTire: number, loadIndex: number) {
  // Result Load = IF(Load/Tire >= LOAD INDEX * 115%, "Over Load", "OK")
  const maxAllowedLoad = loadIndex * 1.15;
  return loadPerTire >= maxAllowedLoad ? "Over Load" : "OK";
}

/**
 * Calculates the maximum permissible load for a tire at a specific speed.
 * @param {number} loadIndex - The tire's base load index in kg.
 * @param {SpeedRow} row - The speed table row corresponding to the vehicle's speed.
 * @param {SpeedSymbol} symbol - The tire's speed symbol.
 * @returns {number} The adjusted load limit in kg.
 */
export function getLimitLoad(
  loadIndex: number,
  row: SpeedRow,
  symbol: SpeedSymbol
): number {
  const factor = row[symbol];
  return loadIndex * factor;
}

/**
 * Calculates the required inflation pressure (I/P) based on the ETRTO formula.
 * @param {number} loadPerTire - The actual load on a single tire in kg.
 * @param {number} loadIndex - The tire's load index value in kg.
 * @param {number} stdIP - The tire's standard inflation pressure in psi.
 * @returns {number} The calculated inflation pressure in psi.
 */
export function calcIPByETRTO(
  loadPerTire: number,
  loadIndex: number,
  stdIP: number
): number {
  // I/P by ETRTO = ((Load/Tire / LOAD INDEX) ^ 1.25) × STD I/P
  const loadRatio = loadPerTire / loadIndex;
  return Math.pow(loadRatio, 1.25) * stdIP;
}

/**
 * Determines if the calculated inflation pressure is within the acceptable limit.
 * The limit is 110% of the tire's standard inflation pressure.
 * @param {number} ipByETRTO - The calculated inflation pressure.
 * @param {number} stdIP - The tire's standard inflation pressure.
 * @returns {"OK" | "CONSULT TO BS"} The inflation pressure status.
 */
export function calcResultIP(ipByETRTO: number, stdIP: number) {
  // Result I/P = IF(I/P by ETRTO >= STD I/P * 110%, "CONSULT TO BS", "OK")
  const maxAllowedIP = stdIP * 1.1;
  return ipByETRTO >= maxAllowedIP ? "CONSULT TO BS" : "OK";
}

/**
 * Calculates the percentage of potential damage due to excessive load or inflation pressure.
 * Returns "OK" if values are within limits, otherwise returns the percentage overload/overpressure.
 * @param {number} loadPerTire - The actual load on a single tire in kg.
 * @param {number} loadIndex - The tire's load index value in kg.
 * @param {number} ipByETRTO - The calculated inflation pressure in psi.
 * @param {number} stdIP - The tire's standard inflation pressure in psi.
 * @returns {{load: string, ip: string}} An object containing the damage status for load and I/P.
 */
export function calcDamage(
  loadPerTire: number,
  loadIndex: number,
  ipByETRTO: number,
  stdIP: number
) {
  // Damage by Load = IF(Load/Tire <= LOAD INDEX * 115%, "OK", (Load/Tire - LOAD INDEX) / LOAD INDEX)
  let damageByLoad: string;
  if (loadPerTire <= loadIndex * 1.15) {
    damageByLoad = "OK";
  } else {
    const percentage = ((loadPerTire - loadIndex) / loadIndex) * 100;
    damageByLoad = percentage.toFixed(0) + "%";
  }

  // Damage by I/P = IF(I/P by ETRTO <= STD I/P * 110%, "OK", (I/P by ETRTO - STD I/P) / STD I/P)
  let damageByIP: string;
  if (ipByETRTO <= stdIP * 1.10) {
    damageByIP = "OK";
  } else {
    const percentage = ((ipByETRTO - stdIP) / stdIP) * 100;
    damageByIP = percentage.toFixed(0) + "%";
  }

  return { load: damageByLoad, ip: damageByIP };
}
