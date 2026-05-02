#!/bin/bash

BASE_URL="http://127.0.0.1:8788/api/email"
TYPE=$1

if [ -z "$TYPE" ]; then
  echo "Usage: sh test-email.sh <type>"
  echo ""
  echo "Available types:"
  echo "  invitation"
  echo "  event-confirmation"
  echo "  event-otp"
  echo "  generic"
  echo "  countdown"
  exit 1
fi

case "$TYPE" in

  invitation)
    echo ">>> Testing: Invitation Email → POST $BASE_URL/invitation"
    curl -s -X POST "$BASE_URL/invitation" \
      -H "Content-Type: application/json" \
      -d '{
        "to": "anandhageethan333@gmail.com",
        "organizationName": "Skill Passport",
        "memberType": "Admin",
        "invitationToken": "abc123",
        "expiresAt": "2026-05-01"
      }' | cat
    echo ""
    ;;

  event-confirmation)
    echo ">>> Testing: Event Confirmation Email → POST $BASE_URL/event-confirmation"
    curl -s -X POST "$BASE_URL/event-confirmation" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Anand",
        "email": "anandhageethan333@gmail.com",
        "phone": "9876543210",
        "amount": 500,
        "orderId": "ORD123"
      }' | cat
    echo ""
    ;;

  generic)
    echo ">>> Testing: Generic Email → POST $BASE_URL/send"
    curl -s -X POST "$BASE_URL/send" \
      -H "Content-Type: application/json" \
      -d '{
        "to": "anandhageethan333@gmail.com",
        "subject": "Test Email",
        "html": "<h1>Hello Anand</h1><p>This is a test email</p>"
      }' | cat
    echo ""
    ;;

  countdown)
    echo ">>> Testing: Countdown Email → POST $BASE_URL/countdown"
    curl -s -X POST "$BASE_URL/countdown" \
      -H "Content-Type: application/json" \
      -d '{
        "to": "anandhageethan333@gmail.com",
        "fullName": "Anand",
        "countdownDay": 3,
        "launchDate": "2026-05-10"
      }' | cat
    echo ""
    ;;

  event-otp)
    echo ">>> Testing: Event OTP Email → POST $BASE_URL/event-otp"
    curl -s -X POST "$BASE_URL/event-otp" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "anandhageethan333@gmail.com",
        "otp": "123456",
        "name": "Anand"
      }' | cat
    echo ""
    ;;

  *)
    echo "Unknown type: $TYPE"
    echo ""
    echo "Usage: sh test-email.sh <type>"
    echo ""
    echo "Available types:"
    echo "  invitation"
    echo "  event-confirmation"
    echo "  event-otp"
    echo "  generic"
    echo "  countdown"
    exit 1
    ;;

esac
