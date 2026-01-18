# ClaudeTask Reference - TTM (Team Task Manager)

> **Quick Reference Document for AI-Assisted Development**
> Last Updated: 2026-01-18

---

## 🎯 Project Overview

**TTM** is a real-time task management application for game development teams with hierarchical structure (Projects → Milestones → Tasks), collaborative features, and CSV import capabilities.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Firebase 12 (Auth + Firestore + Storage), Tailwind CSS 4

---

## 📁 Quick File Locations

### Core Configuration
- **Firebase Config:** `src/lib/firebase.ts`
- **Type Definitions:** `src/lib/types.ts`
- **Constants/Enums:** `src/lib/constants.ts`
- **Utils:** `src/lib/utils.ts`, `src/lib/permissions.ts`
- **Global Styles:** `src/app/globals.css`
- **Path Alias:** `@/*` → `src/*`

### Services (Firestore CRUD + Storage)
```
src/lib/services/
├── ProjectService.ts      # Projects, members, invites
├── MilestoneService.ts    # Milestones
├── TaskService.ts         # Tasks
├── UserService.ts         # User profiles, email lookup, photo upload
└── CsvFormatService.ts    # CSV format templates
```

### Custom Hooks (Data Fetching)
```
src/lib/hooks/
├── useProjects.ts         # User's projects (real-time)
├── useProject.ts          # Single project
├── useMilestones.ts       # Project's milestones
├── useMilestone.ts        # Single milestone
├── useTasks.ts            # Milestone's tasks (real-time)
└── useMembers.ts          # Member profiles batch fetch
```

### Pages (App Router)
```
src/app/
├── page.tsx                                    # Landing (/)
├── profile/page.tsx                            # User profile + photo upload
├── projects/page.tsx                           # Projects list
├── projects/[projectId]/milestones/page.tsx    # Milestones + calendar
└── projects/[projectId]/milestones/[milestoneId]/page.tsx  # Tasks (board/table)
```

### Components (Atomic Design)
```
src/components/
├── atoms/           # Basic UI: Button, Card, Chip, Avatar, InputField, etc.
├── molecules/       # FormField, ThemeToggle
├── organisms/       # Feature components (see breakdown below)
└── providers/       # AuthProvider, ThemeProvider
```

---

## 🔑 Key Service Methods

### ProjectService ([ProjectService.ts](src/lib/services/ProjectService.ts))

```typescript
// Real-time subscriptions
subscribeProjectsForUser(userId, callback)  // All user's projects
subscribeProject(projectId, callback)       // Single project

// CRUD
createProject({name, description, ownerId})
updateProject(projectId, updates)
touchProject(projectId)  // Update timestamp
deleteProjectCascade(projectId)  // Deletes milestones + tasks

// Members
inviteMemberByEmail(projectId, email)  // Find by email → add to project
updateMemberRole(projectId, memberId, role)
removeMember(projectId, memberId)
```

**Firestore Path:** `projects/{projectId}`

---

### MilestoneService ([MilestoneService.ts](src/lib/services/MilestoneService.ts))

```typescript
subscribeMilestone(projectId, milestoneId, callback)
subscribeMilestones(projectId, callback)

createMilestone(projectId, {title, description, status, dueDate})
updateMilestone(projectId, milestoneId, updates)
deleteMilestoneCascade(projectId, milestoneId)  // Deletes tasks

fetchMilestoneTasks(projectId, milestoneId)  // One-time fetch
```

**Firestore Path:** `projects/{projectId}/milestones/{milestoneId}`
**Status Values:** `"Planned"`, `"Active"`, `"Complete"`

---

### TaskService ([TaskService.ts](src/lib/services/TaskService.ts))

```typescript
subscribeTasks(projectId, milestoneId, callback)  // Real-time

createTask(projectId, milestoneId, {...taskData})
updateTask(projectId, milestoneId, taskId, updates)
deleteTask(projectId, milestoneId, taskId)
deleteTasksForMilestone(projectId, milestoneId)  // Batch delete
```

**Firestore Path:** `projects/{projectId}/milestones/{milestoneId}/tasks/{taskId}`
**Default Order:** By `order` field (descending)

**Task Statuses:** `"Backlog"`, `"In Progress"`, `"Review"`, `"Done"`
**Task Priorities:** `"Low"`, `"Medium"`, `"High"`

---

### UserService ([UserService.ts](src/lib/services/UserService.ts))

