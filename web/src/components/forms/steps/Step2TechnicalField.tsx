'use client';

import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InventionFormData } from '@/types/invention';

interface Step2Props {
  form: UseFormReturn<InventionFormData>;
}

export function Step2TechnicalField({ form }: Step2Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="technicalField">
          기술 분야 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="technicalField"
          placeholder="본 발명은 ○○ 분야에 관한 것으로, 보다 상세하게는 ○○에 관한 것이다."
          className="min-h-[100px]"
          {...register('technicalField')}
        />
        {errors.technicalField && (
          <p className="text-sm text-destructive">{errors.technicalField.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          발명이 속하는 기술 분야를 명확하게 기술하세요.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="backgroundTechnology">
          배경 기술 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="backgroundTechnology"
          placeholder="종래의 기술에서는... 이러한 문제점이 있었다..."
          className="min-h-[200px]"
          {...register('backgroundTechnology')}
        />
        {errors.backgroundTechnology && (
          <p className="text-sm text-destructive">{errors.backgroundTechnology.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          기존 기술의 현황과 한계점을 설명하세요. 선행 기술 문헌을 인용할 수 있습니다.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="technicalProblem">
          해결하려는 과제 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="technicalProblem"
          placeholder="본 발명은 상기와 같은 문제점을 해결하기 위하여 안출된 것으로서, ○○를 제공하는 것을 목적으로 한다."
          className="min-h-[150px]"
          {...register('technicalProblem')}
        />
        {errors.technicalProblem && (
          <p className="text-sm text-destructive">{errors.technicalProblem.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          본 발명이 해결하고자 하는 기술적 과제를 명확히 기술하세요.
        </p>
      </div>
    </div>
  );
}
