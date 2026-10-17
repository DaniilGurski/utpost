import {
  listTours,
  getTour,
  getTourLogs,
  getTourPhotos,
  createTour,
} from "../data/tours.js";
import { listGuides, getGuideById, getGuideBySlug } from "../data/guides.js";
import { getUserById } from "../data/users.js";

const MAX_TOURS = 200;

const iso = (date) => (date ? new Date(date).toISOString() : null);

// Fälten som är gemensamma för listan och detaljvyn. Varje uppslag här körs
// en gång per tur (N+1), medvetet olöst i M4 så att det går att mäta.
const tourFields = {
  startedAt: (tour) => iso(tour.started_at),
  distanceM: (tour) => tour.distance_m,
  user: (tour) => getUserById(tour.user_id),
  guide: (tour) => (tour.guide_id ? getGuideById(tour.guide_id) : null),
  photos: (tour) => getTourPhotos(tour.id),
};

export const resolvers = {
  Query: {
    guides: () => listGuides(),
    guide: (_, { slug }) => getGuideBySlug(slug),
    tours: (_, { limit }) => listTours(Math.max(0, Math.min(limit, MAX_TOURS))),
    tour: (_, { id }) => getTour(id),
  },

  User: {
    displayName: (user) => user.display_name,
  },

  Guide: {
    bodyHtml: (guide) => guide.body_html,
    heroImage: (guide) => guide.hero_image,
    updatedAt: (guide) => iso(guide.updated_at),
  },

  LogPoint: {
    recordedAt: (log) => iso(log.recorded_at),
    elevationM: (log) => log.elevation_m,
    heartRate: (log) => log.heart_rate,
  },

  // Ingen logs-resolver här: listan hämtar aldrig tour_logs.
  TourSummary: tourFields,

  Tour: {
    ...tourFields,
    logs: (tour) => getTourLogs(tour.id),
  },

  Mutation: {
    createTour: async (_, args) => {
      const tour = await createTour(args.tour);
      return tour;
    },
  },
};
