import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Download, 
  Loader2, 
  Car, 
  Map,
  Bus,
  Eye,
  X,
  FileImage,
  ExternalLink
} from 'lucide-react';

interface TripDocument {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

interface ClientVouchersProps {
  tripId: string;
  tripName: string;
}

export const ClientVouchers = ({ tripId, tripName }: ClientVouchersProps) => {
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('passeios');
  const [previewDoc, setPreviewDoc] = useState<TripDocument | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [tripId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_documents')
        .select('*')
        .eq('trip_id', tripId)
        .in('document_type', ['voucher_passeio', 'voucher_transfer', 'voucher_carro', 'outro'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentsByType = (type: string) => {
    return documents.filter(doc => doc.document_type === type);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'passeios':
        return <Map className="w-4 h-4" />;
      case 'transfer':
        return <Bus className="w-4 h-4" />;
      case 'carro':
        return <Car className="w-4 h-4" />;
      case 'outros':
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'passeios':
        return 'Passeios';
      case 'transfer':
        return 'Transfer';
      case 'carro':
        return 'Aluguel de Carro';
      case 'outros':
        return 'Outros';
      default:
        return category;
    }
  };

  const getDocumentTypeKey = (category: string) => {
    switch (category) {
      case 'passeios':
        return 'voucher_passeio';
      case 'transfer':
        return 'voucher_transfer';
      case 'carro':
        return 'voucher_carro';
      case 'outros':
        return 'outro';
      default:
        return '';
    }
  };

  const isPdfOrImage = (fileType: string) => {
    return fileType === 'application/pdf' || fileType.startsWith('image/');
  };

  const isImage = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  const categories = ['passeios', 'transfer', 'carro', 'outros'];

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
        <h2 className="font-serif text-2xl font-bold text-foreground mb-2">
          Vouchers - {tripName}
        </h2>
        <p className="text-muted-foreground">
          Documentos de passeios, transfers e aluguel de veículos
        </p>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="flex items-center gap-2">
              {getCategoryIcon(category)}
              <span className="hidden sm:inline">{getCategoryLabel(category)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => {
          const categoryDocs = getDocumentsByType(getDocumentTypeKey(category));
          
          return (
            <TabsContent key={category} value={category} className="mt-4">
              <Card className="border-border bg-secondary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {getCategoryLabel(category)}
                    <Badge variant="outline" className="ml-2">
                      {categoryDocs.length} {categoryDocs.length === 1 ? 'documento' : 'documentos'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryDocs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum voucher de {getCategoryLabel(category).toLowerCase()} disponível</p>
                      <p className="text-sm mt-1">Os documentos serão adicionados pelo seu consultor</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {categoryDocs.map((doc) => (
                        <div 
                          key={doc.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              {isImage(doc.file_type) ? (
                                <FileImage className="w-5 h-5 text-primary" />
                              ) : (
                                <FileText className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{doc.document_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(doc.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                {doc.file_size && ` • ${formatFileSize(doc.file_size)}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isPdfOrImage(doc.file_type) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewDoc(doc)}
                                className="flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">Preview</span>
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(doc.file_url, '_blank')}
                              className="flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="hidden sm:inline">Abrir</span>
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = doc.file_url;
                                link.download = doc.document_name;
                                link.target = '_blank';
                                link.click();
                              }}
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">Baixar</span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between pr-8">
              <span className="truncate">{previewDoc?.document_name}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden rounded-lg border bg-muted/30 min-h-[60vh]">
            {previewDoc && (
              isImage(previewDoc.file_type) ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img 
                    src={previewDoc.file_url} 
                    alt={previewDoc.document_name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              ) : (
                <iframe 
                  src={`${previewDoc.file_url}#toolbar=1&navpanes=0`}
                  className="w-full h-full min-h-[60vh]"
                  title={previewDoc.document_name}
                />
              )
            )}
          </div>

          <div className="flex-shrink-0 flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setPreviewDoc(null)}
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
            <Button
              onClick={() => {
                if (previewDoc) {
                  const link = document.createElement('a');
                  link.href = previewDoc.file_url;
                  link.download = previewDoc.document_name;
                  link.target = '_blank';
                  link.click();
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
