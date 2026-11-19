import { createClient, cacheExchange, fetchExchange } from "@urql/vue";
import { getToken } from "./lib/token";

export const client = createClient({
  url: "/graphql",
  exchanges: [cacheExchange, fetchExchange],
  preferGetMethod: false,
  // M9: samma token som REST-anropen i api.ts. Körs vid varje anrop, så en
  // inloggning eller utloggning gäller direkt utan att klienten byggs om.
  fetchOptions: () => {
    const token = getToken();
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  },
});
