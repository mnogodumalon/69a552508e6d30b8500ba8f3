import type { Anlage, Anlagenteil, Baugruppe, Details, Korrespondenz, Nachrichten, Stoerungsmeldung } from './app';

export type EnrichedAnlage = Anlage & {
  anlage_produktionsbereichName: string;
};

export type EnrichedAnlagenteil = Anlagenteil & {
  typName: string;
  anlagenteil_anlageName: string;
};

export type EnrichedBaugruppe = Baugruppe & {
  baugruppe_anlagenteilName: string;
  baugruppe_anlagenteiltypName: string;
};

export type EnrichedStoerungsmeldung = Stoerungsmeldung & {
  stoerungsmeldung_erfasserName: string;
  stoerungsmeldung_produktionsbereichName: string;
  stoerungsmeldung_anlageName: string;
  stoerungsmeldung_anlagenteilName: string;
  stoerungsmeldung_baugruppeName: string;
};

export type EnrichedKorrespondenz = Korrespondenz & {
  stoerungsmeldungName: string;
};

export type EnrichedNachrichten = Nachrichten & {
  anonyme_kommunikationName: string;
};

export type EnrichedDetails = Details & {
  produktionsbereichName: string;
  stoerungsmeldung_anlageName: string;
  anlagenteiltypName: string;
  anlagenteilName: string;
  baugruppeName: string;
};
