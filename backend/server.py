from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    price: float

class OrderItemCreate(BaseModel):
    menu_item_id: str
    name: str
    quantity: int
    price: float

class OrderItem(BaseModel):
    menu_item_id: str
    name: str
    quantity: int
    price: float

class OrderCreate(BaseModel):
    customer_name: str
    items: List[OrderItemCreate]

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_name: str
    items: List[OrderItem]
    total_price: float
    is_paid: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderUpdate(BaseModel):
    items: Optional[List[OrderItemCreate]] = None
    is_paid: Optional[bool] = None

class ActivityLogEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    action: str
    details: str
    order_id: Optional[str] = None
    device_info: Optional[str] = None

class ActivityLogCreate(BaseModel):
    action: str
    details: str
    order_id: Optional[str] = None
    device_info: Optional[str] = None

class AppSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "app_settings"
    payment_link: str = ""
    is_edit_mode: bool = False

class AppSettingsUpdate(BaseModel):
    payment_link: Optional[str] = None
    is_edit_mode: Optional[bool] = None

class AdminVerify(BaseModel):
    pin: str

# ===================== MENU DATA =====================

MENU_DATA = [
    # SNACKS
    {"name": "Frikandel", "category": "SNACKS", "price": 2.25},
    {"name": "Frikandel Speciaal", "category": "SNACKS", "price": 2.75},
    {"name": "Kroket", "category": "SNACKS", "price": 2.50},
    {"name": "Rundvlees Kroket", "category": "SNACKS", "price": 3.30},
    {"name": "Goulash Kroket", "category": "SNACKS", "price": 3.65},
    {"name": "Berehap", "category": "SNACKS", "price": 3.50},
    {"name": "Bitterballen (6)", "category": "SNACKS", "price": 3.95},
    {"name": "Bamischijf", "category": "SNACKS", "price": 2.60},
    {"name": "Nasischijf", "category": "SNACKS", "price": 2.60},
    {"name": "Boerenbrok", "category": "SNACKS", "price": 2.75},
    {"name": "Pikanto", "category": "SNACKS", "price": 2.95},
    {"name": "Braadworst", "category": "SNACKS", "price": 3.60},
    {"name": "Gehaktbal", "category": "SNACKS", "price": 5.25},
    {"name": "Loempia", "category": "SNACKS", "price": 4.50},
    {"name": "Shoarmarol", "category": "SNACKS", "price": 3.75},
    
    # PATAT
    {"name": "Patat", "category": "PATAT", "price": 2.60},
    {"name": "Grote Patat", "category": "PATAT", "price": 3.35},
    {"name": "Raspatat", "category": "PATAT", "price": 2.60},
    {"name": "Grote Raspatat", "category": "PATAT", "price": 3.35},
    {"name": "Verse Friet met Schil", "category": "PATAT", "price": 3.00},
    
    # PATAT SPECIALS
    {"name": "Waterfiets", "category": "PATAT SPECIALS", "price": 8.00},
    {"name": "Catamaran", "category": "PATAT SPECIALS", "price": 8.50},
    {"name": "Patat Bali", "category": "PATAT SPECIALS", "price": 7.75},
    {"name": "Patat Pulled Pork", "category": "PATAT SPECIALS", "price": 10.00},
    {"name": "Kapsalon", "category": "PATAT SPECIALS", "price": 11.00},
    {"name": "Kipsalon", "category": "PATAT SPECIALS", "price": 11.00},
    
    # BURGERS
    {"name": "Elite Burger", "category": "BURGERS", "price": 6.00},
    {"name": "Elite Burger Speciaal", "category": "BURGERS", "price": 6.50},
    {"name": "Rex Burger", "category": "BURGERS", "price": 7.00},
    {"name": "Macho Burger", "category": "BURGERS", "price": 8.75},
    {"name": "Speciaal Burger", "category": "BURGERS", "price": 6.75},
    {"name": "Fish Burger", "category": "BURGERS", "price": 7.50},
    {"name": "Kibbeling Burger", "category": "BURGERS", "price": 8.00},
    {"name": "Chickenburger", "category": "BURGERS", "price": 7.00},
    {"name": "Vegan Burger", "category": "BURGERS", "price": 7.00},
    {"name": "Runder Burger", "category": "BURGERS", "price": 12.50},
    
    # VIS SNACKS
    {"name": "Kleine Kibbeling + Saus", "category": "VIS SNACKS", "price": 6.50},
    {"name": "Middel Kibbeling + Saus", "category": "VIS SNACKS", "price": 8.50},
    {"name": "Grote Kibbeling + Saus", "category": "VIS SNACKS", "price": 10.50},
    {"name": "Lekkerbek", "category": "VIS SNACKS", "price": 6.00},
    {"name": "Lekkerbek + Saus", "category": "VIS SNACKS", "price": 6.85},
    {"name": "Mosselen + Saus", "category": "VIS SNACKS", "price": 6.75},
    {"name": "Visfriet + Saus", "category": "VIS SNACKS", "price": 5.50},
    {"name": "Vismix + 2 Sauzen", "category": "VIS SNACKS", "price": 9.50},
    {"name": "Torpedo Garnalen (5) + Chilisaus", "category": "VIS SNACKS", "price": 7.00},
    
    # KIP SNACKS
    {"name": "Frikandel XXL", "category": "KIP SNACKS", "price": 3.85},
    {"name": "Frikandel XXL Speciaal", "category": "KIP SNACKS", "price": 4.85},
    {"name": "Kipnuggets (6)", "category": "KIP SNACKS", "price": 3.25},
    {"name": "Kipcorn", "category": "KIP SNACKS", "price": 2.85},
    {"name": "Chickenstrips (5)", "category": "KIP SNACKS", "price": 6.25},
    
    # VEGA/VEGAN SNACKS
    {"name": "Groentekroket", "category": "VEGA/VEGAN SNACKS", "price": 2.25},
    {"name": "Vega Frikandel", "category": "VEGA/VEGAN SNACKS", "price": 2.25},
    {"name": "Kaassouffle", "category": "VEGA/VEGAN SNACKS", "price": 2.25},
    {"name": "Vega Kroket", "category": "VEGA/VEGAN SNACKS", "price": 2.50},
    
    # HUISGEMAAKTE SNACKS
    {"name": "Eierbal", "category": "HUISGEMAAKTE SNACKS", "price": 3.15},
    {"name": "Varkenshaas Sate", "category": "HUISGEMAAKTE SNACKS", "price": 7.50},
    {"name": "Shoarma + Pita + Knoflooksaus", "category": "HUISGEMAAKTE SNACKS", "price": 7.50},
    
    # STOKBROOD
    {"name": "Stokbrood Gezond", "category": "STOKBROOD", "price": 7.25},
    {"name": "Stokbrood Gerookte Zalm", "category": "STOKBROOD", "price": 9.25},
    {"name": "Stokbrood Gerookte Zalmsnippers", "category": "STOKBROOD", "price": 8.25},
    {"name": "Stokbrood Tonijnsalade", "category": "STOKBROOD", "price": 8.00},
    {"name": "Stokbrood Krokante Kip", "category": "STOKBROOD", "price": 7.25},
    {"name": "Stokbrood Surinaamse Kip", "category": "STOKBROOD", "price": 9.50},
    {"name": "Stokbrood Pulled Pork", "category": "STOKBROOD", "price": 9.50},
    {"name": "Stokbrood Warme Beenham", "category": "STOKBROOD", "price": 8.25},
    {"name": "Stokbrood Carpaccio", "category": "STOKBROOD", "price": 12.50},
    
    # LUNCH TOT 16.00 UUR
    {"name": "2 Kroketten met Brood", "category": "LUNCH", "price": 10.50},
    {"name": "Uitsmijter Ham & Kaas", "category": "LUNCH", "price": 9.50},
    {"name": "Bol de Luxe", "category": "LUNCH", "price": 9.75},
    
    # VOORGERECHT
    {"name": "Vissoep", "category": "VOORGERECHT", "price": 6.50},
    {"name": "Tomatensoep", "category": "VOORGERECHT", "price": 6.50},
    {"name": "Gebakken Gamba's", "category": "VOORGERECHT", "price": 8.50},
    {"name": "Nacho's", "category": "VOORGERECHT", "price": 8.50},
    {"name": "Carpaccio", "category": "VOORGERECHT", "price": 12.50},
    
    # VIS PLATE
    {"name": "Vis Plate Kibbeling", "category": "VIS PLATE", "price": 15.50},
    {"name": "Vis Plate Lekkerbek", "category": "VIS PLATE", "price": 15.50},
    {"name": "Vis Plate Vismix", "category": "VIS PLATE", "price": 17.50},
    {"name": "Vis Maaltijdsalade Zalm", "category": "VIS PLATE", "price": 15.50},
    
    # VLEES PLATE
    {"name": "Vlees Plate Rex Schnitzel", "category": "VLEES PLATE", "price": 16.50},
    {"name": "Vlees Plate Varkenshaas Sate", "category": "VLEES PLATE", "price": 16.50},
    {"name": "Vlees Plate Runderburger", "category": "VLEES PLATE", "price": 18.50},
    
    # VEGETARISCH PLATE
    {"name": "Vega Plate Vega Sate", "category": "VEGETARISCH PLATE", "price": 17.50},
    
    # DESSERTS
    {"name": "Vanille IJs", "category": "DESSERTS", "price": 5.25},
    {"name": "Vanille IJs + Fruit", "category": "DESSERTS", "price": 7.25},
    {"name": "Wentelteefje", "category": "DESSERTS", "price": 8.25},
    {"name": "Kinder IJsje", "category": "DESSERTS", "price": 4.50},
    {"name": "Schatkist", "category": "DESSERTS", "price": 3.50},
    
    # KOFFIE NA
    {"name": "Irish Coffee", "category": "KOFFIE NA", "price": 7.00},
    {"name": "Groninger Koffie", "category": "KOFFIE NA", "price": 7.00},
    
    # KIDS BOX
    {"name": "Kidsbox", "category": "KIDS BOX", "price": 7.25},
    
    # EXTRA
    {"name": "Rauwkost", "category": "EXTRA", "price": 3.25},
    {"name": "Huzarensalade", "category": "EXTRA", "price": 3.75},
    {"name": "Appelmoes", "category": "EXTRA", "price": 0.90},
    
    # SAUS (Normaal)
    {"name": "Frietsaus (Normaal)", "category": "SAUS", "price": 0.50},
    {"name": "Brander Mayo (Normaal)", "category": "SAUS", "price": 0.75},
    {"name": "Curry/Ketchup (Normaal)", "category": "SAUS", "price": 0.70},
    {"name": "Mosterd (Normaal)", "category": "SAUS", "price": 0.40},
    {"name": "Joppie/Jamballa (Normaal)", "category": "SAUS", "price": 0.75},
    {"name": "Sate-/Oorlogsaus (Normaal)", "category": "SAUS", "price": 0.75},
    {"name": "Speciaalsaus (Normaal)", "category": "SAUS", "price": 0.75},
    {"name": "Knoflooksaus (Normaal)", "category": "SAUS", "price": 0.75},
    {"name": "Remoulade-/Ravigotte (Normaal)", "category": "SAUS", "price": 0.85},
    
    # SAUS (Bakje)
    {"name": "Frietsaus (Bakje)", "category": "SAUS", "price": 1.00},
    {"name": "Brander Mayo (Bakje)", "category": "SAUS", "price": 1.50},
    {"name": "Curry/Ketchup (Bakje)", "category": "SAUS", "price": 1.40},
    {"name": "Mosterd (Bakje)", "category": "SAUS", "price": 0.80},
    {"name": "Joppie/Jamballa (Bakje)", "category": "SAUS", "price": 1.50},
    {"name": "Sate-/Oorlogsaus (Bakje)", "category": "SAUS", "price": 1.50},
    {"name": "Speciaalsaus (Bakje)", "category": "SAUS", "price": 1.50},
    {"name": "Knoflooksaus (Bakje)", "category": "SAUS", "price": 1.50},
    {"name": "Remoulade-/Ravigotte (Bakje)", "category": "SAUS", "price": 1.50},
    
    # SAUS (Bij groot)
    {"name": "Frietsaus (Bij groot)", "category": "SAUS", "price": 0.75},
    {"name": "Brander Mayo (Bij groot)", "category": "SAUS", "price": 1.00},
    {"name": "Curry/Ketchup (Bij groot)", "category": "SAUS", "price": 1.00},
    {"name": "Mosterd (Bij groot)", "category": "SAUS", "price": 0.60},
    {"name": "Joppie/Jamballa (Bij groot)", "category": "SAUS", "price": 1.00},
    {"name": "Sate-/Oorlogsaus (Bij groot)", "category": "SAUS", "price": 1.00},
    {"name": "Speciaalsaus (Bij groot)", "category": "SAUS", "price": 1.00},
    {"name": "Knoflooksaus (Bij groot)", "category": "SAUS", "price": 1.00},
    {"name": "Remoulade-/Ravigotte (Bij groot)", "category": "SAUS", "price": 1.10},
    
    # DRANKEN
    {"name": "Monster Energy", "category": "DRANKEN", "price": 3.50},
    {"name": "Monster Ultra White", "category": "DRANKEN", "price": 3.50},
    {"name": "Monster Loco Mango", "category": "DRANKEN", "price": 3.50},
    {"name": "Monster Energy Ultra Strawberry Dreams", "category": "DRANKEN", "price": 3.50},
]

