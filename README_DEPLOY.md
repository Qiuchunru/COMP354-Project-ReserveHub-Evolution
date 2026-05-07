# Deploying ReserveHub to InfinityFree

Follow these steps to get your website live:

### 1. Prepare your Account
1. Log in to [InfinityFree](https://app.infinityfree.com/accounts).
2. Create a new Hosting Account.
3. Once active, go to **MySQL Databases** and create a new database (e.g., `reservehub`).

### 2. Import the Database
1. In the InfinityFree panel, open **phpMyAdmin** for your new database.
2. Click **Import** at the top.
3. Upload the `reservehub_dump.sql` file provided in your project root.

### 3. Upload Files
1. Use an FTP client (like FileZilla) or the **Online File Manager** in your InfinityFree dashboard.
2. Navigate to the `htdocs` folder.
3. Upload all files and folders from your local `reservehub` folder **except** the `sql` folder and `reservehub_dump.sql`.

### 4. Configure Database Connection
1. Locate `api/db.php` in your online file manager.
2. Replace its content with the code from `api/db_config_infinityfree.php`.
3. Update the placeholders (`sqlXXX`, `if0_XXXXXXXX`, etc.) with the credentials found in your InfinityFree **Account Details** page.

### 5. Access your Site
Your website will be live at the domain provided by InfinityFree (e.g., `yourname.infinityfreeapp.com`).

---
**Note**: If you see a "Directory Listing" page, make sure `index.php` is in the root `htdocs` folder. The `index.php` I created will automatically redirect visitors to `html/index.html`.
