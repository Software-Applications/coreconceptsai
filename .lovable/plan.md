

## Add Textbook Page References to Videos and Practice

Integrate contextual textbook page references into study tools, allowing students to quickly see which textbook sections correspond to each video and practice set.

---

### Overview

Students often need to cross-reference videos and practice questions with their textbook. By showing page references directly on cards and in detail sheets, we create a seamless bridge between the app's study tools and the physical/digital textbook.

---

### Proposed Design

**On Cards (Compact Hint):**
```text
┌─────────────────────────────────────────┐
│  [Video Thumbnail]                      │
│  ▶ Cell Division & Mitosis              │
│  By Dr. Maria Santos                    │
│  📖 pp. 245-268                         │
└─────────────────────────────────────────┘
```

**In Detail Sheets (Expanded Reference):**
```text
┌─────────────────────────────────────────┐
│  📖 Textbook Reference                  │
│  ─────────────────────────────────────  │
│  Campbell Biology, 12th Ed.             │
│  Chapter 9: Cell Division               │
│  Pages 245-268                          │
│                                         │
│  [Open Textbook →]                      │
└─────────────────────────────────────────┘
```

---

### Data Model Changes

**Option A: Static Data (Recommended for MVP)**
Add page references directly to `courseData.ts`:

```typescript
export interface VideoTile {
  id: number;
  subjectId: number;
  title: string;
  author: string;
  duration: string;
  // ... existing fields
  textbookPages?: string;      // e.g., "pp. 245-268"
  textbookChapter?: string;    // e.g., "Chapter 9"
}

export interface PracticeTile {
  id: number;
  subjectId: number;
  title: string;
  // ... existing fields
  textbookPages?: string;
  textbookChapter?: string;
}
```

**Option B: Database-Driven (Future Enhancement)**
Add columns to a future `videos` and `practice_sets` table in Supabase for dynamic management.

---

### UI Changes

#### 1. VideoCard Component (`src/components/VideoCard.tsx`)

Add a subtle page reference below the author name:

```text
Lines 64-67, after author line:
+ {video.textbookPages && (
+   <p className="text-muted-foreground/70 text-xs flex items-center gap-1">
+     <BookOpen className="w-3 h-3" />
+     {video.textbookPages}
+   </p>
+ )}
```

#### 2. PracticeCard Component (`src/components/PracticeCard.tsx`)

Add page reference in the metadata section below the card:

```text
Lines 59-62, after estimated time:
+ {practice.textbookPages && (
+   <p className="text-muted-foreground/70 text-xs flex items-center gap-1">
+     <BookOpen className="w-3 h-3" />
+     {practice.textbookPages}
+   </p>
+ )}
```

#### 3. VideoPlayerSheet Component (`src/components/VideoPlayerSheet.tsx`)

Add a textbook reference card after the Key Points section:

```text
New section after Key Points (around line 130):
+ {/* Textbook Reference */}
+ {video.textbookPages && (
+   <div className="bg-accent/50 border border-border rounded-xl p-4 mx-4 mb-4">
+     <div className="flex items-center gap-2 mb-2">
+       <BookOpen className="w-4 h-4 text-primary" />
+       <h3 className="font-semibold text-foreground text-sm">Textbook Reference</h3>
+     </div>
+     <p className="text-sm text-muted-foreground">
+       {video.textbookChapter && <span>{video.textbookChapter} • </span>}
+       {video.textbookPages}
+     </p>
+   </div>
+ )}
```

#### 4. PracticeQuizSheet Component (`src/components/PracticeQuizSheet.tsx`)

Add textbook reference after the study tip:

```text
New section after study tip (around line 150):
+ {/* Textbook Reference */}
+ {quiz.textbookPages && (
+   <div className="bg-accent/50 border border-border rounded-xl p-4 mb-4">
+     <div className="flex items-center gap-2 mb-2">
+       <BookOpen className="w-4 h-4 text-primary" />
+       <h3 className="font-semibold text-foreground text-sm">Review in Textbook</h3>
+     </div>
+     <p className="text-sm text-muted-foreground">
+       {quiz.textbookChapter && <span>{quiz.textbookChapter} • </span>}
+       {quiz.textbookPages}
+     </p>
+   </div>
+ )}
```

---

### Sample Data Updates

**File: `src/data/courseData.ts`**

```typescript
// Biology Videos
{ 
  id: 10, 
  subjectId: 3,
  title: "Cell Division & Mitosis", 
  author: "Dr. Maria Santos", 
  duration: "19:28",
  textbookPages: "pp. 245-268",
  textbookChapter: "Chapter 9",
  // ... rest of fields
},

// Biology Practice
{ 
  id: 10, 
  subjectId: 3, 
  title: "Cell Biology Basics", 
  questions: 20, 
  difficulty: "Easy",
  textbookPages: "pp. 95-142",
  textbookChapter: "Chapter 4-5",
  // ... rest of fields
},
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/data/courseData.ts` | Add `textbookPages` and `textbookChapter` to interfaces and sample data |
| `src/components/VideoCard.tsx` | Add page reference hint below author |
| `src/components/PracticeCard.tsx` | Add page reference hint below estimated time |
| `src/components/VideoPlayerSheet.tsx` | Add textbook reference card section |
| `src/components/PracticeQuizSheet.tsx` | Add textbook reference card section |

---

### Visual Hierarchy

The page references use:
- **Muted styling** (`text-muted-foreground/70`) to avoid competing with primary content
- **Small book icon** (`BookOpen` at `w-3 h-3`) for quick recognition
- **Compact format** ("pp. 245-268") to minimize space usage

This ensures the textbook references are discoverable but don't distract from the main study experience.

