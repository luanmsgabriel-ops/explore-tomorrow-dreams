import { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star, Download, Instagram, Quote, MapPin, TrendingUp,
  ThumbsUp, ThumbsDown, Minus, ChevronLeft, ChevronRight
} from 'lucide-react';

interface TravelReview {
  id: string;
  phone_number: string;
  client_name: string | null;
  destination_name: string | null;
  route_score: number | null;
  service_score: number | null;
  nps_score: number | null;
  feedback_text: string | null;
  allows_sharing: string | null;
  photo_url: string | null;
  conversation_status: string;
  created_at: string;
}

interface ReviewDashboardProps {
  reviews: TravelReview[];
}

const StarRating = ({ score }: { score: number | null }) => {
  const value = score ?? 0;
  const filled = Math.round(value / 2);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= filled ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
};

const NpsIndicator = ({ score }: { score: number | null }) => {
  if (score === null) return <span className="text-muted-foreground">-</span>;
  if (score >= 9) return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><ThumbsUp className="w-3 h-3 mr-1" /> Promotor</Badge>;
  if (score >= 7) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Minus className="w-3 h-3 mr-1" /> Neutro</Badge>;
  return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><ThumbsDown className="w-3 h-3 mr-1" /> Detrator</Badge>;
};

export const ReviewDashboard = ({ reviews }: ReviewDashboardProps) => {
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const completed = reviews.filter(r => r.conversation_status === 'complete');
  const withScores = reviews.filter(r => r.nps_score !== null);
  const withFeedback = completed.filter(r => r.feedback_text && r.allows_sharing === 'sim');
  const shareable = withFeedback.length > 0 ? withFeedback : completed.filter(r => r.feedback_text);

  const avgRoute = withScores.length > 0
    ? (withScores.reduce((s, r) => s + (r.route_score || 0), 0) / withScores.length).toFixed(1)
    : '-';
  const avgService = withScores.length > 0
    ? (withScores.reduce((s, r) => s + (r.service_score || 0), 0) / withScores.length).toFixed(1)
    : '-';
  const avgNps = withScores.length > 0
    ? (withScores.reduce((s, r) => s + (r.nps_score || 0), 0) / withScores.length).toFixed(1)
    : '-';

  const promoters = withScores.filter(r => (r.nps_score || 0) >= 9).length;
  const passives = withScores.filter(r => (r.nps_score || 0) >= 7 && (r.nps_score || 0) < 9).length;
  const detractors = withScores.filter(r => (r.nps_score || 0) < 7).length;
  const npsScore = withScores.length > 0
    ? Math.round(((promoters - detractors) / withScores.length) * 100)
    : null;

  const downloadCardAsImage = async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
      });
      const link = document.createElement('a');
      link.download = `avaliacao-tomorrow-travel-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // Fallback: copy as blob
      alert('Para compartilhar, faça uma captura de tela do card abaixo.');
    }
  };

  const currentReview = shareable[selectedCardIndex];

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-5 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
            <p className="text-3xl font-bold text-foreground">{npsScore !== null ? `${npsScore > 0 ? '+' : ''}${npsScore}` : '-'}</p>
            <p className="text-xs text-muted-foreground mt-1">NPS Score</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-5 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-3xl font-bold text-foreground">{avgRoute}</p>
            <p className="text-xs text-muted-foreground mt-1">Média Roteiro</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <CardContent className="p-5 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-accent" />
            <p className="text-3xl font-bold text-foreground">{avgService}</p>
            <p className="text-xs text-muted-foreground mt-1">Média Atendimento</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-5 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-3xl font-bold text-foreground">{avgNps}</p>
            <p className="text-xs text-muted-foreground mt-1">Média NPS</p>
          </CardContent>
        </Card>
      </div>

      {/* NPS Distribution Bar */}
      {withScores.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição NPS</h3>
            <div className="flex rounded-full overflow-hidden h-4 bg-muted">
              {promoters > 0 && (
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(promoters / withScores.length) * 100}%` }}
                  title={`Promotores: ${promoters}`}
                />
              )}
              {passives > 0 && (
                <div
                  className="bg-amber-500 transition-all duration-500"
                  style={{ width: `${(passives / withScores.length) * 100}%` }}
                  title={`Neutros: ${passives}`}
                />
              )}
              {detractors > 0 && (
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${(detractors / withScores.length) * 100}%` }}
                  title={`Detratores: ${detractors}`}
                />
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Promotores ({promoters})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Neutros ({passives})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Detratores ({detractors})</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shareable Instagram Card */}
      {shareable.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Cards para Instagram</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm" variant="outline"
                disabled={selectedCardIndex <= 0}
                onClick={() => setSelectedCardIndex(i => i - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{selectedCardIndex + 1}/{shareable.length}</span>
              <Button
                size="sm" variant="outline"
                disabled={selectedCardIndex >= shareable.length - 1}
                onClick={() => setSelectedCardIndex(i => i + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* The Instagram Card */}
          <div className="flex flex-col items-center gap-4">
            <div
              ref={cardRef}
              className="w-[400px] aspect-square rounded-2xl overflow-hidden relative"
              style={{
                background: 'linear-gradient(145deg, hsl(220 25% 8%), hsl(220 20% 14%), hsl(174 40% 12%))',
              }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, hsl(174 72% 45%), transparent 70%)', filter: 'blur(30px)' }}
              />
              <div className="absolute bottom-0 left-0 w-36 h-36 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, hsl(43 75% 55%), transparent 70%)', filter: 'blur(25px)' }}
              />

              <div className="relative z-10 h-full flex flex-col justify-between p-7">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-primary/70 font-medium">Avaliação de Viagem</p>
                    <h2 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Tomorrow Travel
                    </h2>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i <= Math.round((currentReview?.nps_score || 0) / 2) ? 'fill-accent text-accent' : 'text-white/20'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Feedback quote */}
                <div className="flex-1 flex items-center py-4">
                  <div>
                    <Quote className="w-8 h-8 text-primary/40 mb-2 scale-x-[-1]" />
                    <p className="text-white/90 text-sm leading-relaxed italic line-clamp-5" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {currentReview?.feedback_text || 'Experiência incrível!'}
                    </p>
                  </div>
                </div>

                {/* Scores */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <p className="text-2xl font-bold text-primary">{currentReview?.route_score ?? '-'}</p>
                    <p className="text-[9px] text-white/50 uppercase tracking-wider mt-0.5">Roteiro</p>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <p className="text-2xl font-bold text-accent">{currentReview?.service_score ?? '-'}</p>
                    <p className="text-[9px] text-white/50 uppercase tracking-wider mt-0.5">Atendimento</p>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <p className="text-2xl font-bold text-blue-400">{currentReview?.nps_score ?? '-'}</p>
                    <p className="text-[9px] text-white/50 uppercase tracking-wider mt-0.5">NPS</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {currentReview?.client_name || 'Cliente'}
                    </p>
                    {currentReview?.destination_name && (
                      <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {currentReview.destination_name}
                      </p>
                    )}
                  </div>
                  <p className="text-[9px] text-white/30">@tomorrowtravel</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={downloadCardAsImage} className="gap-2">
                <Download className="w-4 h-4" /> Baixar Imagem
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  downloadCardAsImage();
                  setTimeout(() => {
                    window.open('https://www.instagram.com/', '_blank');
                  }, 1000);
                }}
              >
                <Instagram className="w-4 h-4" /> Compartilhar no Instagram
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* All Reviews with Feedback */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Depoimentos</h3>
        {completed.filter(r => r.feedback_text).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum depoimento recebido ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completed.filter(r => r.feedback_text).map(review => (
              <Card key={review.id} className="bg-gradient-to-br from-card to-secondary/50 border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{review.client_name || 'Cliente'}</p>
                      {review.destination_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {review.destination_name}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StarRating score={review.nps_score} />
                      <NpsIndicator score={review.nps_score} />
                    </div>
                  </div>

                  <p className="text-sm text-foreground/80 italic leading-relaxed mb-3">
                    "{review.feedback_text}"
                  </p>

                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>Roteiro: <strong className="text-primary">{review.route_score ?? '-'}</strong></span>
                    <span>Atendimento: <strong className="text-accent">{review.service_score ?? '-'}</strong></span>
                    <span>NPS: <strong className="text-blue-400">{review.nps_score ?? '-'}</strong></span>
                  </div>

                  {review.allows_sharing === 'sim' && (
                    <Badge className="mt-3 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                      ✓ Autorizado para divulgação
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};