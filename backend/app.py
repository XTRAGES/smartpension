import os
import json
import uuid
import datetime
import sys
import base64
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from flask_sqlalchemy import SQLAlchemy
import numpy as np
import re
import sqlite3

# Load environment variables from .env file
load_dotenv()

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key')

# Configure CORS
CORS(app, supports_credentials=True, origins=['http://localhost:3000'])

# Use absolute path for database file
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pension.db')
print(f"Using database at: {db_path}")

# Debug: Check the database schema
try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(user)")
    columns = cursor.fetchall()
    print("User table schema:")
    for column in columns:
        print(f"  {column}")
    conn.close()
except Exception as e:
    print(f"Failed to check schema: {e}")

# Configure database - use absolute path
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(app)

# Configure file uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# User model
class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password_hash = db.Column(db.String(256), nullable=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    address = db.Column(db.String(200), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    postal_code = db.Column(db.String(20), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    wallet_address = db.Column(db.String(42), nullable=True, unique=True)
    role = db.Column(db.String(20), nullable=False, default='pensioner')
    pensioner_id = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, nullable=True, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'fullName': f"{self.first_name} {self.last_name}",
            'phone': self.phone,
            'dateOfBirth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'address': self.address,
            'city': self.city,
            'postalCode': self.postal_code,
            'country': self.country,
            'walletAddress': self.wallet_address,
            'role': self.role,
            'pensionerID': self.pensioner_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

# Verification model
class Verification(db.Model):
    __tablename__ = 'verification'
    id = db.Column(db.Integer, primary_key=True)
    pensioner_id = db.Column(db.Integer, nullable=False)
    wallet_address = db.Column(db.String(42), nullable=False)
    id_photo_path = db.Column(db.String(255), nullable=True)
    face_photo_path = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('verifications', lazy=True))
    last_verified_at = db.Column(db.DateTime, nullable=True)
    next_verification_date = db.Column(db.DateTime, nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'pensionerID': self.pensioner_id,
            'walletAddress': self.wallet_address,
            'idPhotoPath': self.id_photo_path,
            'facePhotoPath': self.face_photo_path,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'userID': self.user_id,
            'lastVerifiedAt': self.last_verified_at.isoformat() if self.last_verified_at else None,
            'nextVerificationDate': self.next_verification_date.isoformat() if self.next_verification_date else None
        }

def reset_db():
    """Reset the database completely"""
    # Remove existing database file if it exists
    db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pension.db')
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print(f"Removed old database file: {db_file}")
        except Exception as e:
            print(f"Error removing database file: {e}")
    
    # Create all tables
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")

# Add demo users
def create_demo_users():
    with app.app_context():
        # Check if we already have users
        if User.query.count() > 0:
            print("Demo users already exist.")
            return
            
        try:
            print("Creating demo users...")
            
            # Create demo pensioner
            pensioner = User(
                email='pensioner@smartpension.com',
                password_hash=generate_password_hash('password123'),
                first_name='John',
                last_name='Doe',
                role='pensioner',
                phone='123-456-7890',
                wallet_address='0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc'
            )
            
            # Create demo admin
            admin = User(
                email='admin@smartpension.com',
                password_hash=generate_password_hash('admin123'),
                first_name='Admin',
                last_name='User',
                role='admin',
                wallet_address='0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'
            )
            
            # Create demo doctor
            doctor = User(
                email='doctor@smartpension.com',
                password_hash=generate_password_hash('doctor123'),
                first_name='Dr',
                last_name='Smith',
                role='doctor',
                wallet_address='0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
            )
            
            db.session.add(pensioner)
            db.session.add(admin)
            db.session.add(doctor)
            db.session.commit()
            
            print("Demo users created successfully!")
        except Exception as e:
            db.session.rollback()
            print(f"Error creating demo users: {str(e)}")

# Helper function to check if file extension is allowed
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper function to save uploaded file
def save_file(file):
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Generate unique filename to prevent overwrites
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        return unique_filename
    return None

# Simulate face recognition check - in a real app, you would use real face recognition
def check_face_verification(face_image_path, id_image_path, user_data):
    """
    Compare the face in the current photo with the ID document photo
    In a real implementation, this would use facial recognition to compare the two photos
    """
    # This is a mock implementation - replace with actual face recognition
    # For development, we'll always return True (verified)
    print(f"Checking face verification: Face={face_image_path}, ID={id_image_path}")
    return True

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email', 'role']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Check if email is already registered
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({
                'success': False,
                'message': 'Email already registered'
            }), 400
        
        # Check if wallet address is already registered
        if data.get('walletAddress'):
            existing_wallet = User.query.filter_by(wallet_address=data['walletAddress']).first()
            if existing_wallet:
                return jsonify({
                    'success': False,
                    'message': 'Wallet address already registered'
                }), 400
        
        # Create new user
        new_user = User(
            email=data['email'],
            first_name=data['firstName'],
            last_name=data['lastName'],
            phone=data.get('phone'),
            wallet_address=data.get('walletAddress'),
            role=data['role'],
            address=data.get('address'),
            city=data.get('city'),
            postal_code=data.get('postalCode'),
            country=data.get('country')
        )
        
        # Parse date of birth if provided
        if data.get('dateOfBirth'):
            try:
                new_user.date_of_birth = datetime.datetime.fromisoformat(data['dateOfBirth'].replace('Z', '+00:00')).date()
            except ValueError:
                # If ISO format fails, try simple date format
                new_user.date_of_birth = datetime.datetime.strptime(data['dateOfBirth'], '%Y-%m-%d').date()
        
        # Hash password if provided
        if data.get('password'):
            new_user.password_hash = generate_password_hash(data['password'])
        
        # Save user to database
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user': new_user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Registration failed: {str(e)}'
        }), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        user = None
        auth_method = None
        
        # Login with wallet address
        if data.get('walletAddress'):
            user = User.query.filter_by(wallet_address=data['walletAddress']).first()
            auth_method = 'metamask'
            
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'No account found for this wallet address'
                }), 401
        
        # Login with email and password
        elif data.get('email') and data.get('password'):
            user = User.query.filter_by(email=data['email']).first()
            auth_method = 'traditional'
            
            # Extra checking for password_hash column
            if not user:
                return jsonify({
                    'success': False,
                    'message': 'Invalid email or password'
                }), 401
                
            if not hasattr(user, 'password_hash') or not user.password_hash:
                return jsonify({
                    'success': False,
                    'message': 'Account exists but has no password set. Try logging in with MetaMask.'
                }), 401
            
            if not check_password_hash(user.password_hash, data['password']):
                return jsonify({
                    'success': False,
                    'message': 'Invalid email or password'
                }), 401
        
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid login credentials'
            }), 400
        
        # Set session data
        session['user_id'] = user.id
        session['auth_method'] = auth_method
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user.to_dict(),
            'authMethod': auth_method
        })
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Login failed: {str(e)}'
        }), 500

