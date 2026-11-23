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
    lengthKm: Float!
    "Guidens text ur CMS:et (#198). null = texten saknas i Contentful, eller CMS:et är nere/avstängt"
    body: [Block!]
    "Ren text ur första stycket, högst ~180 tecken. Räknas fram i API:et. null när body är null"
    excerpt: String
    heroImage: String
    published: Boolean!
    updatedAt: String!
    "Redaktionens notiser som gäller just den här guiden (M9) – ur CMS:et, ihopkopplade här"
    notices: [Notice!]!
  }

  "En textbit i ett stycke. Rich text som data: klienten bestämmer hur fet text och länkar ser ut."
  type TextRun {
    text: String!
    bold: Boolean!
    italic: Boolean!
    "Vart textbiten länkar, om den är en länk"
    href: String
  }

  type Paragraph {
    runs: [TextRun!]!
  }

  "Vad ett block i guidens text ÄR – klienten bestämmer hur det ser ut"
  enum BlockType {
    PARAGRAPH
    HEADING_2
    HEADING_3
    LIST
  }

  "Ett block i guidens text (#198)"
  type Block {
    type: BlockType!
    "PARAGRAPH, HEADING_2, HEADING_3 (tom för LIST)"
    runs: [TextRun!]!
    "Bara LIST: en rad textbitar per listpunkt"
    items: [[TextRun!]!]
  }

  "En notis från redaktionen. Innehållet bor i CMS:et (M9), inte i databasen."
  type Notice {
    id: ID!
    title: String!
    "info eller varning – vad notisen ÄR, inte vilken färg den har"
    level: String!
    body: [Paragraph!]!
    "Vilken guide notisen gäller. Tom = gäller hela Utpost"
    guideSlug: String
    "published, draft eller changed. Annat än published syns bara i förhandsgranskningen"
    status: String!
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
    "Redaktionens notiser. preview: true visar även utkast – kräver inloggning med rollen editor"
    notices(preview: Boolean = false): [Notice!]!
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
