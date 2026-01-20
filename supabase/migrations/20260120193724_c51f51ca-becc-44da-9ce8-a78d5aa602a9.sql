-- Allow clients to insert their own checklist items
CREATE POLICY "Clients can insert their own checklist items"
ON public.trip_checklist
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM client_trips
    WHERE client_trips.id = trip_checklist.trip_id
    AND client_trips.user_id = auth.uid()
  )
);

-- Allow clients to delete their own custom checklist items (non-default items)
CREATE POLICY "Clients can delete their own custom checklist items"
ON public.trip_checklist
FOR DELETE
USING (
  is_default_item = false
  AND EXISTS (
    SELECT 1 FROM client_trips
    WHERE client_trips.id = trip_checklist.trip_id
    AND client_trips.user_id = auth.uid()
  )
);