@app.route('/api/user', methods=['GET'])
def get_current_user():
    try:
        user_id = session.get('user_id')
        
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Not authenticated'
            }), 401
        
        user = User.query.get(user_id)
        
        if not user:
            # Clear invalid session
            session.clear()
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'authMethod': session.get('auth_method')
        })
        
    except Exception as e:
        print(f"Get current user error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error fetching user data: {str(e)}'
        }), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    try:
        session.clear()
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        })
    except Exception as e:
        print(f"Logout error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Logout failed: {str(e)}'
        }), 500

# API route to verify pensioner identity with facial recognition
@app.route('/api/verify-pensioner', methods=['POST'])
def verify_pensioner():
    try:
        # Check authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Not authenticated'
            }), 401
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Get form data
        pensioner_id = request.form.get('pensionerID') or '0'  # Default to 0 if not provided
        wallet_address = request.form.get('walletAddress')
        
        if not wallet_address:
            return jsonify({
                'success': False,
                'message': 'Missing wallet address'
            }), 400
        
        # Get image files
        id_photo_file = None
        face_photo_file = None
        
        if 'idPhoto' in request.files:
            id_photo_file = request.files['idPhoto']
            if id_photo_file.filename == '':
                id_photo_file = None
                
        if 'facePhoto' in request.files:
            face_photo_file = request.files['facePhoto']
            if face_photo_file.filename == '':
                face_photo_file = None
        
        # Check if at least one image is provided
        if not id_photo_file and not face_photo_file:
            return jsonify({
                'success': False,
                'message': 'At least one photo is required for verification'
            }), 400
        
        # Save images
        id_photo_path = None
        face_photo_path = None
        
        if id_photo_file:
            id_photo_path = save_file(id_photo_file)
            
        if face_photo_file:
            face_photo_path = save_file(face_photo_file)
        
        # Set pensioner ID if not provided
        if pensioner_id == '0' and user.pensioner_id:
            pensioner_id = str(user.pensioner_id)
        
        # For first-time verification, we only require the photos to be uploaded
        # For subsequent verifications, we'll check face against the registered image
        verification_successful = True
        
        # If both photos are available, perform face verification
        if id_photo_path and face_photo_path:
            # Get paths to saved files
            id_photo_full_path = os.path.join(app.config['UPLOAD_FOLDER'], id_photo_path)
            face_photo_full_path = os.path.join(app.config['UPLOAD_FOLDER'], face_photo_path)
            
            # Perform verification
            verification_successful = check_face_verification(
                face_photo_full_path,
                id_photo_full_path,
                {'pensionerID': pensioner_id}
            )
        
        # Calculate next verification date (180 days from now)
        verification_date = datetime.datetime.utcnow()
        next_verification_date = verification_date + datetime.timedelta(days=180)
        
        # Create verification record
        verification = Verification(
            pensioner_id=int(pensioner_id),
            wallet_address=wallet_address,
            id_photo_path=id_photo_path,
            face_photo_path=face_photo_path,
            status='verified' if verification_successful else 'rejected',
            user_id=user.id,
            last_verified_at=verification_date,
            next_verification_date=next_verification_date
        )
        
        db.session.add(verification)
        
        if verification_successful:
            # Update user's pensioner ID if verification is successful
            if not user.pensioner_id and pensioner_id != '0':
                user.pensioner_id = int(pensioner_id)
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Verification successful',
                'verification': verification.to_dict(),
                'nextVerificationDate': next_verification_date.isoformat()
            })
        else:
            db.session.commit()
            return jsonify({
                'success': False,
                'message': 'Verification failed',
                'verification': verification.to_dict()
            }), 400
        
    except Exception as e:
        db.session.rollback()
        print(f"Verification error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Verification process failed: {str(e)}'
        }), 500

