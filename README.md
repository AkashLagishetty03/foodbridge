# 🌿 FoodBridge — Food Waste Redistribution System

A full-stack web application connecting food donors (restaurants, individuals) with NGOs to redistribute surplus food and reduce waste.

---

## 📁 Complete Folder Structure

```
food-waste-app/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── authController.js
│   │   ├── foodController.js
│   │   └── requestController.js
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification
│   │   ├── errorMiddleware.js     # Global error handler + AppError class
│   │   └── roleMiddleware.js      # Role-based access control
│   ├── models/
│   │   ├── Food.js
│   │   ├── Request.js
│   │   └── User.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── foodRoutes.js
│   │   └── requestRoutes.js
│   ├── services/
│   │   ├── adminService.js
│   │   ├── authService.js
│   │   ├── foodService.js
│   │   └── requestService.js
│   ├── .env
│   ├── package.json
│   ├── seed.js                    # Sample data seeder
│   └── server.js                  # Express entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── ProtectedRoute.js  # Auth + role guards
    │   │   ├── Shared.js          # Reusable UI components
    │   │   ├── Sidebar.js
    │   │   └── Topbar.js
    │   ├── context/
    │   │   └── AuthContext.js     # Global auth state
    │   ├── pages/
    │   │   ├── AddFood.js
    │   │   ├── AdminFoods.js
    │   │   ├── AdminRequests.js
    │   │   ├── AdminUsers.js
    │   │   ├── AuthPage.js        # Login + Register
    │   │   ├── Dashboard.js
    │   │   ├── DonorRequests.js
    │   │   ├── FoodListings.js
    │   │   ├── MyFoods.js
    │   │   └── NGORequests.js
    │   ├── services/
    │   │   └── api.js             # Axios instance + all API calls
    │   ├── App.js
    │   ├── index.css
    │   └── index.js
    └── package.json
```

---

## ⚙️ Prerequisites

- **Node.js** v16+ 
- **MongoDB** running locally on port 27017 (or use MongoDB Atlas)
- **npm** v7+

---

## 🚀 Setup & Run Instructions

### 1. Clone / unzip the project

```bash
unzip food-waste-app.zip
cd food-waste-app
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment (already set — edit if needed)
# .env contents:
#   PORT=5000
#   MONGO_URI=mongodb://localhost:27017/food_waste_db
#   JWT_SECRET=food_waste_super_secret_key_2024
#   JWT_EXPIRES_IN=7d
#   NODE_ENV=development

# Seed sample data (optional but recommended)
npm run seed

# Start the backend (development with auto-reload)
npm run dev

# OR start without nodemon
npm start
```

Backend runs at: **http://localhost:5000**

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Start the React dev server
npm start
```

Frontend runs at: **http://localhost:3000**

> The React app proxies `/api` requests to `http://localhost:5000` automatically via the `"proxy"` field in `package.json`.

---

## 🧪 Demo Accounts (after seeding)

| Role  | Email                  | Password   |
|-------|------------------------|------------|
| ADMIN | admin@foodwaste.com    | admin123   |
| DONOR | donor1@example.com     | donor123   |
| DONOR | donor2@example.com     | donor123   |
| NGO   | ngo1@example.com       | ngo123     |
| NGO   | ngo2@example.com       | ngo123     |

---

## 🔌 API Reference

### Auth Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Green Valley Restaurant",
  "email": "restaurant@example.com",
  "password": "mypassword123",
  "role": "DONOR",
  "phone": "+1-555-100-1001",
  "organization": "Green Valley Restaurant"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "donor1@example.com",
  "password": "donor123"
}
```
Response includes `token` — use as `Authorization: Bearer <token>` header.

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

---

### Food Endpoints

#### Get All Food (with filters)
```http
GET /api/food?status=available&category=cooked&page=1&limit=10
Authorization: Bearer <token>
```

#### Get My Listings (Donor)
```http
GET /api/food/my?status=available&page=1
Authorization: Bearer <donor-token>
```

#### Create Food Listing (Donor only)
```http
POST /api/food
Authorization: Bearer <donor-token>
Content-Type: application/json

