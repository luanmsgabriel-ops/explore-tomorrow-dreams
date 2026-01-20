import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckSquare, Square, Loader2, ListChecks, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  item_text: string;
  is_completed: boolean;
  is_default_item: boolean;
  sort_order: number;
}

interface ClientChecklistProps {
  tripId: string;
  tripName: string;
}

export const ClientChecklist = ({ tripId, tripName }: ClientChecklistProps) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    fetchChecklist();
  }, [tripId]);

  const fetchChecklist = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trip_checklist')
        .select('*')
        .eq('trip_id', tripId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching checklist:', error);
      toast.error('Erro ao carregar checklist');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = async (itemId: string, currentStatus: boolean) => {
    try {
      // Optimistic update
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, is_completed: !currentStatus } : item
        )
      );

      const { error } = await supabase
        .from('trip_checklist')
        .update({ is_completed: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating checklist item:', error);
      toast.error('Erro ao atualizar item');
      // Revert on error
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, is_completed: currentStatus } : item
        )
      );
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'pending') return !item.is_completed;
    if (filter === 'completed') return item.is_completed;
    return true;
  });

  const completedCount = items.filter(i => i.is_completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

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
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            Checklist do Viajante
          </h2>
          <p className="text-muted-foreground mt-1">
            Preparativos para {tripName}
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 glass rounded-2xl">
          <ListChecks className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">
            Checklist não disponível
          </h3>
          <p className="text-muted-foreground">
            Seu consultor irá preparar o checklist para sua viagem.
          </p>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-foreground">Progresso</span>
              <span className="text-sm text-muted-foreground">
                {completedCount} de {items.length} itens
              </span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center mt-3 text-sm text-muted-foreground">
              {progress === 100
                ? '🎉 Tudo pronto para sua viagem!'
                : progress >= 50
                ? '👏 Você está quase lá!'
                : '💪 Continue preparando sua viagem!'}
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-2">
              {(['all', 'pending', 'completed'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    filter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Concluídos'}
                </button>
              ))}
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-2">
            {filteredItems.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleItem(item.id, item.is_completed)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  item.is_completed
                    ? 'bg-primary/5 border-primary/20 opacity-70'
                    : 'bg-secondary/50 border-border hover:border-primary/30'
                }`}
              >
                <div className={`shrink-0 ${item.is_completed ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.is_completed ? (
                    <CheckSquare className="w-6 h-6" />
                  ) : (
                    <Square className="w-6 h-6" />
                  )}
                </div>
                <span
                  className={`flex-1 ${
                    item.is_completed
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {item.item_text}
                </span>
                {!item.is_default_item && (
                  <span className="px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">
                    Personalizado
                  </span>
                )}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {filter === 'pending'
                ? '🎉 Todos os itens foram concluídos!'
                : 'Nenhum item concluído ainda'}
            </div>
          )}
        </>
      )}
    </div>
  );
};
