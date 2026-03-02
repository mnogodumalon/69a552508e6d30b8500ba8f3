import { useState, useEffect, useRef } from 'react';
import type { Details, Produktionsbereich, Anlage, Anlagenteiltyp, Anlagenteil, Baugruppe } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Camera, Loader2 } from 'lucide-react';
import { extractFromPhoto, fileToDataUri } from '@/lib/ai';

interface DetailsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Details['fields']) => Promise<void>;
  defaultValues?: Details['fields'];
  produktionsbereichList: Produktionsbereich[];
  anlageList: Anlage[];
  anlagenteiltypList: Anlagenteiltyp[];
  anlagenteilList: Anlagenteil[];
  baugruppeList: Baugruppe[];
  enablePhotoScan?: boolean;
}

export function DetailsDialog({ open, onClose, onSubmit, defaultValues, produktionsbereichList, anlageList, anlagenteiltypList, anlagenteilList, baugruppeList, enablePhotoScan = false }: DetailsDialogProps) {
  const [fields, setFields] = useState<Partial<Details['fields']>>({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as Details['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "produktionsbereich": string | null, // Name des Produktionsbereich-Eintrags (z.B. "Jonas Schmidt")\n  "stoerungsmeldung_anlage": string | null, // Name des Anlage-Eintrags (z.B. "Jonas Schmidt")\n  "anlagenteiltyp": string | null, // Name des Anlagenteiltyp-Eintrags (z.B. "Jonas Schmidt")\n  "anlagenteil": string | null, // Name des Anlagenteil-Eintrags (z.B. "Jonas Schmidt")\n  "baugruppe": string | null, // Name des Baugruppe-Eintrags (z.B. "Jonas Schmidt")\n  "bezeichnung": string | null, // Bezeichnung\n  "beschreibung": string | null, // Beschreibung\n  "datei": string | null, // Datei\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["produktionsbereich", "stoerungsmeldung_anlage", "anlagenteiltyp", "anlagenteil", "baugruppe"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        const produktionsbereichName = raw['produktionsbereich'] as string | null;
        if (produktionsbereichName && !merged['produktionsbereich']) {
          const produktionsbereichMatch = produktionsbereichList.find(r => matchName(produktionsbereichName!, [String(r.fields.produktionsbereich_name ?? '')]));
          if (produktionsbereichMatch) merged['produktionsbereich'] = createRecordUrl(APP_IDS.PRODUKTIONSBEREICH, produktionsbereichMatch.record_id);
        }
        const stoerungsmeldung_anlageName = raw['stoerungsmeldung_anlage'] as string | null;
        if (stoerungsmeldung_anlageName && !merged['stoerungsmeldung_anlage']) {
          const stoerungsmeldung_anlageMatch = anlageList.find(r => matchName(stoerungsmeldung_anlageName!, [String(r.fields.anlage_name ?? '')]));
          if (stoerungsmeldung_anlageMatch) merged['stoerungsmeldung_anlage'] = createRecordUrl(APP_IDS.ANLAGE, stoerungsmeldung_anlageMatch.record_id);
        }
        const anlagenteiltypName = raw['anlagenteiltyp'] as string | null;
        if (anlagenteiltypName && !merged['anlagenteiltyp']) {
          const anlagenteiltypMatch = anlagenteiltypList.find(r => matchName(anlagenteiltypName!, [String(r.fields.anlagenteiltyp_name ?? '')]));
          if (anlagenteiltypMatch) merged['anlagenteiltyp'] = createRecordUrl(APP_IDS.ANLAGENTEILTYP, anlagenteiltypMatch.record_id);
        }
        const anlagenteilName = raw['anlagenteil'] as string | null;
        if (anlagenteilName && !merged['anlagenteil']) {
          const anlagenteilMatch = anlagenteilList.find(r => matchName(anlagenteilName!, [String(r.fields.anlagenteil_name ?? '')]));
          if (anlagenteilMatch) merged['anlagenteil'] = createRecordUrl(APP_IDS.ANLAGENTEIL, anlagenteilMatch.record_id);
        }
        const baugruppeName = raw['baugruppe'] as string | null;
        if (baugruppeName && !merged['baugruppe']) {
          const baugruppeMatch = baugruppeList.find(r => matchName(baugruppeName!, [String(r.fields.baugruppe_name ?? '')]));
          if (baugruppeMatch) merged['baugruppe'] = createRecordUrl(APP_IDS.BAUGRUPPE, baugruppeMatch.record_id);
        }
        return merged as Partial<Details['fields']>;
      });
    } catch (err) {
      console.error('Scan fehlgeschlagen:', err);
    } finally {
      setScanning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{defaultValues ? 'Details bearbeiten' : 'Details hinzufügen'}</DialogTitle>
            {enablePhotoScan && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handlePhotoScan(f);
                    e.target.value = '';
                  }}
                />
                <Button type="button" variant="outline" size="sm" disabled={scanning} onClick={() => fileInputRef.current?.click()}>
                  {scanning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
                  {scanning ? 'Wird erkannt...' : 'Foto scannen'}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="produktionsbereich">Produktionsbereich</Label>
            <Select
              value={extractRecordId(fields.produktionsbereich) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, produktionsbereich: v === 'none' ? undefined : createRecordUrl(APP_IDS.PRODUKTIONSBEREICH, v) }))}
            >
              <SelectTrigger id="produktionsbereich"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {produktionsbereichList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.produktionsbereich_name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stoerungsmeldung_anlage">Anlage</Label>
            <Select
              value={extractRecordId(fields.stoerungsmeldung_anlage) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, stoerungsmeldung_anlage: v === 'none' ? undefined : createRecordUrl(APP_IDS.ANLAGE, v) }))}
            >
              <SelectTrigger id="stoerungsmeldung_anlage"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {anlageList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.anlage_name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="anlagenteiltyp">Anlagenteiltyp</Label>
            <Select
              value={extractRecordId(fields.anlagenteiltyp) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, anlagenteiltyp: v === 'none' ? undefined : createRecordUrl(APP_IDS.ANLAGENTEILTYP, v) }))}
            >
              <SelectTrigger id="anlagenteiltyp"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {anlagenteiltypList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.anlagenteiltyp_name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="anlagenteil">Anlagenteil</Label>
            <Select
              value={extractRecordId(fields.anlagenteil) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, anlagenteil: v === 'none' ? undefined : createRecordUrl(APP_IDS.ANLAGENTEIL, v) }))}
            >
              <SelectTrigger id="anlagenteil"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {anlagenteilList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.anlagenteil_name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="baugruppe">Baugruppe</Label>
            <Select
              value={extractRecordId(fields.baugruppe) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, baugruppe: v === 'none' ? undefined : createRecordUrl(APP_IDS.BAUGRUPPE, v) }))}
            >
              <SelectTrigger id="baugruppe"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {baugruppeList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.baugruppe_name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bezeichnung">Bezeichnung</Label>
            <Input
              id="bezeichnung"
              value={fields.bezeichnung ?? ''}
              onChange={e => setFields(f => ({ ...f, bezeichnung: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="beschreibung">Beschreibung</Label>
            <Textarea
              id="beschreibung"
              value={fields.beschreibung ?? ''}
              onChange={e => setFields(f => ({ ...f, beschreibung: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="datei">Datei</Label>
            <Input
              id="datei"
              value={fields.datei ?? ''}
              onChange={e => setFields(f => ({ ...f, datei: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichern...' : defaultValues ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}