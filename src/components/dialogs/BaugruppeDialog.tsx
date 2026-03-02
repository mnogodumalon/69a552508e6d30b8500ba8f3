import { useState, useEffect, useRef } from 'react';
import type { Baugruppe, Anlagenteil, Anlagenteiltyp } from '@/types/app';
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

interface BaugruppeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Baugruppe['fields']) => Promise<void>;
  defaultValues?: Baugruppe['fields'];
  anlagenteilList: Anlagenteil[];
  anlagenteiltypList: Anlagenteiltyp[];
  enablePhotoScan?: boolean;
}

export function BaugruppeDialog({ open, onClose, onSubmit, defaultValues, anlagenteilList, anlagenteiltypList, enablePhotoScan = false }: BaugruppeDialogProps) {
  const [fields, setFields] = useState<Partial<Baugruppe['fields']>>({});
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
      await onSubmit(fields as Baugruppe['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "baugruppe_name": string | null, // Name\n  "baugruppe_anlagenteil": string | null, // Name des Anlagenteil-Eintrags (z.B. "Jonas Schmidt")\n  "baugruppe_anlagenteiltyp": string | null, // Name des Anlagenteiltyp-Eintrags (z.B. "Jonas Schmidt")\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["baugruppe_anlagenteil", "baugruppe_anlagenteiltyp"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        const baugruppe_anlagenteilName = raw['baugruppe_anlagenteil'] as string | null;
        if (baugruppe_anlagenteilName && !merged['baugruppe_anlagenteil']) {
          const baugruppe_anlagenteilMatch = anlagenteilList.find(r => matchName(baugruppe_anlagenteilName!, [String(r.fields.anlagenteil_name ?? '')]));
          if (baugruppe_anlagenteilMatch) merged['baugruppe_anlagenteil'] = createRecordUrl(APP_IDS.ANLAGENTEIL, baugruppe_anlagenteilMatch.record_id);
        }
        const baugruppe_anlagenteiltypName = raw['baugruppe_anlagenteiltyp'] as string | null;
        if (baugruppe_anlagenteiltypName && !merged['baugruppe_anlagenteiltyp']) {
          const baugruppe_anlagenteiltypMatch = anlagenteiltypList.find(r => matchName(baugruppe_anlagenteiltypName!, [String(r.fields.anlagenteiltyp_name ?? '')]));
          if (baugruppe_anlagenteiltypMatch) merged['baugruppe_anlagenteiltyp'] = createRecordUrl(APP_IDS.ANLAGENTEILTYP, baugruppe_anlagenteiltypMatch.record_id);
        }
        return merged as Partial<Baugruppe['fields']>;
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
            <DialogTitle>{defaultValues ? 'Baugruppe bearbeiten' : 'Baugruppe hinzufügen'}</DialogTitle>
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
            <Label htmlFor="baugruppe_name">Name</Label>
            <Input
              id="baugruppe_name"
              value={fields.baugruppe_name ?? ''}
              onChange={e => setFields(f => ({ ...f, baugruppe_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baugruppe_anlagenteil">Anlagenteil</Label>
            <Select
              value={extractRecordId(fields.baugruppe_anlagenteil) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, baugruppe_anlagenteil: v === 'none' ? undefined : createRecordUrl(APP_IDS.ANLAGENTEIL, v) }))}
            >
              <SelectTrigger id="baugruppe_anlagenteil"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
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
            <Label htmlFor="baugruppe_anlagenteiltyp">Anlagenteiltyp</Label>
            <Select
              value={extractRecordId(fields.baugruppe_anlagenteiltyp) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, baugruppe_anlagenteiltyp: v === 'none' ? undefined : createRecordUrl(APP_IDS.ANLAGENTEILTYP, v) }))}
            >
              <SelectTrigger id="baugruppe_anlagenteiltyp"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
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