'use client';

import { UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InventionFormData } from '@/types/invention';
import { cn } from '@/lib/utils';

interface Step4Props {
  form: UseFormReturn<InventionFormData>;
}

export function Step4DrawingsConfirm({ form }: Step4Props) {
  const { register, watch, formState: { errors } } = form;
  const hasDrawings = watch('hasDrawings');

  return (
    <div className="space-y-6">
      {/* 도면 여부 */}
      <div className="space-y-4">
        <Label>도면 포함 여부</Label>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="hasDrawings"
            className="h-4 w-4 rounded border-gray-300"
            {...register('hasDrawings')}
          />
          <Label htmlFor="hasDrawings" className="font-normal cursor-pointer">
            도면을 포함합니다
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          도면이 있는 경우 체크하고 아래에 도면 설명을 입력하세요.
        </p>
      </div>

      {/* 도면 설명 */}
      <div className={cn('space-y-2', !hasDrawings && 'opacity-50')}>
        <Label htmlFor="drawingDescriptions">
          도면의 간단한 설명
        </Label>
        <Textarea
          id="drawingDescriptions"
          placeholder={`도 1은 본 발명의 일 실시예에 따른 시스템의 전체 구성을 나타내는 블록도이다.
도 2는 본 발명의 일 실시예에 따른 처리 흐름을 나타내는 순서도이다.
도 3은 본 발명의 일 실시예에 따른 데이터 구조를 나타내는 도면이다.`}
          className="min-h-[150px]"
          disabled={!hasDrawings}
          {...register('drawingDescriptions')}
        />
        <p className="text-xs text-muted-foreground">
          각 도면이 무엇을 나타내는지 간략하게 설명하세요.
        </p>
      </div>

      {/* 확인 체크박스 */}
      <div className="rounded-lg border p-4 space-y-4 bg-muted/50">
        <h4 className="font-medium">최종 확인</h4>

        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="confirmAccuracy"
            className="h-4 w-4 rounded border-gray-300 mt-1"
            {...register('confirmAccuracy')}
          />
          <div>
            <Label htmlFor="confirmAccuracy" className="font-normal cursor-pointer">
              입력한 내용이 정확함을 확인합니다 <span className="text-destructive">*</span>
            </Label>
            {errors.confirmAccuracy && (
              <p className="text-sm text-destructive">{errors.confirmAccuracy.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="confirmNoConfidential"
            className="h-4 w-4 rounded border-gray-300 mt-1"
            {...register('confirmNoConfidential')}
          />
          <div>
            <Label htmlFor="confirmNoConfidential" className="font-normal cursor-pointer">
              기밀 정보가 포함되지 않았음을 확인합니다 <span className="text-destructive">*</span>
            </Label>
            {errors.confirmNoConfidential && (
              <p className="text-sm text-destructive">{errors.confirmNoConfidential.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              제출된 내용은 특허 출원 과정에서 공개될 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 제출 안내 */}
      <div className="rounded-lg border border-primary/50 p-4 bg-primary/5">
        <h4 className="font-medium text-primary mb-2">제출 후 진행 안내</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• 제출 후 자동으로 선행기술 검색이 진행됩니다.</li>
          <li>• AI가 KIPO 표준 특허 명세서를 생성합니다.</li>
          <li>• 변리사/연구자의 검수 후 최종 문서가 제공됩니다.</li>
          <li>• 진행 상황은 대시보드에서 확인할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}
