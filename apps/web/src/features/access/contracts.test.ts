import { describe, expect, it } from 'vitest';
import { navigationSchema, sessionSchema } from './contracts';

describe('access contracts', () => {
  it('accepts the W0 session contract returned by the API', () => {
    const result = sessionSchema.parse({
      userId: 'codex-test',
      displayName: 'MMS Test User',
      roleCode: 'WAREHOUSE',
      roleName: null,
      departmentCode: null,
      bravoDepartmentCode: null,
      bravoDepartmentName: null,
    });

    expect(result.userId).toBe('codex-test');
  });

  it('rejects navigation entries without a screen code', () => {
    const result = navigationSchema.safeParse([
      { label: 'Inventory', accessMode: 'view' },
    ]);

    expect(result.success).toBe(false);
  });
});

