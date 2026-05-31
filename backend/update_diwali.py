import os
import sys
from dotenv import load_dotenv

load_dotenv('c:/Users/DEBASMITA/Eventify/backend/.env')
sys.path.append('c:/Users/DEBASMITA/Eventify/backend')
from database import get_db

db = get_db()
db.events.update_one({'id': 19}, {'$set': {'image_url': '/diwali.png'}})
print('Done updating Diwali event')