{
  "title": "Pasta Primavera - Large Batch",
  "description": "Freshly made pasta for 50 people. Vegetarian, no allergens.",
  "quantity": "50 servings",
  "expiryTime": "2024-12-31T18:00:00.000Z",
  "category": "cooked",
  "location": {
    "address": "123 Main St, New York, NY",
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

#### Update Food Listing (Donor only)
```http
PUT /api/food/:id
Authorization: Bearer <donor-token>
Content-Type: application/json

{
  "quantity": "35 servings",
  "description": "Updated: 35 servings remaining"
}
```

#### Delete Food Listing (Donor or Admin)
```http
DELETE /api/food/:id
Authorization: Bearer <token>
```

---

### Request Endpoints

#### Create Request (NGO only)
```http
POST /api/request
Authorization: Bearer <ngo-token>
Content-Type: application/json

{
  "foodId": "<food-object-id>",
  "message": "We serve 150 homeless individuals nightly and would greatly appreciate this.",
  "pickupTime": "2024-12-31T17:00:00.000Z"
}
```

#### Get Requests for Donor
```http
GET /api/request/donor?status=pending&page=1
Authorization: Bearer <donor-token>
```

#### Get My Requests (NGO)
```http
GET /api/request/ngo?status=accepted
Authorization: Bearer <ngo-token>
```

#### Accept / Reject a Request (Donor only)
```http
PUT /api/request/:id/status
Authorization: Bearer <donor-token>
Content-Type: application/json

{
  "status": "accepted",
  "responseNote": "Please come by at 6pm. Use the back entrance."
}
```

#### Mark as Completed (Donor only)
```http
PUT /api/request/:id/complete
Authorization: Bearer <donor-token>
```

---

### Admin Endpoints (ADMIN role only)

#### Dashboard Stats
```http
GET /api/admin/stats
Authorization: Bearer <admin-token>
```

#### Get All Users
```http
GET /api/admin/users?role=NGO&search=hope&page=1
Authorization: Bearer <admin-token>
```

#### Delete User
```http
DELETE /api/admin/users/:id
Authorization: Bearer <admin-token>
```

#### Toggle User Active Status
```http
PATCH /api/admin/users/:id/toggle
Authorization: Bearer <admin-token>
```

#### Get All Food Listings (Admin)
```http
GET /api/admin/foods?status=available&page=1
Authorization: Bearer <admin-token>
```

#### Delete Food Listing (Admin)
```http
DELETE /api/admin/foods/:id
Authorization: Bearer <admin-token>
```

---

## 🎯 Feature Summary by Role

### DONOR
- ✅ Register / Login
- ✅ Create, edit, delete food listings
- ✅ View and filter own listings
- ✅ Receive NGO requests in inbox
- ✅ Accept or reject requests with optional note
- ✅ Mark accepted requests as "completed"

### NGO
- ✅ Register / Login
- ✅ Browse all available food listings
- ✅ Filter by status and category
- ✅ Submit request to donor with message + preferred pickup time
- ✅ Track all own requests and their statuses

### ADMIN
- ✅ View full platform statistics on dashboard
- ✅ Search, filter, and paginate all users
- ✅ Activate / deactivate users
- ✅ Delete users (cascades to food + requests)
- ✅ View and delete any food listing
- ✅ Monitor all requests across the platform

---

## 🗄️ Data Models

### User
```
name, email, password (hashed), role (DONOR|NGO|ADMIN),
phone, organization, isActive, timestamps
```

### Food
```
title, description, quantity, expiryTime,
location { address, lat, lng },
status (available|requested|completed|expired),
category (cooked|raw|packaged|beverages|other),
donor (ref: User), images[], timestamps
```

### Request
```
food (ref: Food), ngo (ref: User), donor (ref: User),
status (pending|accepted|rejected|completed),
message, responseNote, pickupTime, timestamps
```

---

## 🔒 Security Features

- Passwords hashed with **bcryptjs** (12 rounds)
- **JWT** tokens (7-day expiry)
- Role-based middleware protects all sensitive routes
- Global error handler with clean JSON responses
- Mongoose validation on all inputs
- Duplicate key, CastError, and ValidationError handling

---

## 🌱 Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/food_waste_db
JWT_SECRET=food_waste_super_secret_key_2024
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

> For production: change `JWT_SECRET` to a long random string and set `NODE_ENV=production`.

---

## 🧩 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Backend    | Node.js, Express.js               |
| Database   | MongoDB, Mongoose ODM             |
| Auth       | JWT, bcryptjs                     |
| Frontend   | React 18, React Router v6         |
| HTTP Client| Axios (with interceptors)         |
| Styling    | Pure CSS with CSS variables       |
