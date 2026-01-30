import { useState } from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface QuotesFilterValues {
  search: string;
  status: string;
  channel: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  hasFollowUp: string;
}

interface QuotesFilterProps {
  filters: QuotesFilterValues;
  onFiltersChange: (filters: QuotesFilterValues) => void;
  destinations: string[];
}

const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'quoted', label: 'Cotado' },
  { value: 'completed', label: 'Finalizado' },
];

const channelOptions = [
  { value: 'all', label: 'Todos os canais' },
  { value: 'website', label: 'Site' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'whatsapp_direct', label: 'WhatsApp' },
  { value: 'phone', label: 'Telefone' },
  { value: 'walk_in', label: 'Presencial' },
  { value: 'referral', label: 'Indicação' },
  { value: 'email', label: 'E-mail' },
  { value: 'other', label: 'Outro' },
];

const followUpOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Com retorno pendente' },
  { value: 'today', label: 'Retorno hoje' },
  { value: 'overdue', label: 'Retorno atrasado' },
  { value: 'none', label: 'Sem retorno agendado' },
];

export const QuotesFilter = ({ filters, onFiltersChange, destinations }: QuotesFilterProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof QuotesFilterValues, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      channel: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      hasFollowUp: 'all',
    });
  };

  const hasActiveFilters = 
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.channel !== 'all' ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined ||
    filters.hasFollowUp !== 'all';

  return (
    <div className="space-y-4">
      {/* Main filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, telefone ou destino..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status filter */}
        <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Channel filter */}
        <Select value={filters.channel} onValueChange={(value) => updateFilter('channel', value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            {channelOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Toggle advanced filters */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(showAdvanced && 'bg-primary/10 border-primary')}
        >
          <Filter className="w-4 h-4" />
        </Button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
            <X className="w-4 h-4" />
            Limpar
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-secondary/30 rounded-xl">
          {/* Date from */}
          <div className="flex-1">
            <label className="text-sm text-muted-foreground mb-1 block">Data início</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !filters.dateFrom && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => updateFilter('dateFrom', date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date to */}
          <div className="flex-1">
            <label className="text-sm text-muted-foreground mb-1 block">Data fim</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !filters.dateTo && 'text-muted-foreground'
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => updateFilter('dateTo', date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Follow-up filter */}
          <div className="flex-1">
            <label className="text-sm text-muted-foreground mb-1 block">Retorno</label>
            <Select value={filters.hasFollowUp} onValueChange={(value) => updateFilter('hasFollowUp', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Retorno" />
              </SelectTrigger>
              <SelectContent>
                {followUpOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active filters summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              Busca: "{filters.search}"
              <button onClick={() => updateFilter('search', '')} className="hover:text-primary/70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.status !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              Status: {statusOptions.find(s => s.value === filters.status)?.label}
              <button onClick={() => updateFilter('status', 'all')} className="hover:text-primary/70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.channel !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              Canal: {channelOptions.find(c => c.value === filters.channel)?.label}
              <button onClick={() => updateFilter('channel', 'all')} className="hover:text-primary/70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.dateFrom && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              De: {format(filters.dateFrom, 'dd/MM/yyyy', { locale: ptBR })}
              <button onClick={() => updateFilter('dateFrom', undefined)} className="hover:text-primary/70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.dateTo && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              Até: {format(filters.dateTo, 'dd/MM/yyyy', { locale: ptBR })}
              <button onClick={() => updateFilter('dateTo', undefined)} className="hover:text-primary/70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.hasFollowUp !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
              Retorno: {followUpOptions.find(f => f.value === filters.hasFollowUp)?.label}
              <button onClick={() => updateFilter('hasFollowUp', 'all')} className="hover:text-primary/70">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
