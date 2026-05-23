IdeaVault Server

Backend server for IdeaVault, a startup idea sharing platform where users can post startup ideas, explore ideas from others, and interact through comments.

Live API: https://ideavault-server-iota.vercel.app

Features

Custom JWT-based authentication
Email and password user authentication support
Secure password hashing with bcryptjs
MongoDB-based user management
CRUD operations for startup ideas
Add, edit, and delete comments
Protected private API routes
Search ideas by title using case-insensitive query
Filter ideas by category and date range
User-specific routes for My Ideas and My Interactions
MongoDB Atlas database integration

Technologies Used

Node.js
Express.js
MongoDB
JWT
bcryptjs
CORS
dotenv
Vercel

Main API Routes

GET / – Check server status
POST /auth/register – Register a new user
POST /auth/login – Login user and generate JWT token
GET /auth/me – Get logged-in user information
PATCH /auth/profile – Update user profile
GET /ideas – Get all startup ideas
GET /ideas/:id – Get single idea details
POST /ideas – Add a new startup idea
PATCH /ideas/:id – Update an idea
DELETE /ideas/:id – Delete an idea
GET /my-ideas – Get ideas created by logged-in user
GET /comments/idea/:ideaId – Get comments for an idea
POST /comments – Add a comment
PATCH /comments/:id – Update own comment
DELETE /comments/:id – Delete own comment
GET /my-interactions – Get logged-in user comment activity

Project Purpose

This server was built to support the IdeaVault client application. It handles authentication, database operations, protected routes, idea management, and comment interactions.

The backend uses a custom JWT authentication system with MongoDB and bcryptjs instead of Firebase Authentication.