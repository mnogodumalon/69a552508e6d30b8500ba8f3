// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Mitarbeiter, Produktionsbereich, Anlagenteiltyp, Anlage, Anlagenteil, Baugruppe, Stoerungsmeldung, Korrespondenz, Nachrichten, Details } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://ci04.ci.xist4c.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://ci04.ci.xist4c.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

export class LivingAppsService {
  // --- MITARBEITER ---
  static async getMitarbeiter(): Promise<Mitarbeiter[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.MITARBEITER}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getMitarbeiterEntry(id: string): Promise<Mitarbeiter | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.MITARBEITER}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createMitarbeiterEntry(fields: Mitarbeiter['fields']) {
    return callApi('POST', `/apps/${APP_IDS.MITARBEITER}/records`, { fields });
  }
  static async updateMitarbeiterEntry(id: string, fields: Partial<Mitarbeiter['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.MITARBEITER}/records/${id}`, { fields });
  }
  static async deleteMitarbeiterEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.MITARBEITER}/records/${id}`);
  }

  // --- PRODUKTIONSBEREICH ---
  static async getProduktionsbereich(): Promise<Produktionsbereich[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.PRODUKTIONSBEREICH}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getProduktionsbereichEntry(id: string): Promise<Produktionsbereich | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.PRODUKTIONSBEREICH}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createProduktionsbereichEntry(fields: Produktionsbereich['fields']) {
    return callApi('POST', `/apps/${APP_IDS.PRODUKTIONSBEREICH}/records`, { fields });
  }
  static async updateProduktionsbereichEntry(id: string, fields: Partial<Produktionsbereich['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.PRODUKTIONSBEREICH}/records/${id}`, { fields });
  }
  static async deleteProduktionsbereichEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.PRODUKTIONSBEREICH}/records/${id}`);
  }

  // --- ANLAGENTEILTYP ---
  static async getAnlagenteiltyp(): Promise<Anlagenteiltyp[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ANLAGENTEILTYP}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getAnlagenteiltypEntry(id: string): Promise<Anlagenteiltyp | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ANLAGENTEILTYP}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createAnlagenteiltypEntry(fields: Anlagenteiltyp['fields']) {
    return callApi('POST', `/apps/${APP_IDS.ANLAGENTEILTYP}/records`, { fields });
  }
  static async updateAnlagenteiltypEntry(id: string, fields: Partial<Anlagenteiltyp['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.ANLAGENTEILTYP}/records/${id}`, { fields });
  }
  static async deleteAnlagenteiltypEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ANLAGENTEILTYP}/records/${id}`);
  }

  // --- ANLAGE ---
  static async getAnlage(): Promise<Anlage[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ANLAGE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getAnlageEntry(id: string): Promise<Anlage | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ANLAGE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createAnlageEntry(fields: Anlage['fields']) {
    return callApi('POST', `/apps/${APP_IDS.ANLAGE}/records`, { fields });
  }
  static async updateAnlageEntry(id: string, fields: Partial<Anlage['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.ANLAGE}/records/${id}`, { fields });
  }
  static async deleteAnlageEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ANLAGE}/records/${id}`);
  }

  // --- ANLAGENTEIL ---
  static async getAnlagenteil(): Promise<Anlagenteil[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.ANLAGENTEIL}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getAnlagenteilEntry(id: string): Promise<Anlagenteil | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.ANLAGENTEIL}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createAnlagenteilEntry(fields: Anlagenteil['fields']) {
    return callApi('POST', `/apps/${APP_IDS.ANLAGENTEIL}/records`, { fields });
  }
  static async updateAnlagenteilEntry(id: string, fields: Partial<Anlagenteil['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.ANLAGENTEIL}/records/${id}`, { fields });
  }
  static async deleteAnlagenteilEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.ANLAGENTEIL}/records/${id}`);
  }

  // --- BAUGRUPPE ---
  static async getBaugruppe(): Promise<Baugruppe[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.BAUGRUPPE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getBaugruppeEntry(id: string): Promise<Baugruppe | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.BAUGRUPPE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createBaugruppeEntry(fields: Baugruppe['fields']) {
    return callApi('POST', `/apps/${APP_IDS.BAUGRUPPE}/records`, { fields });
  }
  static async updateBaugruppeEntry(id: string, fields: Partial<Baugruppe['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.BAUGRUPPE}/records/${id}`, { fields });
  }
  static async deleteBaugruppeEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.BAUGRUPPE}/records/${id}`);
  }

  // --- STOERUNGSMELDUNG ---
  static async getStoerungsmeldung(): Promise<Stoerungsmeldung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.STOERUNGSMELDUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getStoerungsmeldungEntry(id: string): Promise<Stoerungsmeldung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.STOERUNGSMELDUNG}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createStoerungsmeldungEntry(fields: Stoerungsmeldung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.STOERUNGSMELDUNG}/records`, { fields });
  }
  static async updateStoerungsmeldungEntry(id: string, fields: Partial<Stoerungsmeldung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.STOERUNGSMELDUNG}/records/${id}`, { fields });
  }
  static async deleteStoerungsmeldungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.STOERUNGSMELDUNG}/records/${id}`);
  }

  // --- KORRESPONDENZ ---
  static async getKorrespondenz(): Promise<Korrespondenz[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.KORRESPONDENZ}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getKorrespondenzEntry(id: string): Promise<Korrespondenz | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.KORRESPONDENZ}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createKorrespondenzEntry(fields: Korrespondenz['fields']) {
    return callApi('POST', `/apps/${APP_IDS.KORRESPONDENZ}/records`, { fields });
  }
  static async updateKorrespondenzEntry(id: string, fields: Partial<Korrespondenz['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.KORRESPONDENZ}/records/${id}`, { fields });
  }
  static async deleteKorrespondenzEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.KORRESPONDENZ}/records/${id}`);
  }

  // --- NACHRICHTEN ---
  static async getNachrichten(): Promise<Nachrichten[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.NACHRICHTEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getNachrichtenEntry(id: string): Promise<Nachrichten | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.NACHRICHTEN}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createNachrichtenEntry(fields: Nachrichten['fields']) {
    return callApi('POST', `/apps/${APP_IDS.NACHRICHTEN}/records`, { fields });
  }
  static async updateNachrichtenEntry(id: string, fields: Partial<Nachrichten['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.NACHRICHTEN}/records/${id}`, { fields });
  }
  static async deleteNachrichtenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.NACHRICHTEN}/records/${id}`);
  }

  // --- DETAILS ---
  static async getDetails(): Promise<Details[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.DETAILS}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getDetail(id: string): Promise<Details | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.DETAILS}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createDetail(fields: Details['fields']) {
    return callApi('POST', `/apps/${APP_IDS.DETAILS}/records`, { fields });
  }
  static async updateDetail(id: string, fields: Partial<Details['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.DETAILS}/records/${id}`, { fields });
  }
  static async deleteDetail(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.DETAILS}/records/${id}`);
  }

}