# API route to get pensioner data for the current user
@app.route('/api/pensioner-data', methods=['GET'])
def get_pensioner_data():
    try:
        # Check authentication
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({
                'success': False,
                'message': 'Not authenticated'
            }), 401
        
        # Get user
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
            
        # Check if user is a pensioner
        if user.role != 'pensioner':
            return jsonify({
                'success': False,
                'message': 'User is not a pensioner'
            }), 403
            
        # Get wallet address
        wallet_address = user.wallet_address
        if not wallet_address:
            return jsonify({
                'success': False,
                'message': 'No wallet address associated with user'
            }), 400
            
        # Get pensioner verifications
        verifications = Verification.query.filter_by(user_id=user.id).all()
        
        # Create pensioner data object
        pensioner_data = {
            'id': user.pensioner_id,
            'name': f"{user.first_name} {user.last_name}",
            'firstName': user.first_name,
            'lastName': user.last_name,
            'wallet': wallet_address,
            'email': user.email,
            'phone': user.phone,
            'address': user.address,
            'city': user.city,
            'country': user.country,
            'postalCode': user.postal_code,
            'pensionAmount': '1.5',  # Default mock amount
            'lastVerificationDate': datetime.datetime.utcnow(),
            'isActive': True,
            'isDeceased': False,
            'nextVerificationDate': datetime.datetime.utcnow() + datetime.timedelta(days=180),
            'verificationStatus': 'active',
            'verifications': [v.to_dict() for v in verifications]
        }
        
        return jsonify({
            'success': True,
            'pensioner': pensioner_data
        })
        
    except Exception as e:
        print(f"Get pensioner data error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error fetching pensioner data: {str(e)}'
        }), 500

