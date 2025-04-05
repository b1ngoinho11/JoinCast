I'll show you how to test the `/api/v1/auth/me` endpoint. Since this is a protected endpoint, you'll need to follow these steps:

1. First, register a user (if you haven't already):
```http
POST /api/v1/auth/register
Content-Type: application/json

{
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpassword123"
}
```

2. Then, login to get the access token:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
    "email": "test@example.com",
    "password": "testpassword123"
}
```
This will return something like:
```json
{
    "access_token": "eyJ0eXAiOiJKV...",
    "refresh_token": "eyJ0eXAiOiJKV...",
    "token_type": "bearer"
}
```

3. Finally, test the `/me` endpoint using the access token:
```http
GET /api/v1/auth/me
Authorization: Bearer eyJ0eXAiOiJKV...
```

You can test this using:

1. **cURL:**
```bash
# First login to get the token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword123"}'

# Then use the token to get user info
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

2. **Postman:**
- Create a new GET request to `http://localhost:8000/api/v1/auth/me`
- In the "Headers" tab, add:
  - Key: `Authorization`
  - Value: `Bearer YOUR_ACCESS_TOKEN_HERE`

3. **Python requests:**
```python
import requests

# First login
login_response = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={
        'email': 'test@example.com',
        'password': 'testpassword123'
    }
)
token = login_response.json()['access_token']

# Then get user info
me_response = requests.get(
    'http://localhost:8000/api/v1/auth/me',
    headers={'Authorization': f'Bearer {token}'}
)
print(me_response.json())
```

If successful, you should receive your user information:
```json
{
    "id": "...",
    "email": "test@example.com",
    "username": "testuser",
    "created_at": "2024-02-26T...",
    "updated_at": null
}
```

Remember:
- The access token expires in 60 minutes
- If you get a 401 Unauthorized error, your token might have expired. In that case, either:
  - Login again to get a new token, or
  - Use the refresh token endpoint to get a new access token
