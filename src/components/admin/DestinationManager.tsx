import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Plus, Edit, Trash2, Loader2, Sparkles, Image as ImageIcon, 
  Save, X, Video, MapPin, Calendar, Users, Tag
} from 'lucide-react';

interface Video {
  id: string;
  title: string;
  youtubeId: string;
}

interface Destination {
  id: string;
  slug: string;
  name: string;
  location: string;
  image_url: string | null;
  category: string;
  type: 'explorar' | 'nacional' | 'internacional';
  description: string;
  best_time: string;
  ideal_duration: string;
  for_who: string;
  videos: Video[];
  is_active: boolean;
  created_at: string;
}

export const DestinationManager = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    location: '',
    image_url: '',
    category: 'Praia',
    type: 'nacional' as 'explorar' | 'nacional' | 'internacional',
    description: '',
    best_time: '',
    ideal_duration: '',
    for_who: '',
    videos: [] as Video[],
    is_active: true,
  });

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse videos from JSONB
      const parsedData = (data || []).map(d => ({
        ...d,
        videos: Array.isArray(d.videos) ? d.videos : JSON.parse(d.videos as string || '[]')
      }));
      
      setDestinations(parsedData as Destination[]);
    } catch (error) {
      console.error('Error fetching destinations:', error);
      toast.error('Erro ao carregar destinos');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleGenerateText = async () => {
    if (!formData.name) {
      toast.error('Digite o nome do destino primeiro');
      return;
    }

    setIsGeneratingText(true);
    try {
      const response = await supabase.functions.invoke('generate-destination-content', {
        body: { destinationName: formData.name, type: 'full' }
      });

      if (response.error) throw response.error;

      const content = response.data?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          setFormData(prev => ({
            ...prev,
            description: parsed.description || prev.description,
            best_time: parsed.bestTime || prev.best_time,
            ideal_duration: parsed.idealDuration || prev.ideal_duration,
            for_who: parsed.forWho || prev.for_who,
            category: parsed.category || prev.category,
          }));
          toast.success('Conteúdo gerado com sucesso!');
        } catch {
          // If not JSON, use as description
          setFormData(prev => ({ ...prev, description: content }));
          toast.success('Descrição gerada com sucesso!');
        }
      }
    } catch (error) {
      console.error('Error generating text:', error);
      toast.error('Erro ao gerar texto');
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.name) {
      toast.error('Digite o nome do destino primeiro');
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await supabase.functions.invoke('generate-destination-image', {
        body: { 
          destination: formData.name,
          customPrompt: `Paisagem panorâmica cinematográfica de ${formData.name}, fotografia de viagem profissional, iluminação dourada, alta resolução, destino turístico`,
        }
      });

      if (response.error) throw response.error;

      const imageUrl = response.data?.imageUrl;
      if (imageUrl) {
        setFormData(prev => ({ ...prev, image_url: imageUrl }));
        toast.success('Imagem gerada com sucesso!');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Erro ao gerar imagem');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleAddVideo = () => {
    const newVideo: Video = {
      id: Date.now().toString(),
      title: '',
      youtubeId: ''
    };
    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, newVideo]
    }));
  };

  // Extract YouTube video ID from various URL formats
  const extractYoutubeId = (input: string): string => {
    if (!input) return '';
    
    // If it's already just an ID (no slashes or dots), return as is
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
      return input;
    }
    
    // Try to extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // If no pattern matches, return the input trimmed (user might be typing)
    return input.trim();
  };

  const handleUpdateVideo = (index: number, field: 'title' | 'youtubeId', value: string) => {
    const processedValue = field === 'youtubeId' ? extractYoutubeId(value) : value;
    
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.map((v, i) => 
        i === index ? { ...v, [field]: processedValue } : v
      )
    }));
  };

  const handleRemoveVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const destinationData = {
        slug: formData.slug,
        name: formData.name,
        location: formData.location,
        image_url: formData.image_url || null,
        category: formData.category,
        type: formData.type,
        description: formData.description,
        best_time: formData.best_time,
        ideal_duration: formData.ideal_duration,
        for_who: formData.for_who,
        videos: JSON.parse(JSON.stringify(formData.videos)),
        is_active: formData.is_active,
      };

      if (editingDestination) {
        const { error } = await supabase
          .from('destinations')
          .update(destinationData)
          .eq('id', editingDestination.id);

        if (error) throw error;
        toast.success('Destino atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('destinations')
          .insert([destinationData]);

        if (error) throw error;
        toast.success('Destino criado com sucesso!');
      }

      resetForm();
      fetchDestinations();
    } catch (error: any) {
      console.error('Error saving destination:', error);
      toast.error(error.message || 'Erro ao salvar destino');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (destination: Destination) => {
    setEditingDestination(destination);
    setFormData({
      name: destination.name,
      slug: destination.slug,
      location: destination.location,
      image_url: destination.image_url || '',
      category: destination.category,
      type: destination.type,
      description: destination.description,
      best_time: destination.best_time,
      ideal_duration: destination.ideal_duration,
      for_who: destination.for_who,
      videos: destination.videos || [],
      is_active: destination.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este destino?')) return;

    try {
      const { error } = await supabase
        .from('destinations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Destino excluído com sucesso!');
      fetchDestinations();
    } catch (error) {
      console.error('Error deleting destination:', error);
      toast.error('Erro ao excluir destino');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      location: '',
      image_url: '',
      category: 'Praia',
      type: 'nacional',
      description: '',
      best_time: '',
      ideal_duration: '',
      for_who: '',
      videos: [],
      is_active: true,
    });
    setEditingDestination(null);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold text-foreground">
          Gestão de Destinos
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Destino
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={resetForm}>
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <button onClick={resetForm} className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
              {editingDestination ? 'Editar Destino' : 'Novo Destino'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nome do Destino *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Slug (URL)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Localização *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Grécia"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                  >
                    <option value="Praia">Praia</option>
                    <option value="Aventura">Aventura</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Natureza">Natureza</option>
                    <option value="Histórico">Histórico</option>
                    <option value="Romântico">Romântico</option>
                    <option value="Luxo">Luxo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                  >
                    <option value="nacional">Nacional</option>
                    <option value="internacional">Internacional</option>
                    <option value="explorar">Explorar</option>
                  </select>
                </div>
              </div>

              {/* Description with AI */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">Descrição *</label>
                  <button
                    type="button"
                    onClick={handleGenerateText}
                    disabled={isGeneratingText || !formData.name}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 disabled:opacity-50"
                  >
                    {isGeneratingText ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Gerar com IA
                  </button>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground min-h-[100px]"
                  required
                />
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Melhor Época
                  </label>
                  <input
                    type="text"
                    value={formData.best_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, best_time: e.target.value }))}
                    placeholder="Ex: Abril a Outubro"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Duração Ideal</label>
                  <input
                    type="text"
                    value={formData.ideal_duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, ideal_duration: e.target.value }))}
                    placeholder="Ex: 5 a 7 dias"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Indicado Para
                  </label>
                  <input
                    type="text"
                    value={formData.for_who}
                    onChange={(e) => setFormData(prev => ({ ...prev, for_who: e.target.value }))}
                    placeholder="Ex: Casais e aventureiros"
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                    required
                  />
                </div>
              </div>

              {/* Image with AI */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    <ImageIcon className="w-4 h-4 inline mr-1" />
                    Imagem
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !formData.name}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 disabled:opacity-50"
                  >
                    {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Gerar com IA
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="URL da imagem"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground"
                />
                {formData.image_url && (
                  <img src={formData.image_url} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-xl" />
                )}
              </div>

              {/* Videos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    <Video className="w-4 h-4 inline mr-1" />
                    Vídeos do YouTube
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVideo}
                    className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Vídeo
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.videos.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-xl">
                      Nenhum vídeo adicionado. Clique em "Adicionar Vídeo" para incluir.
                    </p>
                  )}
                  {formData.videos.map((video, index) => (
                    <div key={video.id} className="p-4 border border-border rounded-xl bg-secondary/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">Vídeo {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(index)}
                          className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={video.title}
                        onChange={(e) => handleUpdateVideo(index, 'title', e.target.value)}
                        placeholder="Título do vídeo"
                        className="w-full px-4 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm"
                      />
                      <input
                        type="text"
                        value={video.youtubeId}
                        onChange={(e) => handleUpdateVideo(index, 'youtubeId', e.target.value)}
                        placeholder="ID do YouTube (ex: dQw4w9WgXcQ)"
                        className="w-full px-4 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm"
                      />
                      {/* Video Preview */}
                      {video.youtubeId && (
                        <div className="aspect-video rounded-lg overflow-hidden">
                          <iframe
                            src={`https://www.youtube.com/embed/${video.youtubeId}`}
                            title={video.title || 'Video preview'}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-5 h-5 rounded border-border"
                />
                <span className="text-foreground">Destino ativo (visível no site)</span>
              </label>

              {/* Submit */}
              <div className="flex gap-3">
                <button type="button" onClick={resetForm} className="flex-1 btn-outline">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingDestination ? 'Atualizar' : 'Criar'} Destino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Destinations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {destinations.map((destination) => (
          <div key={destination.id} className="rounded-2xl border border-border overflow-hidden bg-card">
            <div className="aspect-video bg-secondary relative">
              {destination.image_url ? (
                <img src={destination.image_url} alt={destination.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-12 h-12" />
                </div>
              )}
              {/* Video count badge */}
              {destination.videos && destination.videos.length > 0 && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-lg">
                  <Video className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-foreground">{destination.videos.length} vídeos</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-medium text-foreground">{destination.name}</h3>
                  <p className="text-sm text-muted-foreground">{destination.location}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${destination.is_active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {destination.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground mb-3">
                <span className="px-2 py-1 bg-secondary rounded">{destination.type}</span>
                <span className="px-2 py-1 bg-secondary rounded">{destination.category}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{destination.description}</p>
              
              {/* Video list preview */}
              {destination.videos && destination.videos.length > 0 && (
                <div className="mb-4 space-y-1">
                  <p className="text-xs font-medium text-foreground">Vídeos:</p>
                  {destination.videos.slice(0, 3).map((video: any, idx: number) => (
                    <p key={idx} className="text-xs text-muted-foreground truncate">
                      • {video.title || video.youtubeId}
                    </p>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(destination)}
                  className="flex-1 btn-outline text-sm flex items-center justify-center gap-1"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(destination.id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {destinations.length === 0 && (
          <div className="col-span-full p-8 text-center text-muted-foreground rounded-2xl border border-border">
            Nenhum destino cadastrado ainda
          </div>
        )}
      </div>
    </div>
  );
};