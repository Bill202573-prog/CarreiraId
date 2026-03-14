-- Enable pg_cron and pg_net for scheduled edge function calls
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule daily renewal check at 8am UTC (5am BRT)
SELECT cron.schedule(
  'renew-carreira-pix-daily',
  '0 8 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://fppsotlycinwqsjpoybg.supabase.co/functions/v1/renew-carreira-pix',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwcHNvdGx5Y2lud3FzanBveWJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NDU1OTAsImV4cCI6MjA4ODIyMTU5MH0.LxdDToQ_PGkJg6JzX43iZWzKs6FHwZGq7sE5jo0KPzY"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);