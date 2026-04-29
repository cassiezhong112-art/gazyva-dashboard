// Baseline funnel parameters per indication per year
export interface FunnelParams {
  diagnosed: number;
  urbanRate: number;
  targetRate: number;
  treatedRate: number;
  bxAdoption: number;
  gazyvaShare: number;
  injectionInit: number;
  injectionMaint: number;
  compliance: number;
  price: number;
  priceGrowth: number;
  bufferDays: number;
}

export interface FunnelResult {
  urbanDiag: number;
  target: number;
  treated: number;
  bxPatients: number;
  gazyvaPatients: number;
  actualVials: number;
  revenue: number;
  exFactoryVials: number;
  exFactoryRevenue: number;
}

export type Indication = 'LN' | 'MN' | 'ERL' | 'PNS';
export const INDICATIONS: Indication[] = ['LN', 'MN', 'ERL', 'PNS'];

export const INDICATION_LABELS: Record<Indication, { zh: string; en: string }> = {
  LN:  { zh: '狼疮性肾炎', en: 'Lupus Nephritis' },
  MN:  { zh: '膜性肾病', en: 'Membranous Nephropathy' },
  ERL: { zh: '难治性狼疮', en: 'Extra-Renal Lupus' },
  PNS: { zh: '原发性肾病综合征', en: 'Primary Nephrotic Syndrome' },
};

// Explicit baseline data for 2027-2030
export const BASELINE_DATA: Record<Indication, Record<number, FunnelParams>> = {
  LN: {
    2027: { diagnosed: 517000, urbanRate: 68, targetRate: 90, treatedRate: 100, bxAdoption: 12, gazyvaShare: 8, injectionInit: 5, injectionMaint: 2, compliance: 45, price: 7722, priceGrowth: 0, bufferDays: 35 },
    2028: { diagnosed: 516000, urbanRate: 69, targetRate: 90, treatedRate: 100, bxAdoption: 18, gazyvaShare: 34, injectionInit: 5, injectionMaint: 2, compliance: 60, price: 7722, priceGrowth: 0, bufferDays: 35 },
    2029: { diagnosed: 514000, urbanRate: 70, targetRate: 90, treatedRate: 100, bxAdoption: 22, gazyvaShare: 47, injectionInit: 5, injectionMaint: 2, compliance: 65, price: 7722, priceGrowth: 0, bufferDays: 35 },
    2030: { diagnosed: 513000, urbanRate: 71, targetRate: 90, treatedRate: 100, bxAdoption: 24, gazyvaShare: 50, injectionInit: 5, injectionMaint: 2, compliance: 70, price: 7722, priceGrowth: 0, bufferDays: 35 },
  },
  MN: {
    2027: { diagnosed: 498000, urbanRate: 68, targetRate: 67, treatedRate: 100, bxAdoption: 38, gazyvaShare: 12, injectionInit: 4, injectionMaint: 0, compliance: 55, price: 7722, priceGrowth: 0, bufferDays: 35 },
    2028: { diagnosed: 510000, urbanRate: 69, targetRate: 67, treatedRate: 100, bxAdoption: 49, gazyvaShare: 31, injectionInit: 4, injectionMaint: 0, compliance: 62, price: 7722, priceGrowth: 0, bufferDays: 35 },
    2029: { diagnosed: 522000, urbanRate: 70, targetRate: 68, treatedRate: 100, bxAdoption: 55, gazyvaShare: 40, injectionInit: 4, injectionMaint: 0, compliance: 69, price: 7722, priceGrowth: 0, bufferDays: 35 },
    2030: { diagnosed: 533000, urbanRate: 70, targetRate: 68, treatedRate: 100, bxAdoption: 58, gazyvaShare: 44, injectionInit: 4, injectionMaint: 0, compliance: 70, price: 7722, priceGrowth: 0, bufferDays: 35 },
  },
  ERL: {
    2027: { diagnosed: 517000, urbanRate: 63, targetRate: 43, treatedRate: 100, bxAdoption: 23, gazyvaShare: 5, injectionInit: 4, injectionMaint: 0, compliance: 55, price: 7722, priceGrowth: 0, bufferDays: 35 },
    2028: { diagnosed: 516000, urbanRate: 64, targetRate: 43, treatedRate: 100, bxAdoption: 33, gazyvaShare: 21, injectionInit: 4, injectionMaint: 0, compliance: 64, price: 7722, priceGrowth: 0, bufferDays: 35 },
    2029: { diagnosed: 514000, urbanRate: 65, targetRate: 43, treatedRate: 100, bxAdoption: 40, gazyvaShare: 30, injectionInit: 4, injectionMaint: 0, compliance: 66, price: 7722, priceGrowth: 0, bufferDays: 35 },
    2030: { diagnosed: 513000, urbanRate: 65, targetRate: 43, treatedRate: 100, bxAdoption: 45, gazyvaShare: 32, injectionInit: 4, injectionMaint: 0, compliance: 68, price: 7722, priceGrowth: 0, bufferDays: 35 },
  },
  PNS: {
    2027: { diagnosed: 114000, urbanRate: 70, targetRate: 40, treatedRate: 100, bxAdoption: 5, gazyvaShare: 4, injectionInit: 4, injectionMaint: 0, compliance: 52, price: 7722, priceGrowth: 0, bufferDays: 35 },
    2028: { diagnosed: 116000, urbanRate: 70, targetRate: 40, treatedRate: 100, bxAdoption: 11, gazyvaShare: 9, injectionInit: 4, injectionMaint: 0, compliance: 54, price: 7722, priceGrowth: 0, bufferDays: 35 },
    2029: { diagnosed: 118000, urbanRate: 70, targetRate: 40, treatedRate: 100, bxAdoption: 19, gazyvaShare: 15, injectionInit: 4, injectionMaint: 0, compliance: 56, price: 7722, priceGrowth: 0, bufferDays: 35 },
    2030: { diagnosed: 120000, urbanRate: 70, targetRate: 40, treatedRate: 100, bxAdoption: 25, gazyvaShare: 20, injectionInit: 4, injectionMaint: 0, compliance: 58, price: 7722, priceGrowth: 0, bufferDays: 35 },
  },
};

