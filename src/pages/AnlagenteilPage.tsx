import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Anlagenteil, Anlagenteiltyp, Anlage } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { AnlagenteilDialog } from '@/components/dialogs/AnlagenteilDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function AnlagenteilPage() {
  const [records, setRecords] = useState<Anlagenteil[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Anlagenteil | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Anlagenteil | null>(null);
  const [anlagenteiltypList, setAnlagenteiltypList] = useState<Anlagenteiltyp[]>([]);
  const [anlageList, setAnlageList] = useState<Anlage[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, anlagenteiltypData, anlageData] = await Promise.all([
        LivingAppsService.getAnlagenteil(),
        LivingAppsService.getAnlagenteiltyp(),
        LivingAppsService.getAnlage(),
      ]);
      setRecords(mainData);
      setAnlagenteiltypList(anlagenteiltypData);
      setAnlageList(anlageData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Anlagenteil['fields']) {
    await LivingAppsService.createAnlagenteilEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Anlagenteil['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateAnlagenteilEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteAnlagenteilEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getAnlagenteiltypDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return anlagenteiltypList.find(r => r.record_id === id)?.fields.anlagenteiltyp_name ?? '—';
  }

  function getAnlageDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return anlageList.find(r => r.record_id === id)?.fields.anlage_name ?? '—';
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
      title="Anlagenteil"
      subtitle={`${records.length} Anlagenteil im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Anlagenteil suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Anlage</TableHead>
              <TableHead>Geografischer Ort des Anlagenteils</TableHead>
              <TableHead>Verbau-Datum</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{record.fields.anlagenteil_name ?? '—'}</TableCell>
                <TableCell>{getAnlagenteiltypDisplayName(record.fields.typ)}</TableCell>
                <TableCell>{getAnlageDisplayName(record.fields.anlagenteil_anlage)}</TableCell>
                <TableCell>{record.fields.anlagenteil_geo ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.anlagenteil_verbaut_am)}</TableCell>
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
                <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Anlagenteil. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AnlagenteilDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        anlagenteiltypList={anlagenteiltypList}
        anlageList={anlageList}
        enablePhotoScan={AI_PHOTO_SCAN['Anlagenteil']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Anlagenteil löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}