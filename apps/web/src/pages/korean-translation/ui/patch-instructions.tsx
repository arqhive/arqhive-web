import type { Patch } from '@arqhive/content';
import { regionLabel } from '@/entities/patch';
import { MarkdownBody } from '@/shared/markdown';

/** 작품 주소의 초기 HTML과 진열장에서 펼친 속지에 같은 안내를 그린다. */
export function PatchInstructions({ patch }: { readonly patch: Patch }) {
  return (
    <div className="mt-3 space-y-3 text-sm leading-relaxed wrap-anywhere">
      {patch.baseRequirements.length === 0 ? null : (
        <div className="space-y-1">
          <h3 className="font-bold">지원 원본판</h3>
          <ul className="space-y-2">
            {patch.baseRequirements.map((base) => (
              <li key={`${base.region}/${base.gameId ?? ''}`} className="text-ink-sub">
                <span className="font-bold text-ink">{regionLabel(base.region)}</span>
                {base.gameId ? <code className="ml-2 font-num">{base.gameId}</code> : null}
                {base.dumpFormat ? <p className="break-keep">{base.dumpFormat}</p> : null}
                {base.note ? <p className="break-keep">{base.note}</p> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      <MarkdownBody markdown={patch.body} />
    </div>
  );
}
