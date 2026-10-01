type Guide = {
  id: number;
  slug: string;
  title: string;
  region: string;
  difficulty: string;
  length_km: number; // NOTE: should be double precision
  body_html: string;
  heroImage: string | null;
  published: boolean;
  authorId: number | null;
  updatedAt: string;
};

type User = {
  id: number;
  email: string;
  passwordHash: string;
  displayName: string;
  role: string;
  createdAt: string;
};

type Tour = {
  id: number;
  userId: number;
  guideId: number | null;
  title: string;
  startedAt: string;
  distanceM: number;
  notes: string | null;
};

type TourLog = {
  id: number;
  tourId: number;
  recordedAt: string;
  lat: number;
  lon: number;
  elevationM: number | null;
  heartRate: number | null;
  note: string | null;
};

export type { User, Tour, TourLog };
