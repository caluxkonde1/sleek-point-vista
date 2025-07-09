-- Add RLS policies for product_categories if they don't exist
CREATE POLICY IF NOT EXISTS "Users can view outlet categories"
ON public.product_categories
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM outlets
    WHERE outlets.id = product_categories.outlet_id
    AND (
      outlets.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.outlet_id = product_categories.outlet_id
      )
    )
  )
);

CREATE POLICY IF NOT EXISTS "Users can manage outlet categories"
ON public.product_categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM outlets
    WHERE outlets.id = product_categories.outlet_id
    AND (
      outlets.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.outlet_id = product_categories.outlet_id
        AND profiles.role IN ('admin', 'manager')
      )
    )
  )
);