import { useState, useEffect, useRef } from 'react';
import type { Anlagenteil, Anlagenteiltyp, Anlage } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Camera, Loader2 } from 'lucide-react';
import { extractFromPhoto, fileToDataUri } from '@/lib/ai';

interface AnlagenteilDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Anlagenteil['fields']) => Promise<void>;
  defaultValues?: Anlagenteil['fields'];
  anlagenteiltypList: Anlagenteiltyp[];
  anlageList: Anlage[];
  enablePhotoScan?: boolean;
}

export function AnlagenteilDialog({ open, onClose, onSubmit, defaultValues, anlagenteiltypList, anlageList, enablePhotoScan = false }: AnlagenteilDialogProps) {
  const [fields, setFields] = useState<Partial<Anlagenteil['fields']>>({});
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
      await onSubmit(fields as Anlagenteil['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "anlagenteil_name": string | null, // Name\n  "typ": string | null, // Name des Anlagenteiltyp-Eintrags (z.B. "Jonas Schmidt")\n  "anlagenteil_anlage": string | null, // Name des Anlage-Eintrags (z.B. "Jonas Schmidt")\n  "anlagenteil_geo": string | null, // Geografischer Ort des Anlagenteils\n  "anlagenteil_verbaut_am": string | null, // YYYY-MM-DD // Verbau-Datum\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["typ", "anlagenteil_anlage"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        const typName = raw['typ'] as string | null;
        if (typName && !merged['typ']) {
          const typMatch = anlagenteiltypList.find(r => matchName(typName!, [String(r.fields.anlagenteiltyp_name ?? '')]));
          if (typMatch) merged['typ'] = createRecordUrl(APP_IDS.ANLAGENTEILTYP, typMatch.record_id);
        }
        const anlagenteil_anlageName = raw['anlagenteil_anlage'] as string | null;
        if (anlagenteil_anlageName && !merged['anlagenteil_anlage']) {
          const anlagenteil_anlageMatch = anlageList.find(r => matchName(anlagenteil_anlageName!, [String(r.fields.anlage_name ?? '')]));
          if (anlagenteil_anlageMatch) merged['anlagenteil_anlage'] = createRecordUrl(APP_IDS.ANLAGE, anlagenteil_anlageMatch.record_id);
        }
        return merged as Partial<Anlagenteil['fields']>;
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
            <DialogTitle>{defaultValues ? 'Anlagenteil bearbeiten' : 'Anlagenteil hinzufügen'}</DialogTitle>
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
            <Label htmlFor="anlagenteil_name">Name</Label>
            <Input
              id="anlagenteil_name"
              value={fields.anlagenteil_name ?? ''}
              onChange={e => setFields(f => ({ ...f, anlagenteil_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="typ">Typ</Label>
            <Select
              value={extractRecordId(fields.typ) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, typ: v === 'none' ? undefined : createRecordUrl(APP_IDS.ANLAGENTEILTYP, v) }))}
            >
              <SelectTrigger id="typ"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
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
            <Label htmlFor="anlagenteil_anlage">Anlage</Label>
            <Select
              value={extractRecordId(fields.anlagenteil_anlage) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, anlagenteil_anlage: v === 'none' ? undefined : createRecordUrl(APP_IDS.ANLAGE, v) }))}
            >
              <SelectTrigger id="anlagenteil_anlage"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
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
            <Label htmlFor="anlagenteil_geo">Geografischer Ort des Anlagenteils</Label>
            <Input
              id="anlagenteil_geo"
              value={fields.anlagenteil_geo ?? ''}
              onChange={e => setFields(f => ({ ...f, anlagenteil_geo: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anlagenteil_verbaut_am">Verbau-Datum</Label>
            <Input
              id="anlagenteil_verbaut_am"
              type="date"
              value={fields.anlagenteil_verbaut_am ?? ''}
              onChange={e => setFields(f => ({ ...f, anlagenteil_verbaut_am: e.target.value }))}
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