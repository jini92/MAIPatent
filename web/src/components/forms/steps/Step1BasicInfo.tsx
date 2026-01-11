'use client';

import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InventionFormData } from '@/types/invention';

interface Step1Props {
  form: UseFormReturn<InventionFormData>;
}

export function Step1BasicInfo({ form }: Step1Props) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="inventionTitle">
          발명의 명칭 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="inventionTitle"
          placeholder="예: 인공지능 기반 특허 명세서 자동 생성 시스템"
          {...register('inventionTitle')}
        />
        {errors.inventionTitle && (
          <p className="text-sm text-destructive">{errors.inventionTitle.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          발명의 핵심 기술을 간결하게 표현하는 제목을 입력하세요.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="inventorName">
            발명자 성명 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="inventorName"
            placeholder="홍길동"
            {...register('inventorName')}
          />
          {errors.inventorName && (
            <p className="text-sm text-destructive">{errors.inventorName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="inventorAffiliation">
            소속 <span className="text-destructive">*</span>
          </Label>
          <Input
            id="inventorAffiliation"
            placeholder="예: ○○대학교 컴퓨터공학과"
            {...register('inventorAffiliation')}
          />
          {errors.inventorAffiliation && (
            <p className="text-sm text-destructive">{errors.inventorAffiliation.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inventorEmail">
          이메일 (선택)
        </Label>
        <Input
          id="inventorEmail"
          type="email"
          placeholder="inventor@example.com"
          {...register('inventorEmail')}
        />
        {errors.inventorEmail && (
          <p className="text-sm text-destructive">{errors.inventorEmail.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          진행 상황 알림을 받을 이메일 주소입니다.
        </p>
      </div>
    </div>
  );
}