export function getParamsForYear(ind: Indication, year: number): FunnelParams {
  const refYear = year <= 2030 ? year : 2030;
  return { ...BASELINE_DATA[ind][refYear] };
}

export function calculateFunnel(params: FunnelParams, actualPrice?: number): FunnelResult {
  const price = actualPrice ?? params.price;
  const urbanDiag = params.diagnosed * (params.urbanRate / 100);
  const target = urbanDiag * (params.targetRate / 100);
  const treated = target * (params.treatedRate / 100);
  const bxPatients = treated * (params.bxAdoption / 100);
  const gazyvaPatients = bxPatients * (params.gazyvaShare / 100);
  const totalInjections = params.injectionInit + params.injectionMaint;
  const actualVials = gazyvaPatients * totalInjections * (params.compliance / 100);
  const revenue = actualVials * price;
  const bufferRatio = (params.bufferDays || 35) / 365;
  const exFactoryVials = actualVials * (1 + bufferRatio);
  const exFactoryRevenue = revenue * (1 + bufferRatio);

  return { urbanDiag, target, treated, bxPatients, gazyvaPatients, actualVials, revenue, exFactoryVials, exFactoryRevenue };
}

// Calculate total revenue across all indications for a given year
export function calculateTotalRevenue(year: number, overrides?: Partial<Record<Indication, Partial<FunnelParams>>>): number {
  let total = 0;
  for (const ind of INDICATIONS) {
    const params = getParamsForYear(ind, year);
    if (overrides?.[ind]) {
      Object.assign(params, overrides[ind]);
    }
    const basePrice = getParamsForYear(ind, 2027).price;
    const actualPrice = year === 2027 ? basePrice : basePrice * (1 + (params.priceGrowth || 0) / 100);
    total += calculateFunnel(params, actualPrice).revenue;
  }
  return total;
}
