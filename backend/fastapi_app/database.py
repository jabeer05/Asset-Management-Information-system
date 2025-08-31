import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use SQLite for development, MySQL for production
USE_SQLITE = os.getenv('USE_SQLITE', 'false').lower() == 'true'

if USE_SQLITE:
    DATABASE_URL = "sqlite:///./famisdb.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASS = os.getenv('DB_PASS', '')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_NAME = os.getenv('DB_NAME', 'famisdb')
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}"
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) 