# Security Hardening Verification Script

# 1. Login as ADMIN and get a record ID
echo "Logging in as ADMIN..."
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@zorvyn.com"}' | jq -r .token)
RECORD_ID=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" http://localhost:5000/api/records?limit=1 | jq -r '.records[0].id')
echo "ADMIN Record ID: $RECORD_ID"

# 2. Login as VIEWER
echo "Logging in as VIEWER..."
VIEWER_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"email":"viewer@zorvyn.com"}' | jq -r .token)

# 3. Attempt IDOR DELETE: VIEWER tries to delete ADMIN record
echo "Attempting IDOR DELETE (VIEWER -> ADMIN Record)..."
DELETE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE http://localhost:5000/api/records/$RECORD_ID -H "Authorization: Bearer $VIEWER_TOKEN")

if [ "$DELETE_STATUS" == "404" ]; then
    echo "🛡️  IDOR Mitigation Verified: Server returned 404 (Not Found) when unauthorized user tried to delete."
else
    echo "❌ IDOR Mitigation FAILED: Server returned $DELETE_STATUS"
fi

# 4. Attempt Mass Assignment UPDATE: VIEWER tries to change record category (benign) vs attempt to change userId (malicious)
echo "Attempting Mass Assignment (Infecting userId into request)..."
# Even if they try to update their OWN record but inject "userId": "admin-id"
MY_RECORD_ID=$(curl -s -H "Authorization: Bearer $VIEWER_TOKEN" http://localhost:5000/api/records?limit=1 | jq -r '.records[0].id' 2>/dev/null)
if [ "$MY_RECORD_ID" == "null" ] || [ -z "$MY_RECORD_ID" ]; then
    echo "Creating a record for viewer first..."
    MY_RECORD_ID=$(curl -s -X POST http://localhost:5000/api/records -H "Content-Type: application/json" -H "Authorization: Bearer $VIEWER_TOKEN" -d '{"amount":5,"type":"EXPENSE","category":"Test","date":"2026-04-04"}' | jq -r .data.id)
fi

UPDATE_RES=$(curl -s -X PATCH http://localhost:5000/api/records/$MY_RECORD_ID -H "Content-Type: application/json" -H "Authorization: Bearer $VIEWER_TOKEN" -d '{"userId":"5dc7ac90-c08b-4be4-a9aa-32d83cfbec28"}')
echo "Update response: $UPDATE_RES"

if [[ "$UPDATE_RES" == *"5dc7ac90-c08b-4be4-a9aa-32d83cfbec28"* ]]; then
    echo "❌ Mass Assignment FAILED: userId was updated!"
else
    echo "🛡️  Mass Assignment Mitigation Verified: userId remains unchanged."
fi
