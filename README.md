# Monroy QMS (Enterprise v2.0) - Short Paths

## Folders
- /api     = Backend (Express + Prisma + Postgres)
- /public  = Frontend (Vite + React)

---

## 1) Backend setup (api)
### Install
cd api
npm install

### Configure env
copy .env.example to .env and fill values

### Prisma
npx prisma generate
npx prisma migrate dev
npm run seed

### Run backend
npm run dev
Backend runs on http://localhost:4000

---

## 2) Frontend setup (public)
cd public
npm install

copy .env.example to .env
npm run dev
Frontend runs on http://localhost:5173

---

## Default admin
Email: admin@monroy.local
Password: Admin@12345
