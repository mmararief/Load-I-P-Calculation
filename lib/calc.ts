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

export function lookupSpeedRow(data: TireData, speed: number): SpeedRow {
  const sorted = [...data.speed_table].sort((a,b)=>a.speed-b.speed);
  // cari baris terdekat di bawah atau sama dengan speed
  let row = sorted[0];
  for (const r of sorted) {
    if (r.speed <= speed) row = r;
  }
  return row;
}

export function calcResultLoad(loadPerTire: number, loadIndex: number) {
  // Result Load = IF(Load/Tire >= LOAD INDEX * 115%, "Over Load", "OK")
  const maxAllowedLoad = loadIndex * 1.15;
  return loadPerTire >= maxAllowedLoad ? "Over Load" : "OK";
}

export function getLimitLoad(loadIndex: number, row: SpeedRow, symbol: SpeedSymbol): number {
  const factor = row[symbol];
  return loadIndex * factor;
}

export function calcIPByETRTO(loadPerTire: number, loadIndex: number, stdIP: number): number {
  // I/P by ETRTO = ((Load/Tire / LOAD INDEX) ^ 1.25) × STD I/P
  const loadRatio = loadPerTire / loadIndex;
  return Math.pow(loadRatio, 1.25) * stdIP;
}

export function calcResultIP(ipByETRTO: number, stdIP: number) {
  // Result I/P = IF(I/P by ETRTO >= STD I/P * 110%, "CONSULT TO BS", "OK")
  const maxAllowedIP = stdIP * 1.10;
  return ipByETRTO >= maxAllowedIP ? "CONSULT TO BS" : "OK";
}

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
