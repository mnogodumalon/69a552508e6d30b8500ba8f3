import { useState, useEffect, useRef } from 'react';
import type { Mitarbeiter } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2 } from 'lucide-react';
import { extractFromPhoto, fileToDataUri } from '@/lib/ai';

interface MitarbeiterDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Mitarbeiter['fields']) => Promise<void>;
  defaultValues?: Mitarbeiter['fields'];
  enablePhotoScan?: boolean;
}

export function MitarbeiterDialog({ open, onClose, onSubmit, defaultValues, enablePhotoScan = false }: MitarbeiterDialogProps) {
  const [fields, setFields] = useState<Partial<Mitarbeiter['fields']>>({});
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
      await onSubmit(fields as Mitarbeiter['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "mitarbeiter_vorname": string | null, // Vorname\n  "mitarbeiter_nachname": string | null, // Nachname\n  "e_mail": string | null, // E-Mail\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        for (const [k, v] of Object.entries(raw)) {
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        return merged as Partial<Mitarbeiter['fields']>;
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
            <DialogTitle>{defaultValues ? 'Mitarbeiter bearbeiten' : 'Mitarbeiter hinzufügen'}</DialogTitle>
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
            <Label htmlFor="mitarbeiter_vorname">Vorname</Label>
            <Input
              id="mitarbeiter_vorname"
              value={fields.mitarbeiter_vorname ?? ''}
              onChange={e => setFields(f => ({ ...f, mitarbeiter_vorname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mitarbeiter_nachname">Nachname</Label>
            <Input
              id="mitarbeiter_nachname"
              value={fields.mitarbeiter_nachname ?? ''}
              onChange={e => setFields(f => ({ ...f, mitarbeiter_nachname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e_mail">E-Mail</Label>
            <Input
              id="e_mail"
              type="email"
              value={fields.e_mail ?? ''}
              onChange={e => setFields(f => ({ ...f, e_mail: e.target.value }))}
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