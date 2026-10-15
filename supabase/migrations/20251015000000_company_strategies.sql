/*
  # Semantic Bridge: company_strategies

  Stores the "Company Strategy" objects produced by the semantic-bridge edge
  function.

  Review First rule: every AI-generated strategy starts as `pending_review` and
  is never treated as approved until the owning user signs off in the UI.
    - INSERTs are forced to `pending_review` by trigger, whoever the caller is
      (including the service role).
    - Only the owning user can move a row to `verified` or `rejected`; the
      approval timestamp/actor are stamped by trigger, not by the client.
*/

CREATE TABLE IF NOT EXISTS company_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  fit_score integer NOT NULL CHECK (fit_score BETWEEN 0 AND 100),
  fit_tier text NOT NULL CHECK (fit_tier IN ('strong_target', 'viable_target', 'stretch', 'not_a_fit')),
  strategy jsonb NOT NULL,
  inputs jsonb NOT NULL,
  model text NOT NULL,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'verified', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS company_strategies_user_status_idx
  ON company_strategies (user_id, status, created_at DESC);

ALTER TABLE company_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company strategies"
  ON company_strategies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own pending company strategies"
  ON company_strategies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending_review');

CREATE POLICY "Users can review own company strategies"
  ON company_strategies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company strategies"
  ON company_strategies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Review First guardrail: new rows always start unreviewed.
CREATE OR REPLACE FUNCTION company_strategies_force_pending()
RETURNS trigger AS $$
BEGIN
  NEW.status := 'pending_review';
  NEW.reviewed_at := NULL;
  NEW.reviewed_by := NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_strategies_force_pending
  BEFORE INSERT ON company_strategies
  FOR EACH ROW EXECUTE FUNCTION company_strategies_force_pending();

-- Review First guardrail: the AI output itself is immutable, and a review
-- decision is stamped with the acting user rather than client-supplied values.
CREATE OR REPLACE FUNCTION company_strategies_on_review()
RETURNS trigger AS $$
BEGIN
  IF NEW.strategy IS DISTINCT FROM OLD.strategy
     OR NEW.inputs IS DISTINCT FROM OLD.inputs
     OR NEW.fit_score IS DISTINCT FROM OLD.fit_score
     OR NEW.fit_tier IS DISTINCT FROM OLD.fit_tier
     OR NEW.company_name IS DISTINCT FROM OLD.company_name
     OR NEW.model IS DISTINCT FROM OLD.model
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Company strategies are immutable; only the review status can change';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'pending_review' THEN
      NEW.reviewed_at := NULL;
      NEW.reviewed_by := NULL;
    ELSE
      NEW.reviewed_at := now();
      NEW.reviewed_by := auth.uid();
    END IF;
  ELSE
    NEW.reviewed_at := OLD.reviewed_at;
    NEW.reviewed_by := OLD.reviewed_by;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_strategies_on_review
  BEFORE UPDATE ON company_strategies
  FOR EACH ROW EXECUTE FUNCTION company_strategies_on_review();
