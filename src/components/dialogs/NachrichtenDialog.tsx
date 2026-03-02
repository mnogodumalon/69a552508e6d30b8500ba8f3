import { useState, useEffect, useRef } from 'react';
import type { Nachrichten, Korrespondenz } from '@/types/app';
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

interface NachrichtenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Nachrichten['fields']) => Promise<void>;
  defaultValues?: Nachrichten['fields'];
  korrespondenzList: Korrespondenz[];
  enablePhotoScan?: boolean;
}

export function NachrichtenDialog({ open, onClose, onSubmit, defaultValues, korrespondenzList, enablePhotoScan = false }: NachrichtenDialogProps) {
  const [fields, setFields] = useState<Partial<Nachrichten['fields']>>({});
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
      await onSubmit(fields as Nachrichten['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "anonyme_kommunikation": string | null, // Name des Korrespondenz-Eintrags (z.B. "Jonas Schmidt")\n  "ersteller2": string | null, // Ersteller\n  "text": string | null, // Text\n  "datei": string | null, // Datei\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["anonyme_kommunikation"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        const anonyme_kommunikationName = raw['anonyme_kommunikation'] as string | null;
        if (anonyme_kommunikationName && !merged['anonyme_kommunikation']) {
          const anonyme_kommunikationMatch = korrespondenzList.find(r => matchName(anonyme_kommunikationName!, [String(r.fields.edit_key_1 ?? '')]));
          if (anonyme_kommunikationMatch) merged['anonyme_kommunikation'] = createRecordUrl(APP_IDS.KORRESPONDENZ, anonyme_kommunikationMatch.record_id);
        }
        return merged as Partial<Nachrichten['fields']>;
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
            <DialogTitle>{defaultValues ? 'Nachrichten bearbeiten' : 'Nachrichten hinzufügen'}</DialogTitle>
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
            <Label htmlFor="anonyme_kommunikation">Korrespondenz</Label>
            <Select
              value={extractRecordId(fields.anonyme_kommunikation) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, anonyme_kommunikation: v === 'none' ? undefined : createRecordUrl(APP_IDS.KORRESPONDENZ, v) }))}
            >
              <SelectTrigger id="anonyme_kommunikation"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {korrespondenzList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.edit_key_1 ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ersteller2">Ersteller</Label>
            <Input
              id="ersteller2"
              value={fields.ersteller2 ?? ''}
              onChange={e => setFields(f => ({ ...f, ersteller2: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="text">Text</Label>
            <Textarea
              id="text"
              value={fields.text ?? ''}
              onChange={e => setFields(f => ({ ...f, text: e.target.value }))}
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