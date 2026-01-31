UPDATE subjects
SET textbook_image_url = CASE name
  WHEN 'Biology' THEN '/images/biology-cover.png?v=2'
  WHEN 'Chemistry' THEN '/images/chemistry-cover.png?v=2'
  WHEN 'Microbiology' THEN '/images/microbiology-cover.png?v=2'
  ELSE textbook_image_url
END
WHERE name IN ('Biology','Chemistry','Microbiology');