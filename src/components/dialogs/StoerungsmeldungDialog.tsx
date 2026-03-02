import { useState, useEffect, useRef } from 'react';
import type { Stoerungsmeldung, Mitarbeiter, Produktionsbereich, Anlage, Anlagenteil, Baugruppe } from '@/types/app';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, Loader2 } from 'lucide-react';
import { extractFromPhoto, fileToDataUri } from '@/lib/ai';

interface StoerungsmeldungDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Stoerungsmeldung['fields']) => Promise<void>;
  defaultValues?: Stoerungsmeldung['fields'];
  mitarbeiterList: Mitarbeiter[];
  produktionsbereichList: Produktionsbereich[];
  anlageList: Anlage[];
  anlagenteilList: Anlagenteil[];
  baugruppeList: Baugruppe[];
  enablePhotoScan?: boolean;
}

export function StoerungsmeldungDialog({ open, onClose, onSubmit, defaultValues, mitarbeiterList, produktionsbereichList, anlageList, anlagenteilList, baugruppeList, enablePhotoScan = false }: StoerungsmeldungDialogProps) {
  const [fields, setFields] = useState<Partial<Stoerungsmeldung['fields']>>({});
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
      await onSubmit(fields as Stoerungsmeldung['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "stoerungsmeldung_datum": string | null, // YYYY-MM-DD // Datum\n  "stoerungsmeldung_erfasser": string | null, // Name des Mitarbeiter-Eintrags (z.B. "Jonas Schmidt")\n  "stoerungsmeldung_standort": string | null, // Standort der Störung\n  "stoerungsmeldung_produktionsbereich": string | null, // Name des Produktionsbereich-Eintrags (z.B. "Jonas Schmidt")\n  "stoerungsmeldung_anlage": string | null, // Name des Anlage-Eintrags (z.B. "Jonas Schmidt")\n  "stoerungsmeldung_anlagenteil": string | null, // Name des Anlagenteil-Eintrags (z.B. "Jonas Schmidt")\n  "stoerungsmeldung_baugruppe": string | null, // Name des Baugruppe-Eintrags (z.B. "Jonas Schmidt")\n  "stoerungsmeldung_beschreibung": string | null, // Beschreibung\n  "stoerungsmeldung_foto": string | null, // Foto\n  "stoerungsmeldung_dringlichkeit": string | null, // Dringlichkeit\n  "erledigt": boolean | null, // Erledigt\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["stoerungsmeldung_erfasser", "stoerungsmeldung_produktionsbereich", "stoerungsmeldung_anlage", "stoerungsmeldung_anlagenteil", "stoerungsmeldung_baugruppe"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        const stoerungsmeldung_erfasserName = raw['stoerungsmeldung_erfasser'] as string | null;
        if (stoerungsmeldung_erfasserName && !merged['stoerungsmeldung_erfasser']) {
          const stoerungsmeldung_erfasserMatch = mitarbeiterList.find(r => matchName(stoerungsmeldung_erfasserName!, [String(r.fields.mitarbeiter_vorname ?? '')]));
          if (stoerungsmeldung_erfasserMatch) merged['stoerungsmeldung_erfasser'] = createRecordUrl(APP_IDS.MITARBEITER, stoerungsmeldung_erfasserMatch.record_id);
        }
        const stoerungsmeldung_produktionsbereichName = raw['stoerungsmeldung_produktionsbereich'] as string | null;
        if (stoerungsmeldung_produktionsbereichName && !merged['stoerungsmeldung_produktionsbereich']) {
          const stoerungsmeldung_produktionsbereichMatch = produktionsbereichList.find(r => matchName(stoerungsmeldung_produktionsbereichName!, [String(r.fields.produktionsbereich_name ?? '')]));
          if (stoerungsmeldung_produktionsbereichMatch) merged['stoerungsmeldung_produktionsbereich'] = createRecordUrl(APP_IDS.PRODUKTIONSBEREICH, stoerungsmeldung_produktionsbereichMatch.record_id);
        }
        const stoerungsmeldung_anlageName = raw['stoerungsmeldung_anlage'] as string | null;
        if (stoerungsmeldung_anlageName && !merged['stoerungsmeldung_anlage']) {
          const stoerungsmeldung_anlageMatch = anlageList.find(r => matchName(stoerungsmeldung_anlageName!, [String(r.fields.anlage_name ?? '')]));
          if (stoerungsmeldung_anlageMatch) merged['stoerungsmeldung_anlage'] = createRecordUrl(APP_IDS.ANLAGE, stoerungsmeldung_anlageMatch.record_id);
        }
        const stoerungsmeldung_anlagenteilName = raw['stoerungsmeldung_anlagenteil'] as string | null;
        if (stoerungsmeldung_anlagenteilName && !merged['stoerungsmeldung_anlagenteil']) {
          const stoerungsmeldung_anlagenteilMatch = anlagenteilList.find(r => matchName(stoerungsmeldung_anlagenteilName!, [String(r.fields.anlagenteil_name ?? '')]));
          if (stoerungsmeldung_anlagenteilMatch) merged['stoerungsmeldung_anlagenteil'] = createRecordUrl(APP_IDS.ANLAGENTEIL, stoerungsmeldung_anlagenteilMatch.record_id);
        }
        const stoerungsmeldung_baugruppeName = raw['stoerungsmeldung_baugruppe'] as string | null;
        if (stoerungsmeldung_baugruppeName && !merged['stoerungsmeldung_baugruppe']) {
          const stoerungsmeldung_baugruppeMatch = baugruppeList.find(r => matchName(stoerungsmeldung_baugruppeName!, [String(r.fields.baugruppe_name ?? '')]));
          if (stoerungsmeldung_baugruppeMatch) merged['stoerungsmeldung_baugruppe'] = createRecordUrl(APP_IDS.BAUGRUPPE, stoerungsmeldung_baugruppeMatch.record_id);
        }
        return merged as Partial<Stoerungsmeldung['fields']>;
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
            <DialogTitle>{defaultValues ? 'Störungsmeldung bearbeiten' : 'Störungsmeldung hinzufügen'}</DialogTitle>
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
            <Label htmlFor="stoerungsmeldung_datum">Datum</Label>
            <Input
              id="stoerungsmeldung_datum"
              type="date"
              value={fields.stoerungsmeldung_datum ?? ''}
              onChange={e => setFields(f => ({ ...f, stoerungsmeldung_datum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stoerungsmeldung_erfasser">Erfasser</Label>
            <Select
              value={extractRecordId(fields.stoerungsmeldung_erfasser) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, stoerungsmeldung_erfasser: v === 'none' ? undefined : createRecordUrl(APP_IDS.MITARBEITER, v) }))}
            >
              <SelectTrigger id="stoerungsmeldung_erfasser"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {mitarbeiterList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.mitarbeiter_vorname ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stoerungsmeldung_standort">Standort der Störung</Label>
            <Input
              id="stoerungsmeldung_standort"
              value={fields.stoerungsmeldung_standort ?? ''}
              onChange={e => setFields(f => ({ ...f, stoerungsmeldung_standort: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stoerungsmeldung_produktionsbereich">Produktionsbereich</Label>
            <Select
              value={extractRecordId(fields.stoerungsmeldung_produktionsbereich) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, stoerungsmeldung_produktionsbereich: v === 'none' ? undefined : createRecordUrl(APP_IDS.PRODUKTIONSBEREICH, v) }))}
            >
              <SelectTrigger id="stoerungsmeldung_produktionsbereich"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
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
            <Label htmlFor="stoerungsmeldung_anlagenteil">Anlagenteil</Label>
            <Select
              value={extractRecordId(fields.stoerungsmeldung_anlagenteil) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, stoerungsmeldung_anlagenteil: v === 'none' ? undefined : createRecordUrl(APP_IDS.ANLAGENTEIL, v) }))}
            >
              <SelectTrigger id="stoerungsmeldung_anlagenteil"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
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
            <Label htmlFor="stoerungsmeldung_baugruppe">Baugruppe</Label>
            <Select
              value={extractRecordId(fields.stoerungsmeldung_baugruppe) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, stoerungsmeldung_baugruppe: v === 'none' ? undefined : createRecordUrl(APP_IDS.BAUGRUPPE, v) }))}
            >
              <SelectTrigger id="stoerungsmeldung_baugruppe"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
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
            <Label htmlFor="stoerungsmeldung_beschreibung">Beschreibung</Label>
            <Textarea
              id="stoerungsmeldung_beschreibung"
              value={fields.stoerungsmeldung_beschreibung ?? ''}
              onChange={e => setFields(f => ({ ...f, stoerungsmeldung_beschreibung: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stoerungsmeldung_foto">Foto</Label>
            <Input
              id="stoerungsmeldung_foto"
              value={fields.stoerungsmeldung_foto ?? ''}
              onChange={e => setFields(f => ({ ...f, stoerungsmeldung_foto: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stoerungsmeldung_dringlichkeit">Dringlichkeit</Label>
            <Input
              id="stoerungsmeldung_dringlichkeit"
              value={fields.stoerungsmeldung_dringlichkeit ?? ''}
              onChange={e => setFields(f => ({ ...f, stoerungsmeldung_dringlichkeit: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="erledigt">Erledigt</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="erledigt"
                checked={!!fields.erledigt}
                onCheckedChange={(v) => setFields(f => ({ ...f, erledigt: !!v }))}
              />
              <Label htmlFor="erledigt" className="font-normal">Erledigt</Label>
            </div>
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