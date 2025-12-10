SELECT id,
       symbol,
       name,
       sector,
       market_cap,
       pe_ratio,
       dividend_yield,
       fifty_two_week_high,
       fifty_two_week_low,
       last_updated
FROM public.stocks
LIMIT 1000;