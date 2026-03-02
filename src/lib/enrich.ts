import type { EnrichedAnlage, EnrichedAnlagenteil, EnrichedBaugruppe, EnrichedDetails, EnrichedKorrespondenz, EnrichedNachrichten, EnrichedStoerungsmeldung } from '@/types/enriched';
import type { Anlage, Anlagenteil, Anlagenteiltyp, Baugruppe, Details, Korrespondenz, Mitarbeiter, Nachrichten, Produktionsbereich, Stoerungsmeldung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: string | undefined, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface AnlageMaps {
  produktionsbereichMap: Map<string, Produktionsbereich>;
}

export function enrichAnlage(
  anlage: Anlage[],
  maps: AnlageMaps
): EnrichedAnlage[] {
  return anlage.map(r => ({
    ...r,
    anlage_produktionsbereichName: resolveDisplay(r.fields.anlage_produktionsbereich, maps.produktionsbereichMap, 'produktionsbereich_name'),
  }));
}

interface AnlagenteilMaps {
  anlagenteiltypMap: Map<string, Anlagenteiltyp>;
  anlageMap: Map<string, Anlage>;
}

export function enrichAnlagenteil(
  anlagenteil: Anlagenteil[],
  maps: AnlagenteilMaps
): EnrichedAnlagenteil[] {
  return anlagenteil.map(r => ({
    ...r,
    typName: resolveDisplay(r.fields.typ, maps.anlagenteiltypMap, 'anlagenteiltyp_name'),
    anlagenteil_anlageName: resolveDisplay(r.fields.anlagenteil_anlage, maps.anlageMap, 'anlage_name'),
  }));
}

interface BaugruppeMaps {
  anlagenteilMap: Map<string, Anlagenteil>;
  anlagenteiltypMap: Map<string, Anlagenteiltyp>;
}

export function enrichBaugruppe(
  baugruppe: Baugruppe[],
  maps: BaugruppeMaps
): EnrichedBaugruppe[] {
  return baugruppe.map(r => ({
    ...r,
    baugruppe_anlagenteilName: resolveDisplay(r.fields.baugruppe_anlagenteil, maps.anlagenteilMap, 'anlagenteil_name'),
    baugruppe_anlagenteiltypName: resolveDisplay(r.fields.baugruppe_anlagenteiltyp, maps.anlagenteiltypMap, 'anlagenteiltyp_name'),
  }));
}

interface StoerungsmeldungMaps {
  mitarbeiterMap: Map<string, Mitarbeiter>;
  produktionsbereichMap: Map<string, Produktionsbereich>;
  anlageMap: Map<string, Anlage>;
  anlagenteilMap: Map<string, Anlagenteil>;
  baugruppeMap: Map<string, Baugruppe>;
}

export function enrichStoerungsmeldung(
  stoerungsmeldung: Stoerungsmeldung[],
  maps: StoerungsmeldungMaps
): EnrichedStoerungsmeldung[] {
  return stoerungsmeldung.map(r => ({
    ...r,
    stoerungsmeldung_erfasserName: resolveDisplay(r.fields.stoerungsmeldung_erfasser, maps.mitarbeiterMap, 'mitarbeiter_vorname'),
    stoerungsmeldung_produktionsbereichName: resolveDisplay(r.fields.stoerungsmeldung_produktionsbereich, maps.produktionsbereichMap, 'produktionsbereich_name'),
    stoerungsmeldung_anlageName: resolveDisplay(r.fields.stoerungsmeldung_anlage, maps.anlageMap, 'anlage_name'),
    stoerungsmeldung_anlagenteilName: resolveDisplay(r.fields.stoerungsmeldung_anlagenteil, maps.anlagenteilMap, 'anlagenteil_name'),
    stoerungsmeldung_baugruppeName: resolveDisplay(r.fields.stoerungsmeldung_baugruppe, maps.baugruppeMap, 'baugruppe_name'),
  }));
}

interface KorrespondenzMaps {
  stoerungsmeldungMap: Map<string, Stoerungsmeldung>;
}

export function enrichKorrespondenz(
  korrespondenz: Korrespondenz[],
  maps: KorrespondenzMaps
): EnrichedKorrespondenz[] {
  return korrespondenz.map(r => ({
    ...r,
    stoerungsmeldungName: resolveDisplay(r.fields.stoerungsmeldung, maps.stoerungsmeldungMap, 'stoerungsmeldung_beschreibung'),
  }));
}

interface NachrichtenMaps {
  korrespondenzMap: Map<string, Korrespondenz>;
}

export function enrichNachrichten(
  nachrichten: Nachrichten[],
  maps: NachrichtenMaps
): EnrichedNachrichten[] {
  return nachrichten.map(r => ({
    ...r,
    anonyme_kommunikationName: resolveDisplay(r.fields.anonyme_kommunikation, maps.korrespondenzMap, 'edit_key_1'),
  }));
}

interface DetailsMaps {
  produktionsbereichMap: Map<string, Produktionsbereich>;
  anlageMap: Map<string, Anlage>;
  anlagenteiltypMap: Map<string, Anlagenteiltyp>;
  anlagenteilMap: Map<string, Anlagenteil>;
  baugruppeMap: Map<string, Baugruppe>;
}

export function enrichDetails(
  details: Details[],
  maps: DetailsMaps
): EnrichedDetails[] {
  return details.map(r => ({
    ...r,
    produktionsbereichName: resolveDisplay(r.fields.produktionsbereich, maps.produktionsbereichMap, 'produktionsbereich_name'),
    stoerungsmeldung_anlageName: resolveDisplay(r.fields.stoerungsmeldung_anlage, maps.anlageMap, 'anlage_name'),
    anlagenteiltypName: resolveDisplay(r.fields.anlagenteiltyp, maps.anlagenteiltypMap, 'anlagenteiltyp_name'),
    anlagenteilName: resolveDisplay(r.fields.anlagenteil, maps.anlagenteilMap, 'anlagenteil_name'),
    baugruppeName: resolveDisplay(r.fields.baugruppe, maps.baugruppeMap, 'baugruppe_name'),
  }));
}
