"use client";

import { AuthPanel } from "@/components/organisms/AuthPanel";
import { Card } from "@/components/atoms/Card";
import { Panel } from "@/components/atoms/Panel";

export default function Home() {
  return (
    <div className="flex w-full flex-col items-center justify-center p-4">
      {/* Hero Section */}
      <div className="my-12 flex max-w-4xl flex-col items-center text-center animate-rise-in">
        <h1 className="text-5xl font-bold tracking-tight text-[var(--text)] sm:text-6xl">
          Team Task Manager
        </h1>
        <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
          효율적인 팀 협업을 위한 최고의 선택. 프로젝트 생성부터 마일스톤 관리,
          개별 태스크까지.
          <br />
          지금 바로 시작하여 팀의 생산성을 한 단계 높여보세요.
        </p>
      </div>

      {/* Auth Panel */}
      <div className="w-full max-w-md animate-fade-in">
        <AuthPanel />
      </div>

      {/* Feature Grid Section */}
      <div className="mt-24 w-full max-w-6xl animate-fade-in">
        <h2 className="mb-8 text-center text-3xl font-semibold text-[var(--text)]">
          주요 기능
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              체계적인 관리
            </h3>
            <ul className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--accent)]" />
                멤버 전용 접근 권한 및 마일스톤 게이트가 있는 프로젝트 대시보드.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--accent-2)]" />
                우선순위, 라벨, 담당자가 포함된 마크다운 기반 태스크 카드.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--success)]" />
                모든 팀원을 위한 실시간 업데이트.
              </li>
            </ul>
          </Card>
          <Panel className="p-6">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              추천 워크플로우
            </h3>
            <div className="mt-4 grid gap-4 text-sm text-[var(--muted)]">
              <div>
                <p className="font-medium text-[var(--text)]">
                  스프린트 마일스톤
                </p>
                <p>
                  작업 단위를 마일스톤으로 나누고 각 스프린트 범위에 맞게 태스크를
                  유지하세요.
                </p>
              </div>
              <div>
                <p className="font-medium text-[var(--text)]">기능 단위 조직</p>
                <p>
                  명확한 소유권과 우선순위 신호로 태스크를 각 기능 팀에
                  할당하세요.
                </p>
              </div>
            </div>
          </Panel>
          <Panel className="p-6 text-sm text-[var(--muted)]">
            <h3 className="text-lg font-semibold text-[var(--text)]">
              빠른 시작 가이드
            </h3>
            <p className="mt-4">
              프로젝트를 만들고, 팀원을 초대한 후, 각 마일스톤 내에 태스크를
              구성하세요.
            </p>
            <p className="mt-2 font-medium">
              프로젝트 → 마일스톤 → 태스크 순서로 진행됩니다.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
