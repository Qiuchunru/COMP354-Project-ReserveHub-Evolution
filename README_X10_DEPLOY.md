# Deploying ReserveHub to x10Hosting

Follow these steps to deploy your ReserveHub restaurant booking application to **x10Hosting**.

---

## 1. Prepare your x10Hosting Account & Domain
1. Log in or sign up at [x10Hosting](https://x10hosting.com).
2. Once your account is active, log into the **x10Hosting DirectAdmin Control Panel** (or cPanel, depending on your account version).
3. Obtain your domain name (e.g., `yourdomain.x10.mx` or custom domain) and your FTP details:
   - **FTP Hostname**: Your domain name (e.g., `yourdomain.x10.mx` or the server IP address).
   - **FTP Username & Password**: By default, this is the exact same username and password you use to log in to the DirectAdmin Control Panel.
   - **Custom Accounts**: You can view or create new FTP credentials in DirectAdmin by searching for **FTP Management**.

---

## 2. Create the MySQL Database
Unlike other hosting providers that use remote database hosts (e.g. InfinityFree), x10Hosting database servers run on `localhost`.

> [!CAUTION]
> **Do NOT try to create a database inside phpMyAdmin** (e.g. by clicking "New" on the left menu). If you do, you will receive a `"No privileges to create databases"` or `Access Denied` error because phpMyAdmin on shared hosts does not have administrative rights. You **must** create the database via the DirectAdmin Control Panel first.

1. Log into your **DirectAdmin Control Panel** (not phpMyAdmin).
2. Find the database creation section:
   - **Method A (Search)**: Use the search bar at the very top of your DirectAdmin page and type in **MySQL** or **Database**. This is the quickest way to find it.
   - **Method B (Menu Navigation)**: Locate the **Account Manager** menu/category and select **MySQL Management** (sometimes labeled **MySQL Databases** or **Databases**).
   - **Method C (Access Level)**: If you still cannot find it, you might be logged in under the wrong Access Level. Look at the top-right corner of DirectAdmin (next to your username) and ensure your access level is set to **User** (switch to **User Level** if it says "Admin" or "Reseller").
3. Click the **Create New Database** button.
4. Choose a database name and database username.
   - Note: x10Hosting automatically prefixes your database names and usernames with your account username (e.g., `username_reservehub`).
5. Generate or enter a secure password, then click **Create**.
6. Keep this database name, username, and password handy.

---

## 3. Import the Database Dump
1. In the DirectAdmin dashboard, open **phpMyAdmin**.
2. From the left sidebar, click on your newly created database (e.g., `username_reservehub`).
3. Click the **Import** tab at the top menu.
4. Click **Choose File** and select `sql/full_dump.sql` from your local project directory.
5. Scroll down and click **Import** (or **Go**). Your tables, relationships, and initial seed data will be imported successfully.

---

## 4. Configure Environment Credentials
There are two ways to connect your application to your new database:

### Option A: Using a `.env` File (Recommended)
1. In your local project root, duplicate `.env.example` and rename it to `.env` (or create a `.env` file directly on x10Hosting).
2. Update the `.env` file with your production database credentials and SMTP details:
   ```env
   # Database Configuration for x10Hosting
   DB_HOST="localhost"
   DB_NAME="username_reservehub"
   DB_USER="username_dbuser"
   DB_PASS="your_database_password"

   # SMTP Mail Server Configuration (for password reset functionality)
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-gmail-app-password"
   ```
3. Upload this `.env` file to the root directory of your website on x10Hosting.
   - **Exact location**: It must be placed in the main `public_html` directory (or `domains/yourdomain.x10.mx/public_html`), sitting in the exact same folder as your `index.php` file and the `api` directory.
   - *Example layout:*
     ```
     public_html/
       ├── .env         <-- PLACE IT HERE
       ├── index.php
       ├── api/
       ├── html/
       └── css/
     ```

### Option B: Editing `api/db.php` directly
If you prefer not to use a `.env` file, open `api/db.php` and edit the fallback values in the `else` block:
```php
} else {
    // x10Hosting uses 'localhost' as MySQL host
    $host = 'localhost'; 
    $db   = 'username_reservehub'; // Replace with your actual database name
    $user = 'username_dbuser';    // Replace with your actual database user
    $pass = 'your_database_password'; // Replace with your actual database password
}
```

---

## 5. Upload Website Files
1. Open your preferred FTP client (such as **WinSCP** or **FileZilla**).
   
   ### How to configure WinSCP for x10Hosting:
   - **File protocol**: Select **FTP**.
   - **Encryption**: Select **No encryption** (or **TLS Explicit encryption** if your account supports SSL/TLS).
     > [!IMPORTANT]
     > *If you get a "Timeout detected (control connection)" error*, change this to **No encryption** (Plain FTP). Free x10Hosting accounts often do not support SSL/TLS over standard FTP, causing connection handshakes to hang and time out.
   - **Host name**: `x11.x10hosting.com` (do **NOT** include `:2222` at the end).
   - **Port number**: `21` (default FTP port).
     > [!WARNING]
     > The port `2222` is specifically for accessing the DirectAdmin Control Panel in your web browser. Do **NOT** use port `2222` in WinSCP, as it will cause a timeout error. Use port `21` for FTP transfers.
   - **User name**: Your main x10Hosting control panel username.
   - **Password**: Your main x10Hosting control panel password.
   - Click **Save** to bookmark the connection, then click **Login**.

   ### WinSCP Troubleshooting for Connection Timeouts:
   - **Disable/Enable Passive Mode**: In the WinSCP Login dialog, click **Advanced...** -> **Connection** (under the Connection category). Toggle the checkbox for **Passive mode**. If it's enabled, try disabling it (or vice versa).
   - **Check Server Hostname**: Ensure you are using `x11.x10hosting.com` (without any port number) as the **Host name** and port `21` as the **Port number**.
   - **Disable Firewall/Antivirus**: Sometimes local firewalls block port 21 or the data port range. Try temporarily disabling your firewall or adding WinSCP to your firewall allow-list.

2. Navigate to your root web directory (usually `public_html` or `domains/yourdomain.x10.mx/public_html`).
3. **Delete the default `index.html` file** (the ~622-byte placeholder file) and the default `logo.png` file that x10Hosting created. If you leave this placeholder `index.html` file, it will take priority over your PHP files, and visitors will see the default x10Hosting page instead of ReserveHub.
4. Upload all files and folders from your local `reservehub` folder into this `public_html` directory.
   - You can safely exclude the `sql` folder to save space, but make sure to upload `.env` (if using Option A), `.htaccess` (if present), `index.php`, and all core folders (`api`, `css`, `html`, `js`, `pictures`, `uploads`, etc.).

---

## 6. Verify and Test
1. Visit your x10Hosting website URL (e.g., `http://yourdomain.x10.mx`) in a web browser.
2. The root `index.php` will automatically redirect you to the reservation homepage at `html/index.html`.
3. Try registering a new user, logging in, or making a reservation to confirm the database connection works.
4. Try requesting a password reset to ensure PHPMailer sends emails properly via your configured SMTP settings.