```typescript
fetchProfiles(userIds)  // Batch fetch by UID array
findByEmail(email)      // Search by email (returns UserProfile | null)

subscribeAllUsers(callback)  // Real-time (cached globally)
fetchAllUsers()              // One-time fetch

// Profile photo management (Firebase Storage)
uploadProfilePhoto(uid, file, onProgress?)  // Upload with progress tracking
deleteProfilePhoto(uid)                      // Clear photoURL

updateProfile(uid, {nickname, photoURL})
deleteUser(firebaseUser)  // Requires recent auth
```

**Firestore Path:** `users/{uid}`
**Storage Path:** `profile-photos/{uid}/avatar.{ext}`
**Caching:** Global cache with subscriber pattern for all users
**Photo Constraints:** Max 5MB, JPEG/PNG/GIF/WEBP only

---

### CsvFormatService ([CsvFormatService.ts](src/lib/services/CsvFormatService.ts))

```typescript
subscribeFormats(userId, callback)  // User's saved formats
createFormat(userId, {name, hasHeader, columns})
deleteFormat(userId, formatId)
```

**Firestore Path:** `users/{uid}/csvFormats/{formatId}`
**Columns:** `{scene?, category?, feature?, detail?, logic?, progress?, result?}`

---

## 🧩 Component Breakdown

### Organisms - Projects
- **[ProjectCard.tsx](src/components/organisms/projects/ProjectCard.tsx)** - Project card in grid
- **[ProjectCreateForm.tsx](src/components/organisms/projects/ProjectCreateForm.tsx)** - Create project form
- **[ProjectHeader.tsx](src/components/organisms/projects/ProjectHeader.tsx)** - Project title + actions
- **[ProjectImportPanel.tsx](src/components/organisms/projects/ProjectImportPanel.tsx)** - CSV import wizard
- **[ProjectMembersPanel.tsx](src/components/organisms/projects/ProjectMembersPanel.tsx)** - Member management panel

### Organisms - Milestones
- **[MilestoneCard.tsx](src/components/organisms/milestones/MilestoneCard.tsx)** - Milestone card
- **[MilestoneCalendar.tsx](src/components/organisms/milestones/MilestoneCalendar.tsx)** - Calendar view
- **[MilestoneCreateForm.tsx](src/components/organisms/milestones/MilestoneCreateForm.tsx)** - Create form
- **[MilestoneHeader.tsx](src/components/organisms/milestones/MilestoneHeader.tsx)** - Title + actions

### Organisms - Tasks
- **[TaskBoard.tsx](src/components/organisms/tasks/TaskBoard.tsx)** - Kanban board view
- **[TaskCard.tsx](src/components/organisms/tasks/TaskCard.tsx)** - Individual task card
- **[TaskCreateForm.tsx](src/components/organisms/tasks/TaskCreateForm.tsx)** - Create task form
- **[TaskDetailsPanel.tsx](src/components/organisms/tasks/TaskDetailsPanel.tsx)** - Edit drawer (markdown support)
- **[TaskFilters.tsx](src/components/organisms/tasks/TaskFilters.tsx)** - Filter/search controls
- **[TaskTable.tsx](src/components/organisms/tasks/TaskTable.tsx)** - Excel-style table view

### Organisms - Auth & Layout
- **[AppShell.tsx](src/components/organisms/AppShell.tsx)** - Main layout wrapper with header
- **[AuthPanel.tsx](src/components/organisms/AuthPanel.tsx)** - Login/signup form
- **[AuthGate.tsx](src/components/organisms/AuthGate.tsx)** - Route protection wrapper
- **[ProfileEditForm.tsx](src/components/organisms/ProfileEditForm.tsx)** - Profile editor with photo upload (progress bar, remove option)

---

## 🔐 Authentication & Context

### AuthProvider ([AuthProvider.tsx](src/components/providers/AuthProvider.tsx))

**Context Type:**
```typescript
{
  user: FirebaseUser | null;           // Firebase Auth user
  profile: UserProfile | null;         // Firestore profile
  loading: boolean;
  signOutUser: () => Promise<void>;
  isConfigured: boolean;               // Firebase config check
}
```

**Usage:** `const { user, profile } = useAuth();`

**Auto-sync Features:**
- Syncs Google profile photo to Firestore on login
- Real-time profile subscription
- Auto-creates Firestore profile for new users

---

### ThemeProvider ([ThemeProvider.tsx](src/components/providers/ThemeProvider.tsx))

**Context Type:**
```typescript
{
  theme: "dark" | "light";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}
```

**Usage:** `const { theme, toggleTheme } = useTheme();`

