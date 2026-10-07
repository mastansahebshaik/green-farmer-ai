DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_language_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_language_check
      CHECK (language IN ('en', 'hi', 'mr', 'bn', 'te', 'ta', 'kn'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scans_language_check'
  ) THEN
    ALTER TABLE public.scans
      ADD CONSTRAINT scans_language_check
      CHECK (language IN ('en', 'hi', 'mr', 'bn', 'te', 'ta', 'kn'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scans_severity_score_check'
  ) THEN
    ALTER TABLE public.scans
      ADD CONSTRAINT scans_severity_score_check
      CHECK (severity_score BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'scans_severity_label_check'
  ) THEN
    ALTER TABLE public.scans
      ADD CONSTRAINT scans_severity_label_check
      CHECK (char_length(trim(severity_label)) BETWEEN 1 AND 50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fertilizers_name_check'
  ) THEN
    ALTER TABLE public.fertilizers
      ADD CONSTRAINT fertilizers_name_check
      CHECK (char_length(trim(name)) BETWEEN 1 AND 120);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fertilizers_kind_check'
  ) THEN
    ALTER TABLE public.fertilizers
      ADD CONSTRAINT fertilizers_kind_check
      CHECK (kind IN ('chemical', 'organic', 'bio', 'micronutrient'));
  END IF;
END $$;
