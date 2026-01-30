

## Smart Topic Search with Priority-Based Results

### Overview
Transform the current simple text search into an intelligent two-tier search system that shows:
1. **Direct Hits** - Exact keyword matches (high precision)
2. **You might also be interested in** - Semantically related topics (high recall via LSI)

### Current State
The search currently uses simple `includes()` matching on title and description, returning all matches in a flat list within their chapter groups.

### Solution Architecture

```text
+------------------+     +-------------------+     +------------------+
| User Query       | --> | Search Engine     | --> | Prioritized      |
| "bacteria"       |     | (Client-side)     |     | Results UI       |
+------------------+     +-------------------+     +------------------+
                               |
                    +----------+----------+
                    |                     |
            +-------v-------+     +-------v-------+
            | Priority 1    |     | Priority 2    |
            | Exact Match   |     | LSI/Semantic  |
            +---------------+     +---------------+
            | Title match   |     | Same chapter  |
            | Keyword in    |     | Related terms |
            | description   |     | Bullet points |
            +---------------+     +---------------+
```

### Implementation Approach

**Option A: Client-Side LSI (Recommended)**
Build a lightweight keyword-synonym map and use chapter/subject grouping for semantic relationships. Fast, no API calls needed.

**Option B: AI-Powered Semantic Search**
Call Lovable AI to expand search terms with synonyms and related concepts. More accurate but adds latency.

I recommend **Option A** for instant results with Option B as a future enhancement.

---

### Phase 1: Create Search Utilities

**New File: `src/lib/topicSearch.ts`**

Create a dedicated search module with:

1. **Keyword Extraction** - Split query into meaningful terms
2. **Exact Match Scoring** - Higher score for title matches vs description matches
3. **Semantic Relationship Detection**:
   - Topics in the same chapter (related concepts)
   - Topics sharing keywords in bullet points
   - Topics with related visual types (formula topics link to other formula topics)
4. **Domain Synonym Map** - Educational term relationships:
   - "bacteria" → "microbial", "cell", "gram"
   - "atom" → "molecule", "ion", "electron"
   - "cell" → "membrane", "nucleus", "organelle"

---

### Phase 2: Update TopicSelectionSheet

**File: `src/components/TopicSelectionSheet.tsx`**

Replace the simple `filteredTopics` logic with the new search engine:

1. **Debounce Search** - 150ms delay to avoid excessive re-renders
2. **Categorize Results**:
   - `directHits`: Topics with exact keyword matches
   - `relatedTopics`: Semantically related but no exact match
3. **Update UI** to show two sections when searching:
   - "Direct Hits" section header with match count
   - "You might also be interested in" section header

---

### Phase 3: Update UI Components

**File: `src/components/topic-selection/index.ts`**

Export a new `SearchResultsSection` component.

**New Component: `src/components/topic-selection/SearchResultsSection.tsx`**

Create a section component that:
- Shows section headers ("Direct Hits", "Related Topics")
- Displays topics without chapter grouping (flat list for search results)
- Maintains highlight functionality for matched keywords
- Shows relevance indicators (optional: match badges)

---

### Technical Details

#### Scoring Algorithm

```text
Score Calculation:
-----------------
Title exact match:       +100 points
Title partial match:      +50 points
Description keyword:      +25 points
Bullet point match:       +15 points
Same chapter as hit:      +10 points (semantic)
Synonym match:             +8 points (semantic)
Same subject:              +5 points (semantic)

Direct Hit threshold:    >= 25 points
Related threshold:       >= 5 points (but < 25)
```

#### Synonym/Related Terms Map

```typescript
const semanticRelations: Record<string, string[]> = {
  // Microbiology
  "bacteria": ["bacterial", "microbial", "microbe", "cell", "gram", "pathogen"],
  "virus": ["viral", "pathogen", "infection", "prion"],
  "cell": ["cellular", "membrane", "nucleus", "structure", "organelle"],
  "growth": ["growth phases", "reproduction", "division", "metabolism"],
  
  // Chemistry  
  "atom": ["atomic", "electron", "proton", "neutron", "nucleus", "ion"],
  "molecule": ["molecular", "compound", "bond", "covalent", "ionic"],
  "reaction": ["reactions", "aqueous", "acid", "base", "oxidation"],
  
  // Biology
  "protein": ["amino acid", "macromolecule", "enzyme", "structure"],
  "respiration": ["cellular", "ATP", "metabolism", "energy", "glucose"],
  "membrane": ["transport", "osmosis", "diffusion", "cell"],
};
```

---

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/topicSearch.ts` | Create | Search engine with scoring and LSI |
| `src/components/topic-selection/SearchResultsSection.tsx` | Create | Two-tier results display |
| `src/components/topic-selection/index.ts` | Modify | Export new component |
| `src/components/TopicSelectionSheet.tsx` | Modify | Integrate new search engine |
| `src/hooks/useTopics.ts` | Modify | Include chapter and flash_summary data for semantic matching |

---

### User Experience Flow

1. User types "cell" in search box
2. After 150ms debounce:
   - **Direct Hits** section shows:
     - "Cell Structure" (title match)
     - "Bacterial Cell Structure" (title match)
     - "Cell Membrane Transport" (title match)
   - **You might also be interested in** section shows:
     - "Cellular Respiration" (related via "cellular")
     - "Biological Macromolecules" (same chapter context)
     - Topics with bullet points mentioning "cell"

3. Empty states:
   - No direct hits → Show only "You might also be interested in"
   - No results at all → Show "No topics found" with suggestions

---

### Edge Cases

- **Single character queries**: Require minimum 2 characters
- **Very common terms**: Limit semantic results to top 5 to avoid overwhelming
- **No matches**: Suggest browsing by chapter instead
- **Special characters**: Strip punctuation before matching