@app.route('/api/sync-verification', methods=['POST'])
def sync_verification():
    """
    Endpoint to sync offline verifications
    """
    # Check if user is authenticated
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({
            'success': False,
            'message': 'Authentication required'
        }), 401
    
    # Get verification data from request
    data = request.get_json()
    if not data:
        return jsonify({
            'success': False,
            'message': 'No data provided'
        }), 400
    
    try:
        # Extract data from request
        first_name = data.get('firstName')
        last_name = data.get('lastName')
        date_of_birth = data.get('dateOfBirth')
        national_id = data.get('nationalId')
        wallet_address = data.get('walletAddress')
        id_photo = data.get('idPhoto')
        face_photo = data.get('facePhoto')
        
        # Validate required fields
        if not first_name or not last_name or not wallet_address:
            return jsonify({
                'success': False,
                'message': 'Missing required fields'
            }), 400
        
        # Find or create the user
        user = User.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Save ID photo if provided
        id_photo_path = None
        if id_photo and id_photo.startswith('data:image'):
            try:
                # Extract base64 data
                image_data = id_photo.split(',')[1]
                binary_data = base64.b64decode(image_data)
                
                # Generate a filename
                filename = f"id_{uuid.uuid4()}.jpg"
                photo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                # Save the file
                with open(photo_path, 'wb') as f:
                    f.write(binary_data)
                
                # Use relative path for storage
                id_photo_path = filename
            except Exception as e:
                print(f"Error saving ID photo: {str(e)}")
        
        # Save face photo if provided
        face_photo_path = None
        if face_photo and face_photo.startswith('data:image'):
            try:
                # Extract base64 data
                image_data = face_photo.split(',')[1]
                binary_data = base64.b64decode(image_data)
                
                # Generate a filename
                filename = f"face_{uuid.uuid4()}.jpg"
                photo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                
                # Save the file
                with open(photo_path, 'wb') as f:
                    f.write(binary_data)
                
                # Use relative path for storage
                face_photo_path = filename
            except Exception as e:
                print(f"Error saving face photo: {str(e)}")
        
        # Calculate verification dates
        verification_date = datetime.datetime.utcnow()
        next_verification_date = verification_date + datetime.timedelta(days=180)
        
        # Create a verification entry
        verification = Verification(
            pensioner_id=user.pensioner_id or 0,  # Use existing ID or placeholder
            wallet_address=wallet_address,
            id_photo_path=id_photo_path,
            face_photo_path=face_photo_path,
            status='approved',  # Auto-approve for demo purposes
            user_id=user_id,
            last_verified_at=verification_date,
            next_verification_date=next_verification_date
        )
        
        db.session.add(verification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Verification synced successfully',
            'verification': verification.to_dict(),
            'nextVerificationDate': next_verification_date.isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error syncing verification: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__':
    command = sys.argv[1] if len(sys.argv) > 1 else None
    
    if command == '--reset-db':
        reset_db()
        create_demo_users()
        print("Database reset and demo users created successfully!")
        sys.exit(0)
    elif command == '--demo':
        create_demo_users()
    
    # Create tables if they don't exist
    with app.app_context():
        try:
            db.create_all()
            print("Database tables checked/created.")
        except Exception as e:
            print(f"Database initialization error: {str(e)}")
    
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting server on port {port}...")
    app.run(debug=True, host='0.0.0.0', port=port) 