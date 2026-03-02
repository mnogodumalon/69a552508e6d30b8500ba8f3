import { useState, useEffect, useRef } from 'react';
import type { Anlage, Produktionsbereich } from '@/types/app';
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

interface AnlageDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Anlage['fields']) => Promise<void>;
  defaultValues?: Anlage['fields'];
  produktionsbereichList: Produktionsbereich[];
  enablePhotoScan?: boolean;
}

export function AnlageDialog({ open, onClose, onSubmit, defaultValues, produktionsbereichList, enablePhotoScan = false }: AnlageDialogProps) {
  const [fields, setFields] = useState<Partial<Anlage['fields']>>({});
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
      await onSubmit(fields as Anlage['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "anlage_name": string | null, // Name\n  "anlage_produktionsbereich": string | null, // Name des Produktionsbereich-Eintrags (z.B. "Jonas Schmidt")\n  "anlage_geo": string | null, // Geografischer Ort der Anlage\n  "anlage_betriebsstunden": string | null, // Betriebsstunden\n  "anlage_fertigstellung": string | null, // YYYY-MM-DD // Datum der Fertigstellung\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["anlage_produktionsbereich"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        const anlage_produktionsbereichName = raw['anlage_produktionsbereich'] as string | null;
        if (anlage_produktionsbereichName && !merged['anlage_produktionsbereich']) {
          const anlage_produktionsbereichMatch = produktionsbereichList.find(r => matchName(anlage_produktionsbereichName!, [String(r.fields.produktionsbereich_name ?? '')]));
          if (anlage_produktionsbereichMatch) merged['anlage_produktionsbereich'] = createRecordUrl(APP_IDS.PRODUKTIONSBEREICH, anlage_produktionsbereichMatch.record_id);
        }
        return merged as Partial<Anlage['fields']>;
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
            <DialogTitle>{defaultValues ? 'Anlage bearbeiten' : 'Anlage hinzufügen'}</DialogTitle>
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
            <Label htmlFor="anlage_name">Name</Label>
            <Input
              id="anlage_name"
              value={fields.anlage_name ?? ''}
              onChange={e => setFields(f => ({ ...f, anlage_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anlage_produktionsbereich">Produktionsbereich</Label>
            <Select
              value={extractRecordId(fields.anlage_produktionsbereich) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, anlage_produktionsbereich: v === 'none' ? undefined : createRecordUrl(APP_IDS.PRODUKTIONSBEREICH, v) }))}
            >
              <SelectTrigger id="anlage_produktionsbereich"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
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
            <Label htmlFor="anlage_geo">Geografischer Ort der Anlage</Label>
            <Input
              id="anlage_geo"
              value={fields.anlage_geo ?? ''}
              onChange={e => setFields(f => ({ ...f, anlage_geo: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anlage_betriebsstunden">Betriebsstunden</Label>
            <Input
              id="anlage_betriebsstunden"
              value={fields.anlage_betriebsstunden ?? ''}
              onChange={e => setFields(f => ({ ...f, anlage_betriebsstunden: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anlage_fertigstellung">Datum der Fertigstellung</Label>
            <Input
              id="anlage_fertigstellung"
              type="date"
              value={fields.anlage_fertigstellung ?? ''}
              onChange={e => setFields(f => ({ ...f, anlage_fertigstellung: e.target.value }))}
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