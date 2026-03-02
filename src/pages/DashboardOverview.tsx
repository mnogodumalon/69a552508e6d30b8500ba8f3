import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichStoerungsmeldung } from '@/lib/enrich';
import type { EnrichedStoerungsmeldung } from '@/types/enriched';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Plus, AlertTriangle, Clock, CheckCircle2, Wrench, Building2, Layers, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { StoerungsmeldungDialog } from '@/components/dialogs/StoerungsmeldungDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';

type Dringlichkeit = 'stillstand' | 'stillstand_droht' | 'merken' | 'erledigt';

const DRINGLICHKEIT_CONFIG: Record<string, { label: string; color: string; headerColor: string; icon: React.ReactNode; order: number }> = {
  stillstand: {
    label: 'Stillstand',
    color: 'bg-destructive/10 border-destructive/30 text-destructive',
    headerColor: 'bg-destructive text-destructive-foreground',
    icon: <AlertCircle size={14} />,
    order: 0,
  },
  stillstand_droht: {
    label: 'Stillstand droht',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    headerColor: 'bg-orange-500 text-white',
    icon: <AlertTriangle size={14} />,
    order: 1,
  },
  merken: {
    label: 'Merken',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    headerColor: 'bg-amber-400 text-white',
    icon: <Clock size={14} />,
    order: 2,
  },
  erledigt: {
    label: 'Erledigt',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    headerColor: 'bg-emerald-500 text-white',
    icon: <CheckCircle2 size={14} />,
    order: 3,
  },
};

