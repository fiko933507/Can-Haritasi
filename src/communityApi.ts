import { rpc } from './backend';

export type VolunteerPreferences = {
  can_transport: boolean;
  has_carrier: boolean;
  can_foster: boolean;
  can_vet_run: boolean;
  can_feed: boolean;
  updated_at: string | null;
};

export type NotificationPreferences = {
  radius_m: number;
  urgent_only: boolean;
  cats: boolean;
  dogs: boolean;
  updated_at: string | null;
};

export type CommunityPoint = {
  id: string;
  point_type: 'food' | 'water' | 'food_water';
  note: string | null;
  latitude: number;
  longitude: number;
  distance_m: number;
  last_refreshed_at: string;
  created_at: string;
};

export type TimelineEvent = {
  event_type: string;
  note: string | null;
  created_at: string;
  actor_display_name: string | null;
};

export async function getVolunteerPreferences() {
  return rpc<VolunteerPreferences>('my_volunteer_preferences');
}

export async function saveVolunteerPreferences(value: Omit<VolunteerPreferences, 'updated_at'>) {
  return rpc<VolunteerPreferences>('update_volunteer_preferences', {
    p_can_transport: value.can_transport,
    p_has_carrier: value.has_carrier,
    p_can_foster: value.can_foster,
    p_can_vet_run: value.can_vet_run,
    p_can_feed: value.can_feed,
  });
}

export async function getNotificationPreferences() {
  return rpc<NotificationPreferences>('my_notification_preferences');
}

export async function saveNotificationPreferences(value: Omit<NotificationPreferences, 'updated_at'>) {
  return rpc<NotificationPreferences>('update_notification_preferences', {
    p_radius_m: value.radius_m,
    p_urgent_only: value.urgent_only,
    p_cats: value.cats,
    p_dogs: value.dogs,
  });
}

export async function getCommunityPoints(latitude: number, longitude: number, radiusM = 5000) {
  return rpc<CommunityPoint[]>('nearby_community_points', {
    p_lat: latitude,
    p_lon: longitude,
    p_radius_m: radiusM,
    p_limit: 30,
  });
}

export async function addCommunityPoint(input: {
  pointType: CommunityPoint['point_type'];
  latitude: number;
  longitude: number;
  note?: string | null;
}) {
  return rpc<CommunityPoint>('add_community_point', {
    p_point_type: input.pointType,
    p_lat: input.latitude,
    p_lon: input.longitude,
    p_note: input.note || null,
  });
}

export async function refreshCommunityPoint(pointId: string) {
  return rpc<CommunityPoint>('refresh_community_point', { p_point_id: pointId });
}

export async function getReportTimeline(reportId: string) {
  return rpc<TimelineEvent[]>('report_timeline', { p_report_id: reportId });
}

export type PotentialDuplicate = {
  id: string;
  title: string | null;
  condition: string;
  created_at: string;
  distance_m: number;
};

export async function findPotentialDuplicates(input: {
  animalType: string;
  latitude: number;
  longitude: number;
  minutes?: number;
  distanceM?: number;
}) {
  return rpc<PotentialDuplicate[]>('find_potential_duplicates', {
    p_animal_type: input.animalType,
    p_lat: input.latitude,
    p_lon: input.longitude,
    p_minutes: input.minutes ?? 120,
    p_distance_m: input.distanceM ?? 250,
  });
}
