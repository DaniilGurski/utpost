type Guide = {
  id: number;
  slug: string;
  title: string;
  region: string;
  difficulty: string;
  length_km: number; // NOTE: should be double precision
  body_html: string;
  hero_image: string | null;
  published: boolean;
  author_id: number | null;
  updated_at: string;
};

type User = {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
  role: string;
  created_at: string;
};

type Tour = {
  id: number;
  user_id: number;
  guide_id: number | null;
  title: string;
  started_at: string;
  distance_m: number;
  notes: string | null;
};

type TourEnriched = Tour & {
  user: User;
  guide: Guide;
  photos: Photo[];
  logs: TourLog[];
};

type TourLog = {
  id: number;
  tour_id: number;
  recorded_at: string;
  lat: number;
  lon: number;
  elevation_m: number | null;
  heart_rate: number | null;
  note: string | null;
};

type Photo = {
  id: number;
  tour_id: number;
  filename: string;
  width: number;
  height: number;
  created_at: string;
};

// `null` means the request never got an HTTP response (e.g. network error),
// so every failure must state its status explicitly instead of omitting it.
type ApiFailure = {
  message: string;
  status: number | null;
};

export type { Guide, User, Tour, TourEnriched, TourLog, Photo, ApiFailure };