# ===================== ROUTES =====================

@api_router.get("/")
async def root():
    return {"message": "P&TA Snack Bestel App API"}

# Menu endpoints
@api_router.get("/menu", response_model=List[MenuItem])
async def get_menu():
    menu_items = await db.menu_items.find({}, {"_id": 0}).to_list(1000)
    if not menu_items:
        # Seed menu if empty
        for item in MENU_DATA:
            menu_item = MenuItem(**item)
            await db.menu_items.insert_one(menu_item.model_dump())
        menu_items = await db.menu_items.find({}, {"_id": 0}).to_list(1000)
    return menu_items

@api_router.post("/menu/seed")
async def seed_menu():
    await db.menu_items.delete_many({})
    for item in MENU_DATA:
        menu_item = MenuItem(**item)
        await db.menu_items.insert_one(menu_item.model_dump())
    return {"message": f"Seeded {len(MENU_DATA)} menu items"}

# Order endpoints
@api_router.get("/orders", response_model=List[Order])
async def get_orders():
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    return orders

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    items = [OrderItem(**item.model_dump()) for item in order_data.items]
    total_price = sum(item.quantity * item.price for item in items)
    
    order = Order(
        customer_name=order_data.customer_name,
        items=items,
        total_price=total_price
    )
    
    await db.orders.insert_one(order.model_dump())
    return order

