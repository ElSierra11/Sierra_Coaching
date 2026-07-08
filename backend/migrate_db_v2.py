import os
import sys
from sqlalchemy import text
from database import engine

def migrate():
    print("Iniciando migración de base de datos Sierra Coaching (V2)...")
    
    # Columns to check and add
    # Format: (table, column, type_and_default)
    migrations = [
        ("exercises", "video_url", "VARCHAR(255) DEFAULT ''"),
        ("lift_logs", "rpe", "INTEGER DEFAULT 0"),
        ("diet_meals", "calories", "INTEGER DEFAULT 0"),
        ("diet_meals", "proteins", "INTEGER DEFAULT 0"),
        ("diet_meals", "carbs", "INTEGER DEFAULT 0"),
        ("diet_meals", "fats", "INTEGER DEFAULT 0"),
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
                    
    print("Migración de base de datos finalizada.")

if __name__ == "__main__":
    migrate()
