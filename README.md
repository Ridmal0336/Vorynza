# Vorynza — Wedding Hotel Reservation System

## Open in IntelliJ IDEA (one-click backend run)

1. **File → Open** → select this folder: `Ithin_web`
2. Trust the project and let Maven import (root `pom.xml` + `backend` module).
3. **Start Microsoft SQL Server** and create `VorynzaDB` — see [SQL_SERVER_SETUP.md](SQL_SERVER_SETUP.md).
4. Set SQL login in `backend/src/main/resources/application.properties`.
5. Top-right run configuration: **VorynzaApplication** → green **Run**.

Or open `backend/src/main/java/com/vorynza/wedding/VorynzaApplication.java` and click the green arrow beside `main`.

- Database: **Microsoft SQL Server** (`mssql-jdbc`) — **not** MySQL
- Database name: **VorynzaDB**
- API: `http://localhost:8080`

### Demo logins (seeded on first successful start)

| Email | Password | Role |
|-------|----------|------|
| admin@vorynza.com | Password123! | ADMIN |
| customer@vorynza.com | Password123! | CUSTOMER |

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Module folders (per person)

| Member | Backend package | Frontend pages |
|--------|-----------------|----------------|
| Hapuarachchi | `useraccount` | `pages/user-account` |
| Damsahan | `weddingpackage` | `pages/wedding-package` |
| Dinujaya | `hallvenue` | `pages/hall-venue` |
| Umeshani | `reservation` | `pages/reservation` |
| Piyumanthi | `cateringmenu` | `pages/catering-menu` |
| Ariyadasa | `paymentbilling` | `pages/payment-billing` |
