# 🍽️ ReserveHub - Restaurant Reservation System

ReserveHub is a modern, responsive restaurant reservation platform designed to streamline the booking process for both customers and restaurant owners.

## ✨ Features
- **Modern UI/UX**: Clean, intuitive interface with dark and light mode support.
- **Dynamic Search**: Filter restaurants by name, cuisine, or location.
- **Secure Authentication**: User registration and login system.
- **Profile Management**: View and manage reservations and saved restaurants.
- **Admin Dashboard**: Comprehensive management tool for restaurant owners.
- **Responsive Design**: Optimized for desktop and mobile devices.

## 🛠️ Technology Stack
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Backend**: PHP (7.4+)
- **Database**: MySQL
- **Icons**: FontAwesome 6

## 🚀 Getting Started

### Prerequisites
- PHP 7.4 or higher
- MySQL / MariaDB
- A local server environment like XAMPP, WAMP, or MAMP.

### Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/reserve-hub.git
   cd reserve-hub
   ```

2. **Database Setup**:
   - Open your MySQL administration tool (e.g., phpMyAdmin).
   - Create a new database named `reservehub`.
   - Import the SQL files from the `sql/` directory:
     - First, run `sql/setup_db.sql`.
     - Then, run `sql/create_tables.sql`.
     - Finally, run `sql/seed_tables.sql` or `sql/malaysia_restaurants.sql` for sample data.

3. **Configuration**:
   - Navigate to the `api/` directory.
   - Copy `db.example.php` to `db.php`.
   - Update `db.php` with your local database credentials.

4. **Run Locally**:
   - Move the project folder to your server's root (e.g., `C:/xampp/htdocs/`).
   - Access the site via `http://localhost/reservehub/`.

## 📂 Project Structure
```text
├── api/             # PHP backend scripts (Database connections, CRUD)
├── css/             # Stylesheets (Modular CSS for different pages)
├── html/            # Frontend HTML pages
├── js/              # Client-side JavaScript logic
├── pictures/        # Image assets (logos, icons, favicons)
├── sql/             # Database schema and seed scripts
├── videos/          # Video assets for the landing page
├── index.php        # Root entry point (Redirects to html/index.html)
└── .gitignore       # Git exclusion rules
```

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git checkout -b feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 Deployment
For instructions on how to deploy this project to InfinityFree, please refer to [README_DEPLOY.md](README_DEPLOY.md).
