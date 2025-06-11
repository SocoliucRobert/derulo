import os
from functools import wraps
import jwt
from flask import request, jsonify, g, current_app

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'authorization' in request.headers:
            auth_header = request.headers['authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        # Attempt 1: Decode with app's SECRET_KEY (for admin users)
        try:
            secret_key = current_app.config['SECRET_KEY']
            data = jwt.decode(token, secret_key, algorithms=['HS256'])
            g.current_user = {
                'id': data.get('user_id'), # Admin token uses 'user_id'
                'role': data.get('role'),
                'email': data.get('email')
            }
            return f(*args, **kwargs)
        except jwt.PyJWTError:
            # If it fails, it might be a Supabase token. Pass to the next try block.
            pass

        # Attempt 2: Decode with Supabase JWT secret
        try:
            jwt_secret = os.environ.get('SUPABASE_JWT_SECRET')
            if not jwt_secret:
                raise ValueError("SUPABASE_JWT_SECRET is not set in the environment.")
            
            data = jwt.decode(token, jwt_secret, algorithms=['HS256'], audience='authenticated')

            # Robustly extract user details from Supabase token
            user_meta = data.get('user_metadata', {})
            email = data.get('email')
            full_name = user_meta.get('full_name') or user_meta.get('name')

            # Provide a fallback for full_name if it's not in the token
            if not full_name and email:
                full_name = email.split('@')[0].replace('.', ' ').title()

            g.current_user = {
                'id': data.get('sub'),
                'role': user_meta.get('role'), # This is for context; sync_user determines the definitive role
                'email': email,
                'full_name': full_name
            }
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except (jwt.InvalidTokenError, jwt.PyJWTError):
            return jsonify({'message': 'Token is invalid!'}), 401
        except ValueError as e:
            print(f"JWT Validation error: {e}")
            return jsonify({'message': 'Server configuration error.'}), 500

    return decorated


def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if g.current_user.get('role') != 'ADMIN':
            return jsonify({'message': 'Requires admin access!'}), 403
        return f(*args, **kwargs)
    return decorated
