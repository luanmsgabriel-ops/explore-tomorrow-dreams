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

const NpsGauge = ({ score, promoters, passives, detractors, total }: {
  score: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
}) => {
  const nps = score ?? 0;
  // NPS ranges from -100 to +100, map to 0-180 degrees
  const angle = ((nps + 100) / 200) * 180;
  const needleAngle = angle - 90; // SVG rotation offset

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 text-center">Medidor NPS</h3>
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 200 120" className="w-64 h-36">
            {/* Background arc segments */}
            {/* Detractor zone: -100 to -1 (0° to ~89°) - Red */}
            <path
              d="M 20 100 A 80 80 0 0 1 100 20"
              fill="none"
              stroke="hsl(0 70% 45%)"
              strokeWidth="16"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Passive zone: 0 to 49 (90° to ~134°) - Amber */}
            <path
              d="M 100 20 A 80 80 0 0 1 156 44"
              fill="none"
              stroke="hsl(43 75% 50%)"
              strokeWidth="16"
              strokeLinecap="round"
              opacity="0.3"
            />
            {/* Promoter zone: 50 to 100 (135° to 180°) - Green */}
            <path
              d="M 156 44 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="hsl(152 60% 40%)"
              strokeWidth="16"
              strokeLinecap="round"
              opacity="0.3"
            />

            {/* Active colored arc up to current value */}
            {score !== null && (
              <path
                d={describeArc(100, 100, 80, 0, angle)}
                fill="none"
                stroke={nps >= 50 ? 'hsl(152 60% 45%)' : nps >= 0 ? 'hsl(43 75% 55%)' : 'hsl(0 70% 50%)'}
                strokeWidth="16"
                strokeLinecap="round"
                style={{ transition: 'all 0.8s ease' }}
              />
            )}

            {/* Needle */}
            <g transform={`rotate(${needleAngle}, 100, 100)`} style={{ transition: 'transform 0.8s ease' }}>
              <line x1="100" y1="100" x2="100" y2="32" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="100" cy="100" r="5" fill="hsl(var(--foreground))" />
            </g>

            {/* Labels */}
            <text x="16" y="115" fill="hsl(0 70% 50%)" fontSize="9" fontWeight="600">-100</text>
            <text x="93" y="14" fill="hsl(43 75% 55%)" fontSize="9" fontWeight="600" textAnchor="middle">0</text>
            <text x="178" y="115" fill="hsl(152 60% 45%)" fontSize="9" fontWeight="600" textAnchor="end">+100</text>
          </svg>

          {/* Score display */}
          <div className="text-center -mt-4">
            <p className={`text-4xl font-bold ${nps >= 50 ? 'text-emerald-400' : nps >= 0 ? 'text-accent' : 'text-red-400'}`}>
              {score !== null ? `${nps > 0 ? '+' : ''}${nps}` : '-'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Net Promoter Score</p>
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="text-muted-foreground">Promotores <strong className="text-foreground">{promoters}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="text-muted-foreground">Neutros <strong className="text-foreground">{passives}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span className="text-muted-foreground">Detratores <strong className="text-foreground">{detractors}</strong></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper to describe an SVG arc path
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
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

  // Include reviews that have feedback regardless of status (not just 'complete')
  const withScores = reviews.filter(r => r.nps_score !== null);
  const withFeedback = reviews.filter(r => r.feedback_text);
  const shareable = withFeedback.length > 0 ? withFeedback : [];

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

      {/* NPS Gauge */}
      {withScores.length > 0 && (
        <NpsGauge
          score={npsScore}
          promoters={promoters}
          passives={passives}
          detractors={detractors}
          total={withScores.length}
        />
      )}

      {/* Shareable Instagram Card - always show if there are reviews with feedback */}
      {shareable.length > 0 && currentReview && (
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

              {/* Client photo as background overlay */}
              {currentReview.photo_url && (
                <div className="absolute inset-0 z-0">
                  <img
                    src={currentReview.photo_url}
                    alt=""
                    className="w-full h-full object-cover opacity-15"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg, hsl(220 25% 8% / 0.85), hsl(220 20% 14% / 0.9), hsl(174 40% 12% / 0.85))' }} />
                </div>
              )}

              <div className="relative z-10 h-full flex flex-col justify-between p-7">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentReview.photo_url && (
                      <img
                        src={currentReview.photo_url}
                        alt={currentReview.client_name || 'Cliente'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-primary/40"
                        crossOrigin="anonymous"
                      />
                    )}
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-primary/70 font-medium">Avaliação de Viagem</p>
                      <h2 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Tomorrow Travel
                      </h2>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i <= Math.round((currentReview.nps_score || 0) / 2) ? 'fill-accent text-accent' : 'text-white/20'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Feedback quote */}
                <div className="flex-1 flex items-center py-4">
                  <div>
                    <Quote className="w-8 h-8 text-primary/40 mb-2 scale-x-[-1]" />
                    <p className="text-white/90 text-sm leading-relaxed italic line-clamp-5" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {currentReview.feedback_text || 'Experiência incrível!'}
                    </p>
                  </div>
                </div>

                {/* Scores */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <p className="text-2xl font-bold text-primary">{currentReview.route_score ?? '-'}</p>
                    <p className="text-[9px] text-white/50 uppercase tracking-wider mt-0.5">Roteiro</p>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <p className="text-2xl font-bold text-accent">{currentReview.service_score ?? '-'}</p>
                    <p className="text-[9px] text-white/50 uppercase tracking-wider mt-0.5">Atendimento</p>
                  </div>
                  <div className="flex-1 bg-white/5 rounded-xl p-3 text-center border border-white/10">
                    <p className="text-2xl font-bold text-blue-400">{currentReview.nps_score ?? '-'}</p>
                    <p className="text-[9px] text-white/50 uppercase tracking-wider mt-0.5">NPS</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {currentReview.client_name || 'Cliente'}
                    </p>
                    {currentReview.destination_name && (
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
        {withFeedback.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum depoimento recebido ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {withFeedback.map(review => (
              <Card key={review.id} className="bg-gradient-to-br from-card to-secondary/50 border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {review.photo_url ? (
                        <img
                          src={review.photo_url}
                          alt={review.client_name || 'Cliente'}
                          className="w-10 h-10 rounded-full object-cover border-2 border-primary/30"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {(review.client_name || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{review.client_name || 'Cliente'}</p>
                        {review.destination_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {review.destination_name}
                          </p>
                        )}
                      </div>
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