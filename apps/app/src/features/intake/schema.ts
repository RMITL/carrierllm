import { z } from 'zod';
import type { IntakeAnswers } from '../../types';

export const intakeSchema = z.object({
  dob: z.string().min(1, 'Date of birth is required'),
  state: z.string().min(2, 'State is required'),
  coverageStart: z.string().min(1, 'Coverage start date required'),
  replacingCoverage: z.boolean(),
  nicotineUse: z.enum(['never', 'past24Months', 'current']),
  majorConditions: z.string().optional().default(''),
  prescriptions: z.string().optional().default(''),
  height: z.number().min(48).max(90),
  weight: z.number().min(70).max(400),
  riskActivities: z.string().optional().default(''),
  householdIncome: z.number().min(0).optional(),
  occupation: z.string().optional(),
  coverageType: z.enum(['health', 'life'])
});

export type IntakeFormValues = z.infer<typeof intakeSchema>;

export const defaultIntakeValues = (): IntakeFormValues => ({
  dob: '',
  state: '',
  coverageStart: '',
  replacingCoverage: false,
  nicotineUse: 'never',
  majorConditions: '',
  prescriptions: '',
  height: 70,
  weight: 180,
  riskActivities: '',
  householdIncome: undefined,
  occupation: '',
  coverageType: 'life'
});

export const toIntakeAnswers = (values: IntakeFormValues): IntakeAnswers => ({
  dob: values.dob,
  state: values.state,
  coverageStart: values.coverageStart,
  replacingCoverage: values.replacingCoverage,
  nicotineUse: values.nicotineUse,
  majorConditions: values.majorConditions ?? '',
  prescriptions: values.prescriptions ?? '',
  height: values.height,
  weight: values.weight,
  riskActivities: values.riskActivities ?? '',
  householdIncome: values.householdIncome,
  occupation: values.occupation,
  coverageType: values.coverageType
});
