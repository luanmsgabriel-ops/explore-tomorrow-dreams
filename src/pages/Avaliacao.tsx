import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, CheckCircle, MapPin, Send } from 'lucide-react';
import logo from '@/assets/logo.jpeg';

type Step = 'loading' | 'not_found' | 'already_done' | 'scores' | 'feedback' | 'photo' | 'thank_you';

const ScoreSelector = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
}) => (
  <div className="space-y-3">
    <Label className="text-base font-semibold text-foreground">{label}</Label>
    <div className="flex gap-1.5 flex-wrap">
      {Array.from({ length: 11 }, (_, i) => i).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
            value === n
              ? n >= 9
                ? 'bg-green-500 text-white scale-110 shadow-lg'
                : n >= 7
                ? 'bg-yellow-500 text-white scale-110 shadow-lg'
                : 'bg-red-500 text-white scale-110 shadow-lg'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  </div>
);

const Avaliacao = () => {
  const { id } = useParams<{ id: string }>();
  const [step, setStep] = useState<Step>('loading');
  const [reviewData, setReviewData] = useState<{
    client_name: string | null;
    destination_name: string | null;
  }>({ client_name: null, destination_name: null });

  const [routeScore, setRouteScore] = useState<number | null>(null);
  const [serviceScore, setServiceScore] = useState<number | null>(null);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [allowsSharing, setAllowsSharing] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadReview();
  }, [id]);

  const loadReview = async () => {
    if (!id) { setStep('not_found'); return; }
    try {
      const { data, error } = await supabase
        .from('travel_reviews')
        .select('client_name, destination_name, conversation_status, route_score, service_score, nps_score, feedback_text')
        .eq('id', id)
        .single();

      if (error || !data) { setStep('not_found'); return; }

      if (data.conversation_status === 'complete' && data.nps_score !== null) {
        setStep('already_done');
        return;
      }

      setReviewData({ client_name: data.client_name, destination_name: data.destination_name });
      // Restore any partially filled data
      if (data.route_score !== null) setRouteScore(data.route_score);
      if (data.service_score !== null) setServiceScore(data.service_score);
      if (data.nps_score !== null) setNpsScore(data.nps_score);
      if (data.feedback_text) setFeedbackText(data.feedback_text);
      setStep('scores');
    } catch {
      setStep('not_found');
    }
  };

  const submitScores = async () => {
    if (routeScore === null || serviceScore === null || npsScore === null) {
      toast.error('Por favor, preencha todas as notas');
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('travel_reviews')
        .update({
          route_score: routeScore,
          service_score: serviceScore,
          nps_score: npsScore,
          conversation_status: 'in_progress',
          current_step: 'feedback',
        })
        .eq('id', id!);
      if (error) throw error;
      setStep('feedback');
    } catch {
      toast.error('Erro ao salvar notas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFeedback = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('travel_reviews')
        .update({
          feedback_text: feedbackText.trim() || null,
          allows_sharing: allowsSharing,
          current_step: 'photo',
        })
        .eq('id', id!);
      if (error) throw error;
      setStep('photo');
    } catch {
      toast.error('Erro ao salvar feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitPhoto = async () => {
    setIsSubmitting(true);
    try {
      let photoUrl: string | null = null;

      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const path = `reviews/${id}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('destination-images')
          .upload(path, photoFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('destination-images')
            .getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from('travel_reviews')
        .update({
          photo_url: photoUrl,
          conversation_status: 'complete',
          current_step: 'done',
        })
        .eq('id', id!);
      if (error) throw error;
      setStep('thank_you');
    } catch {
      toast.error('Erro ao finalizar avaliação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const skipPhoto = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('travel_reviews')
        .update({
          conversation_status: 'complete',
          current_step: 'done',
        })
        .eq('id', id!);
      if (error) throw error;
      setStep('thank_you');
    } catch {
      toast.error('Erro ao finalizar avaliação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <img src={logo} alt="Tomorrow Travel" className="w-16 h-16 rounded-full mx-auto object-cover" />
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
            Tomorrow Travel
          </h1>
          {reviewData.destination_name && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {reviewData.destination_name}
            </p>
          )}
        </div>

        {/* Loading */}
        {step === 'loading' && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Not Found */}
        {step === 'not_found' && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg font-semibold text-foreground">Avaliação não encontrada</p>
              <p className="text-sm text-muted-foreground mt-2">O link pode estar expirado ou inválido.</p>
            </CardContent>
          </Card>
        )}

        {/* Already Done */}
        {step === 'already_done' && (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="text-lg font-semibold text-foreground">Avaliação já respondida!</p>
              <p className="text-sm text-muted-foreground">Obrigado por compartilhar sua experiência.</p>
            </CardContent>
          </Card>
        )}

        {/* Scores Step */}
        {step === 'scores' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {reviewData.client_name ? `Olá, ${reviewData.client_name}! ` : ''}Como foi sua viagem?
              </CardTitle>
              <p className="text-sm text-muted-foreground">Avalie de 0 a 10 cada item abaixo</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ScoreSelector label="📍 Roteiro da viagem" value={routeScore} onChange={setRouteScore} />
              <ScoreSelector label="🤝 Atendimento da agência" value={serviceScore} onChange={setServiceScore} />
              <ScoreSelector label="⭐ Recomendaria a Tomorrow Travel?" value={npsScore} onChange={setNpsScore} />

              <Button onClick={submitScores} disabled={isSubmitting} className="w-full" size="lg">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Feedback Step */}
        {step === 'feedback' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conte mais sobre sua experiência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>O que mais marcou sua viagem? (opcional)</Label>
                <Textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Escreva aqui seu depoimento..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Podemos divulgar seu depoimento?</Label>
                <div className="flex gap-3 mt-2">
                  {['Sim', 'Não'].map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      variant={allowsSharing === opt.toLowerCase() ? 'default' : 'outline'}
                      onClick={() => setAllowsSharing(opt.toLowerCase())}
                      size="sm"
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
              <Button onClick={submitFeedback} disabled={isSubmitting} className="w-full" size="lg">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Photo Step */}
        {step === 'photo' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📸 Envie uma foto da viagem</CardTitle>
              <p className="text-sm text-muted-foreground">Opcional - adoramos ver suas aventuras!</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
              {photoFile && (
                <img
                  src={URL.createObjectURL(photoFile)}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={skipPhoto} disabled={isSubmitting} className="flex-1">
                  Pular
                </Button>
                <Button onClick={submitPhoto} disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Thank You */}
        {step === 'thank_you' && (
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: 'Playfair Display, serif' }}>
                Obrigado pela avaliação!
              </h2>
              <p className="text-muted-foreground">
                Sua opinião é muito importante para continuarmos oferecendo experiências incríveis. ✈️
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Avaliacao;
