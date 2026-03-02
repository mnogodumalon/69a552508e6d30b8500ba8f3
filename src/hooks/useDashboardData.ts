import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Mitarbeiter, Produktionsbereich, Anlagenteiltyp, Anlage, Anlagenteil, Baugruppe, Stoerungsmeldung, Korrespondenz, Nachrichten, Details } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);
  const [produktionsbereich, setProduktionsbereich] = useState<Produktionsbereich[]>([]);
  const [anlagenteiltyp, setAnlagenteiltyp] = useState<Anlagenteiltyp[]>([]);
  const [anlage, setAnlage] = useState<Anlage[]>([]);
  const [anlagenteil, setAnlagenteil] = useState<Anlagenteil[]>([]);
  const [baugruppe, setBaugruppe] = useState<Baugruppe[]>([]);
  const [stoerungsmeldung, setStoerungsmeldung] = useState<Stoerungsmeldung[]>([]);
  const [korrespondenz, setKorrespondenz] = useState<Korrespondenz[]>([]);
  const [nachrichten, setNachrichten] = useState<Nachrichten[]>([]);
  const [details, setDetails] = useState<Details[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [mitarbeiterData, produktionsbereichData, anlagenteiltypData, anlageData, anlagenteilData, baugruppeData, stoerungsmeldungData, korrespondenzData, nachrichtenData, detailsData] = await Promise.all([
        LivingAppsService.getMitarbeiter(),
        LivingAppsService.getProduktionsbereich(),
        LivingAppsService.getAnlagenteiltyp(),
        LivingAppsService.getAnlage(),
        LivingAppsService.getAnlagenteil(),
        LivingAppsService.getBaugruppe(),
        LivingAppsService.getStoerungsmeldung(),
        LivingAppsService.getKorrespondenz(),
        LivingAppsService.getNachrichten(),
        LivingAppsService.getDetails(),
      ]);
      setMitarbeiter(mitarbeiterData);
      setProduktionsbereich(produktionsbereichData);
      setAnlagenteiltyp(anlagenteiltypData);
      setAnlage(anlageData);
      setAnlagenteil(anlagenteilData);
      setBaugruppe(baugruppeData);
      setStoerungsmeldung(stoerungsmeldungData);
      setKorrespondenz(korrespondenzData);
      setNachrichten(nachrichtenData);
      setDetails(detailsData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const mitarbeiterMap = useMemo(() => {
    const m = new Map<string, Mitarbeiter>();
    mitarbeiter.forEach(r => m.set(r.record_id, r));
    return m;
  }, [mitarbeiter]);

  const produktionsbereichMap = useMemo(() => {
    const m = new Map<string, Produktionsbereich>();
    produktionsbereich.forEach(r => m.set(r.record_id, r));
    return m;
  }, [produktionsbereich]);

  const anlagenteiltypMap = useMemo(() => {
    const m = new Map<string, Anlagenteiltyp>();
    anlagenteiltyp.forEach(r => m.set(r.record_id, r));
    return m;
  }, [anlagenteiltyp]);

  const anlageMap = useMemo(() => {
    const m = new Map<string, Anlage>();
    anlage.forEach(r => m.set(r.record_id, r));
    return m;
  }, [anlage]);

  const anlagenteilMap = useMemo(() => {
    const m = new Map<string, Anlagenteil>();
    anlagenteil.forEach(r => m.set(r.record_id, r));
    return m;
  }, [anlagenteil]);

  const baugruppeMap = useMemo(() => {
    const m = new Map<string, Baugruppe>();
    baugruppe.forEach(r => m.set(r.record_id, r));
    return m;
  }, [baugruppe]);

  const stoerungsmeldungMap = useMemo(() => {
    const m = new Map<string, Stoerungsmeldung>();
    stoerungsmeldung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [stoerungsmeldung]);

  const korrespondenzMap = useMemo(() => {
    const m = new Map<string, Korrespondenz>();
    korrespondenz.forEach(r => m.set(r.record_id, r));
    return m;
  }, [korrespondenz]);

  return { mitarbeiter, setMitarbeiter, produktionsbereich, setProduktionsbereich, anlagenteiltyp, setAnlagenteiltyp, anlage, setAnlage, anlagenteil, setAnlagenteil, baugruppe, setBaugruppe, stoerungsmeldung, setStoerungsmeldung, korrespondenz, setKorrespondenz, nachrichten, setNachrichten, details, setDetails, loading, error, fetchAll, mitarbeiterMap, produktionsbereichMap, anlagenteiltypMap, anlageMap, anlagenteilMap, baugruppeMap, stoerungsmeldungMap, korrespondenzMap };
}