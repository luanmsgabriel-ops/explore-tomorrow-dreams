import requests
import os
import json

SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

url = f"{SUPABASE_URL}/functions/v1/whatsapp-webhook"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
}

payload = {
    "object": "whatsapp_business_account",
    "entry": [
        {
            "id": "123456789",
            "changes": [
                {
                    "value": {
                        "messaging_product": "whatsapp",
                        "metadata": {"display_phone_number": "5515991833448", "phone_number_id": "12345"},
                        "contacts": [{"profile": {"name": "Luan Teste"}, "wa_id": "5515991825285"}],
                        "messages": [
                            {
                                "from": "5515991825285",
                                "id": "TEST_SUCCESS_" + str(os.getpid()),
                                "timestamp": "1724080000",
                                "text": {"body": "Pode cotar agora!"},
                                "type": "text"
                            }
                        ]
                    },
                    "field": "messages"
                }
            ]
        }
    ]
}

print(f"Executing search trigger test...")
response = requests.post(url, headers=headers, json=payload)
print(f"Status: {response.status_code}")
