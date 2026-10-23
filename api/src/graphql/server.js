import { getOperationAST } from "graphql";
import { createYoga } from "graphql-yoga";
import { queryLog } from "../db/client.js";
import { schema } from "./schema.js";
import { verifyAuthHeader } from "../lib/auth.js";
import { createLoaders } from "./loaders.js";
import { db } from "../db/client.js";

// Skriver ut antalet databasfrågor per GraphQL-operation, t.ex.
// "[graphql] Tours: 151 databasfrågor, 87 ms". Underlag för beslutsdokumentet.
// Antalet läggs också i svarets extensions.queryCount, så att testerna kan kontrollera det.
const logQueryCount = {
  onExecute({ args }) {
    // Utan trackQueries (t.ex. yoga.fetch i testerna) startar vi räkningen här.
    if (!queryLog.getStore()) queryLog.enterWith({ count: 0 });
    const log = queryLog.getStore();
    const before = log.count;
    const start = performance.now();
    return {
      onExecuteDone({ result, setResult }) {
        const name =
          getOperationAST(args.document, args.operationName)?.name?.value ??
          "anonym";
        const ms = Math.round(performance.now() - start);
        console.log(
          `[graphql] ${name}: ${log.count - before} databasfrågor, ${ms} ms`,
        );
        if (Symbol.asyncIterator in result) return;
        setResult({
          ...result,
          extensions: { ...result.extensions, queryCount: log.count - before },
        });
      },
    };
  },
};

export const yoga = createYoga({
  schema,
  plugins: [logQueryCount],

  graphqlEndpoint: "/graphql",
  context: ({ request }) => {
    return {
      loaders: createLoaders(db),
      user: verifyAuthHeader(request.headers.get("authorization")),
    };
  },
});

export const trackQueries = (req, res, next) =>
  queryLog.run({ count: 0 }, next);
