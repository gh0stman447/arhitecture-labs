-- Task 3: Exchange rates table
CREATE TABLE public.exchange_rates (
  id         BIGSERIAL PRIMARY KEY,
  date       DATE NOT NULL,
  currency   TEXT NOT NULL,
  amount     INTEGER NOT NULL,
  rate       NUMERIC(12, 4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (date, currency)
);

-- Index for fast date range queries
CREATE INDEX idx_exchange_rates_date ON public.exchange_rates (date);
CREATE INDEX idx_exchange_rates_currency ON public.exchange_rates (currency);

-- RLS
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read rates
CREATE POLICY "Authenticated users can read rates"
  ON public.exchange_rates FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only service role can insert/update (via server)
CREATE POLICY "Service role can insert rates"
  ON public.exchange_rates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update rates"
  ON public.exchange_rates FOR UPDATE
  USING (true);
