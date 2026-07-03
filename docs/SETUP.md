# Local Development Environment Setup Guide

This guide walks you through running ReserveHub locally from a fresh clone.
It was written after a full setup on macOS (Apple Silicon); Windows notes are
included where paths differ.

**TL;DR:** install XAMPP → copy project into `htdocs` → import
`sql/local_setup.sql` (NOT the files mentioned in the old README) → copy
`api/db.example.php` to `api/db.php` → open `http://localhost/reservehub`.

---

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| XAMPP | 8.2.x (PHP 8.2) | Bundles Apache + MariaDB + phpMyAdmin |
| Git | any recent | To clone the repo |

**macOS notes:**
- Download the regular **installer** version of XAMPP, *not* the `-vm` version.
- On first launch, macOS may block the installer ("Apple cannot verify…").
  Go to **System Settings → Privacy & Security**, scroll down, and click
  **Open Anyway**.
- On Apple Silicon (M1/M2/M3), XAMPP runs through Rosetta. You may see a
  "support for Intel apps is ending" notice — it is safe to ignore for this
  course; just avoid major macOS upgrades during the semester.

## 2. Clone the repository

```bash
cd ~/Desktop        # or wherever you keep projects
git clone https://github.com/Qiuchunru/COMP354-Project-ReserveHub-Evolution.git
```

## 3. Copy the project into XAMPP's web root

- **macOS:**
  ```bash
  cp -r ~/Desktop/COMP354-Project-ReserveHub-Evolution /Applications/XAMPP/xamppfiles/htdocs/reservehub
  ```
- **Windows:** copy the folder to `C:\xampp\htdocs\` and rename it `reservehub`.

Note: this is a *copy*. If you edit code in your Git working directory,
re-copy it (or set up a symlink) to see changes in the browser.

## 4. Start Apache and MySQL

Open the XAMPP control panel (macOS: the `manager-osx` app → **Manage
Servers** tab) and start **Apache Web Server** and **MySQL Database**.
Verify by opening `http://localhost` — you should see the XAMPP welcome page.

## 5. Create and import the database

> ⚠️ **Do NOT follow the import steps in the old README**
> (`setup_db.sql` → `create_tables.sql` → `seed_tables.sql`) and do NOT use
> `full_dump.sql`. Both reflect an outdated schema and will fail — see
> [Known Issues](#8-known-issues) below.

1. Open `http://localhost/phpmyadmin`
2. Create a new database named **`reservehub`** (character set `utf8mb4` is fine)
3. Select it, click **Import**, and import **`sql/local_setup.sql`** — one
   file, done. It creates all 7 tables in the final schema the current code
   expects, plus seed data (5 restaurants, 42 tables, 15 reviews) and three
   test accounts.

The script is idempotent: it drops and recreates the app tables, so you can
re-import it any time to reset your local database.

## 6. Configure the database connection

```bash
cd /Applications/XAMPP/xamppfiles/htdocs/reservehub/api   # Windows: C:\xampp\htdocs\reservehub\api
cp db.example.php db.php
```

The template's defaults (`localhost` / `reservehub` / `root` / empty
password) match a stock XAMPP install — no edits needed.

## 7. Verify the setup

1. Open `http://localhost/reservehub` (or `.../reservehub/html/index.html`)
2. Log in with a test account, or register a new one:

   | Role | Email | Password |
   |------|-------|----------|
   | Admin | admin@test.com | admin123 |
   | Vendor | vendor@test.com | vendor123 |
   | Customer | customer@test.com | test123 |

3. Browse **Restaurants** (you should see 5 seeded restaurants), pick one,
   and create a reservation. Check it appears under your profile.

**Expected limitations on local setups** (safe to ignore):
- Password-reset emails do nothing — no SMTP is configured locally.
- "Continue with Google" fails — no OAuth credentials are configured locally.

## 8. Known issues

These were discovered during the first local deployment (2026-07-03) and are
tracked as GitHub issues:

1. **Outdated database scripts.** `setup_db.sql` fails immediately
   (`errno 150`: its first table references `users`, which it never creates),
   and `full_dump.sql` reflects the pre-refactor schema (`users.id` instead
   of `user_id`, missing `username`/`phone`/`role` columns, no
   `contact_messages` table), so registration fails with
   `Unknown column 'user_id'`. The schema history is scattered across
   `sql/migrate_*.sql` and `tools/migrations/*.php` with no single
   authoritative file — `sql/local_setup.sql` was created to fill that gap.
2. **Plaintext passwords.** `api/signup.php` stores passwords as-is and
   `api/login.php` compares them with `===`. This should be replaced with
   `password_hash()` / `password_verify()`.

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| `Database Connection Failed` on every page | `api/db.php` missing (step 6) or MySQL not started |
| `Unknown column 'user_id'` on signup | You imported `full_dump.sql`; re-import `sql/local_setup.sql` |
| `errno 150` foreign key error during import | You ran `setup_db.sql`; use `sql/local_setup.sql` instead |
| Port 3306 already in use | Another MySQL instance is running; stop it or change XAMPP's MySQL port |
| Page loads but no restaurants listed | Database empty — re-import `sql/local_setup.sql` |
