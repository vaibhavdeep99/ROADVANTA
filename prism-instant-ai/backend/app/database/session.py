from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.database.models import Base, Role

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    # Seed default system roles if not present
    db = SessionLocal()
    try:
        existing_roles = {r.name for r in db.query(Role).all()}
        for role_name, desc in [
            ("USER", "Standard registered citizen user with scan, report, and personal download permissions"),
            ("ADMIN", "System administrator with platform moderation, user management, and audit log access"),
            ("AUTHORITY", "Verified municipal or road department official with inspection and repair resolution rights"),
        ]:
            if role_name not in existing_roles:
                db.add(Role(name=role_name, description=desc))
        db.commit()
    except Exception as e:
        db.rollback()
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
