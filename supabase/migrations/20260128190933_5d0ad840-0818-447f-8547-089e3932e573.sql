-- Seed subjects
INSERT INTO public.subjects (id, name, color, image_url, textbook_title, textbook_image_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Microbiology', 'bg-navy-800', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=100&h=100&fit=crop', 'Microbiology with Diseases by Body System, 5th edition', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=200&h=250&fit=crop'),
('22222222-2222-2222-2222-222222222222', 'Chemistry', 'bg-navy-700', 'https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=100&h=100&fit=crop', 'Chemistry: The Central Science, 15th edition', 'https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=200&h=250&fit=crop'),
('33333333-3333-3333-3333-333333333333', 'Biology', 'bg-navy-800', 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=100&h=100&fit=crop', 'Campbell Biology, 12th edition', 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=200&h=250&fit=crop');

-- Seed chapters for Microbiology
INSERT INTO public.chapters (id, subject_id, chapter_number, title) VALUES
('c1111111-0001-4000-a000-000000000001', '11111111-1111-1111-1111-111111111111', 1, 'Ch. 1 - Introduction to Microbiology'),
('c1111111-0002-4000-a000-000000000002', '11111111-1111-1111-1111-111111111111', 2, 'Ch. 2 - Cell Structure and Function'),
('c1111111-0003-4000-a000-000000000003', '11111111-1111-1111-1111-111111111111', 3, 'Ch. 3 - Bacterial Genetics'),
('c1111111-0004-4000-a000-000000000004', '11111111-1111-1111-1111-111111111111', 4, 'Ch. 4 - Microbial Metabolism'),
('c1111111-0005-4000-a000-000000000005', '11111111-1111-1111-1111-111111111111', 5, 'Ch. 5 - Microbial Growth'),
('c1111111-0006-4000-a000-000000000006', '11111111-1111-1111-1111-111111111111', 6, 'Ch. 6 - Viruses and Prions'),
('c1111111-0007-4000-a000-000000000007', '11111111-1111-1111-1111-111111111111', 7, 'Ch. 7 - Control of Microbial Growth'),
('c1111111-0008-4000-a000-000000000008', '11111111-1111-1111-1111-111111111111', 8, 'Ch. 8 - Antimicrobial Drugs');

-- Seed chapters for Chemistry
INSERT INTO public.chapters (id, subject_id, chapter_number, title) VALUES
('c2222222-0009-4000-a000-000000000009', '22222222-2222-2222-2222-222222222222', 1, 'Ch. 1 - Matter and Measurements'),
('c2222222-0010-4000-a000-000000000010', '22222222-2222-2222-2222-222222222222', 2, 'Ch. 2 - Atoms, Molecules, and Ions'),
('c2222222-0011-4000-a000-000000000011', '22222222-2222-2222-2222-222222222222', 3, 'Ch. 3 - Stoichiometry'),
('c2222222-0012-4000-a000-000000000012', '22222222-2222-2222-2222-222222222222', 4, 'Ch. 4 - Reactions in Aqueous Solution'),
('c2222222-0013-4000-a000-000000000013', '22222222-2222-2222-2222-222222222222', 5, 'Ch. 5 - Thermochemistry'),
('c2222222-0014-4000-a000-000000000014', '22222222-2222-2222-2222-222222222222', 6, 'Ch. 6 - Electronic Structure of Atoms'),
('c2222222-0015-4000-a000-000000000015', '22222222-2222-2222-2222-222222222222', 7, 'Ch. 7 - Periodic Properties');

-- Seed chapters for Biology
INSERT INTO public.chapters (id, subject_id, chapter_number, title) VALUES
('c3333333-0016-4000-a000-000000000016', '33333333-3333-3333-3333-333333333333', 1, 'Ch. 1 - The Study of Life'),
('c3333333-0017-4000-a000-000000000017', '33333333-3333-3333-3333-333333333333', 2, 'Ch. 2 - The Chemical Foundation of Life'),
('c3333333-0018-4000-a000-000000000018', '33333333-3333-3333-3333-333333333333', 3, 'Ch. 3 - Biological Macromolecules'),
('c3333333-0019-4000-a000-000000000019', '33333333-3333-3333-3333-333333333333', 4, 'Ch. 4 - Cell Structure'),
('c3333333-0020-4000-a000-000000000020', '33333333-3333-3333-3333-333333333333', 5, 'Ch. 5 - Cell Membranes'),
('c3333333-0021-4000-a000-000000000021', '33333333-3333-3333-3333-333333333333', 6, 'Ch. 6 - Metabolism'),
('c3333333-0022-4000-a000-000000000022', '33333333-3333-3333-3333-333333333333', 7, 'Ch. 7 - Cellular Respiration'),
('c3333333-0023-4000-a000-000000000023', '33333333-3333-3333-3333-333333333333', 8, 'Ch. 8 - Photosynthesis');

-- Seed Microbiology topics
INSERT INTO public.topics (id, chapter_id, title, description, duration, audio_url) VALUES
('a0000001-0001-4000-a000-000000000001', 'c1111111-0001-4000-a000-000000000001', 'Introduction to Microbiology', 'Explore the microscopic world and learn about different types of microorganisms.', '10:32', '/mock-audio.mp3'),
('a0000002-0002-4000-a000-000000000002', 'c1111111-0001-4000-a000-000000000001', 'History of Microbiology', 'From Leeuwenhoek to modern genetics - the journey of discovery.', '9:15', '/mock-audio.mp3'),
('a0000003-0003-4000-a000-000000000003', 'c1111111-0002-4000-a000-000000000002', 'Bacterial Cell Structure', 'Learn the key components that make up bacterial cells.', '11:45', '/mock-audio.mp3'),
('a0000004-0004-4000-a000-000000000004', 'c1111111-0002-4000-a000-000000000002', 'Gram Staining Technique', 'Master the essential lab technique for classifying bacteria.', '8:30', '/mock-audio.mp3'),
('a0000005-0005-4000-a000-000000000005', 'c1111111-0003-4000-a000-000000000003', 'Bacterial Genetics', 'How bacteria replicate, mutate, and share genetic information.', '12:20', '/mock-audio.mp3'),
('a0000006-0006-4000-a000-000000000006', 'c1111111-0004-4000-a000-000000000004', 'Microbial Metabolism', 'How microbes obtain energy and build cellular components.', '13:10', '/mock-audio.mp3'),
('a0000007-0007-4000-a000-000000000007', 'c1111111-0005-4000-a000-000000000005', 'Bacterial Growth Phases', 'Understand the four phases of bacterial population growth.', '9:45', '/mock-audio.mp3'),
('a0000008-0008-4000-a000-000000000008', 'c1111111-0005-4000-a000-000000000005', 'Growth Requirements', 'What bacteria need to survive and multiply.', '10:15', '/mock-audio.mp3');

-- Seed Chemistry topics
INSERT INTO public.topics (id, chapter_id, title, description, duration, audio_url) VALUES
('a0000009-0009-4000-a000-000000000009', 'c2222222-0009-4000-a000-000000000009', 'Matter and Measurements', 'Foundations of chemistry - what matter is and how we measure it.', '10:05', '/mock-audio.mp3'),
('a0000010-0010-4000-a000-000000000010', 'c2222222-0009-4000-a000-000000000009', 'Significant Figures', 'How to express precision in scientific measurements.', '8:30', '/mock-audio.mp3'),
('a0000011-0011-4000-a000-000000000011', 'c2222222-0010-4000-a000-000000000010', 'Atomic Structure', 'Protons, neutrons, electrons - the building blocks of atoms.', '11:20', '/mock-audio.mp3'),
('a0000012-0012-4000-a000-000000000012', 'c2222222-0010-4000-a000-000000000010', 'Ions and Ionic Compounds', 'How atoms gain or lose electrons to form charged particles.', '10:45', '/mock-audio.mp3'),
('a0000013-0013-4000-a000-000000000013', 'c2222222-0011-4000-a000-000000000011', 'Stoichiometry Basics', 'Calculate quantities in chemical reactions using mole ratios.', '13:15', '/mock-audio.mp3'),
('a0000014-0014-4000-a000-000000000014', 'c2222222-0011-4000-a000-000000000011', 'The Mole Concept', 'Avogadros number and counting atoms by weighing.', '10:50', '/mock-audio.mp3'),
('a0000015-0015-4000-a000-000000000015', 'c2222222-0012-4000-a000-000000000012', 'Reactions in Solution', 'How reactions occur when substances dissolve in water.', '11:30', '/mock-audio.mp3'),
('a0000016-0016-4000-a000-000000000016', 'c2222222-0012-4000-a000-000000000012', 'Acids and Bases', 'Understanding pH and acid-base reactions.', '12:05', '/mock-audio.mp3');

-- Seed Biology topics
INSERT INTO public.topics (id, chapter_id, title, description, duration, audio_url) VALUES
('a0000017-0017-4000-a000-000000000017', 'c3333333-0016-4000-a000-000000000016', 'The Study of Life', 'What defines life and how biologists study living things.', '9:30', '/mock-audio.mp3'),
('a0000018-0018-4000-a000-000000000018', 'c3333333-0016-4000-a000-000000000016', 'Scientific Method', 'How biologists design experiments and test hypotheses.', '8:45', '/mock-audio.mp3'),
('a0000019-0019-4000-a000-000000000019', 'c3333333-0017-4000-a000-000000000017', 'Chemistry of Life', 'Water, carbon, and the chemical basis of living systems.', '11:20', '/mock-audio.mp3'),
('a0000020-0020-4000-a000-000000000020', 'c3333333-0018-4000-a000-000000000018', 'Biological Macromolecules', 'Carbohydrates, lipids, proteins, and nucleic acids.', '13:45', '/mock-audio.mp3'),
('a0000021-0021-4000-a000-000000000021', 'c3333333-0018-4000-a000-000000000018', 'Protein Structure', 'From amino acids to functional 3D proteins.', '12:10', '/mock-audio.mp3'),
('a0000022-0022-4000-a000-000000000022', 'c3333333-0019-4000-a000-000000000019', 'Cell Structure', 'Organelles and their functions in eukaryotic cells.', '11:30', '/mock-audio.mp3'),
('a0000023-0023-4000-a000-000000000023', 'c3333333-0020-4000-a000-000000000020', 'Cell Membrane Transport', 'How substances move in and out of cells.', '10:45', '/mock-audio.mp3'),
('a0000024-0024-4000-a000-000000000024', 'c3333333-0022-4000-a000-000000000022', 'Cellular Respiration', 'How cells extract energy from glucose.', '12:30', '/mock-audio.mp3');

-- Seed flash summaries for Microbiology topics
INSERT INTO public.flash_summaries (id, topic_id, visual_type, visual_content, bullet_points, difficulty) VALUES
('f0000001-0001-4000-a000-000000000001', 'a0000001-0001-4000-a000-000000000001', 'diagram', '🔬 Bacteria, Viruses, Fungi, Protozoa', ARRAY['Microorganisms are everywhere - in soil, water, air, and inside our bodies', 'Bacteria are single-celled organisms with no nucleus (prokaryotes)', 'Viruses are not truly alive - they need host cells to reproduce'], 'easy'),
('f0000002-0002-4000-a000-000000000002', 'a0000002-0002-4000-a000-000000000002', 'analogy', '📜 Germ Theory Revolution', ARRAY['Leeuwenhoek first observed animalcules with his handmade microscopes', 'Pasteur disproved spontaneous generation and developed pasteurization', 'Kochs postulates established how to prove a microbe causes disease'], 'easy'),
('f0000003-0003-4000-a000-000000000003', 'a0000003-0003-4000-a000-000000000003', 'diagram', '🦠 Cell Wall → Membrane → Cytoplasm', ARRAY['The cell wall provides shape and protection - differs between gram+ and gram-', 'Flagella enable movement; pili help attach to surfaces and transfer DNA', 'Ribosomes are smaller (70S) than eukaryotic ones - key for antibiotic targeting'], 'medium'),
('f0000004-0004-4000-a000-000000000004', 'a0000004-0004-4000-a000-000000000004', 'diagram', '🟣 Gram+ Purple | 🔴 Gram- Pink', ARRAY['Crystal violet stains all cells purple initially', 'Alcohol decolorizes thin-walled Gram-negative cells', 'Safranin counterstain makes Gram-negative cells appear pink'], 'easy'),
('f0000005-0005-4000-a000-000000000005', 'a0000005-0005-4000-a000-000000000005', 'diagram', '🧬 Chromosome + Plasmids', ARRAY['Bacteria have a single circular chromosome plus extra plasmids', 'Horizontal gene transfer spreads antibiotic resistance rapidly', 'Transformation, transduction, and conjugation are three ways bacteria share DNA'], 'hard'),
('f0000006-0006-4000-a000-000000000006', 'a0000006-0006-4000-a000-000000000006', 'formula', 'ATP = Cellular Energy Currency', ARRAY['Autotrophs make their own food; heterotrophs consume organic compounds', 'Aerobic respiration yields ~38 ATP; fermentation yields only 2 ATP', 'Some bacteria use unique pathways like chemolithotrophy'], 'hard'),
('f0000007-0007-4000-a000-000000000007', 'a0000007-0007-4000-a000-000000000007', 'diagram', '📈 Lag → Log → Stationary → Death', ARRAY['Lag phase: bacteria adapt to new environment, no division yet', 'Log phase: exponential growth with constant generation time', 'Stationary phase: nutrients deplete, growth equals death rate'], 'medium'),
('f0000008-0008-4000-a000-000000000008', 'a0000008-0008-4000-a000-000000000008', 'diagram', '🌡️ Temperature + pH + Oxygen', ARRAY['Most pathogens are mesophiles (grow at 20-40°C body temperature)', 'pH affects enzyme function - most bacteria prefer neutral pH', 'Aerobes need O₂; anaerobes are killed by it; facultatives can use both'], 'medium');

-- Seed flash summaries for Chemistry topics
INSERT INTO public.flash_summaries (id, topic_id, visual_type, visual_content, bullet_points, difficulty) VALUES
('f0000009-0009-4000-a000-000000000009', 'a0000009-0009-4000-a000-000000000009', 'diagram', '⚗️ Solid ↔ Liquid ↔ Gas', ARRAY['Matter is anything with mass and volume - exists in three main states', 'Physical changes dont alter chemical composition; chemical changes do', 'SI units provide a universal measurement system for science'], 'easy'),
('f0000010-0010-4000-a000-000000000010', 'a0000010-0010-4000-a000-000000000010', 'formula', '0.00340 = 3 sig figs', ARRAY['Leading zeros are never significant; trailing zeros after decimal are', 'In multiplication/division, answer has fewest sig figs of inputs', 'In addition/subtraction, answer matches fewest decimal places'], 'medium'),
('f0000011-0011-4000-a000-000000000011', 'a0000011-0011-4000-a000-000000000011', 'diagram', '⚛️ Nucleus: p⁺ + n⁰ | Shell: e⁻', ARRAY['Protons determine element identity; electrons determine chemistry', 'Isotopes have same protons but different neutrons', 'Atomic mass is weighted average of all natural isotopes'], 'medium'),
('f0000012-0012-4000-a000-000000000012', 'a0000012-0012-4000-a000-000000000012', 'analogy', '🔋 Cations (+) give | Anions (-) take', ARRAY['Metals lose electrons to form positive cations', 'Nonmetals gain electrons to form negative anions', 'Ionic compounds are neutral - charges must balance'], 'easy'),
('f0000013-0013-4000-a000-000000000013', 'a0000013-0013-4000-a000-000000000013', 'formula', 'mol ratio = coefficient ratio', ARRAY['Coefficients in balanced equations give mole ratios', 'Convert grams → moles → use ratio → convert back', 'Limiting reagent determines maximum product yield'], 'hard'),
('f0000014-0014-4000-a000-000000000014', 'a0000014-0014-4000-a000-000000000014', 'formula', '1 mol = 6.022 × 10²³ particles', ARRAY['A mole is a counting unit - 6.022 × 10²³ of anything', 'Molar mass equals atomic mass in grams per mole', 'Moles bridge the gap between atoms and grams'], 'medium'),
('f0000015-0015-4000-a000-000000000015', 'a0000015-0015-4000-a000-000000000015', 'diagram', '💧 Precipitation, Acid-Base, Redox', ARRAY['Soluble compounds dissociate into ions in water', 'Precipitation occurs when insoluble products form', 'Net ionic equations show only species that react'], 'medium'),
('f0000016-0016-4000-a000-000000000016', 'a0000016-0016-4000-a000-000000000016', 'diagram', 'pH 0 ←→ 7 ←→ 14', ARRAY['Acids donate H⁺; bases accept H⁺ (Brønsted-Lowry)', 'pH = -log[H⁺]; each unit is 10× difference', 'Neutralization: acid + base → salt + water'], 'medium');

-- Seed flash summaries for Biology topics
INSERT INTO public.flash_summaries (id, topic_id, visual_type, visual_content, bullet_points, difficulty) VALUES
('f0000017-0017-4000-a000-000000000017', 'a0000017-0017-4000-a000-000000000017', 'diagram', '🌱 7 Characteristics of Life', ARRAY['Living things: grow, reproduce, respond, use energy, maintain homeostasis', 'Biology uses scientific method: observe, hypothesize, experiment, conclude', 'Life is organized in levels: atoms → cells → organisms → ecosystems'], 'easy'),
('f0000018-0018-4000-a000-000000000018', 'a0000018-0018-4000-a000-000000000018', 'diagram', '🔬 Question → Hypothesis → Experiment → Analyze', ARRAY['A hypothesis is a testable prediction based on observation', 'Control groups eliminate variables except the one being tested', 'Theories are well-supported explanations; laws describe patterns'], 'easy'),
('f0000019-0019-4000-a000-000000000019', 'a0000019-0019-4000-a000-000000000019', 'analogy', '💧 Water = Universal Solvent', ARRAY['Waters polarity makes it excellent for dissolving ionic compounds', 'Hydrogen bonds give water high specific heat and surface tension', 'Carbons 4 bonds allow complex organic molecule construction'], 'medium'),
('f0000020-0020-4000-a000-000000000020', 'a0000020-0020-4000-a000-000000000020', 'diagram', '🧬 Carbs, Lipids, Proteins, Nucleic Acids', ARRAY['Carbohydrates store energy (starch) and provide structure (cellulose)', 'Proteins are polymers of amino acids; shape determines function', 'Nucleic acids (DNA/RNA) store and transmit genetic information'], 'medium'),
('f0000021-0021-4000-a000-000000000021', 'a0000021-0021-4000-a000-000000000021', 'diagram', '🔗 Primary → Secondary → Tertiary → Quaternary', ARRAY['Primary structure is the amino acid sequence', 'Secondary structures (α-helix, β-sheet) form from hydrogen bonds', 'Tertiary structure is the final 3D folded shape'], 'hard'),
('f0000022-0022-4000-a000-000000000022', 'a0000022-0022-4000-a000-000000000022', 'analogy', '🏭 Cell = Microscopic Factory', ARRAY['Nucleus houses DNA; ribosomes build proteins', 'Mitochondria are powerhouses producing ATP', 'ER and Golgi process and ship proteins'], 'easy'),
('f0000023-0023-4000-a000-000000000023', 'a0000023-0023-4000-a000-000000000023', 'diagram', '🚪 Passive vs Active Transport', ARRAY['Passive transport requires no energy - diffusion and osmosis', 'Active transport uses ATP to move against concentration gradient', 'Endocytosis brings large particles in; exocytosis pushes them out'], 'medium'),
('f0000024-0024-4000-a000-000000000024', 'a0000024-0024-4000-a000-000000000024', 'formula', 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP', ARRAY['Glycolysis in cytoplasm yields 2 ATP and pyruvate', 'Krebs cycle in mitochondria produces electron carriers', 'Electron transport chain generates most ATP (~34)'], 'hard');