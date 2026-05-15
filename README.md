# 🍽️ ReserveHub - Premium Restaurant Reservation System

ReserveHub is a high-end, responsive restaurant reservation platform designed to bridge the gap between diners and restaurant owners. With a focus on modern aesthetics (Glassmorphism), seamless user experience, and robust backend management, ReserveHub streamlines the entire booking journey.

## ✨ Features

### 👤 For Diners
- **Modern UI/UX**: Cinematic landing page with dynamic background animations and theme-aware design (Light/Dark mode).
- **Secure Authentication**: Traditional Email/Password login plus **Google Social Login** integration.
- **Password Recovery**: Fully functional "Forgot Password" workflow using SMTP-based email delivery.
- **Advanced Search**: Filter by name, cuisine, location, and real-time availability.
- **Interactive Floor Plans**: Visual table selection allowing users to choose their preferred dining spot.
- **Personalized Profile**: Manage reservations, track history, and customize user avatars.
- **Social Proof**: Integration with **Google Reviews** and local community feedback.

### 🛠️ For Administrators
- **Unified Dashboard**: Real-time overview of reservations, restaurant analytics, and user activity.
- **Restaurant Management**: Dynamic control over restaurant details, availability, and table layouts.
- **Role-Based Access**: Secure admin gateway with protected routes and restricted UI elements.

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+), Google Fonts (Inter, Outfit).
- **Backend**: PHP (7.4+) with procedural and OOP patterns.
- **Database**: MySQL / MariaDB with PDO for secure prepared statements.
- **Integration**:
  - **PHPMailer**: For reliable transactional emails (Password resets, notifications).
  - **Google OAuth**: For streamlined social authentication.
  - **Google Maps/Places API**: (Planned/Integrated) For location and review services.
- **Icons & Media**: FontAwesome 6, custom SVG assets, and high-quality cinematic video backgrounds.

## 🚀 Getting Started

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7+ / MariaDB 10.3+
- Local environment: XAMPP, WAMP, MAMP, or Laragon.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/DexComm69/reserve-hub.git
   cd reserve-hub
   ```

2. **Database Setup**:
   - Create a database named `reservehub`.
   - Run the migration/setup scripts in `api/` or import from `sql/`:
     - `sql/setup_db.sql`
     - `sql/create_tables.sql`
     - `sql/seed_tables.sql` (Optional: for sample data)
   - *Note: Run `api/migrate_add_username.php` and `api/add_avatar_column.php` if updating from a legacy version.*

3. **Configuration**:
   - Create `api/db.php` (use `api/db.example.php` as a template).
   - Configure your MySQL credentials and SMTP settings for PHPMailer.

4. **Environment Variables**:
   - Ensure `api/load_env.php` is configured if using external services like Google OAuth.

5. **Run**:
   - Serve the project folder via Apache/Nginx.
   - Access via `http://localhost/reservehub/`.

## 📂 Project Structure

```text
├── api/             # Backend Logic (PHP)
│   ├── PHPMailer/   # Email service library
│   └── *.php        # API endpoints (Auth, Search, Reservations, Admin)
├── css/             # Modular Styling (CSS3)
├── html/            # Page Templates
├── js/              # Client-side Logic (Auth, Session, UI interactions)
├── pictures/        # Brand assets, logos, and user uploads
├── sql/             # Database Schema and basic seed scripts
├── tools/           # Internal tools and maintenance scripts
│   ├── deployment/  # Deployment configuration for specific targets
│   └── migrations/  # Database migration and cleanup scripts
├── uploads/         # User-uploaded content (Profile pictures)
├── videos/          # High-quality UI background assets
└── index.php        # Entry point (Main redirect)
```

## 🤝 Contributing
ReserveHub is an evolving project. Contributions, feature suggestions, and bug reports are welcome!

1. Fork the repo.
2. Create a feature branch: `git checkout -b feature/NewFeature`.
3. Commit changes: `git commit -m 'Add NewFeature'`.
4. Push to branch: `git push origin feature/NewFeature`.
5. Open a Pull Request.

## 📄 License
This project is licensed under the MIT License.

## 🌐 Deployment
For production deployment guides (e.g., InfinityFree), see [README_DEPLOY.md](README_DEPLOY.md).
