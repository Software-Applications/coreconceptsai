UPDATE subjects
SET textbook_image_url = CASE name
  WHEN 'Biology' THEN '/images/biology-cover-ai.png'
  WHEN 'Chemistry' THEN '/images/chemistry-cover-ai.png'
  WHEN 'Microbiology' THEN '/images/microbiology-cover-ai.png'
  ELSE textbook_image_url
END
WHERE name IN ('Biology','Chemistry','Microbiology');