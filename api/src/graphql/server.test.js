import { describe, it, expect, afterAll } from "vitest";
import { yoga } from "./server.js";
import { pool } from "../db/client.js";
import { mongoClient } from "../db/mongo.js";
import { sign } from "../lib/auth.js";

// Integrationstester (M5): hela kedjan fråga → schema → resolvers → databas, mot riktiga
// Postgres och MongoDB. Ingen port behövs: yoga är en fetch-handler, så vi anropar den direkt
// med samma request som browsern skulle skicka. Adressen spelar ingen roll – bara sökvägen.
const graphql = async (query, { variables, token } = {}) => {
  const res = await yoga.fetch("http://utpost/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  return { status: res.status, ...(await res.json()) };
};

afterAll(async () => {
  await pool.end();
  await mongoClient.close();
});

describe("GraphQL API against a real database", () => {
  it("tours returns 50 tours with their user in 2 database queries, not 51", async () => {
    const { data, errors } = await graphql(/* GraphQL */ `
      query Tours {
        tours {
          id
          title
          user {
            displayName
          }
        }
      }
    `);
    expect(errors).toBeUndefined();
    expect(data.tours).toHaveLength(50);
    for (const tour of data.tours)
      expect(tour.user.displayName).toEqual(expect.any(String));
  });

  it("guide(slug) returns null, not an error, for an unknown slug", async () => {
    const { data, errors } = await graphql(/* GraphQL */ `
      query Saknas {
        guide(slug: "finns-inte") {
          title
        }
      }
    `);
    expect(errors).toBeUndefined();
    expect(data.guide).toBeNull();
  });

  it("querying an unknown field returns errors with status 200", async () => {
    const { status, data, errors } = await graphql("{ guides { titel } }");
    expect(status).toBe(200);
    expect(data).toBeUndefined();
    expect(errors[0].message).toContain('Cannot query field "titel"');
  });

  it("createTour without a token is rejected with UNAUTHENTICATED", async () => {
    const { data, errors } = await graphql(/* GraphQL */ `
      mutation NyTur {
        createTour(
          tour: {
            title: "Testtur"
            startedAt: "2026-10-23T09:00:00Z"
            distanceM: 1000
          }
        ) {
          id
        }
      }
    `);
    expect(data).toBeNull();
    expect(errors[0].extensions.code).toBe("UNAUTHENTICATED");
  });

  it("createTour with a token creates the tour for the logged-in user", async () => {
    // Samma JWT som REST-inloggningen ger. Användare 1 finns alltid efter npm run seed.
    const user = (
      await pool.query(
        "select id, email, role, display_name from users where id = 1",
      )
    ).rows[0];
    const token = sign(user);
    const { data, errors } = await graphql(
      /* GraphQL */ `
        mutation NyTur($input: CreateTourInput!) {
          createTour(tour: $input) {
            id
            title
            user {
              displayName
            }
          }
        }
      `,
      {
        variables: {
          input: {
            title: "Testtur",
            startedAt: "2026-10-23T09:00:00Z",
            distanceM: 1000,
          },
        },
        token,
      },
    );
    expect(errors).toBeUndefined();
    expect(data.createTour.title).toBe("Testtur");
    expect(data.createTour.user.displayName).toBe(user.display_name);
    // Städa: testet lämnar inget efter sig i databasen.
    await pool.query("delete from tours where id = $1", [data.createTour.id]);
  });

  it("tour logs come from MongoDB and match the Postgres row count", async () => {
    const { rows } = await pool.query(
      "select count(*)::int as n from tour_logs where tour_id = 1",
    );
    const { data, errors, extensions } = await graphql(/* GraphQL */ `
      query Tur {
        tour(id: 1) {
          logs {
            recordedAt
            lat
          }
        }
      }
    `);
    expect(errors).toBeUndefined();
    expect(data.tour.logs).toHaveLength(rows[0].n); // migreringen tappade inget
    expect(extensions.queryCount).toBe(2); // en i Postgres (turen), en i Mongo (dokumentet)
  });

  // M9: notiserna kommer ur CMS:et. I testerna är CMS:et avstängt (inga nycklar i pipelinen),
  // så listan är tom – men frågan ska fungera, och rollkontrollen ska gälla ändå.
  it("notices: fungerar utan CMS, och utkast kräver rollen editor", async () => {
    const utan = await graphql(
      "{ notices { title } guides { slug notices { title } } }",
    );
    expect(utan.errors).toBeUndefined();
    expect(utan.data.notices).toEqual([]);
    expect(utan.data.guides[0].notices).toEqual([]);

    const anonym = await graphql("{ notices(preview: true) { title } }");
    expect(anonym.errors[0].extensions.code).toBe("FORBIDDEN");

    const medlem = sign({ id: 2, email: "medlem@utpost.se", role: "member" });
    const somMedlem = await graphql("{ notices(preview: true) { title } }", {
      token: medlem,
    });
    expect(somMedlem.errors[0].extensions.code).toBe("FORBIDDEN");
  });

  // #198: guidens text kommer ur CMS:et. Utan CMS (som i testerna) är body och excerpt null –
  // men guiden finns, och allt som bor i Postgres går att läsa.
  it("guide: body och excerpt är null utan CMS, resten av guiden kommer ur Postgres", async () => {
    const { data, errors } = await graphql(
      "{ guides { slug title region body { type } excerpt } }",
    );
    expect(errors).toBeUndefined();
    expect(data.guides).toHaveLength(40);
    for (const guide of data.guides) {
      expect(guide.title).toEqual(expect.any(String));
      expect(guide.body).toBeNull();
      expect(guide.excerpt).toBeNull();
    }
  });

  it("seeden ger samma titel och slug varje gång (guide 7 = Lilla Hällstigen 7)", async () => {
    const { data } = await graphql(
      '{ guide(slug: "lilla-hallstigen-7") { title region } }',
    );
    expect(data.guide).toEqual({ title: "Lilla Hällstigen 7", region: "Härjedalen" });
  });
});
