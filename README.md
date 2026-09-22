# Utpost

Plattform för friluftsdestinationer. Redaktionella guider, användarnas egna turer och bilder.

## Branchstrategi

Vi använder **trunk-based development med pull requests**. Strategin är ny för oss och vi vill testa den.

- `main` är den enda långlivade branchen. Vi har ingen `dev`-branch.
- Allt arbete sker i korta feature-brancher som mergas till `main` via PR.
- Varför: det tar bort ett lager av komplexitet, vilket passar ett litet team på 4 personer. Genom att merga oftare undviker vi också konflikter och synkroniseringsproblem mellan brancherna.
- Vi använder ändå PR:er (även som drafts) så att teamet kan följa en features framsteg under dagen.

## Arbetssätt

### Git

1. Skapa en branch från en issue på GitHub (under _Development_-sektionen) och följ instruktionerna där.
2. Gör en tom commit innan du börjar jobba:
   `git commit --allow-empty -m "chore: #<id> init"`
3. Skapa en draft-PR för feature-branchen.
4. Pusha ofta: `git push origin HEAD`
5. Använd conventional commits: `feat`, `fix`, `docs`, `chore`.

### Kommunikation

- Vi når varandra i vår Discord-kanal.
- Fastnar du på en uppgift? Skriv på Discord så snart du kan.

## Kom igång

```bash
npm install
docker compose -f docker-compose.dev.yml up -d
npm run seed
npm start
```

Appen ligger sen på http://localhost:3000 och API:et pa http://localhost:4000.

## Struktur

- `api/` – Express + Postgres (Drizzle)
- `web/` – React + Vite

## Deploy

Fråga Marcus.