**Persistence:** localStorage + `document.documentElement.dataset.theme`

---

## 📊 Database Schema (Firestore + Storage)

### Firestore Collections

```
users/{uid}
  ├── uid: string
  ├── email: string
  ├── displayName: string
  ├── nickname: string
  ├── photoURL: string
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp

users/{uid}/csvFormats/{formatId}  📎 Subcollection
  ├── name: string
  ├── hasHeader: boolean
  ├── columns: {scene?, category?, feature?, detail?, logic?, progress?, result?}
  ├── ownerId: string
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp

projects/{projectId}
  ├── name: string
  ├── description: string
  ├── ownerId: string
  ├── memberIds: string[]
  ├── memberRoles: {[uid]: "owner"|"admin"|"editor"|"viewer"}
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp

projects/{projectId}/milestones/{milestoneId}  📎 Subcollection
  ├── title: string
  ├── description: string
  ├── status: "Planned"|"Active"|"Complete"
  ├── dueDate: string  (ISO format)
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp

projects/{projectId}/milestones/{milestoneId}/tasks/{taskId}  📎 Subcollection
  ├── title: string
  ├── description: string  (Markdown)
  ├── status: "Backlog"|"In Progress"|"Review"|"Done"
  ├── priority: "Low"|"Medium"|"High"
  ├── completed: boolean
  ├── assigneeIds: string[]
  ├── labels: string[]
  ├── order: number  (for drag-drop ordering)
  ├── dueDate: string  (ISO format)
  ├── creatorId: string
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp
```

### Firebase Storage Structure

```
profile-photos/{uid}/avatar.{ext}
  └── User profile photos (max 5MB, JPEG/PNG/GIF/WEBP)
```

---

## 🔒 Permission System

### Role Hierarchy ([permissions.ts](src/lib/permissions.ts))

```typescript
type MemberRole = "owner" | "admin" | "editor" | "viewer"
```

**Access Levels:**
- **Viewer:** Read-only access to all content
- **Editor:** Can create/edit tasks, milestones, content
- **Admin:** Same as editor (reserved for future features)
- **Owner:** Full control + delete project + manage members

**Helper Functions:**
```typescript
resolveMemberRole(project, userId) → MemberRole
canEditProjectContent(role) → boolean  // false for "viewer"
```

**Member Management (Owner Only):**
- Invite by email
- Change roles
- Remove members

---

## 🛠️ Utility Functions

### Date Formatting ([utils.ts](src/lib/utils.ts))
```typescript
toDateString(value?: Timestamp | string) → string
// Example: "Jan 15, 2024" or "No date"
```

### Avatar Initials ([utils.ts](src/lib/utils.ts))
```typescript
getInitials(name: string) → string
// Example: "John Doe" → "JD"
```

### CSV Parsing ([customCsv.ts](src/lib/importers/customCsv.ts))
```typescript
parseCsvWithFormat(csvText: string, format: CsvFormatDefinition)
  → {tasks: ParsedCsvTask[]}
```

**Progress Mapping:**
- `"complete"`, `"done"` → `{status: "Done", completed: true}`
- `"review"` → `{status: "Review", completed: false}`
- `"develop"`, `"progress"` → `{status: "In Progress", completed: false}`
- `"ready"`, `"todo"` → `{status: "Backlog", completed: false}`

---

## 🎨 Styling System

### Theme Variables ([globals.css](src/app/globals.css))

**Dark Mode (Default):**
```css
--bg: #07090d           /* Main background */
--surface: #0f1219      /* Primary surface */
--surface-2: #141926
--surface-3: #1a2133

--text: #f5f7ff         /* Primary text */
--muted: #9aa6bf        /* Secondary text */

--accent: #6ee7ff       /* Cyan */
--accent-2: #9b8bff     /* Purple */
--success: #39d98a      /* Green */
--danger: #ff7a7a       /* Red */
--warning: #f2c94c      /* Yellow */
```

**Light Mode:** Inverted color scheme

**Custom Properties:**
- `--app-header-height: 72px`
- `--task-panel-width: 840px`
- `--shadow`, `--ring`, `--accent-fill` for consistent styling

---

## 🚀 Common Development Patterns

### Real-time Data Flow
```typescript
// 1. Service subscribes to Firestore
ProjectService.subscribeProjectsForUser(userId, callback)

// 2. Hook wraps service with React state
const useProjects = (userId) => {
  const [projects, setProjects] = useState([])
  useEffect(() => {
    return ProjectService.subscribeProjectsForUser(userId, setProjects)
  }, [userId])
  return projects
}

// 3. Component uses hook
const MyComponent = () => {
  const { user } = useAuth()
  const projects = useProjects(user?.uid)
  return <div>{projects.map(...)}</div>
}
```

