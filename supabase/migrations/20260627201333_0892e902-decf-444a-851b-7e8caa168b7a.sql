SELECT cron.alter_job(4, active := false);   -- admin-proactive-alerts
SELECT cron.alter_job(13, active := false);  -- flight-tracker-every-10-min