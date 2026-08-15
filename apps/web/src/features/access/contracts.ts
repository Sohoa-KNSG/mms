import { z } from 'zod';

export const sessionSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  roleCode: z.string(),
  roleName: z.string().nullable(),
  departmentCode: z.string().nullable(),
  bravoDepartmentCode: z.string().nullable(),
  bravoDepartmentName: z.string().nullable(),
});

export const navigationItemSchema = z.object({
  screenCode: z.string(),
  label: z.string(),
  accessMode: z.string().nullable(),
});

export const navigationSchema = z.array(navigationItemSchema);

export type Session = z.infer<typeof sessionSchema>;
export type NavigationItem = z.infer<typeof navigationItemSchema>;