### Protected Route Pattern
```typescript
// Wrap page with AuthGate
export default function ProjectsPage() {
  return (
    <AuthGate>
      <AppShell>
        {/* Page content */}
      </AppShell>
    </AuthGate>
  )
}
```

### CSV Import Flow
1. User selects CSV file
2. User chooses saved format OR creates new mapping
3. Preview parsed tasks
4. Import creates tasks sequentially (with `order` field)
5. Optionally save format for future use

### Drag-Drop Ordering
- Tasks have `order` field (float timestamp)
- On drop, calculate new order between neighbors
- Update via `TaskService.updateTask()`
- Real-time subscription updates UI

### Profile Photo Upload Flow
```typescript
// 1. User selects file in ProfileEditForm
// 2. Validate file (type + size)
// 3. Upload to Firebase Storage with progress tracking
const photoURL = await UserService.uploadProfilePhoto(uid, file, onProgress)
// 4. Update profile with new photoURL
await UserService.updateProfile(uid, { nickname, photoURL })
// 5. Avatar updates immediately via real-time subscription
```

---

## ⚠️ Known Limitations & Risks

### Performance Risks
- **Global User Subscription:** `UserService.subscribeAllUsers()` can be expensive at scale
  - **Solution:** Replace with server-side search + pagination
- **Sequential CSV Import:** Creates tasks one-by-one
  - **Solution:** Use `writeBatch()` for bulk operations

### Security Gaps
- **UI-only Permissions:** Role checks only in frontend
  - **Required:** Firestore security rules enforcement
- **No Server Validation:** All writes direct to Firestore
  - **Required:** Cloud Functions for validation

### UX Gaps
- No virtualization for large task/member lists
- No CSV format editing (must delete + recreate)
- No sample row preview in CSV import

---

## 📝 Future Enhancement Ideas

### High Priority
- [ ] Implement Firestore security rules (role-based)
- [ ] Batch CSV import with `writeBatch()`
- [ ] Replace global user subscription with search API
- [ ] Virtualize long task/member lists

### Feature Additions
- [ ] Milestone timeline/Gantt view
- [ ] Task templates and recurring tasks
- [ ] Notifications (due soon, mentions, status changes)
- [ ] Activity log and comments per task
- [ ] CSV export functionality
- [ ] Integrations (Google Sheets, Jira, Trello)

### UX Improvements
- [ ] Persist board/table view preference per milestone
- [ ] Column pinning/sorting in table view
- [ ] Due-soon badges on task cards
- [ ] Sample row preview in CSV formats
- [ ] Recent/pinned suggestions in member autocomplete

---

## 🔍 Quick Troubleshooting

### Firebase Not Configured
**Error:** `isFirebaseConfigured === false`
**Solution:** Check `.env.local` has all `NEXT_PUBLIC_FIREBASE_*` variables

### Tasks Not Updating
**Issue:** Real-time updates not working
**Check:**
1. Firestore connection active?
2. `subscribeTasks()` cleanup on unmount?
3. Console errors for permission denied?

### CSV Import Fails
**Issue:** Tasks not created from CSV
**Debug:**
1. Check CSV format column mapping
2. Verify `hasHeader` setting matches file
3. Look for parsing errors in console

### Theme Not Persisting
**Issue:** Theme resets on refresh
**Check:**
1. localStorage working?
2. `ThemeProvider` wraps app root?
3. Browser incognito mode blocking storage?

### Profile Photo Upload Fails
**Issue:** Photo not uploading
**Check:**
1. File size under 5MB?
2. File type is JPEG/PNG/GIF/WEBP?
3. Firebase Storage rules configured?
4. `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` set in `.env.local`?

---

## 📚 File Count Summary

- **Total Files:** 58 TypeScript/TSX
- **Services:** 5
- **Hooks:** 6
- **Pages:** 5 (including profile)
- **Components:** 49 (14 atoms, 2 molecules, 31 organisms, 2 providers)
- **Collections:** 3 root + 3 subcollections
- **Storage Buckets:** 1 (profile-photos)

---

## 🎯 Quick Command Reference

```bash
# Development
npm run dev              # Start Next.js dev server (port 3000)

# Production
npm run build           # Build for production
npm run start           # Start production server

# Linting
npm run lint            # Run ESLint
```

---

**End of ClaudeTask Reference**
