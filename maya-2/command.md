# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Configure MySQL and create .env file
cd ../backend
# Create .env with your MySQL credentials

# 3. Create tables and admin
node createTables.js
node resetAdmin.js

# 4. Start servers
npm start  # Backend on port 5000
# New terminal: cd frontend && npm run dev  # Frontend on port 5173