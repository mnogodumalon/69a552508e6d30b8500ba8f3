import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Details, Produktionsbereich, Anlage, Anlagenteiltyp, Anlagenteil, Baugruppe } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { DetailsDialog } from '@/components/dialogs/DetailsDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';

export default function DetailsPage() {
  const [records, setRecords] = useState<Details[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Details | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Details | null>(null);
  const [produktionsbereichList, setProduktionsbereichList] = useState<Produktionsbereich[]>([]);
  const [anlageList, setAnlageList] = useState<Anlage[]>([]);
  const [anlagenteiltypList, setAnlagenteiltypList] = useState<Anlagenteiltyp[]>([]);
  const [anlagenteilList, setAnlagenteilList] = useState<Anlagenteil[]>([]);
  const [baugruppeList, setBaugruppeList] = useState<Baugruppe[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, produktionsbereichData, anlageData, anlagenteiltypData, anlagenteilData, baugruppeData] = await Promise.all([
        LivingAppsService.getDetails(),
        LivingAppsService.getProduktionsbereich(),
        LivingAppsService.getAnlage(),
        LivingAppsService.getAnlagenteiltyp(),
        LivingAppsService.getAnlagenteil(),
        LivingAppsService.getBaugruppe(),
      ]);
      setRecords(mainData);
      setProduktionsbereichList(produktionsbereichData);
      setAnlageList(anlageData);
      setAnlagenteiltypList(anlagenteiltypData);
      setAnlagenteilList(anlagenteilData);
      setBaugruppeList(baugruppeData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Details['fields']) {
    await LivingAppsService.createDetail(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Details['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateDetail(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteDetail(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getProduktionsbereichDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return produktionsbereichList.find(r => r.record_id === id)?.fields.produktionsbereich_name ?? '—';
  }

  function getAnlageDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return anlageList.find(r => r.record_id === id)?.fields.anlage_name ?? '—';
  }

  function getAnlagenteiltypDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return anlagenteiltypList.find(r => r.record_id === id)?.fields.anlagenteiltyp_name ?? '—';
  }

  function getAnlagenteilDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return anlagenteilList.find(r => r.record_id === id)?.fields.anlagenteil_name ?? '—';
  }

  function getBaugruppeDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return baugruppeList.find(r => r.record_id === id)?.fields.baugruppe_name ?? '—';
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v =>
      String(v ?? '').toLowerCase().includes(s)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title="Details"
      subtitle={`${records.length} Details im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Details suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produktionsbereich</TableHead>
              <TableHead>Anlage</TableHead>
              <TableHead>Anlagenteiltyp</TableHead>
              <TableHead>Anlagenteil</TableHead>
              <TableHead>Baugruppe</TableHead>
              <TableHead>Bezeichnung</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead>Datei</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell>{getProduktionsbereichDisplayName(record.fields.produktionsbereich)}</TableCell>
                <TableCell>{getAnlageDisplayName(record.fields.stoerungsmeldung_anlage)}</TableCell>
                <TableCell>{getAnlagenteiltypDisplayName(record.fields.anlagenteiltyp)}</TableCell>
                <TableCell>{getAnlagenteilDisplayName(record.fields.anlagenteil)}</TableCell>
                <TableCell>{getBaugruppeDisplayName(record.fields.baugruppe)}</TableCell>
                <TableCell className="font-medium">{record.fields.bezeichnung ?? '—'}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.beschreibung ?? '—'}</span></TableCell>
                <TableCell>{record.fields.datei ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(record)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Details. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DetailsDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        produktionsbereichList={produktionsbereichList}
        anlageList={anlageList}
        anlagenteiltypList={anlagenteiltypList}
        anlagenteilList={anlagenteilList}
        baugruppeList={baugruppeList}
        enablePhotoScan={AI_PHOTO_SCAN['Details']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Details löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}