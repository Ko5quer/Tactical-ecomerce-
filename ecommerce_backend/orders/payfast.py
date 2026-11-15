import hashlib
import urllib.parse
from dotenv import load_dotenv
import os 

load_dotenv()

pfData = {
    "merchant_id": os.getenv("MERCHANT_ID"),
    "return_url": os.getenv("RETURN_URL"),
    "notify_url": os.getenv("NOTIFY_URL"),
    "m_payment_id": f"{order.reference}",
    "amount": f"{order.total:.2f}",
    "item_name": f"TC Order #{order.reference}"
}
