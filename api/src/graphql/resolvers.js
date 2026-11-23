import {
  listTours,
  getTour,
  getTourLogs,
  getTourPhotos,
  createTour,
} from "../data/tours.js";
import { listGuides, getGuideBySlug } from "../data/guides.js";
import { GraphQLError } from "graphql/error";
import { excerpt } from "./excerpt.js";

const MAX_TOURS = 200;

const iso = (date) => (date ? new Date(date).toISOString() : null);

// Fälten som är gemensamma för listan och detaljvyn. Varje uppslag här körs
// en gång per tur (N+1), medvetet olöst i M4 så att det går att mäta.
const tourFields = {
  startedAt: (tour) => iso(tour.started_at),
  distanceM: (tour) => tour.distance_m,
  user: (tour, _, { loaders }) => loaders.getUsersByIds.load(tour.user_id),
  guide: (tour, _, { loaders }) =>
    tour.guide_id ? loaders.getGuidesByIds.load(tour.guide_id) : null,
  photos: (tour, _, { loaders }) => loaders.getPhotosByTourIds.load(tour.id),
};

export const resolvers = {
  Query: {
    guides: () => listGuides(),
    guide: (_, { slug }) => getGuideBySlug(slug),
    tours: (_, { limit }) => listTours(Math.max(0, Math.min(limit, MAX_TOURS))),
    tour: (_, { id }) => getTour(id),
    // M9: notiserna kommer ur CMS:et (cms/contentful.js), inte ur databasen. Utkast får bara
    // redaktionen se: rollen kontrolleras HÄR, på servern, som också håller preview-nyckeln.
    notices: (_, { preview }, { user, cms }) => {
      if (!preview) return cms.notices();
      if (user?.role !== "editor") {
        throw new GraphQLError("Förhandsgranskningen kräver rollen editor", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      return cms.previewNotices();
    },
  },

  User: {
    displayName: (user) => user.display_name,
  },

  Guide: {
    lengthKm: (guide) => guide.length_km,
    heroImage: (guide) => guide.hero_image,
    updatedAt: (guide) => iso(guide.updated_at),
    // #198: guiden bor i Postgres, texten i CMS:et – id:t kopplar ihop dem (cms vet hur).
    body: (guide, _, { cms }) => cms.guideBody(guide.id),
    excerpt: async (guide, _, { cms }) => excerpt(await cms.guideBody(guide.id)),
    // M9: guiden bor i Postgres, notisen i CMS:et – sluggen kopplar ihop dem.
    notices: async (guide, _, { cms }) =>
      (await cms.notices()).filter((notice) => notice.guideSlug === guide.slug),
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
    logs: (tour, _, { loaders }) => loaders.getLogsByTourIds.load(tour.id),
  },

  Mutation: {
    createTour: (_, args, ctx) => {
      if (!ctx.user)
        throw new GraphQLError("Not authenticated", {
          extensions: { code: "UNAUTHENTICATED" },
        });

      return createTour({ ...args.tour, userId: ctx.user.id });
    },
  },
};
