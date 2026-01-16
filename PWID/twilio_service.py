import os
import requests

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

def send_whatsapp_alert(to_number, message):
    if not all([TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER]):
        print("Twilio credentials missing. Skipping alert.")
        return {"error": "Missing credentials"}

    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    
    # Ensure numbers are formatted for WhatsApp
    from_number = f"whatsapp:{TWILIO_PHONE_NUMBER}"
    if not to_number.startswith("whatsapp:"):
        to_number = f"whatsapp:{to_number}"

    data = {
        "From": from_number,
        "To": to_number,
        "Body": message
    }

    try:
        response = requests.post(url, data=data, auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN))
        return response.json()
    except Exception as e:
        print(f"Failed to send Twilio message: {e}")
        return {"error": str(e)}
