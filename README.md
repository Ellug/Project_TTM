# TTM (Team Task Manager)

## 한국어

### 개요
게임 개발 팀을 위한 실시간 태스크 코크핏입니다. 프로젝트 → 마일스톤 → 태스크
흐름으로 계획하고, 보드/테이블 뷰에서 작업을 관리합니다.

### 주요 기능
- 프로젝트 생성, 멤버 초대/역할 관리, 접근 제어
- 마일스톤 생성/편집 + 마감일 달력 하이라이트
- 태스크 칸반 보드 및 엑셀 스타일 테이블 뷰
- 드래그로 순서 변경, 필터/검색, 마크다운 디테일 패널
- CSV import: 기본 포맷 + 커스텀 포맷 저장/선택 + 매핑 미리보기
- 프로필 사진 업로드 (Firebase Storage, 진행률 표시, 5MB 제한)
- 다크/라이트 테마 전환
- Firebase 실시간 동기화

### 기술 스택
- Next.js (App Router), React, TypeScript
- Firebase Auth + Firestore + Storage (realtime)
- Tailwind CSS (@theme inline) + next/font

### 데이터 모델
`users`, `projects`, `milestones`, `tasks`, `users/{uid}/csvFormats`
자세한 구조는 `docs/db-schema.md` 참고.

## English

### Overview
Realtime task cockpit for game development teams. Plan work from projects to
milestones to tasks, and manage execution across board and table views.

### Features
- Project creation, member invites, role-based access control
- Milestone creation/editing + due-date calendar highlights
- Kanban board and Excel-style task table
- Drag ordering, filters/search, markdown task details
- CSV import with default + custom formats and mapping preview
- Profile photo upload (Firebase Storage, progress tracking, 5MB limit)
- Dark/light theme toggle
- Firebase realtime sync

### Tech Stack
- Next.js (App Router), React, TypeScript
- Firebase Auth + Firestore + Storage (realtime)
- Tailwind CSS (@theme inline) + next/font

### Data Model
`users`, `projects`, `milestones`, `tasks`, `users/{uid}/csvFormats`
See `docs/db-schema.md` for full structure.

