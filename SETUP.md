# FAMIS Quick Setup Guide

This guide provides step-by-step instructions to get FAMIS running on your local machine.

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites Check

Ensure you have the following installed:
- ✅ Node.js 18+ (`node --version`)
- ✅ Python 3.8+ (`python --version`)
- ✅ Git (`git --version`)
- ✅ Docker (optional, for database)

### 2. Database Setup

**Option A: Using Docker (Recommended)**
```bash
# Start MySQL database
docker-compose up -d mysql

# Verify it's running
docker-compose ps
```

**Option B: Manual MySQL Setup**
```bash
# Create database 'famisdb' in your MySQL server
# Then run: mysql -u root -p famisdb < backend/updateddb.sql
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database and create admin user
python db.py setup
python db.py create-admin
python db.py create-all

# Start backend server
uvicorn
```

### 4. Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Access the Application

- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs
- 🗄️ **phpMyAdmin**: http://localhost:8080 (if using Docker)

### 6. Login

- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@famis.com`

⚠️ **Remember**: Change the default password after first login!

## 🔧 Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check if MySQL is running
docker-compose ps

# Restart MySQL
docker-compose restart mysql
```

**2. Port Already in Use**
```bash
# Check what's using the port
netstat -ano | findstr :8000  # Windows
lsof -i :8000                 # macOS/Linux

# Kill the process or use different port
uvicorn fastapi_app.main:app --reload --port 8000
```

**3. Python Dependencies Error**
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Reinstall requirements
pip install -r requirements.txt --force-reinstall
```

**4. Node.js Dependencies Error**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables

Create `.env` files if needed:

**Backend (.env)**
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=famisdb
SECRET_KEY=your-secret-key-here
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📊 System Verification

After setup, verify everything is working:

1. **Database**: Check tables exist
   ```bash
   python db.py check
   ```

2. **Backend**: Test API endpoints
   ```bash
   curl http://localhost:8000/docs
   ```

3. **Frontend**: Check login page loads
   - Visit http://localhost:3000
   - Should see login form

4. **Authentication**: Test login
   - Use admin credentials
   - Should redirect to dashboard

## 🎯 Next Steps

1. **Explore Features**:
   - Asset Management
   - Maintenance Scheduling
   - Transfer Requests
   - Reports & Analytics

2. **Customize**:
   - Add your organization's data
   - Configure departments
   - Set up user roles

3. **Production Setup**:
   - Change default passwords
   - Configure SSL certificates
   - Set up backups
   - Deploy to production server

## 📞 Need Help?

- 📖 **Full Documentation**: See README.md
- 🐛 **Issues**: Check the troubleshooting section above
- 💬 **Support**: Contact the development team

---

**Happy Asset Managing!** 🏛️✨
