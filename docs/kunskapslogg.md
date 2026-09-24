# Kunskapslogg – Douglas
Cloud, CI/CD och arbetsmetodik + Avancerad fullstackutveckling, v. 38–51 2026

## Sammanfattningstabell

| Kursmål | Post i vecka | Var det syns i mitt arbete | Siktar på VG |
|---|---|---|---|
| Fullstack 4 | 38 | | – |
| Fullstack 5 | 39 | | – |
| Cloud 3 | 39 | | – |
| Fullstack 3 | 40 | | – |
| Cloud 5 | 40 | | – |
| Cloud 6 | 40 | | – |
| Fullstack 1 | 41 | | – |
| Cloud 4 | 41 | | – |
| Fullstack 2 | 42 | | – |
| Cloud 1 | 44 | | – |
| Cloud 2 | 45 | | – |
| Fullstack 8 | 46 | | – |
| Fullstack 9 | 47 | | – |
| Fullstack 6 | 48 | | – |
| Fullstack 7 | 48 | | – |
| Fullstack 19 | 49 | | – |

---

## Vecka 38 – Ramverket och arbetssättet
**Kursmål:** Fullstack 4

### Vad jag förstått

Fullstack 4: Mycket logik som finns i react finns även i vue men under annat namn (custom hook - composable, useEffect - watchEffect). En route i vue skrivs som ett objekt med data men vad den skickar vidare är en URL/slug, precis som i react. Den kan således inte skicka data direkt till GuideCard.

### Var det syns i mitt arbete

 `GuideCard.vue` (fungerar korrekt i `v-for` i `GuidesView.vue`)
och `router/index.js`, där routen för `/guider/:slug` felaktigt pekar direkt på GuideCard utan en "mellan-komponent".

### Kvar att förstå

Jag behöver skapa en komponent som är ett mellanled mellan routingen och komponenten som renderar UI.

### Siktar på VG
Nej.

---

## Vecka 39 – Routing, state och CI
**Kursmål:** Fullstack 5 · Cloud 3

### Vad jag förstått
Fullstack 5:

Cloud 3: För push och commit till GH använder vi trunk-based development med relativt frekventa pull requests, vilket jag inte gjort innan. 

### Var det syns i mitt arbete
Fullstack 5:

Cloud 3:

### Kvar att förstå


### Siktar på VG
Nej.

---

## Vecka 40 – TypeScript och kvalitetssäkring
**Kursmål:** Fullstack 3 · Cloud 5, 6

### Vad jag förstått
Fullstack 3:

Cloud 5:

Cloud 6:

### Var det syns i mitt arbete
Fullstack 3:

Cloud 5:

Cloud 6:

### Kvar att förstå


### Siktar på VG
Nej.

---

## Vecka 41 – NoSQL och containrar
**Kursmål:** Fullstack 1 · Cloud 4

### Vad jag förstått
Fullstack 1:

Cloud 4:

### Var det syns i mitt arbete
Fullstack 1:

Cloud 4:

### Kvar att förstå


### Siktar på VG
Nej.

---

## Vecka 42 – GraphQL
**Kursmål:** Fullstack 2

### Vad jag förstått
Fullstack 2:

### Var det syns i mitt arbete
Fullstack 2:

### Kvar att förstå


### Siktar på VG
Nej.

---

## Vecka 43 – GraphQL i klienten
**Kursmål:** (fri post)

### Vad jag förstått


### Var det syns i mitt arbete


### Kvar att förstå


### Siktar på VG
Nej.

---

## Vecka 44 – Hosting och moln
**Kursmål:** Cloud 1

### Vad jag förstått
Cloud 1:

### Var det syns i mitt arbete
Cloud 1:

### Kvar att förstå


### Siktar på VG
Nej.

---

## Vecka 45 – Serverless
**Kursmål:** Cloud 2

### Vad jag förstått
Cloud 2:

### Var det syns i mitt arbete
Cloud 2:

### Kvar att förstå


### Siktar på VG
Nej.

---

## Vecka 46 – OWASP
**Kursmål:** Fullstack 8

### Vad jag förstått
Fullstack 8:

### Var det syns i mitt arbete
Fullstack 8:

### Kvar att förstå


### Siktar på VG
Nej.

---

## Vecka 47 – Headless CMS
**Kursmål:** Fullstack 9

### Vad jag förstått
Fullstack 9:

### Var det syns i mitt arbete
Fullstack 9:

### Kvar att förstå


### Siktar på VG
Nej.

---

## Vecka 48 – Rendering, prestanda och struktur
**Kursmål:** Fullstack 6, 7

### Vad jag förstått
Fullstack 6:

Fullstack 7:

### Var det syns i mitt arbete
Fullstack 6:

Fullstack 7:

### Kvar att förstå


### Siktar på VG
Nej.

---

## Vecka 49 – AI i flödet
**Kursmål:** Fullstack 19

### Vad jag förstått
Fullstack 19 (bygger på besluten från v. 41, 42, 46 – sammanfatta här med hänvisning till de beslutsdokumenten):

### Var det syns i mitt arbete
Fullstack 19:

### Kvar att förstå


### Siktar på VG
Nej.

---

## Vecka 50 – Tekniska motiveringar
**Kursmål:** (fri post)

### Vad jag förstått


### Var det syns i mitt arbete


### Kvar att förstå


### Siktar på VG
Nej.
