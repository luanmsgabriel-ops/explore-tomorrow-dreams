-- Tabela de viagens do cliente
CREATE TABLE public.client_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
  destination_name TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  flight_number TEXT,
  flight_departure_time TIMESTAMPTZ,
  hotel_name TEXT,
  hotel_address TEXT,
  trip_status TEXT NOT NULL DEFAULT 'confirmed' CHECK (trip_status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de documentos/vouchers da viagem
CREATE TABLE public.trip_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.client_trips(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('voucher_flight', 'voucher_hotel', 'voucher_transfer', 'insurance', 'itinerary', 'other')),
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de itens de checklist padrão
CREATE TABLE public.checklist_items_default (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'geral',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de checklist da viagem (personalizado por viagem)
CREATE TABLE public.trip_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.client_trips(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_default_item BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de contatos de emergência
CREATE TABLE public.trip_emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.client_trips(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('consultant', 'insurance', 'embassy', 'local_emergency', 'other')),
  contact_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.client_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items_default ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Políticas para client_trips
CREATE POLICY "Clients can view their own trips"
  ON public.client_trips FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all trips"
  ON public.client_trips FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas para trip_documents
CREATE POLICY "Clients can view their trip documents"
  ON public.trip_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.client_trips 
    WHERE client_trips.id = trip_documents.trip_id 
    AND client_trips.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all documents"
  ON public.trip_documents FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas para checklist_items_default
CREATE POLICY "Anyone authenticated can view default checklist"
  ON public.checklist_items_default FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage default checklist"
  ON public.checklist_items_default FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas para trip_checklist
CREATE POLICY "Clients can view and update their checklist"
  ON public.trip_checklist FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.client_trips 
    WHERE client_trips.id = trip_checklist.trip_id 
    AND client_trips.user_id = auth.uid()
  ));

CREATE POLICY "Clients can update their checklist completion"
  ON public.trip_checklist FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.client_trips 
    WHERE client_trips.id = trip_checklist.trip_id 
    AND client_trips.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all checklists"
  ON public.trip_checklist FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas para trip_emergency_contacts
CREATE POLICY "Clients can view their emergency contacts"
  ON public.trip_emergency_contacts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.client_trips 
    WHERE client_trips.id = trip_emergency_contacts.trip_id 
    AND client_trips.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all emergency contacts"
  ON public.trip_emergency_contacts FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_client_trips_updated_at
  BEFORE UPDATE ON public.client_trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir itens padrão de checklist
INSERT INTO public.checklist_items_default (item_text, category, sort_order) VALUES
  ('Verificar validade do passaporte (mínimo 6 meses)', 'documentos', 1),
  ('Providenciar visto (se necessário)', 'documentos', 2),
  ('Imprimir vouchers e reservas', 'documentos', 3),
  ('Fazer cópia dos documentos importantes', 'documentos', 4),
  ('Comprar moeda local ou cartão pré-pago', 'financeiro', 5),
  ('Avisar banco sobre viagem internacional', 'financeiro', 6),
  ('Contratar seguro viagem', 'segurança', 7),
  ('Fazer check-in online (24h antes)', 'voo', 8),
  ('Verificar peso e dimensões da bagagem', 'bagagem', 9),
  ('Separar itens para bagagem de mão', 'bagagem', 10),
  ('Levar adaptador de tomada', 'equipamentos', 11),
  ('Baixar mapas offline do destino', 'tecnologia', 12),
  ('Informar familiares sobre itinerário', 'comunicação', 13),
  ('Verificar vacinas necessárias', 'saúde', 14),
  ('Levar medicamentos pessoais', 'saúde', 15);

-- Criar bucket para documentos de viagem
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trip-documents', 
  'trip-documents', 
  false,
  52428800,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- Políticas de storage para documentos de viagem
CREATE POLICY "Admins can upload trip documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'trip-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update trip documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'trip-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete trip documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'trip-documents' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their trip documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'trip-documents' AND (
      has_role(auth.uid(), 'admin') OR
      EXISTS (
        SELECT 1 FROM public.trip_documents td
        JOIN public.client_trips ct ON td.trip_id = ct.id
        WHERE ct.user_id = auth.uid()
        AND td.file_url LIKE '%' || storage.objects.name
      )
    )
  );