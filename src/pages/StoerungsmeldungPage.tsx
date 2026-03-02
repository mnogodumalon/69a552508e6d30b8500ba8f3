import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Stoerungsmeldung, Mitarbeiter, Produktionsbereich, Anlage, Anlagenteil, Baugruppe } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { StoerungsmeldungDialog } from '@/components/dialogs/StoerungsmeldungDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function StoerungsmeldungPage() {
  const [records, setRecords] = useState<Stoerungsmeldung[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Stoerungsmeldung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Stoerungsmeldung | null>(null);
  const [mitarbeiterList, setMitarbeiterList] = useState<Mitarbeiter[]>([]);
  const [produktionsbereichList, setProduktionsbereichList] = useState<Produktionsbereich[]>([]);
  const [anlageList, setAnlageList] = useState<Anlage[]>([]);
  const [anlagenteilList, setAnlagenteilList] = useState<Anlagenteil[]>([]);
  const [baugruppeList, setBaugruppeList] = useState<Baugruppe[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, mitarbeiterData, produktionsbereichData, anlageData, anlagenteilData, baugruppeData] = await Promise.all([
        LivingAppsService.getStoerungsmeldung(),
        LivingAppsService.getMitarbeiter(),
        LivingAppsService.getProduktionsbereich(),
        LivingAppsService.getAnlage(),
        LivingAppsService.getAnlagenteil(),
        LivingAppsService.getBaugruppe(),
      ]);
      setRecords(mainData);
      setMitarbeiterList(mitarbeiterData);
      setProduktionsbereichList(produktionsbereichData);
      setAnlageList(anlageData);
      setAnlagenteilList(anlagenteilData);
      setBaugruppeList(baugruppeData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Stoerungsmeldung['fields']) {
    await LivingAppsService.createStoerungsmeldungEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Stoerungsmeldung['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateStoerungsmeldungEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteStoerungsmeldungEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getMitarbeiterDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return mitarbeiterList.find(r => r.record_id === id)?.fields.mitarbeiter_vorname ?? '—';
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
      title="Störungsmeldung"
      subtitle={`${records.length} Störungsmeldung im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Störungsmeldung suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Erfasser</TableHead>
              <TableHead>Standort der Störung</TableHead>
              <TableHead>Produktionsbereich</TableHead>
              <TableHead>Anlage</TableHead>
              <TableHead>Anlagenteil</TableHead>
              <TableHead>Baugruppe</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead>Foto</TableHead>
              <TableHead>Dringlichkeit</TableHead>
              <TableHead>Erledigt</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="text-muted-foreground">{formatDate(record.fields.stoerungsmeldung_datum)}</TableCell>
                <TableCell>{getMitarbeiterDisplayName(record.fields.stoerungsmeldung_erfasser)}</TableCell>
                <TableCell>{record.fields.stoerungsmeldung_standort ?? '—'}</TableCell>
                <TableCell>{getProduktionsbereichDisplayName(record.fields.stoerungsmeldung_produktionsbereich)}</TableCell>
                <TableCell>{getAnlageDisplayName(record.fields.stoerungsmeldung_anlage)}</TableCell>
                <TableCell>{getAnlagenteilDisplayName(record.fields.stoerungsmeldung_anlagenteil)}</TableCell>
                <TableCell>{getBaugruppeDisplayName(record.fields.stoerungsmeldung_baugruppe)}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.stoerungsmeldung_beschreibung ?? '—'}</span></TableCell>
                <TableCell>{record.fields.stoerungsmeldung_foto ?? '—'}</TableCell>
                <TableCell>{record.fields.stoerungsmeldung_dringlichkeit ?? '—'}</TableCell>
                <TableCell><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${record.fields.erledigt ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{record.fields.erledigt ? 'Ja' : 'Nein'}</span></TableCell>
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
                <TableCell colSpan={12} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Störungsmeldung. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <StoerungsmeldungDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        mitarbeiterList={mitarbeiterList}
        produktionsbereichList={produktionsbereichList}
        anlageList={anlageList}
        anlagenteilList={anlagenteilList}
        baugruppeList={baugruppeList}
        enablePhotoScan={AI_PHOTO_SCAN['Stoerungsmeldung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Störungsmeldung löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}