# System Design

> Written by Oleksandr Kotusenko (40318616)

This document illustrates the runtime interaction flow between ReserveHub's main components for core business operations.

## Component Interaction Model

ReserveHub is a PHP/MySQL web application with static HTML/CSS/JavaScript pages in the frontend and PHP JSON endpoints in the API layer. The browser stores a lightweight user object in `localStorage` or `sessionStorage` for UI state, while protected backend operations rely on the PHP session created by `api/login.php`.

```mermaid
flowchart LR
    User[User]
    Frontend[Frontend<br/>HTML + CSS + JavaScript]
    API[Controller / API Layer<br/>PHP endpoints in api/]
    DB[(Database<br/>MySQL / MariaDB)]

    User -->|Clicks, form input, page navigation| Frontend
    Frontend -->|fetch requests<br/>JSON or FormData| API
    API -->|Prepared SQL queries| DB
    DB -->|Rows / write result| API
    API -->|JSON response| Frontend
    Frontend -->|UI update, redirect, modal, toast| User
```

## Authentication Flow

Current implementation:

- Frontend file: `js/auth-script.js`
- API endpoint: `api/login.php`
- Database table: `users`
- Session state: `$_SESSION['user_id']` and `$_SESSION['role']`
- Browser UI state: `reservehub_user` in `localStorage` or `sessionStorage`

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Frontend<br/>login-signup.html + js/auth-script.js
    participant API as Controller / API<br/>api/login.php
    participant DB as Database<br/>users table

    User->>Frontend: Enter email/username and password
    Frontend->>Frontend: Validate required fields and password length
    Frontend->>API: POST /api/login.php<br/>{ identifier, password }
    API->>DB: SELECT user by email or username
    DB-->>API: Return user row with password and role

    alt Credentials match current plaintext password check
        API->>API: Set PHP session<br/>user_id and role
        API-->>Frontend: JSON success with user profile data
        Frontend->>Frontend: Store reservehub_user in localStorage/sessionStorage
        Frontend-->>User: Show success modal
        Frontend->>Frontend: Redirect by role<br/>admin, vendor, or customer
    else Invalid credentials
        API-->>Frontend: JSON failure message
        Frontend-->>User: Show login error
    end
```

Notes:

- The current code compares the submitted password directly with the stored value in `api/login.php`; no password hash is used yet.
- The browser-stored `reservehub_user` object controls navigation and UI rendering, but protected API access is authorized by the PHP session cookie.

## Reservation Process Flow

Current implementation:

- Frontend file: `js/restaurant.js`
- Restaurant details endpoint: `api/restaurant.php`
- Table availability endpoint: `api/tables.php`
- Reservation endpoint: `api/reserve.php`
- Database tables: `restaurants`, `tables`, `reservations`

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as Frontend<br/>restaurant.html + js/restaurant.js
    participant API as Controller / API<br/>restaurant.php, tables.php, reserve.php
    participant DB as Database<br/>restaurants, tables, reservations

    User->>Frontend: Open restaurant page
    Frontend->>API: GET /api/restaurant.php?id={restaurant_id}
    API->>DB: SELECT restaurant and computed rating
    DB-->>API: Restaurant details
    API-->>Frontend: JSON restaurant data
    Frontend-->>User: Render restaurant hero and booking controls

    User->>Frontend: Select date, time, and guest count
    Frontend->>Frontend: Check operating hours client-side
    Frontend->>API: GET /api/tables.php<br/>restaurant_id, date, time, guests
    API->>DB: SELECT restaurant opening/closing time
    DB-->>API: Operating hours

    alt Requested time outside operating hours
        API-->>Frontend: JSON closed response
        Frontend-->>User: Show closed-state floor plan overlay
    else Requested time is valid
        API->>DB: SELECT tables with availability<br/>capacity check and +/- 60 minute reservation conflict window
        DB-->>API: Tables with available, unavailable, or occupied status
        API-->>Frontend: JSON table availability
        Frontend-->>User: Render interactive floor plan
    end

    User->>Frontend: Select available table and submit booking
    Frontend->>API: POST /api/reserve.php<br/>restaurant_id, table_id, date, time, guests, special_requests
    API->>API: Verify PHP session user_id exists
    API->>DB: SELECT restaurant operating hours
    DB-->>API: Operating hours
    API->>DB: Check active reservation conflict for table/date/time
    DB-->>API: Existing conflict row or none
    API->>DB: SELECT table capacity
    DB-->>API: Table capacity

    alt Not logged in
        API-->>Frontend: HTTP 401 unauthorized JSON response
        Frontend-->>User: Prompt login or show reservation failure
    else Closed, conflicting, or over capacity
        API-->>Frontend: JSON failure message
        Frontend-->>User: Show reservation error toast
    else Reservation accepted
        API->>DB: INSERT reservation with status pending
        DB-->>API: Insert successful
        API-->>Frontend: JSON success with reservation_id
        Frontend-->>User: Show confirmation modal and receipt options
    end
```

Notes:

- Reservation availability is dynamic. The `tables` table does not store a static availability status; `api/tables.php` computes status from current reservation records.
- A reservation request is inserted with status `pending`. Vendors can later accept or cancel requests through `api/vendor_api.php?endpoint=update_reservation`.
- The backend repeats important validation from the frontend: operating hours, table conflict, and table capacity are checked again in `api/reserve.php`.
