import os
import sys
from sqlalchemy import text
from database import engine

def migrate():
    print("Iniciando migración de base de datos Sierra Coaching (V2)...")
    
    # Columns to check and add
    # Format: (table, column, type_and_default)
    migrations = [
        ("users", "is_approved", "BOOLEAN DEFAULT TRUE"),
        ("exercises", "video_url", "VARCHAR(255) DEFAULT ''"),
        ("lift_logs", "rpe", "INTEGER DEFAULT 0"),
        ("diet_meals", "calories", "INTEGER DEFAULT 0"),
        ("diet_meals", "proteins", "INTEGER DEFAULT 0"),
        ("diet_meals", "carbs", "INTEGER DEFAULT 0"),
        ("diet_meals", "fats", "INTEGER DEFAULT 0"),
        ("client_profiles", "tdee", "FLOAT DEFAULT NULL"),
        ("client_profiles", "target_calories", "INTEGER DEFAULT NULL"),
        ("client_profiles", "target_proteins", "INTEGER DEFAULT NULL"),
        ("client_profiles", "target_carbs", "INTEGER DEFAULT NULL"),
        ("client_profiles", "target_fats", "INTEGER DEFAULT NULL"),
        ("client_profiles", "gender", "VARCHAR(50) DEFAULT NULL"),
        ("client_profiles", "activity_level", "VARCHAR(100) DEFAULT NULL"),
        ("client_profiles", "age", "INTEGER DEFAULT NULL"),
    ]
    
    # Connect and perform alterations
    with engine.connect() as connection:
        for table, column, col_type in migrations:
            try:
                # Check if column exists
                connection.execute(text(f"SELECT {column} FROM {table} LIMIT 1"))
                print(f"La columna '{column}' ya existe en la tabla '{table}'.")
            except Exception:
                # Column doesn't exist, we must add it.
                # Rollback current transaction error block
                connection.rollback()
                try:
                    alter_query = f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"
                    connection.execute(text(alter_query))
                    connection.commit()
                    print(f"La columna '{column}' fue añadida con éxito a la tabla '{table}'.")
                except Exception as e:
                    connection.rollback()
                    print(f"Error al añadir la columna '{column}' a '{table}': {e}")
        
        try:
            connection.execute(text("UPDATE users SET is_approved = TRUE WHERE is_approved IS NULL"))
            connection.commit()
        except Exception:
            pass

        # Create password_reset_tokens table if not exists
        try:
            connection.execute(text("""
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    token VARCHAR(255) UNIQUE NOT NULL,
                    expires_at VARCHAR(50) NOT NULL,
                    used BOOLEAN DEFAULT FALSE
                )
            """))
            connection.commit()
            print("Tabla 'password_reset_tokens' verificada/creada con éxito.")
        except Exception as e:
            connection.rollback()
            print(f"Info tabla password_reset_tokens: {e}")

    print("Migración de base de datos finalizada.")

if __name__ == "__main__":
    migrate()
