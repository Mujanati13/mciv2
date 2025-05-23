# Backend Implementation for Unified Login

This document describes how to implement the backend API endpoint for the unified login system that supports both consultant and commercial roles.

## API Endpoint Overview

The unified login system uses a single endpoint to authenticate both consultant and commercial users:

```
POST /api/unified_login/
```

## Request Format

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

## Response Format

The response should include the authenticated user's details, role, token, and ESN ID:

```json
{
  "success": true,
  "token": "jwt_token_here...",
  "data": {
    "ID_collab": 2,
    "ID_ESN": 2,
    "Prenom": "User",
    "Nom": "Name",
    "email": "user@example.com",
    "password": "hashed_password_here", 
    "token": "jwt_token_here...",
    "Poste": "consultant", // or "commercial"
    "Date_inscription": "2024-12-10",
    "experience": null,
    "Commercial": true // Only for commercial users
  },
  "role": "consultant", // or "commercial" 
  "esn_id": 2
}
```

## Implementation Steps

1. Create a new endpoint in your backend that accepts email and password
2. Look up the user in your database (check both consultant and commercial tables)
3. Validate the credentials
4. Determine the user's role (consultant or commercial)
5. Generate a JWT token that includes:
   - User ID
   - Email
   - Role
   - ESN ID
   - Expiration time
6. Return the response with user details and token

## Python Example (using Flask and JWT)

```python
from flask import Flask, request, jsonify
import jwt
import datetime
from werkzeug.security import check_password_hash
from your_database_module import get_db_connection

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'

@app.route('/api/unified_login/', methods=['POST'])
def unified_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password are required'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Check consultant table first
    cursor.execute("SELECT * FROM consultants WHERE email = %s", (email,))
    user = cursor.fetchone()
    role = "consultant"
    
    # If not found, check commercial table
    if not user:
        cursor.execute("SELECT * FROM commercials WHERE email = %s", (email,))
        user = cursor.fetchone()
        role = "commercial"
    
    # Close connection
    cursor.close()
    conn.close()
    
    if not user or not check_password_hash(user['password'], password):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    # Generate token
    token = jwt.encode({
        'id': user['ID_collab'],
        'email': user['email'],
        'role': role,
        'esn_id': user['ID_ESN'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }, app.config['SECRET_KEY'])
    
    # Create response
    user['token'] = token
    
    return jsonify({
        'success': True,
        'token': token,
        'data': user,
        'role': role,
        'esn_id': user['ID_ESN']
    }), 200

if __name__ == '__main__':
    app.run(debug=True)
```

## Security Considerations

1. Always use HTTPS for the API endpoint
2. Never return plain-text passwords in the response
3. Set appropriate token expiration time
4. Add rate limiting to prevent brute-force attacks
5. Log authentication attempts for security monitoring
6. Consider adding multi-factor authentication for sensitive accounts

## Frontend Integration

The frontend will store the authentication token and user details in localStorage. When making API requests to protected resources, include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## Existing Login Endpoints

For backward compatibility, maintain the existing login endpoints while transitioning users to the new unified system:

- `/api/login_consultant/`
- `/api/login_commercial/` (if exists)
