import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckSquare, Square, Loader2, ListChecks, Filter, Plus, X } from 'lucide-react';
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
  const [newItemText, setNewItemText] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

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

  const addNewItem = async () => {
    if (!newItemText.trim()) {
      toast.error('Digite o texto do item');
      return;
    }

    setIsAddingItem(true);
    try {
      const maxSortOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : 0;

      const { data, error } = await supabase
        .from('trip_checklist')
        .insert({
          trip_id: tripId,
          item_text: newItemText.trim(),
          is_default_item: false,
          is_completed: false,
          sort_order: maxSortOrder + 1
        })
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [...prev, data]);
      setNewItemText('');
      setShowAddForm(false);
      toast.success('Item adicionado ao checklist!');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Erro ao adicionar item');
    } finally {
      setIsAddingItem(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      // Find the item to check if it's a custom item
      const itemToDelete = items.find(i => i.id === itemId);
      if (!itemToDelete || itemToDelete.is_default_item) {
        toast.error('Não é possível remover itens padrão');
        return;
      }

      // Optimistic update
      setItems(prev => prev.filter(item => item.id !== itemId));

      const { error } = await supabase
        .from('trip_checklist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Item removido');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erro ao remover item');
      fetchChecklist(); // Refetch to restore state
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
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar Item</span>
        </button>
      </div>

      {/* Add New Item Form */}
      {showAddForm && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Digite o novo item do checklist..."
              className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && addNewItem()}
              autoFocus
            />
            <button
              onClick={addNewItem}
              disabled={isAddingItem || !newItemText.trim()}
              className="px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAddingItem ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Adicionar'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewItemText('');
              }}
              className="p-3 rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 glass rounded-2xl">
          <ListChecks className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-serif text-xl font-bold text-foreground mb-2">
            Checklist não disponível
          </h3>
          <p className="text-muted-foreground mb-4">
            Seu consultor irá preparar o checklist para sua viagem.
          </p>
          <p className="text-sm text-muted-foreground">
            Ou adicione seus próprios itens usando o botão acima!
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
              <div
                key={item.id}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  item.is_completed
                    ? 'bg-primary/5 border-primary/20 opacity-70'
                    : 'bg-secondary/50 border-border hover:border-primary/30'
                }`}
              >
                <button
                  onClick={() => toggleItem(item.id, item.is_completed)}
                  className={`shrink-0 ${item.is_completed ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {item.is_completed ? (
                    <CheckSquare className="w-6 h-6" />
                  ) : (
                    <Square className="w-6 h-6" />
                  )}
                </button>
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
                  <>
                    <span className="px-2 py-0.5 rounded text-xs bg-accent/20 text-accent">
                      Personalizado
                    </span>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remover item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
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
