UPDATE topics 
SET duration = 
  FLOOR(array_length(string_to_array(transcript, ' '), 1) / 150) || ':' ||
  LPAD((array_length(string_to_array(transcript, ' '), 1) % 150 * 60 / 150)::text, 2, '0')
WHERE duration IS NULL AND transcript IS NOT NULL;