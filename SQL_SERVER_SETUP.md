# Why IntelliJ "shuts down" the run

IntelliJ itself is fine. The **VorynzaApplication process exits** with `Process finished with exit code 1` because it cannot connect to SQL Server.

Key line in your log:

```
TCP/IP connection to the host localhost, port 1433 has failed
Connection refused
```

Until SQL Server answers, Spring Boot cannot start and the green Run stops.

## Fix (do in order)

### 1) Confirm SQL Server is installed and running
Open PowerShell and run:

```powershell
cd D:\SLIIT\projectr\Ithin_web\database
powershell -ExecutionPolicy Bypass -File .\check-sql-server.ps1
```

Or open `services.msc` and start:
- `SQL Server (MSSQLSERVER)` or
- `SQL Server (SQLEXPRESS)`

### 2) Match the JDBC URL to your instance
Edit `backend/src/main/resources/application.properties`:

| What you have | Use this URL style |
|---------------|--------------------|
| Default SQL Server, port 1433 open | `localhost:1433` (current Option A) |
| Express | `localhost\\SQLEXPRESS` (Option B) |
| LocalDB | `(localdb)\\MSSQLLocalDB` (Option C) |

### 3) Enable TCP/IP (if using port 1433)
SQL Server Configuration Manager → Protocols → enable **TCP/IP** → restart SQL Server service.

### 4) Create database
In SSMS, connect to the same instance, run `database/01_create_database.sql`.

### 5) Set login password
Change `spring.datasource.username` / `password` to a real SQL login (or use integratedSecurity for LocalDB).

### 6) Clean IntelliJ classpath
File → Project Structure → Modules → backend → Dependencies  
Remove jars under:
`C:\Users\herat\Downloads\Compressed\sqljdbc_...`  
Keep only Maven `mssql-jdbc` from `.m2`.

### 7) Run again
You need this line before the app stays up:

```
Started VorynzaApplication
```

Then open `http://localhost:8080/api/health`
