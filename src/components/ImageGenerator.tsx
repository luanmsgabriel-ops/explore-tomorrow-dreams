import { useState, useRef } from 'react';
import { Image, Upload, Loader2, Download, RefreshCw, Mail, Phone, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { imageGeneratorSchema, validateForm, isValidationError } from '@/lib/validations';

interface ImageGeneratorProps {
  destinationId: string;
  destinationName: string;
}

export const ImageGenerator = ({ destinationId, destinationName }: ImageGeneratorProps) => {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFormValid = email.trim() !== '' && whatsapp.trim() !== '';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Limita tamanho do arquivo a 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUserImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    setValidationErrors({});
    
    // Valida os campos antes de enviar
    const validation = validateForm(imageGeneratorSchema, {
      email: email.trim(),
      whatsapp: whatsapp.trim(),
    });

    if (isValidationError(validation)) {
      const errors: Record<string, string> = {};
      for (const err of validation.errors) {
        errors[err.field] = err.message;
      }
      setValidationErrors(errors);
      
      if (validation.errors[0]) {
        toast.error(validation.errors[0].message);
      }
      return;
    }

    setIsLoading(true);
    setGeneratedImage(null);

    try {
      const response = await supabase.functions.invoke('generate-destination-image', {
        body: {
          destination: destinationName,
          userImageBase64: userImage,
          email: email.trim(),
          whatsapp: whatsapp.trim(),
        },
      });

      // Verifica erros de rate limit
      if (response.error) {
        const errorData = response.error as any;
        if (errorData?.context?.body) {
          try {
            const body = JSON.parse(errorData.context.body);
            if (body.code === 'RATE_LIMIT') {
              toast.error(body.error, {
                description: `Uso diário: ${body.usage?.daily_used}/${body.usage?.daily_limit} | Mensal: ${body.usage?.monthly_used}/${body.usage?.monthly_limit}`,
                duration: 8000,
              });
              setIsLoading(false);
              return;
            }
          } catch {
            // Parse failed, continue with generic error
          }
        }
        throw response.error;
      }

      const { imageUrl } = response.data;
      setGeneratedImage(imageUrl);

      // Save to database with user info
      const imageData = {
        destination_id: destinationId,
        destination_name: destinationName,
        prompt: `Imagem gerada para ${destinationName}`,
        image_url: imageUrl,
        user_email: email.trim(),
        user_whatsapp: whatsapp.trim(),
      };
      
      await supabase.from('ai_generated_images').insert(imageData);

      // Envia notificação por e-mail para o admin
      try {
        const notifyResponse = await supabase.functions.invoke('send-admin-notification', {
          body: {
            type: 'ai_image',
            data: imageData,
          },
        });
        if (notifyResponse.error) {
          console.error('Erro ao enviar notificação:', notifyResponse.error);
        } else {
          console.log('Notificação de imagem enviada com sucesso');
        }
      } catch (err) {
        console.error('Erro ao enviar notificação:', err);
      }

      toast.success('Imagem gerada com sucesso!');
    } catch {
      toast.error('Erro ao gerar imagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `viagem-${destinationName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  return (
    <div className="p-6 max-h-[80vh] overflow-y-auto">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Image className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-foreground mb-2">
          Gerar Imagem no Destino
        </h3>
        <p className="text-muted-foreground">
          Visualize você em {destinationName} com IA
        </p>
      </div>

      <div className="space-y-5">
        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              E-mail *
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="seu@email.com"
                className={`w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border ${validationErrors.email ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm`}
                required
                maxLength={255}
              />
            </div>
            {validationErrors.email && (
              <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              WhatsApp *
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, whatsapp: '' }));
                }}
                placeholder="(11) 99999-9999"
                className={`w-full pl-11 pr-4 py-3 rounded-xl bg-secondary border ${validationErrors.whatsapp ? 'border-destructive' : 'border-border'} text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm`}
                required
                maxLength={20}
              />
            </div>
            {validationErrors.whatsapp && (
              <p className="text-xs text-destructive mt-1">{validationErrors.whatsapp}</p>
            )}
          </div>
        </div>

        {/* Upload section with highlight suggestion */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 border border-accent/30">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                📸 Inclua uma foto sua ou da sua família!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Nossa IA vai criar uma imagem personalizada de vocês no destino. Quanto melhor a foto, mais incrível o resultado!
              </p>
            </div>
          </div>
          
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-accent/50 rounded-xl p-6 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
          >
            {userImage ? (
              <div className="relative">
                <img
                  src={userImage}
                  alt="Preview"
                  className="max-h-40 mx-auto rounded-lg object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserImage(null);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-accent mx-auto mb-3" />
                <p className="text-foreground font-medium text-sm mb-1">
                  Clique para enviar sua foto
                </p>
                <p className="text-xs text-muted-foreground">
                  Foto de rosto ou em família • Máx 5MB
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isLoading || !isFormValid}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={!isFormValid ? 'Preencha e-mail e WhatsApp para habilitar' : ''}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Image className="w-5 h-5" />
              Gerar Imagem
            </>
          )}
        </button>

        {!isFormValid && (
          <p className="text-xs text-muted-foreground text-center">
            * Preencha seu e-mail e WhatsApp para habilitar a geração
          </p>
        )}

        {/* Result */}
        {generatedImage && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-border">
              <img
                src={generatedImage}
                alt={`Você em ${destinationName}`}
                className="w-full"
              />
            </div>
            
            {/* Branded message below the image */}
            <div className="text-center py-4 px-6 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl border border-primary/20">
              <p className="text-lg font-medium text-foreground">
                Isso pode se tornar <span className="font-bold text-primary uppercase">REAL</span> com a{' '}
                <span className="font-bold text-accent">TOMORROW TRAVEL</span>
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 btn-gold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Baixar Imagem
              </button>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="btn-outline flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Gerar Novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
