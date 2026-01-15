'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormStepIndicator } from './FormStepIndicator';
import { Step1BasicInfo } from './steps/Step1BasicInfo';
import { Step2TechnicalField } from './steps/Step2TechnicalField';
import { Step3InventionContent } from './steps/Step3InventionContent';
import { Step4DrawingsConfirm } from './steps/Step4DrawingsConfirm';
import {
  inventionFormSchema,
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  InventionFormData,
  FORM_STEPS,
} from '@/types/invention';
import { submitInvention } from '@/lib/n8n-client';
import { savePatent, createPatentFromFormData } from '@/lib/patent-storage';

const stepSchemas = [step1Schema, step2Schema, step3Schema, step4Schema];

interface InventionFormProps {
  onSuccess?: (patentId: string) => void;
}

export function InventionForm({ onSuccess }: InventionFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<InventionFormData>({
    resolver: zodResolver(inventionFormSchema),
    mode: 'onChange',
    defaultValues: {
      inventionTitle: '',
      inventorName: '',
      inventorAffiliation: '',
      inventorEmail: '',
      technicalField: '',
      backgroundTechnology: '',
      technicalProblem: '',
      inventionSummary: '',
      proposedSolution: '',
      expectedEffects: '',
      keywords: '',
      drawingDescriptions: '',
      hasDrawings: false,
      confirmAccuracy: false,
      confirmNoConfidential: false,
    },
  });

  const currentStepInfo = FORM_STEPS[currentStep - 1];

  const validateCurrentStep = async (): Promise<boolean> => {
    const currentSchema = stepSchemas[currentStep - 1];
    const currentFields = currentStepInfo.fields;

    // 현재 단계의 필드만 추출
    const currentValues: Record<string, unknown> = {};
    currentFields.forEach((field) => {
      currentValues[field] = form.getValues(field as keyof InventionFormData);
    });

    try {
      await currentSchema.parseAsync(currentValues);
      // 현재 단계의 필드 에러 클리어
      currentFields.forEach((field) => {
        form.clearErrors(field as keyof InventionFormData);
      });
      return true;
    } catch {
      // 현재 단계의 필드만 트리거
      await form.trigger([...currentFields] as (keyof InventionFormData)[]);
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    // 최종 단계 유효성 검사
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data = form.getValues();

      // n8n WF01로 제출
      const result = await submitInvention({
        inventionTitle: data.inventionTitle,
        inventorName: data.inventorName,
        inventorAffiliation: data.inventorAffiliation,
        technicalField: data.technicalField,
        inventionSummary: data.inventionSummary,
        technicalProblem: data.technicalProblem,
        proposedSolution: data.proposedSolution,
        expectedEffects: data.expectedEffects,
        keywords: typeof data.keywords === 'string'
          ? data.keywords.split(',').map(k => k.trim()).filter(Boolean)
          : data.keywords,
        drawingDescriptions: data.drawingDescriptions
          ? [data.drawingDescriptions]
          : [],
      });

      // localStorage에 특허 데이터 저장
      const patentData = createPatentFromFormData(
        {
          inventionTitle: data.inventionTitle,
          inventorName: data.inventorName,
          inventorAffiliation: data.inventorAffiliation,
          inventorEmail: data.inventorEmail,
          technicalField: data.technicalField,
          keywords: data.keywords,
          inventionSummary: data.inventionSummary,
        },
        result.patent_id // n8n에서 받은 ID를 executionId로 저장
      );
      const savedPatent = savePatent(patentData);

      if (!completedSteps.includes(4)) {
        setCompletedSteps([...completedSteps, 4]);
      }

      // localStorage에 저장된 실제 특허 ID 반환 (PAT-XXX 형식)
      onSuccess?.(savedPatent.id);
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : '제출 중 오류가 발생했습니다. 다시 시도해주세요.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo form={form} />;
      case 2:
        return <Step2TechnicalField form={form} />;
      case 3:
        return <Step3InventionContent form={form} />;
      case 4:
        return <Step4DrawingsConfirm form={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <FormStepIndicator currentStep={currentStep} completedSteps={completedSteps} />

      <Card>
        <CardHeader>
          <CardTitle>{currentStepInfo.title}</CardTitle>
          <CardDescription>{currentStepInfo.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()}>
            {renderStep()}

            {submitError && (
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/50">
                <p className="text-sm text-destructive">{submitError}</p>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1 || isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                이전
              </Button>

              {currentStep < 4 ? (
                <Button type="button" onClick={handleNext}>
                  다음
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      제출 중...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      제출하기
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
