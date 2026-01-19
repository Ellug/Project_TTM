# TTM (Team Task Manager)

## 한국어

### 개요
게임 개발 팀을 위한 실시간 태스크 코크핏입니다. 프로젝트 → 마일스톤 → 태스크
흐름으로 계획하고, 보드/테이블 뷰에서 작업을 관리합니다.

### 주요 기능
- 프로젝트 생성, 멤버 초대/역할 관리, 접근 제어
- 마일스톤 생성/편집 + 마감일 달력 하이라이트
- 태스크 칸반 보드 및 엑셀 스타일 테이블 뷰
- 드래그로 순서 변경, 필터/검색, 마크다운 디테일 패널, 태스크 마일스톤 이동
- CSV import: 기본 포맷 + 커스텀 포맷 저장/선택 + 매핑 미리보기
- CSV export: 마일스톤 태스크를 CSV로 내보내기 (order 순서, 파일명=마일스톤 타이틀)
- 프로필 사진 업로드 (Firebase Storage, 진행률 표시, 5MB 제한)
- 다크/라이트 테마 전환
- Discord 웹훅 알림 (프로젝트/마일스톤/태스크 변경)
- 프로젝트 게시판 (토글 UI, 카테고리 필터 시각 표시, 애니메이션, 태스크로 복사)
- 데일리 스크럼 (달력 기반 날짜 선택, 팀원별 보드, 텍스트/태스크 항목 추가, 태스크 클릭시 상세 패널)
- Firebase 실시간 동기화

### 기술 스택
- Next.js (App Router), React, TypeScript
- Firebase Auth + Firestore + Storage (realtime)
- Tailwind CSS (@theme inline) + next/font

### 데이터 모델
`users`, `projects`, `milestones`, `tasks`, `scrums`, `posts`, `users/{uid}/csvFormats`
자세한 구조는 `docs/db-schema.md` 참고.

## English

### Overview
Realtime task cockpit for game development teams. Plan work from projects to
milestones to tasks, and manage execution across board and table views.

### Features
- Project creation, member invites, role-based access control
- Milestone creation/editing + due-date calendar highlights
- Kanban board and Excel-style task table
- Drag ordering, filters/search, markdown task details, move tasks between milestones
- CSV import with default + custom formats and mapping preview
- CSV export: Export milestone tasks to CSV (sorted by order, filename=milestone title)
- Profile photo upload (Firebase Storage, progress tracking, 5MB limit)
- Dark/light theme toggle
- Discord webhook notifications for project/milestone/task changes
- Project board with toggle UI, category filter highlighting, animations, and task shortcut
- Daily scrum (calendar-based date selection, team member boards, text/task item entry, task click opens details panel)
- Firebase realtime sync

### Tech Stack
- Next.js (App Router), React, TypeScript
- Firebase Auth + Firestore + Storage (realtime)
- Tailwind CSS (@theme inline) + next/font

### Data Model
`users`, `projects`, `milestones`, `tasks`, `scrums`, `posts`, `users/{uid}/csvFormats`
See `docs/db-schema.md` for full structure.

