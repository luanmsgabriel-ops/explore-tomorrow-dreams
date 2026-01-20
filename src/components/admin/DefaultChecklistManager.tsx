import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Loader2, 
  Plus,
  Trash2,
  GripVertical,
  Save
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  item_text: string;
  category: string;
  is_active: boolean;
  sort_order: number;
}

const CATEGORIES = [
  { value: 'documentos', label: 'Documentos' },
  { value: 'saude', label: 'Saúde' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'bagagem', label: 'Bagagem' },
  { value: 'geral', label: 'Geral' },
];

export const DefaultChecklistManager = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('geral');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('checklist_items_default')
        .select('*')
        .order('category')
        .order('sort_order');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching checklist items:', error);
      toast.error('Erro ao carregar checklist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemText.trim()) {
      toast.error('Digite o texto do item');
      return;
    }

    try {
      const { error } = await supabase
        .from('checklist_items_default')
        .insert({
          item_text: newItemText,
          category: newItemCategory,
          sort_order: items.length
        });

      if (error) throw error;
      
      toast.success('Item adicionado');
      setNewItemText('');
      fetchItems();
    } catch (error) {
      toast.error('Erro ao adicionar item');
    }
  };

  const handleToggleActive = async (item: ChecklistItem) => {
    try {
      const { error } = await supabase
        .from('checklist_items_default')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;
      
      setItems(items.map(i => 
        i.id === item.id ? { ...i, is_active: !i.is_active } : i
      ));
    } catch (error) {
      toast.error('Erro ao atualizar item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Excluir este item do checklist padrão?')) return;

    try {
      const { error } = await supabase
        .from('checklist_items_default')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      toast.success('Item excluído');
      fetchItems();
    } catch (error) {
      toast.error('Erro ao excluir item');
    }
  };

  const handleUpdateItem = async (item: ChecklistItem, newText: string) => {
    try {
      const { error } = await supabase
        .from('checklist_items_default')
        .update({ item_text: newText })
        .eq('id', item.id);

      if (error) throw error;
      
      setItems(items.map(i => 
        i.id === item.id ? { ...i, item_text: newText } : i
      ));
    } catch (error) {
      toast.error('Erro ao atualizar item');
    }
  };

  // Group items by category
  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = items.filter(i => i.category === cat.value);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

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
        <h2 className="text-2xl font-bold text-foreground">Checklist Padrão</h2>
        <p className="text-muted-foreground">Itens que aparecem automaticamente em novas viagens</p>
      </div>

      {/* Add new item */}
      <div className="glass rounded-xl p-4">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Novo item do checklist"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Select value={newItemCategory} onValueChange={setNewItemCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddItem}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>

      {/* Items by category */}
      <div className="space-y-6">
        {CATEGORIES.map((category) => {
          const categoryItems = groupedItems[category.value] || [];
          if (categoryItems.length === 0) return null;

          return (
            <div key={category.value} className="space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {category.label}
                <span className="text-muted-foreground font-normal text-sm">
                  ({categoryItems.filter(i => i.is_active).length} ativos)
                </span>
              </h3>
              
              <div className="space-y-2">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      item.is_active 
                        ? 'bg-card border-border' 
                        : 'bg-muted/50 border-transparent opacity-60'
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    
                    <Input
                      value={item.item_text}
                      onChange={(e) => handleUpdateItem(item, e.target.value)}
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 px-0"
                    />
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => handleToggleActive(item)}
                        />
                        <Label className="text-xs text-muted-foreground">
                          {item.is_active ? 'Ativo' : 'Inativo'}
                        </Label>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 glass rounded-2xl">
          <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum item cadastrado</h3>
          <p className="text-muted-foreground">Adicione itens que aparecerão em todas as novas viagens</p>
        </div>
      )}
    </div>
  );
};
