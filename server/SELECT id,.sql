SELECT id,
       stock_id,
       date,
       open,
       high,
       low,
       close,
       volume
FROM public.stock_prices
LIMIT 1000;