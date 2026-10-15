import { createSchema } from "graphql-yoga";
import { resolvers } from "./resolvers.js";

const typeDefs = /* GraphQL */ `
  type User {
    id: ID
    email: String
  }

  type Query {
    users: [User!]!
  }
`;

export const schema = createSchema({ typeDefs, resolvers });
