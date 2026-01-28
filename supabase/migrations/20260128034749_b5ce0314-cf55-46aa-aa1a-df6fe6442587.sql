-- Create table for shared account access
CREATE TABLE public.account_shared_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id uuid NOT NULL,
  shared_user_id uuid NOT NULL,
  shared_email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (primary_user_id, shared_user_id)
);

-- Enable RLS
ALTER TABLE public.account_shared_access ENABLE ROW LEVEL SECURITY;

-- Admin can manage all shared access
CREATE POLICY "Admins can manage shared access"
  ON public.account_shared_access
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Users can view their own shared access entries
CREATE POLICY "Users can view their shared access"
  ON public.account_shared_access
  FOR SELECT
  USING (auth.uid() = primary_user_id OR auth.uid() = shared_user_id);

-- Update client_trips RLS to allow shared users to view trips
DROP POLICY IF EXISTS "Clients can view their own trips" ON public.client_trips;

CREATE POLICY "Clients can view their own trips"
  ON public.client_trips
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM public.account_shared_access
      WHERE primary_user_id = client_trips.user_id
      AND shared_user_id = auth.uid()
    )
  );

-- Also update trip_checklist to allow shared access
DROP POLICY IF EXISTS "Clients can view and update their checklist" ON public.trip_checklist;

CREATE POLICY "Clients can view and update their checklist"
  ON public.trip_checklist
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_trips
      WHERE client_trips.id = trip_checklist.trip_id
      AND (
        client_trips.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.account_shared_access
          WHERE primary_user_id = client_trips.user_id
          AND shared_user_id = auth.uid()
        )
      )
    )
  );

-- Update trip_documents for shared access
DROP POLICY IF EXISTS "Clients can view their trip documents" ON public.trip_documents;

CREATE POLICY "Clients can view their trip documents"
  ON public.trip_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM client_trips
      WHERE client_trips.id = trip_documents.trip_id
      AND (
        client_trips.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.account_shared_access
          WHERE primary_user_id = client_trips.user_id
          AND shared_user_id = auth.uid()
        )
      )
    )
  );