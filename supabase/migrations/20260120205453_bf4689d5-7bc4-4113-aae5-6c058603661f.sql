-- Drop the old constraint
ALTER TABLE public.trip_documents DROP CONSTRAINT trip_documents_document_type_check;

-- Add new constraint with all voucher types
ALTER TABLE public.trip_documents ADD CONSTRAINT trip_documents_document_type_check 
CHECK (document_type = ANY (ARRAY[
  'voucher_flight'::text, 
  'voucher_hotel'::text, 
  'voucher_transfer'::text,
  'voucher_voo'::text,
  'voucher_traslado'::text,
  'voucher_passeio'::text,
  'voucher_carro'::text,
  'insurance'::text, 
  'seguro'::text,
  'itinerary'::text, 
  'other'::text,
  'outro'::text
]));