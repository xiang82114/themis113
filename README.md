# Themis113 Full-Stack Refactor

此專案已重構為：
- Frontend: Angular 21（`@angular/build:application`，開發伺服器底層為 Vite）
- Backend: Java Spring Boot 3.5 + Spring Data JPA
- Database: PostgreSQL 16
- Container: Docker Compose（frontend + backend + postgres）

## 專案結構

```text
.
├─ frontend/          # Angular 前端
├─ backend/           # Spring Boot 後端
└─ docker-compose.yml # 一鍵啟動整套環境
```

## 主要 API

- `GET /api/works`：取得作品列表
- `GET /api/works/{slug}`：取得作品詳情
- `POST /api/contact`：送出聯絡表單（寫入 `contact_inquiries`）

## 本機開發

### 1) 啟動 PostgreSQL（Docker）

```bash
docker compose up -d postgres
```

### 2) 啟動後端

```bash
cd backend
./mvnw spring-boot:run
```

Windows:

```powershell
cd backend
./mvnw.cmd spring-boot:run
```

### 3) 啟動前端

```bash
cd frontend
npm install
npm start
```

前端開發網址：`http://localhost:4200`  
前端透過 `proxy.conf.json` 將 `/api` 代理到 `http://localhost:8080`

## Docker 一鍵啟動（建議）

```bash
docker compose up --build
```

服務網址：
- Frontend: `http://localhost:8081`
- Backend: `http://localhost:8080`（容器內部提供，前端透過 Nginx `/api` 反向代理）

## 資料庫

Flyway migration 檔案位於：
- `backend/src/main/resources/db/migration/V1__init_schema.sql`
- `backend/src/main/resources/db/migration/V2__seed_data.sql`

其中已包含 `works`/`work_images` 初始化資料與 `contact_inquiries` 表格。
