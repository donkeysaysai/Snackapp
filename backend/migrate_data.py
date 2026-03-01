#!/usr/bin/env python3
"""
Data Migration Script: Emergent MongoDB -> MongoDB Atlas
One-time migration of all collections
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment
load_dotenv('/app/backend/.env')

# Source database (Emergent/local)
SOURCE_URI = os.environ.get('MONGO_URL')
SOURCE_DB = os.environ.get('DB_NAME')

# Target database (MongoDB Atlas)
TARGET_URI = "mongodb+srv://donkeysaysaiDB:N33dMoney4@appssandbox09.eeey9i4.mongodb.net/?appName=APPsSandbox09"
TARGET_DB = "pta_snack_app"

# Collections to migrate
COLLECTIONS = ['menu_items', 'orders', 'activity_log', 'app_settings']

def migrate():
    print("=" * 60)
    print("P&TA Snack Bestel App - Data Migration")
    print("=" * 60)
    
    # Connect to source
    print(f"\n📥 Connecting to source database...")
    source_client = MongoClient(SOURCE_URI)
    source_db = source_client[SOURCE_DB]
    print(f"   Connected to: {SOURCE_DB}")
    
    # Connect to target
    print(f"\n📤 Connecting to target database (MongoDB Atlas)...")
    target_client = MongoClient(TARGET_URI)
    target_db = target_client[TARGET_DB]
    print(f"   Connected to: {TARGET_DB}")
    
    # Test connection
    target_client.admin.command('ping')
    print("   ✅ Atlas connection successful!")
    
    # Migrate each collection
    print("\n" + "-" * 60)
    print("Starting migration...")
    print("-" * 60)
    
    total_docs = 0
    
    for collection_name in COLLECTIONS:
        print(f"\n📁 Collection: {collection_name}")
        
        # Get source data
        source_collection = source_db[collection_name]
        docs = list(source_collection.find({}))
        count = len(docs)
        
        if count == 0:
            print(f"   ⚠️  No documents found, skipping...")
            continue
        
        print(f"   Found {count} documents")
        
        # Clear target collection first
        target_collection = target_db[collection_name]
        target_collection.delete_many({})
        print(f"   Cleared target collection")
        
        # Insert into target
        if docs:
            target_collection.insert_many(docs)
            print(f"   ✅ Migrated {count} documents")
            total_docs += count
    
    # Summary
    print("\n" + "=" * 60)
    print("MIGRATION COMPLETE!")
    print("=" * 60)
    print(f"\n📊 Summary:")
    print(f"   Total documents migrated: {total_docs}")
    print(f"   Collections: {', '.join(COLLECTIONS)}")
    print(f"\n🎉 Your MongoDB Atlas database is now ready!")
    
    # Close connections
    source_client.close()
    target_client.close()

if __name__ == "__main__":
    migrate()
