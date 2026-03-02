import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Korrespondenz, Stoerungsmeldung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { KorrespondenzDialog } from '@/components/dialogs/KorrespondenzDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function KorrespondenzPage() {
  const [records, setRecords] = useState<Korrespondenz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Korrespondenz | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Korrespondenz | null>(null);
  const [stoerungsmeldungList, setStoerungsmeldungList] = useState<Stoerungsmeldung[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, stoerungsmeldungData] = await Promise.all([
        LivingAppsService.getKorrespondenz(),
        LivingAppsService.getStoerungsmeldung(),
      ]);
      setRecords(mainData);
      setStoerungsmeldungList(stoerungsmeldungData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Korrespondenz['fields']) {
    await LivingAppsService.createKorrespondenzEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Korrespondenz['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateKorrespondenzEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteKorrespondenzEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getStoerungsmeldungDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return stoerungsmeldungList.find(r => r.record_id === id)?.fields.stoerungsmeldung_beschreibung ?? '—';
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
      title="Korrespondenz"
      subtitle={`${records.length} Korrespondenz im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Korrespondenz suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Edit Key 1</TableHead>
              <TableHead>Edit Key 2</TableHead>
              <TableHead>Edit Key Timeout 1</TableHead>
              <TableHead>Edit Key Timeout 2</TableHead>
              <TableHead>Titel</TableHead>
              <TableHead>Betreff</TableHead>
              <TableHead>E-Mail-Adresse 1</TableHead>
              <TableHead>E-Mail-Adresse 2</TableHead>
              <TableHead>Label Mine 1</TableHead>
              <TableHead>Label Mine 2</TableHead>
              <TableHead>Label Yours 1</TableHead>
              <TableHead>Label Yours 2</TableHead>
              <TableHead>Icon 1</TableHead>
              <TableHead>Icon 2</TableHead>
              <TableHead>Störungsmeldung</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{record.fields.edit_key_1 ?? '—'}</TableCell>
                <TableCell>{record.fields.edit_key_2 ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.edit_key_timeout_1)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.edit_key_timeout_2)}</TableCell>
                <TableCell>{record.fields.titel ?? '—'}</TableCell>
                <TableCell>{record.fields.thema ?? '—'}</TableCell>
                <TableCell>{record.fields.e_mail_adresse_1 ?? '—'}</TableCell>
                <TableCell>{record.fields.e_mail_adresse_2 ?? '—'}</TableCell>
                <TableCell>{record.fields.label_mine_1 ?? '—'}</TableCell>
                <TableCell>{record.fields.label_mine_2 ?? '—'}</TableCell>
                <TableCell>{record.fields.label_yours_1 ?? '—'}</TableCell>
                <TableCell>{record.fields.label_yours_2 ?? '—'}</TableCell>
                <TableCell>{record.fields.icon_1 ?? '—'}</TableCell>
                <TableCell>{record.fields.icon_2 ?? '—'}</TableCell>
                <TableCell>{getStoerungsmeldungDisplayName(record.fields.stoerungsmeldung)}</TableCell>
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
                <TableCell colSpan={16} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Korrespondenz. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <KorrespondenzDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        stoerungsmeldungList={stoerungsmeldungList}
        enablePhotoScan={AI_PHOTO_SCAN['Korrespondenz']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Korrespondenz löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}