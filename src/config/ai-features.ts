/**
 * AI feature toggles per entity.
 * Set to true to show "Foto scannen" button in the create/edit dialog.
 * The agent can change these values — all other AI files are pre-generated.
 */

export const AI_PHOTO_SCAN: Record<string, boolean> = {
  Mitarbeiter: true,
  Produktionsbereich: true,
  Anlagenteiltyp: true,
  Anlage: true,
  Anlagenteil: true,
  Baugruppe: true,
  Stoerungsmeldung: true,
  Korrespondenz: true,
  Nachrichten: true,
  Details: true,
};