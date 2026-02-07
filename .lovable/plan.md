
# Fix Trending Topics Count and Data

## Issues Identified

1. **Trending count shows "30"**: The count in `CoreConceptsHub` displays `trendingTopics.length` which shows 30 (the fetch limit) instead of the actual number of subject-filtered trending topics.

2. **Trending topics data is empty**: The `useTrendingTopics` hook ranks topics by completion counts in `user_progress`, but that table is currently empty. We need to seed it with demo data for topics at positions 1, 2, 3, 8, and 9 per subject.

---

## Implementation

### Part 1: Fix Dynamic Count Display

The count is already dynamic (line 230: `{trendingTopics.length}`), but the issue is that `subjectTrendingTopics` is passed correctly. The count will automatically show the correct number (5 per subject) once we have proper trending data.

No code changes needed here - the count will be correct after the data fix.

### Part 2: Seed Trending Data in Database

Insert fake `user_progress` entries to give the target topics high listen counts. Since RLS requires authenticated users, we'll insert with a placeholder UUID that represents demo/system data.

**Topics to make trending (15 total - 5 per subject):**

| Subject | Topic | ID |
|---------|-------|-----|
| Biology | Homeostatic Feedback (#1) | 8a7a6405-bc64-43cf-89db-3b1d7094a7cb |
| Biology | Signal Transduction (#2) | f7007245-7d25-4c9c-9a80-3264f5de289a |
| Biology | Hardy-Weinberg Equilibrium (#3) | a3491db6-da74-4473-9ca5-0e1875ce7d3f |
| Biology | The Calvin Cycle (#8) | 9f97e0e3-f0ec-4ba2-b0d1-1b48609ca691 |
| Biology | Epigenetics (#9) | 9172d397-99ea-4b01-9f04-eba2e3f9c79f |
| Chemistry | Stereochemistry (#1) | 2c556b80-0770-400f-bbb0-76ea49e493d4 |
| Chemistry | Quantum Mechanical Model (#2) | 02eb2f3a-c3e0-4d25-bffd-c9b17ccad9ee |
| Chemistry | Spectroscopy (#3) | 09293e95-074c-4d72-b98b-1058f12fe507 |
| Chemistry | Electrochemistry (#8) | 49f59742-0699-439c-9a10-c43839b85e3d |
| Chemistry | Chemical Equilibrium (#9) | 77474a09-8c72-4e10-955a-1a417f42c1c6 |
| Microbiology | Viral Replication Cycles (#1) | 9f05dff1-ebbd-4096-aef1-e335e3d0dfc7 |
| Microbiology | Horizontal Gene Transfer (#2) | d44d5117-8ee0-430b-ba3d-19ae87657138 |
| Microbiology | Virulence Factors (#3) | 1e1e2ec7-e395-40f2-a463-5e83b6a0e67e |
| Microbiology | Endospore Formation (#8) | 04762ddc-c0fe-4022-bdaa-de07567e1b84 |
| Microbiology | Quorum Sensing (#9) | d06e4807-1805-42cd-afc4-7fc97a748ba9 |

**SQL to insert demo progress data:**

We need to insert multiple `user_progress` records per topic with `completed = true` to give them listen counts. Higher counts for #1, 2, 3 topics, lower for #8, 9 to create ranking variation.

Since RLS restricts inserts to authenticated users (`auth.uid() = user_id`), we'll need to:
1. Temporarily add an RLS policy for service role or use a migration
2. Use a demo user UUID: `00000000-0000-0000-0000-000000000001`

---

## Technical Notes

- The trending count will show "5" per subject after data is seeded (5 trending topics each)
- The `useTrendingTopics(30)` limit is intentionally high to ensure all subjects' trending topics are fetched
- Ranking order will be determined by the number of `user_progress` records per topic

## Result

After implementation:
- Biology will show 5 trending topics: Homeostatic Feedback, Signal Transduction, Hardy-Weinberg Equilibrium, The Calvin Cycle, Epigenetics
- Chemistry will show 5 trending topics: Stereochemistry, Quantum Mechanical Model, Spectroscopy, Electrochemistry, Chemical Equilibrium
- Microbiology will show 5 trending topics: Viral Replication Cycles, Horizontal Gene Transfer, Virulence Factors, Endospore Formation, Quorum Sensing
- The count badge will dynamically show "5" instead of "30"
