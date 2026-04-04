The Gaggle
A goose-themed group travel and place-tracking app for friend groups ("flocks"). Members sign in, join a flock, pin places on a shared map, rate them, and compete on a leaderboard — all backed by Supabase.

Features

Loading screen — A parade of animated geese waddles across the screen with a honk sound after sign-in
Authentication — Username + password sign-in with SHA-256 hashed passwords stored in Supabase (no third-party auth provider required)
4-step sign-up flow — Pick credentials → choose a goose avatar → select a role (Leader, Scout, Snack Keeper, Waddler) → join a flock
Flocks — Users belong to a flock; all place data and leaderboards are scoped to the flock
Interactive map — Pan, zoom, and click to drop pins on a custom map image; pins are persisted to Supabase
Place types — Tag each pin as a Cafe, Food, Park, or Work spot, each with its own icon
Ratings — Rate places 1–5 using goose-foot icons
Photo uploads — Attach multiple images to a place entry
Places list — Browse and filter all flock-saved places by type; search by name
Points & leaderboard — Members earn points for visiting places; a flock-scoped leaderboard tracks rankings
Wrapped view — A summary / highlights screen for the flock's activity


Tech Stack
LayerTechnologyFrontendReact (Vite)StylingCSS (App.css)Backend / DBSupabaseAuthCustom (SHA-256 hashed passwords in Supabase users table)

Project Structure
src/
├── App.jsx          # Entire application — components, pages, data fetching
├── App.css          # All styles
├── lib/
│   └── supabase.js  # Supabase client initialisation
└── assets/
    ├── Rashi-2.png  # Goose avatars (Goose1–12)
    ├── Dyuthi-1.png
    ├── Rajni-1.png
    ├── Goose4.png … Goose12.png
    ├── compass.png
    ├── goosefoot.png  # Rating icon
    ├── snack.png      # Place type icons
    ├── memory.png
    ├── fun.png
    ├── work.png
    ├── Map.jpg        # The custom map image
    └── breadcrumb.png
public/
└── sounds/
    └── HONK.mp3      # Played at the end of the loading screen

Supabase Schema
The app expects the following tables and views in your Supabase project:
Tables
TableKey columnsusersid, username, password_hash, avatar_id, role, flock_idflocksid, name, emoji, descriptionplacesid, name, review, rating, rel_x, rel_y, place_typeplace_peopleplace_id, goose_id (user id)geeseid, name (legacy — used for backward compatibility)
Views
ViewPurposeflock_leaderboardRanked flock members with user_id, flock_id, total_points, places_visitedgoose_leaderboardLegacy leaderboard used when no user is signed in

Note on password security: Passwords are hashed with SHA-256 in the browser before being stored. This is a lightweight approach suited for a private friend-group app. For a public-facing product, consider migrating to Supabase Auth with bcrypt.


Environment Variables
Create a .env file at the project root (or set these in your hosting provider):
envVITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
Both values are available in your Supabase project under Settings → API.

Getting Started
bash# 1. Install dependencies
npm install

# 2. Add environment variables
cp .env.example .env   # then fill in your Supabase URL and key

# 3. Start the dev server
npm run dev

Adding New Geese / Avatars
Avatar options are defined in the avatarOptions array near the top of App.jsx. Add an entry for each new goose image you import:
jsimport gooseThirteenArt from './assets/Goose13.png';

// inside avatarOptions:
{ id: 'a13', art: gooseThirteenArt, label: 'Goose 13' },
The same image will automatically appear in the loading-screen parade if you also add it to the loadingGeese array.

Roles
RoleEmojiDescriptionLeader👑First to explore, leads the wayScout🔍Spots clues, runs aheadSnack Keeper🥐Knows the best spots to eatWaddler🪷Takes it slow, enjoys the view
