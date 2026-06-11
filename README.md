# CallCenter

Support Hub dla zespołu serwisowego. Frontend działa z backendem Express, dane trzyma PostgreSQL, a Directus służy jako panel administracyjny dla osób nietechnicznych.

## Lokalny start

### 1. Uruchom bazę i Directusa

```powershell
docker compose up -d
```

To postawi lokalnie:
- PostgreSQL na porcie `5432`
- Directusa na porcie `8055`

### 2. Załaduj schemat bazy

```powershell
Get-Content .\backend\sql\postgres-schema.sql -Raw | docker compose exec -T postgres psql -U callcenter -d callcenter
```

### 3. Zaimportuj dane do PostgreSQL

```powershell
$env:DATABASE_URL="postgresql://callcenter:callcenter@localhost:5432/callcenter"
npm run import:postgres -- --reset
```

`--reset` czyści tabele przed importem, więc użyj go przy pierwszym ładowaniu lokalnym.

### 4. Uruchom backend Express

```powershell
npm start
```

Backend powinien być dostępny pod `http://localhost:4000`.

### 5. Zaloguj się do Directusa

Otwórz `http://localhost:8055` i zaloguj się danymi z `docker-compose.yml`:
- email: `admin@callcenter.local`
- hasło: `admin12345`

Jeśli po imporcie nie widzisz jeszcze kolekcji lub schematu, odśwież model danych w Directusie albo zrestartuj kontener Directusa.

## Szybki test endpointów

```powershell
npm run quick:test -- http://localhost:4000 55PUS9000
```

To odpytuje jednocześnie:
- `GET /api/models/55PUS9000`
- `GET /api/models/search?q=55PUS9000`

## Test obciążeniowy wyszukiwarki

### Szybka komenda `autocannon`

```powershell
npx --yes autocannon -c 100 -d 10 "http://localhost:4000/api/models/search?q=55PUS9000"
```

Parametry:
- `-c 100` oznacza 100 równoczesnych połączeń
- `-d 10` oznacza 10 sekund testu

### Wersja przez npm

```powershell
npm run load:test
```

Domyślnie testuje `http://localhost:4000/api/models/search?q=55PUS9000` z 100 połączeniami przez 10 sekund.

### Porównanie cache vs brak cache

W [backend/src/modelSearchService.js](backend/src/modelSearchService.js) cache jest sprawdzany na początku `searchModels()`.

Najprostszy test porównawczy:
- Bez cache: zakomentuj blok zaczynający się od `const cachedResult = getCachedSearchResult(normalizedQuery);` w `searchModels()`.
- Z cache: przywróć ten blok.

Potem uruchom ten sam test dwa razy i porównaj:
- `Req/Sec`
- `Latency`

Jeśli wolisz bez zmian w kodzie, możesz też ustawić `MODEL_SEARCH_CACHE_TTL_SECONDS=0` przed startem backendu, ale do czystego porównania najczytelniejsze jest tymczasowe wyłączenie bloku cache w kodzie.
