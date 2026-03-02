import { useState, useEffect, useRef } from 'react';
import type { Korrespondenz, Stoerungsmeldung } from '@/types/app';
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

interface KorrespondenzDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Korrespondenz['fields']) => Promise<void>;
  defaultValues?: Korrespondenz['fields'];
  stoerungsmeldungList: Stoerungsmeldung[];
  enablePhotoScan?: boolean;
}

export function KorrespondenzDialog({ open, onClose, onSubmit, defaultValues, stoerungsmeldungList, enablePhotoScan = false }: KorrespondenzDialogProps) {
  const [fields, setFields] = useState<Partial<Korrespondenz['fields']>>({});
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
      await onSubmit(fields as Korrespondenz['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "edit_key_1": string | null, // Edit Key 1\n  "edit_key_2": string | null, // Edit Key 2\n  "edit_key_timeout_1": string | null, // YYYY-MM-DDTHH:MM // Edit Key Timeout 1\n  "edit_key_timeout_2": string | null, // YYYY-MM-DDTHH:MM // Edit Key Timeout 2\n  "titel": string | null, // Titel\n  "thema": string | null, // Betreff\n  "e_mail_adresse_1": string | null, // E-Mail-Adresse 1\n  "e_mail_adresse_2": string | null, // E-Mail-Adresse 2\n  "label_mine_1": string | null, // Label Mine 1\n  "label_mine_2": string | null, // Label Mine 2\n  "label_yours_1": string | null, // Label Yours 1\n  "label_yours_2": string | null, // Label Yours 2\n  "icon_1": string | null, // Icon 1\n  "icon_2": string | null, // Icon 2\n  "stoerungsmeldung": string | null, // Name des Störungsmeldung-Eintrags (z.B. "Jonas Schmidt")\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["stoerungsmeldung"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        const stoerungsmeldungName = raw['stoerungsmeldung'] as string | null;
        if (stoerungsmeldungName && !merged['stoerungsmeldung']) {
          const stoerungsmeldungMatch = stoerungsmeldungList.find(r => matchName(stoerungsmeldungName!, [String(r.fields.stoerungsmeldung_beschreibung ?? '')]));
          if (stoerungsmeldungMatch) merged['stoerungsmeldung'] = createRecordUrl(APP_IDS.STOERUNGSMELDUNG, stoerungsmeldungMatch.record_id);
        }
        return merged as Partial<Korrespondenz['fields']>;
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
            <DialogTitle>{defaultValues ? 'Korrespondenz bearbeiten' : 'Korrespondenz hinzufügen'}</DialogTitle>
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
            <Label htmlFor="edit_key_1">Edit Key 1</Label>
            <Input
              id="edit_key_1"
              value={fields.edit_key_1 ?? ''}
              onChange={e => setFields(f => ({ ...f, edit_key_1: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_key_2">Edit Key 2</Label>
            <Input
              id="edit_key_2"
              value={fields.edit_key_2 ?? ''}
              onChange={e => setFields(f => ({ ...f, edit_key_2: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_key_timeout_1">Edit Key Timeout 1</Label>
            <Input
              id="edit_key_timeout_1"
              type="datetime-local"
              step="60"
              value={fields.edit_key_timeout_1 ?? ''}
              onChange={e => setFields(f => ({ ...f, edit_key_timeout_1: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_key_timeout_2">Edit Key Timeout 2</Label>
            <Input
              id="edit_key_timeout_2"
              type="datetime-local"
              step="60"
              value={fields.edit_key_timeout_2 ?? ''}
              onChange={e => setFields(f => ({ ...f, edit_key_timeout_2: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="titel">Titel</Label>
            <Input
              id="titel"
              value={fields.titel ?? ''}
              onChange={e => setFields(f => ({ ...f, titel: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="thema">Betreff</Label>
            <Input
              id="thema"
              value={fields.thema ?? ''}
              onChange={e => setFields(f => ({ ...f, thema: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e_mail_adresse_1">E-Mail-Adresse 1</Label>
            <Input
              id="e_mail_adresse_1"
              type="email"
              value={fields.e_mail_adresse_1 ?? ''}
              onChange={e => setFields(f => ({ ...f, e_mail_adresse_1: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e_mail_adresse_2">E-Mail-Adresse 2</Label>
            <Input
              id="e_mail_adresse_2"
              type="email"
              value={fields.e_mail_adresse_2 ?? ''}
              onChange={e => setFields(f => ({ ...f, e_mail_adresse_2: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label_mine_1">Label Mine 1</Label>
            <Input
              id="label_mine_1"
              value={fields.label_mine_1 ?? ''}
              onChange={e => setFields(f => ({ ...f, label_mine_1: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label_mine_2">Label Mine 2</Label>
            <Input
              id="label_mine_2"
              value={fields.label_mine_2 ?? ''}
              onChange={e => setFields(f => ({ ...f, label_mine_2: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label_yours_1">Label Yours 1</Label>
            <Input
              id="label_yours_1"
              value={fields.label_yours_1 ?? ''}
              onChange={e => setFields(f => ({ ...f, label_yours_1: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="label_yours_2">Label Yours 2</Label>
            <Input
              id="label_yours_2"
              value={fields.label_yours_2 ?? ''}
              onChange={e => setFields(f => ({ ...f, label_yours_2: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon_1">Icon 1</Label>
            <Input
              id="icon_1"
              value={fields.icon_1 ?? ''}
              onChange={e => setFields(f => ({ ...f, icon_1: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icon_2">Icon 2</Label>
            <Input
              id="icon_2"
              value={fields.icon_2 ?? ''}
              onChange={e => setFields(f => ({ ...f, icon_2: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stoerungsmeldung">Störungsmeldung</Label>
            <Select
              value={extractRecordId(fields.stoerungsmeldung) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, stoerungsmeldung: v === 'none' ? undefined : createRecordUrl(APP_IDS.STOERUNGSMELDUNG, v) }))}
            >
              <SelectTrigger id="stoerungsmeldung"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {stoerungsmeldungList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.stoerungsmeldung_beschreibung ?? r.record_id}
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