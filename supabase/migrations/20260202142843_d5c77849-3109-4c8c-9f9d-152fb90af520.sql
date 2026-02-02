-- Fix corrupted topic descriptions (one-time restore of curated content)
UPDATE topics SET description = 'The mechanisms that maintain stable internal conditions through feedback loops involving sensors, control centers, and effectors.' WHERE id = '8a7a6405-bc64-43cf-89db-3b1d7094a7cb';

UPDATE topics SET description = 'The process by which cells receive and respond to external signals through receptor proteins and intracellular signaling cascades.' WHERE id = 'f7007245-7d25-4c9c-9a80-3264f5de289a';