export default function DashboardOverview() {
  const {
    mitarbeiter, produktionsbereich, anlagenteiltyp, anlage, anlagenteil, baugruppe, stoerungsmeldung,
    mitarbeiterMap, produktionsbereichMap, anlageMap, anlagenteilMap, baugruppeMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EnrichedStoerungsmeldung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedStoerungsmeldung | null>(null);
  const [selectedBereich, setSelectedBereich] = useState<string>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const enrichedStoerungsmeldung = useMemo(() =>
    enrichStoerungsmeldung(stoerungsmeldung, { mitarbeiterMap, produktionsbereichMap, anlageMap, anlagenteilMap, baugruppeMap }),
    [stoerungsmeldung, mitarbeiterMap, produktionsbereichMap, anlageMap, anlagenteilMap, baugruppeMap]
  );

  const filtered = useMemo(() => {
    if (selectedBereich === 'all') return enrichedStoerungsmeldung;
    return enrichedStoerungsmeldung.filter(s => {
      const id = s.fields.stoerungsmeldung_produktionsbereich?.match(/([a-f0-9]{24})$/i)?.[1];
      return id === selectedBereich;
    });
  }, [enrichedStoerungsmeldung, selectedBereich]);

  const kanbanColumns = useMemo(() => {
    const cols: Record<string, EnrichedStoerungsmeldung[]> = {
      stillstand: [],
      stillstand_droht: [],
      merken: [],
      erledigt: [],
    };
    for (const s of filtered) {
      const key = (s.fields.stoerungsmeldung_dringlichkeit as Dringlichkeit) || 'merken';
      if (cols[key]) cols[key].push(s);
      else cols['merken'].push(s);
    }
    return cols;
  }, [filtered]);

  const offen = enrichedStoerungsmeldung.filter(s => !s.fields.erledigt).length;
  const kritisch = enrichedStoerungsmeldung.filter(s => s.fields.stoerungsmeldung_dringlichkeit === 'stillstand').length;
  const heute = enrichedStoerungsmeldung.filter(s => s.fields.stoerungsmeldung_datum === new Date().toISOString().slice(0, 10)).length;

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const handleCreate = async (fields: Record<string, unknown>) => {
    await LivingAppsService.createStoerungsmeldungEntry(fields as never);
    fetchAll();
  };

  const handleEdit = async (fields: Record<string, unknown>) => {
    if (!editRecord) return;
    await LivingAppsService.updateStoerungsmeldungEntry(editRecord.record_id, fields as never);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteStoerungsmeldungEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Störungsmeldungen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Alle Anlagen im Überblick — {enrichedStoerungsmeldung.length} Meldungen gesamt</p>
        </div>
        <Button
          onClick={() => { setEditRecord(null); setDialogOpen(true); }}
          className="shrink-0"
        >
          <Plus size={16} className="mr-2" />
          Neue Störung
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Offen"
          value={String(offen)}
          description="Unerledigte Meldungen"
          icon={<Wrench size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Stillstand"
          value={String(kritisch)}
          description="Kritische Störungen"
          icon={<AlertCircle size={18} className="text-destructive" />}
        />
        <StatCard
          title="Heute"
          value={String(heute)}
          description="Neue Meldungen heute"
          icon={<Clock size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Anlagen"
          value={String(anlage.length)}
          description={`in ${produktionsbereich.length} Bereichen`}
          icon={<Building2 size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Produktionsbereich Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedBereich('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
            selectedBereich === 'all'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          Alle Bereiche
        </button>
        {produktionsbereich.map(pb => (
          <button
            key={pb.record_id}
            onClick={() => setSelectedBereich(pb.record_id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              selectedBereich === pb.record_id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {pb.fields.produktionsbereich_name}
          </button>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Object.entries(DRINGLICHKEIT_CONFIG)
          .sort(([, a], [, b]) => a.order - b.order)
          .map(([key, config]) => {
            const items = kanbanColumns[key] || [];
            return (
              <div key={key} className="flex flex-col gap-2">
                {/* Column Header */}
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl ${config.headerColor}`}>
                  <div className="flex items-center gap-1.5 font-semibold text-sm">
                    {config.icon}
                    {config.label}
                  </div>
                  <span className="text-xs font-bold opacity-80 bg-black/10 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 min-h-[120px]">
                  {items.length === 0 && (
                    <div className="flex items-center justify-center h-20 rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                      Keine Einträge
                    </div>
                  )}
                  {items.map(s => {
                    const isExpanded = expandedCard === s.record_id;
                    return (
                      <div
                        key={s.record_id}
                        className="bg-card border border-border rounded-xl p-3 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => setExpandedCard(isExpanded ? null : s.record_id)}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                            {s.fields.stoerungsmeldung_beschreibung || '(Keine Beschreibung)'}
                          </p>
                          <ChevronRight
                            size={14}
                            className={`shrink-0 mt-0.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          />
                        </div>

                        {/* Anlage Badge */}
                        {s.stoerungsmeldung_anlageName && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                            <Layers size={11} />
                            <span className="truncate">{s.stoerungsmeldung_anlageName}</span>
                          </div>
                        )}

                        {/* Date + Erfasser */}
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(s.fields.stoerungsmeldung_datum)}
                          </span>
                          {s.stoerungsmeldung_erfasserName && (
                            <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                              {s.stoerungsmeldung_erfasserName}
                            </span>
                          )}
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                            {s.stoerungsmeldung_produktionsbereichName && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Bereich</span>
                                <span className="font-medium">{s.stoerungsmeldung_produktionsbereichName}</span>
                              </div>
                            )}
                            {s.stoerungsmeldung_anlagenteilName && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Anlagenteil</span>
                                <span className="font-medium">{s.stoerungsmeldung_anlagenteilName}</span>
                              </div>
                            )}
                            {s.stoerungsmeldung_baugruppeName && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Baugruppe</span>
                                <span className="font-medium">{s.stoerungsmeldung_baugruppeName}</span>
                              </div>
                            )}
                            {s.fields.stoerungsmeldung_foto && (
                              <div className="mt-2">
                                <img
                                  src={s.fields.stoerungsmeldung_foto}
                                  alt="Störungsfoto"
                                  className="rounded-lg w-full h-24 object-cover border border-border"
                                />
                              </div>
                            )}
                            <div className="flex gap-2 pt-1" onClick={e => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-7 text-xs"
                                onClick={() => { setEditRecord(s); setDialogOpen(true); }}
                              >
                                Bearbeiten
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="flex-1 h-7 text-xs"
                                onClick={() => setDeleteTarget(s)}
                              >
                                Löschen
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Card Button */}
                  <button
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                    onClick={() => { setEditRecord(null); setDialogOpen(true); }}
                  >
                    <Plus size={12} />
                    Störung melden
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Dialogs */}
      <StoerungsmeldungDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); }}
        onSubmit={editRecord ? handleEdit : handleCreate}
        defaultValues={editRecord?.fields}
        mitarbeiterList={mitarbeiter}
        produktionsbereichList={produktionsbereich}
        anlageList={anlage}
        anlagenteilList={anlagenteil}
        baugruppeList={baugruppe}
        enablePhotoScan={AI_PHOTO_SCAN['Stoerungsmeldung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Störungsmeldung löschen"
        description={`Störungsmeldung "${deleteTarget?.fields.stoerungsmeldung_beschreibung?.slice(0, 60) || '(Keine Beschreibung)'}" wirklich löschen?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