@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_update: OrderUpdate):
    existing = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {}
    if order_update.items is not None:
        items = [OrderItem(**item.model_dump()) for item in order_update.items]
        total_price = sum(item.quantity * item.price for item in items)
        update_data["items"] = [item.model_dump() for item in items]
        update_data["total_price"] = total_price
    
    if order_update.is_paid is not None:
        update_data["is_paid"] = order_update.is_paid
    
    if update_data:
        await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return Order(**updated)

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str):
    result = await db.orders.delete_one({"id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order deleted"}

# Activity Log endpoints
@api_router.get("/activity-log", response_model=List[ActivityLogEntry])
async def get_activity_log():
    logs = await db.activity_log.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    return logs

@api_router.post("/activity-log", response_model=ActivityLogEntry)
async def create_activity_log(log_data: ActivityLogCreate):
    entry = ActivityLogEntry(**log_data.model_dump())
    await db.activity_log.insert_one(entry.model_dump())
    return entry

# App Settings endpoints
@api_router.get("/settings", response_model=AppSettings)
async def get_settings():
    settings = await db.app_settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not settings:
        default_settings = AppSettings()
        await db.app_settings.insert_one(default_settings.model_dump())
        return default_settings
    return AppSettings(**settings)

@api_router.put("/settings", response_model=AppSettings)
async def update_settings(settings_update: AppSettingsUpdate):
    existing = await db.app_settings.find_one({"id": "app_settings"}, {"_id": 0})
    if not existing:
        default_settings = AppSettings()
        await db.app_settings.insert_one(default_settings.model_dump())
        existing = default_settings.model_dump()
    
    update_data = {}
    if settings_update.payment_link is not None:
        update_data["payment_link"] = settings_update.payment_link
    if settings_update.is_edit_mode is not None:
        update_data["is_edit_mode"] = settings_update.is_edit_mode
    
    if update_data:
        await db.app_settings.update_one({"id": "app_settings"}, {"$set": update_data})
    
    updated = await db.app_settings.find_one({"id": "app_settings"}, {"_id": 0})
    return AppSettings(**updated)

# Admin verification
@api_router.post("/admin/verify")
async def verify_admin(data: AdminVerify):
    if data.pin == "1990":
        return {"success": True}
    return {"success": False}

# Reset app
@api_router.post("/reset")
async def reset_app():
    await db.orders.delete_many({})
    return {"message": "All orders have been reset"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
