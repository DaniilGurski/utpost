import { createSchema } from "graphql-yoga";
import { resolvers } from "./resolvers.js";

export const typeDefs = /* GraphQL */ `
  type User {
    id: ID!
    displayName: String!
  }

  type Guide {
    id: ID!
    slug: String!
    title: String!
    region: String!
    difficulty: String!
    bodyHtml: String!
    heroImage: String
    published: Boolean!
    updatedAt: String!
  }

  type Photo {
    id: ID!
    filename: String!
    width: Int!
    height: Int!
  }

  type LogPoint {
    recordedAt: String!
    lat: Float!
    lon: Float!
    elevationM: Int
    heartRate: Int
  }

  type TourSummary {
    id: ID!
    title: String!
    startedAt: String!
    distanceM: Int!
    user: User!
    guide: Guide
    photos: [Photo!]!
  }

  type Tour {
    id: ID!
    title: String!
    startedAt: String!
    distanceM: Int!
    notes: String
    user: User!
    guide: Guide
    photos: [Photo!]!
    logs: [LogPoint!]!
  }

  type Query {
    guides: [Guide!]!
    guide(slug: String!): Guide
    "Max 200, begränsas i resolvern med Math.min(limit, 200)"
    tours(limit: Int = 50): [TourSummary!]!
    tour(id: ID!): Tour
  }

  input CreateTourInput {
    guideId: ID
    title: String!
    startedAt: String!
    distanceM: Int!
    notes: String
  }

  type Mutation {
    createTour(tour: CreateTourInput!): Tour!
  }
`;

export const schema = createSchema({ typeDefs, resolvers });
