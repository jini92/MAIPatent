import { z } from 'zod';

// Step 1: 기본 정보
export const step1Schema = z.object({
  inventionTitle: z
    .string()
    .min(5, '발명의 명칭은 5자 이상이어야 합니다')
    .max(200, '발명의 명칭은 200자 이하여야 합니다'),
  inventorName: z
    .string()
    .min(2, '발명자 성명을 입력하세요')
    .max(50, '발명자 성명은 50자 이하여야 합니다'),
  inventorAffiliation: z
    .string()
    .min(2, '소속을 입력하세요')
    .max(100, '소속은 100자 이하여야 합니다'),
  inventorEmail: z
    .string()
    .email('유효한 이메일 주소를 입력하세요')
    .optional()
    .or(z.literal('')),
});

// Step 2: 기술 분야
export const step2Schema = z.object({
  technicalField: z
    .string()
    .min(10, '기술 분야를 10자 이상 입력하세요')
    .max(500, '기술 분야는 500자 이하여야 합니다'),
  backgroundTechnology: z
    .string()
    .min(50, '배경 기술을 50자 이상 입력하세요')
    .max(3000, '배경 기술은 3000자 이하여야 합니다'),
  technicalProblem: z
    .string()
    .min(30, '해결하려는 과제를 30자 이상 입력하세요')
    .max(2000, '해결하려는 과제는 2000자 이하여야 합니다'),
});

// Step 3: 발명 내용
export const step3Schema = z.object({
  inventionSummary: z
    .string()
    .min(100, '발명 요약을 100자 이상 입력하세요')
    .max(5000, '발명 요약은 5000자 이하여야 합니다'),
  proposedSolution: z
    .string()
    .min(100, '과제 해결 수단을 100자 이상 입력하세요')
    .max(5000, '과제 해결 수단은 5000자 이하여야 합니다'),
  expectedEffects: z
    .string()
    .min(50, '기대 효과를 50자 이상 입력하세요')
    .max(2000, '기대 효과는 2000자 이하여야 합니다'),
  keywords: z.string().optional(),
});

// Step 4: 도면 및 확인
export const step4Schema = z.object({
  drawingDescriptions: z.string().optional(),
  hasDrawings: z.boolean().optional().default(false),
  confirmAccuracy: z
    .boolean()
    .refine((val) => val === true, '정확성을 확인해주세요'),
  confirmNoConfidential: z
    .boolean()
    .refine((val) => val === true, '기밀 정보 미포함을 확인해주세요'),
});

// 전체 폼 스키마 (merge를 사용하여 default 유지)
export const inventionFormSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema);

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type InventionFormData = z.input<typeof inventionFormSchema>;

// 폼 단계 정의
export const FORM_STEPS = [
  {
    id: 1,
    title: '기본 정보',
    description: '발명의 명칭과 발명자 정보를 입력합니다',
    fields: ['inventionTitle', 'inventorName', 'inventorAffiliation', 'inventorEmail'],
  },
  {
    id: 2,
    title: '기술 분야',
    description: '기술 분야, 배경 기술, 해결 과제를 입력합니다',
    fields: ['technicalField', 'backgroundTechnology', 'technicalProblem'],
  },
  {
    id: 3,
    title: '발명 내용',
    description: '발명 요약, 해결 수단, 기대 효과를 입력합니다',
    fields: ['inventionSummary', 'proposedSolution', 'expectedEffects', 'keywords'],
  },
  {
    id: 4,
    title: '도면 및 확인',
    description: '도면 설명을 입력하고 최종 확인합니다',
    fields: ['drawingDescriptions', 'hasDrawings', 'confirmAccuracy', 'confirmNoConfidential'],
  },
] as const;
