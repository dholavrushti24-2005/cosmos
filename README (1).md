# Cosmos

Girls-focused fashion & beauty e-commerce — college internship project.

Two sides:
- **User side** (`frontend/user`) — browse, wishlist, cart, checkout, orders, profile.
- **Admin side** (`frontend/admin`) — manage products, brands, users, orders.

Single Node.js + Express backend with a JSON file database (no external DB),
JWT authentication, and bcrypt password hashing.

## Run

```bash
npm install
npm run dev
```

- User site: http://localhost:5000/
- Admin site: http://localhost:5000/admin/login.html

## Demo accounts (seeded in backend/data/database.json)

- **User:** demo@cosmos.com / demo123
- **Admin:** admin@cosmos.com / admin123

## Structure

```
COSMOS/
├── frontend/
│   ├── user/     — public shop (HTML/CSS/JS, no framework)
│   └── admin/    — admin dashboard (HTML/CSS/JS, no framework)
├── backend/
│   ├── server.js
│   ├── config.js
│   ├── middleware/
│   ├── routes/
│   └── data/database.json
└── assets/       — product & brand images
```
