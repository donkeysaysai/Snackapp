# P&TA Snack Bestel App - Product Requirements Document

## Original Problem Statement
Build a full-stack web application called "P&TA Snack Bestel App" for office lunch orders, migrating from a frontend-only React prototype to a production-ready app with real backend database.

## Architecture
- **Frontend**: React 19 with Tailwind CSS, Shadcn/UI components
- **Backend**: FastAPI (Python) with async MongoDB (Motor)
- **Database**: MongoDB
- **Design**: Dark Apple Pro aesthetic

## User Personas
1. **Office Employee**: Places lunch orders, views totals, marks payments
2. **Admin**: Views activity logs, exports CSV, resets app, manages payment link

## Core Requirements (Static)
- Dutch terminology throughout UI
- EUR currency formatting (nl-NL locale)
- PIN-protected admin features (PIN: 1990)
- Activity logging for all actions
- Categorized menu with 124 items (snacks, patat, burgers, vis, etc.)

## What's Been Implemented (Jan 2026)
- [x] MongoDB database with collections: menu_items, orders, activity_log, app_settings
- [x] Full CRUD API for orders
- [x] Menu endpoint with 124 items across 20 categories
- [x] Activity logging system
- [x] Admin verification endpoint
- [x] App reset functionality
- [x] React frontend with dark Apple design
- [x] Order form with categorized dropdown
- [x] Orders list with edit mode
- [x] Total overview with aggregated snacks
- [x] Payment status toggles
- [x] Settings dropdown with admin login
- [x] Activity log modal with CSV export
- [x] Payment link footer
- [x] Email export (mailto:info@cafetariarex.nl)
- [x] Confirmation modals for delete/reset

## Prioritized Backlog

### P0 (Completed)
- All core features implemented

### P1 (Future Enhancements)
- Persistent admin sessions (JWT tokens)
- Order history by date
- Menu item management via admin UI
- Real-time updates (WebSocket)

### P2 (Nice to Have)
- Print-friendly receipt view
- Multiple payment link support
- Dark/Light theme toggle
- Mobile app version

## Next Tasks
1. Add order search/filter functionality
2. Implement order date grouping
3. Add statistics dashboard for admin
