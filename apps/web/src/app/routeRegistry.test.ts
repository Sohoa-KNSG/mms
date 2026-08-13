import { describe, expect, it } from 'vitest';
import { routeRegistry } from './routeRegistry';

describe('W1, W2 and W3 route registry', () => {
  it('maps every delivered use case to at least one legacy screen', () => {
    const deliveredUseCases = new Set(
      Object.values(routeRegistry).flat().map((route) => route.useCaseId),
    );

    expect(deliveredUseCases).toEqual(
      new Set([
        'INB-04', 'INV-01', 'INV-02', 'INV-03', 'LOC-01',
        'ADM-01', 'ADM-02', 'ADM-03',
        'QC-01', 'QC-02', 'QC-03', 'QC-04', 'QC-05', 'QC-06',
        'INB-01', 'INB-02', 'INB-03', 'INB-05', 'INB-06', 'INB-07', 'INB-08',
        'INV-04', 'INV-05', 'INV-06', 'INV-07', 'LOC-02', 'LOC-03', 'LOC-04',
        'OUT-01', 'OUT-02', 'OUT-03', 'OUT-04', 'OUT-05',
        'OUT-06', 'OUT-07', 'OUT-08', 'OUT-09',
        'RET-01', 'RET-02', 'RET-03',
      ]),
    );
  });

  it('keeps desktop and mobile screen aliases on the same route', () => {
    expect(routeRegistry.scr_tam_nhanhang_log?.[0]?.path).toBe(
      routeRegistry.scr_nhanhang_log?.[0]?.path,
    );
    expect(routeRegistry.scr_luukho_so_do?.[0]?.path).toBe(
      routeRegistry.scr_luukho_vitri_ke?.[0]?.path,
    );
  });
});
