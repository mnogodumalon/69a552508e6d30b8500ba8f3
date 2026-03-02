// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Mitarbeiter {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    mitarbeiter_vorname?: string;
    mitarbeiter_nachname?: string;
    e_mail?: string;
  };
}

export interface Produktionsbereich {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    produktionsbereich_name?: string;
  };
}

export interface Anlagenteiltyp {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    anlagenteiltyp_name?: string;
  };
}

export interface Anlage {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    anlage_name?: string;
    anlage_produktionsbereich?: string; // applookup -> URL zu 'Produktionsbereich' Record
    anlage_geo?: string;
    anlage_betriebsstunden?: string;
    anlage_fertigstellung?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Anlagenteil {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    anlagenteil_name?: string;
    typ?: string; // applookup -> URL zu 'Anlagenteiltyp' Record
    anlagenteil_anlage?: string; // applookup -> URL zu 'Anlage' Record
    anlagenteil_geo?: string;
    anlagenteil_verbaut_am?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Baugruppe {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    baugruppe_name?: string;
    baugruppe_anlagenteil?: string; // applookup -> URL zu 'Anlagenteil' Record
    baugruppe_anlagenteiltyp?: string; // applookup -> URL zu 'Anlagenteiltyp' Record
  };
}

export interface Stoerungsmeldung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    stoerungsmeldung_datum?: string; // Format: YYYY-MM-DD oder ISO String
    stoerungsmeldung_erfasser?: string; // applookup -> URL zu 'Mitarbeiter' Record
    stoerungsmeldung_standort?: string;
    stoerungsmeldung_produktionsbereich?: string; // applookup -> URL zu 'Produktionsbereich' Record
    stoerungsmeldung_anlage?: string; // applookup -> URL zu 'Anlage' Record
    stoerungsmeldung_anlagenteil?: string; // applookup -> URL zu 'Anlagenteil' Record
    stoerungsmeldung_baugruppe?: string; // applookup -> URL zu 'Baugruppe' Record
    stoerungsmeldung_beschreibung?: string;
    stoerungsmeldung_foto?: string;
    stoerungsmeldung_dringlichkeit?: string;
    erledigt?: boolean;
  };
}

export interface Korrespondenz {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    edit_key_1?: string;
    edit_key_2?: string;
    edit_key_timeout_1?: string; // Format: YYYY-MM-DD oder ISO String
    edit_key_timeout_2?: string; // Format: YYYY-MM-DD oder ISO String
    titel?: string;
    thema?: string;
    e_mail_adresse_1?: string;
    e_mail_adresse_2?: string;
    label_mine_1?: string;
    label_mine_2?: string;
    label_yours_1?: string;
    label_yours_2?: string;
    icon_1?: string;
    icon_2?: string;
    stoerungsmeldung?: string; // applookup -> URL zu 'Stoerungsmeldung' Record
  };
}

export interface Nachrichten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    anonyme_kommunikation?: string; // applookup -> URL zu 'Korrespondenz' Record
    ersteller2?: string;
    text?: string;
    datei?: string;
  };
}

export interface Details {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    produktionsbereich?: string; // applookup -> URL zu 'Produktionsbereich' Record
    stoerungsmeldung_anlage?: string; // applookup -> URL zu 'Anlage' Record
    anlagenteiltyp?: string; // applookup -> URL zu 'Anlagenteiltyp' Record
    anlagenteil?: string; // applookup -> URL zu 'Anlagenteil' Record
    baugruppe?: string; // applookup -> URL zu 'Baugruppe' Record
    bezeichnung?: string;
    beschreibung?: string;
    datei?: string;
  };
}

export const APP_IDS = {
  MITARBEITER: '69a551fea295faaf45637a1f',
  PRODUKTIONSBEREICH: '69a55219f7e40ead165dd87d',
  ANLAGENTEILTYP: '69a55219448919e103c17a3e',
  ANLAGE: '69a5521aa86e8990e3edd8e9',
  ANLAGENTEIL: '69a5521befef6527309e4870',
  BAUGRUPPE: '69a5521bc003cdee43cb3e8f',
  STOERUNGSMELDUNG: '69a5521c764e564160089811',
  KORRESPONDENZ: '69a5521ddaf2514c6dff7fc6',
  NACHRICHTEN: '69a5521e6c124ffb6cc73c13',
  DETAILS: '69a5521f387532711a4395fa',
} as const;

// Helper Types for creating new records
export type CreateMitarbeiter = Mitarbeiter['fields'];
export type CreateProduktionsbereich = Produktionsbereich['fields'];
export type CreateAnlagenteiltyp = Anlagenteiltyp['fields'];
export type CreateAnlage = Anlage['fields'];
export type CreateAnlagenteil = Anlagenteil['fields'];
export type CreateBaugruppe = Baugruppe['fields'];
export type CreateStoerungsmeldung = Stoerungsmeldung['fields'];
export type CreateKorrespondenz = Korrespondenz['fields'];
export type CreateNachrichten = Nachrichten['fields'];
export type CreateDetails = Details['fields'];