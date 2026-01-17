# ForgeFlow

Dark-mode task cockpit for game development teams. Plan projects, break work
into milestones, and manage tasks with markdown details, assignees, and
realtime updates.

## Features
- Title (login) → Projects → Milestones flow
- Firebase Auth + Firestore user profiles (nickname + photo URL)
- Project membership gating and Firestore security rules
- Task cards with status, priority, due date, assignees, and markdown details
- Filters for status, priority, and assignee

## Setup
1. Copy `.env.local.example` to `.env.local` and add your Firebase config.
2. Create a Firebase project with Email/Password Authentication and Firestore enabled.
3. Apply the rules from `firestore.rules` to your Firestore instance.

## Dev
```bash
npm run dev
```

## Data model
See `docs/db-schema.md` for the Firestore structure and access notes.
