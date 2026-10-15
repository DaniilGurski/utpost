import { getOperationAST } from "graphql";
import { createYoga } from "graphql-yoga";
import { queryLog } from "../db/client.js";
import { schema } from "./schema.js";

// Skriver ut antalet databasfrågor per GraphQL-operation, t.ex.
// "[graphql] Tours: 151 databasfrågor, 87 ms". Underlag för beslutsdokumentet.
const logQueryCount = {
  onExecute({ args }) {
    const log = queryLog.getStore();
    if (!log) return;
    const before = log.count;
    const start = performance.now();
    return {
      onExecuteDone() {
        const name = getOperationAST(args.document, args.operationName)?.name?.value ?? "anonym";
        const ms = Math.round(performance.now() - start);
        console.log(`[graphql] ${name}: ${log.count - before} databasfrågor, ${ms} ms`);
      },
    };
  },
};

export const yoga = createYoga({
  schema,
  plugins: [logQueryCount],

  graphqlEndpoint: "/graphql",
});

export const trackQueries = (req, res, next) => queryLog.run({ count: 0 }, next);
