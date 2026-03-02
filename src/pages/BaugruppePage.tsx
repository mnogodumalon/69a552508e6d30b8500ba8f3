import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Baugruppe, Anlagenteil, Anlagenteiltyp } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { BaugruppeDialog } from '@/components/dialogs/BaugruppeDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';

export default function BaugruppePage() {
  const [records, setRecords] = useState<Baugruppe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Baugruppe | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Baugruppe | null>(null);
  const [anlagenteilList, setAnlagenteilList] = useState<Anlagenteil[]>([]);
  const [anlagenteiltypList, setAnlagenteiltypList] = useState<Anlagenteiltyp[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, anlagenteilData, anlagenteiltypData] = await Promise.all([
        LivingAppsService.getBaugruppe(),
        LivingAppsService.getAnlagenteil(),
        LivingAppsService.getAnlagenteiltyp(),
      ]);
      setRecords(mainData);
      setAnlagenteilList(anlagenteilData);
      setAnlagenteiltypList(anlagenteiltypData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Baugruppe['fields']) {
    await LivingAppsService.createBaugruppeEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Baugruppe['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateBaugruppeEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteBaugruppeEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getAnlagenteilDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return anlagenteilList.find(r => r.record_id === id)?.fields.anlagenteil_name ?? '—';
  }

  function getAnlagenteiltypDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return anlagenteiltypList.find(r => r.record_id === id)?.fields.anlagenteiltyp_name ?? '—';
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
      title="Baugruppe"
      subtitle={`${records.length} Baugruppe im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Baugruppe suchen..."
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
              <TableHead>Anlagenteil</TableHead>
              <TableHead>Anlagenteiltyp</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{record.fields.baugruppe_name ?? '—'}</TableCell>
                <TableCell>{getAnlagenteilDisplayName(record.fields.baugruppe_anlagenteil)}</TableCell>
                <TableCell>{getAnlagenteiltypDisplayName(record.fields.baugruppe_anlagenteiltyp)}</TableCell>
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
                <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Baugruppe. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <BaugruppeDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        anlagenteilList={anlagenteilList}
        anlagenteiltypList={anlagenteiltypList}
        enablePhotoScan={AI_PHOTO_SCAN['Baugruppe']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Baugruppe löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}