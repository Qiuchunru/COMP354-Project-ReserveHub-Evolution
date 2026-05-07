UPDATE restaurants 
SET image_url = CASE 
    WHEN id % 10 = 0 THEN 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'
    WHEN id % 10 = 1 THEN 'https://images.unsplash.com/photo-1414235077428-338988a2e8c0?auto=format&fit=crop&w=600&q=80'
    WHEN id % 10 = 2 THEN 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
    WHEN id % 10 = 3 THEN 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80'
    WHEN id % 10 = 4 THEN 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
    WHEN id % 10 = 5 THEN 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=600&q=80'
    WHEN id % 10 = 6 THEN 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80'
    WHEN id % 10 = 7 THEN 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=600&q=80'
    WHEN id % 10 = 8 THEN 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=80'
    WHEN id % 10 = 9 THEN 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=600&q=80'
END;
