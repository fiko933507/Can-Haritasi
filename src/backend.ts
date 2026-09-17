import { createAuthClient } from 'better-auth/react';
import { jwtClient } from 'better-auth/client/plugins';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

export const NEON_AUTH_URL = 'https://ep-red-lake-ayk3kz85.neonauth.c-5.us-east-2.aws.neon.tech/canharitasi/auth';
export const NEON_DATA_API_URL = 'https://ep-red-lake-ayk3kz85.apirest.c-5.us-east-2.aws.neon.tech/canharitasi/rest/v1';
export const MEDIA_FUNCTION_URL = 'https://br-dry-boat-ayf159cc-media.compute.c-5.us-east-2.aws.neon.tech';
export const LEGAL_FUNCTION_URL = 'https://br-dry-boat-ayf159cc-legal.compute.c-5.us-east-2.aws.neon.tech';
export const PRIVACY_URL = `${LEGAL_FUNCTION_URL}/privacy`;
export const TERMS_URL = `${LEGAL_FUNCTION_URL}/terms`;
export const DELETE_ACCOUNT_URL = `${LEGAL_FUNCTION_URL}/delete-account`;
export const TERMS_VERSION = '2026-09-13';

export const authClient = createAuthClient({
  baseURL: NEON_AUTH_URL,
  plugins: [
    expoClient({
      scheme: 'canharitasi',
      storagePrefix: 'canharitasi',
      // Better Auth 1.7.4 falls back to "better-auth" for a bare empty string.
      // Using an array containing an empty prefix keeps suffix matching active,
      // so Managed Neon Auth session_token/session_data cookies are persisted
      // regardless of the server-side cookie prefix.
      cookiePrefix: [''],
      storage: SecureStore,
    }),
    jwtClient(),
  ],
});

export type NearbyReport = {
  id: string;
  animal_type: string;
  category: string | null;
  condition: string;
  urgency: number;
  title: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  distance_m: number;
  city: string | null;
  district: string | null;
  status: string;
  created_at: string;
  image_key: string | null;
};

export type Profile = {
  id: string;
  auth_user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  district: string | null;
  reputation: number;
  is_verified: boolean;
  terms_accepted_at: string | null;
  terms_version: string | null;
};

export type CreatedReport = {
  id: string;
  reporter_id: string;
  animal_type: string;
  condition: string;
  status: string;
  created_at: string;
};

type RpcBody = Record<string, unknown>;

async function accessToken() {
  const { data, error } = await authClient.token();
  if (error || !data?.token) {
    throw new Error(error?.message || 'Oturum anahtarı alınamadı. Lütfen tekrar giriş yap.');
  }
  return data.token;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = text; }
  }
  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload
      ? String((payload as { message?: unknown }).message)
      : typeof payload === 'string' ? payload : `Sunucu hatası (${response.status})`;
    throw new Error(message);
  }
  return payload as T;
}

export async function rpc<T>(name: string, body: RpcBody = {}) {
  const token = await accessToken();
  const response = await fetch(`${NEON_DATA_API_URL}/rpc/${name}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export async function ensureProfile(displayName?: string | null, city?: string | null, district?: string | null) {
  return rpc<Profile>('ensure_profile', {
    p_display_name: displayName || null,
    p_city: city || null,
    p_district: district || null,
  });
}

export async function getMyProfile() {
  return rpc<Profile | null>('my_profile');
}

export async function acceptTerms(version = TERMS_VERSION) {
  return rpc<Profile>('accept_terms', { p_version: version });
}

export async function fetchNearbyReports(latitude: number, longitude: number, radiusM = 10000) {
  return rpc<NearbyReport[]>('nearby_reports_v3', {
    p_lat: latitude,
    p_lon: longitude,
    p_radius_m: radiusM,
    p_limit: 50,
  });
}

export async function createAnimalReport(input: {
  animalType: string;
  need: string;
  note: string;
  latitude: number;
  longitude: number;
  accuracyM?: number | null;
  city?: string | null;
  district?: string | null;
}) {
  const urgency = input.need === 'Veteriner' ? 4 : input.need === 'Güvenli alan' ? 3 : 2;
  return rpc<CreatedReport>('create_animal_report', {
    p_animal_type: input.animalType,
    p_category: input.need,
    p_condition: input.need,
    p_urgency: urgency,
    p_title: `${input.animalType} için ${input.need.toLocaleLowerCase('tr-TR')} desteği`,
    p_description: input.note || null,
    p_lat: input.latitude,
    p_lon: input.longitude,
    p_accuracy_m: input.accuracyM ?? null,
    p_city: input.city || null,
    p_district: input.district || null,
  });
}

export async function markHelp(reportId: string, action = 'on_the_way') {
  return rpc('mark_help', { p_report_id: reportId, p_action: action, p_note: null });
}

export async function reportContent(reportId: string, reason = 'uygunsuz_veya_yaniltici', details?: string | null) {
  return rpc('report_content', {
    p_report_id: reportId,
    p_reason: reason,
    p_details: details || null,
  });
}

export async function blockReportAuthor(reportId: string) {
  return rpc<boolean>('block_report_author', { p_report_id: reportId });
}

export async function requestMyAccountDeletion(reason?: string | null) {
  return rpc<boolean>('request_my_account_deletion', { p_reason: reason || null });
}

async function mediaRequest<T>(path: string, body: Record<string, unknown>) {
  const token = await accessToken();
  const response = await fetch(`${MEDIA_FUNCTION_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return parseResponse<T>(response);
}

export async function uploadReportImage(input: {
  reportId: string;
  uri: string;
  contentType?: string | null;
  width?: number | null;
  height?: number | null;
}) {
  const contentType = input.contentType || 'image/jpeg';
  const signed = await mediaRequest<{ key: string; uploadUrl: string; contentType: string }>('/upload-url', { contentType });
  const fileResponse = await fetch(input.uri);
  const blob = await fileResponse.blob();
  const uploadResponse = await fetch(signed.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': signed.contentType },
    body: blob as any,
  });
  if (!uploadResponse.ok) {
    throw new Error(`Fotoğraf yüklenemedi (${uploadResponse.status}).`);
  }
  await rpc('add_report_image', {
    p_report_id: input.reportId,
    p_storage_key: signed.key,
    p_mime_type: signed.contentType,
    p_width: input.width ?? null,
    p_height: input.height ?? null,
  });
  return signed.key;
}

export async function getDownloadUrl(key: string) {
  return mediaRequest<{ key: string; downloadUrl: string; expiresIn: number }>('/download-url', { key });
}
