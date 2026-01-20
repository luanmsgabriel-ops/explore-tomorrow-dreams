import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileText, 
  Download, 
  Loader2, 
  Plane, 
  Building2, 
  Car, 
  Shield, 
  Map, 
  File 
} from 'lucide-react';
import { toast } from 'sonner';

interface TripDocument {
  id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

interface ClientTripDetailsProps {
  tripId: string;
  tripName: string;
}

export const ClientTripDetails = ({ tripId, tripName }: ClientTripDetailsProps) => {
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [tripId]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trip_documents')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'voucher_flight':
        return <Plane className="w-5 h-5" />;
      case 'voucher_hotel':
        return <Building2 className="w-5 h-5" />;
      case 'voucher_transfer':
        return <Car className="w-5 h-5" />;
      case 'insurance':
        return <Shield className="w-5 h-5" />;
      case 'itinerary':
        return <Map className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'voucher_flight':
        return 'Voucher de Voo';
      case 'voucher_hotel':
        return 'Voucher de Hotel';
      case 'voucher_transfer':
        return 'Voucher de Traslado';
      case 'insurance':
        return 'Seguro Viagem';
      case 'itinerary':
        return 'Roteiro';
      default:
        return 'Outro Documento';
    }
  };

  const handleDownload = async (doc: TripDocument) => {
    try {
      // Get signed URL for private bucket
      const filePath = doc.file_url.split('/').pop();
      if (!filePath) {
        throw new Error('Invalid file path');
      }

      const { data, error } = await supabase.storage
        .from('trip-documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;

      // Open in new tab or download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = doc.document_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const groupedDocuments = documents.reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = [];
    }
    acc[doc.document_type].push(doc);
    return acc;
  }, {} as Record<string, TripDocument[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Vouchers e Documentos
        </h2>
        <p className="text-muted-foreground mt-1">
          Documentos da viagem para {tripName}
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 glass rounded-2xl">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">
            Nenhum documento disponível
          </h3>
          <p className="text-muted-foreground">
            Seu consultor de viagens irá anexar os documentos em breve.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocuments).map(([type, docs]) => (
            <div key={type} className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  {getDocumentIcon(type)}
                </div>
                <h3 className="font-serif text-lg font-bold text-foreground">
                  {getDocumentTypeLabel(type)}
                </h3>
              </div>

              <div className="space-y-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {doc.document_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.file_type.toUpperCase()} • {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Baixar</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
