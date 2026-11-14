update public.products
set gallery = array[image]
where (id, name) in (
  (1, 'Vintage Graphic Tee'),
  (2, 'Washed Oversized Tee'),
  (3, 'Vintage Checked Shirt'),
  (4, 'Relaxed Denim Jeans'),
  (5, 'Retro Sportswear Jacket'),
  (6, 'Vintage Statement Shirt')
)
and gallery is distinct from array[image];
