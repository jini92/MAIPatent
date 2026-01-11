'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InventionFormData } from '@/types/invention';

interface Step3Props {
  form: UseFormReturn<InventionFormData>;
}

export function Step3InventionContent({ form }: Step3Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="inventionSummary">
          발명 요약 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="inventionSummary"
          placeholder="본 발명의 일 측면에 따르면, ○○를 포함하는 시스템/방법이 제공된다. 상기 시스템은 ○○ 수단, ○○ 수단을 포함하며..."
          className="min-h-[200px]"
          {...register('inventionSummary')}
        />
        {errors.inventionSummary && (
          <p className="text-sm text-destructive">{errors.inventionSummary.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          발명의 핵심 구성요소와 동작 원리를 요약하세요.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="proposedSolution">
          과제 해결 수단 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="proposedSolution"
          placeholder="상기 목적을 달성하기 위한 본 발명의 일 측면에 따르면, ○○를 포함하는 것을 특징으로 하는 시스템이 제공된다. 상기 시스템은..."
          className="min-h-[200px]"
          {...register('proposedSolution')}
        />
        {errors.proposedSolution && (
          <p className="text-sm text-destructive">{errors.proposedSolution.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          과제를 해결하기 위한 구체적인 기술적 수단을 상세히 기술하세요.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="expectedEffects">
          기대 효과 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="expectedEffects"
          placeholder="본 발명에 따르면, ○○의 효과가 있다. 또한, ○○가 가능하여 ○○의 이점이 있다."
          className="min-h-[150px]"
          {...register('expectedEffects')}
        />
        {errors.expectedEffects && (
          <p className="text-sm text-destructive">{errors.expectedEffects.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          발명을 통해 얻을 수 있는 기술적, 경제적 효과를 기술하세요.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="keywords">
          키워드 (선택)
        </Label>
        <Input
          id="keywords"
          placeholder="인공지능, 특허, 명세서, 자동화 (쉼표로 구분)"
          {...register('keywords')}
        />
        <p className="text-xs text-muted-foreground">
          선행기술 검색에 활용될 핵심 키워드를 입력하세요. 쉼표(,)로 구분합니다.
        </p>
      </div>
    </div>
  );
}
