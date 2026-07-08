import os
import uuid
import datetime
import jwt
import bcrypt
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes and origins to allow frontend connection
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Secret Key for JWT
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'nexus_central_jwt_secret_key_9988')

# File Upload Config
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'mp4', 'mov'}
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB limit

# MongoDB Atlas Connection
MONGO_URI = os.environ.get('MONGO_URI', '')
try:
    if not MONGO_URI or '<db_password>' in MONGO_URI:
        # No valid URI provided, fallback to local MongoDB
        print("No valid MONGO_URI found. Trying local MongoDB...")
        client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=3000)
        client.server_info()  # Trigger connection check
        print("Connected to local MongoDB!")
    else:
        print(f"Connecting to MongoDB Atlas...")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.server_info()  # Trigger connection check
        print("Connected to MongoDB Atlas successfully!")
    db = client['nexus_system']
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    print("Trying local MongoDB as final fallback...")
    client = MongoClient('mongodb://localhost:27017/')
    db = client['nexus_system']

# Collections
users_col = db['users']
meetings_col = db['meetings']
events_col = db['events']
policies_col = db['policies']
announcements_col = db['announcements']

# Ensure admin account exists
try:
    if users_col.count_documents({"username": "admin"}) == 0:
        admin_pass = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        users_col.insert_one({
            "username": "admin",
            "password": admin_pass,
            "name": "Administrator",
            "role": "admin",
            "email": "admin@nexus.local",
            "status": "active"
        })
    if users_col.count_documents({"username": "manager"}) == 0:
        mgr_pass = bcrypt.hashpw("manager123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        users_col.insert_one({
            "username": "manager",
            "password": mgr_pass,
            "name": "Manager User",
            "role": "manager",
            "email": "manager@nexus.local",
            "status": "active"
        })
    if users_col.count_documents({"username": "user"}) == 0:
        usr_pass = bcrypt.hashpw("user123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        users_col.insert_one({
            "username": "user",
            "password": usr_pass,
            "name": "Regular User",
            "role": "user",
            "email": "user@nexus.local",
            "status": "active"
        })
except Exception as e:
    print(f"Error seeding database: {e}")

# Helper decorator for JWT verification
def token_required(f):
    def decorator(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"success": False, "message": "Unauthorized: Token is missing"}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_col.find_one({"username": data['username']})
            if not current_user:
                return jsonify({"success": False, "message": "Unauthorized: Invalid user session"}), 401
            current_user['_id'] = str(current_user['_id'])
        except Exception as e:
            return jsonify({"success": False, "message": f"Unauthorized: {str(e)}"}), 401
        
        return f(current_user, *args, **kwargs)
    decorator.__name__ = f.__name__
    return decorator

# Helper function to convert DB object to JSON-friendly format
def serialize_doc(doc):
    if not doc:
        return None
    doc['id'] = str(doc.get('_id', ''))
    if '_id' in doc:
        del doc['_id']
    return doc

# --- AUTH ROUTES ---
@app.route('/api/auth.php', methods=['POST'])
@app.route('/api/auth/login', methods=['POST'])
@app.route('/api/auth/register', methods=['POST'])
def auth_router():
    # Supports both custom JSON format and Action routing for compatibility with legacy auth.js calls
    data = request.get_json() or {}
    action = data.get('action')
    
    if action == 'login' or request.path.endswith('/login'):
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({"success": False, "message": "Please enter both username and password"}), 400
            
        user = users_col.find_one({"username": username, "status": "active"})
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            token = jwt.encode({
                'username': user['username'],
                'role': user['role'],
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm="HS256")
            
            return jsonify({
                "success": True,
                "message": "Login successful",
                "user": {
                    "id": str(user['_id']),
                    "username": user['username'],
                    "name": user['name'],
                    "role": user['role']
                },
                "token": token
            })
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    elif action == 'register' or request.path.endswith('/register'):
        username = data.get('username')
        password = data.get('password')
        name = data.get('name')
        
        if not username or not password or not name:
            return jsonify({"success": False, "message": "Please fill in all required fields"}), 400
            
        if users_col.find_one({"username": username}):
            return jsonify({"success": False, "message": "Username already exists"}), 400
            
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        role = data.get('role', 'user')
        email = data.get('email', '')
        
        users_col.insert_one({
            "username": username,
            "password": hashed_password,
            "name": name,
            "role": role,
            "email": email,
            "status": "active"
        })
        return jsonify({"success": True, "message": "User registered successfully"}), 201
        
    return jsonify({"success": False, "message": "Method or Action not supported"}), 400

# --- PASSWORD RESET ROUTE ---
@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    new_password = data.get('new_password', '')

    if not username or not new_password:
        return jsonify({"success": False, "message": "Username and new password are required"}), 400

    if len(new_password) < 6:
        return jsonify({"success": False, "message": "Password must be at least 6 characters"}), 400

    user = users_col.find_one({"username": username})
    if not user:
        return jsonify({"success": False, "message": "No account found with this username"}), 404

    hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    users_col.update_one({"username": username}, {"$set": {"password": hashed}})

    return jsonify({"success": True, "message": "Password reset successfully"})


# --- FILE UPLOAD ROUTE ---
@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "message": "No file selected"}), 400

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"success": False, "message": f"File type .{ext} not allowed"}), 400

    original_name = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{original_name}"
    file.save(os.path.join(UPLOAD_FOLDER, unique_name))

    return jsonify({
        "success": True,
        "filename": unique_name,
        "originalName": original_name
    })


# --- SERVE UPLOADED FILES ---
@app.route('/api/uploads/<filename>', methods=['GET'])
def serve_upload(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)



@app.route('/api/meetings', methods=['GET', 'POST'])
@app.route('/api/meetings/<id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def handle_meetings(current_user):
    id_param = request.args.get('id') or request.view_args.get('id')
    
    if request.method == 'GET':
        if id_param:
            meeting = meetings_col.find_one({"id": id_param})
            if meeting:
                return jsonify(serialize_doc(meeting))
            return jsonify({"message": "Meeting not found"}), 404
        else:
            meetings = list(meetings_col.find())
            return jsonify([serialize_doc(m) for m in meetings])
            
    elif request.method == 'POST':
        data = request.get_json()
        new_id = f"meeting_{str(ObjectId())}"
        
        meeting_doc = {
            "id": new_id,
            "title": data.get('title'),
            "date": data.get('date'),
            "location": data.get('location'),
            "attendees": data.get('attendees', []),
            "status": data.get('status', 'scheduled'),
            "agenda": data.get('agenda', ''),
            "minutes": data.get('minutes', ''),
            "created_by": current_user['username'],
            "createdAt": datetime.datetime.utcnow().isoformat()
        }
        meetings_col.insert_one(meeting_doc)
        return jsonify({"success": True, "message": "Meeting created", "id": new_id}), 201
        
    elif request.method == 'PUT':
        if not id_param:
            return jsonify({"success": False, "message": "ID is required for update"}), 400
        data = request.get_json()
        
        update_fields = {
            "title": data.get('title'),
            "date": data.get('date'),
            "location": data.get('location'),
            "attendees": data.get('attendees'),
            "status": data.get('status'),
            "agenda": data.get('agenda'),
            "minutes": data.get('minutes'),
            "updatedAt": datetime.datetime.utcnow().isoformat()
        }
        # Filter none values
        update_fields = {k: v for k, v in update_fields.items() if v is not None}
        
        result = meetings_col.update_one({"id": id_param}, {"$set": update_fields})
        if result.matched_count > 0:
            return jsonify({"success": True, "message": "Meeting updated"})
        return jsonify({"success": False, "message": "Meeting not found"}), 404
        
    elif request.method == 'DELETE':
        if not id_param:
            return jsonify({"success": False, "message": "ID is required for deletion"}), 400
        result = meetings_col.delete_one({"id": id_param})
        if result.deleted_count > 0:
            return jsonify({"success": True, "message": "Meeting deleted"})
        return jsonify({"success": False, "message": "Meeting not found"}), 404

# --- EVENTS ROUTES ---
@app.route('/api/events.php', methods=['GET', 'POST', 'PUT', 'DELETE'])
@app.route('/api/events', methods=['GET', 'POST'])
@app.route('/api/events/<id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def handle_events(current_user):
    id_param = request.args.get('id') or request.view_args.get('id')
    
    if request.method == 'GET':
        if id_param:
            event = events_col.find_one({"id": id_param})
            if event:
                return jsonify(serialize_doc(event))
            return jsonify({"message": "Event not found"}), 404
        else:
            events = list(events_col.find())
            return jsonify([serialize_doc(e) for e in events])
            
    elif request.method == 'POST':
        data = request.get_json()
        new_id = f"event_{str(ObjectId())}"
        
        event_doc = {
            "id": new_id,
            "title": data.get('title'),
            "date": data.get('date'),
            "location": data.get('location'),
            "description": data.get('description', ''),
            "speakers": data.get('speakers', []),
            "attendees": data.get('attendees', 0),
            "status": data.get('status', 'upcoming'),
            "created_by": current_user['username'],
            "createdAt": datetime.datetime.utcnow().isoformat()
        }
        events_col.insert_one(event_doc)
        return jsonify({"success": True, "message": "Event created", "id": new_id}), 201
        
    elif request.method == 'PUT':
        if not id_param:
            return jsonify({"success": False, "message": "ID is required"}), 400
        data = request.get_json()
        
        update_fields = {
            "title": data.get('title'),
            "date": data.get('date'),
            "location": data.get('location'),
            "description": data.get('description'),
            "speakers": data.get('speakers'),
            "attendees": data.get('attendees'),
            "status": data.get('status')
        }
        update_fields = {k: v for k, v in update_fields.items() if v is not None}
        
        result = events_col.update_one({"id": id_param}, {"$set": update_fields})
        if result.matched_count > 0:
            return jsonify({"success": True, "message": "Event updated"})
        return jsonify({"success": False, "message": "Event not found"}), 404
        
    elif request.method == 'DELETE':
        if not id_param:
            return jsonify({"success": False, "message": "ID is required"}), 400
        result = events_col.delete_one({"id": id_param})
        if result.deleted_count > 0:
            return jsonify({"success": True, "message": "Event deleted"})
        return jsonify({"success": False, "message": "Event not found"}), 404

# --- POLICIES ROUTES ---
@app.route('/api/policies.php', methods=['GET', 'POST', 'PUT', 'DELETE'])
@app.route('/api/policies', methods=['GET', 'POST'])
@app.route('/api/policies/<id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def handle_policies(current_user):
    id_param = request.args.get('id') or request.view_args.get('id')
    
    if request.method == 'GET':
        if id_param:
            policy = policies_col.find_one({"id": id_param})
            if policy:
                return jsonify(serialize_doc(policy))
            return jsonify({"message": "Policy not found"}), 404
        else:
            policies = list(policies_col.find())
            return jsonify([serialize_doc(p) for p in policies])
            
    elif request.method == 'POST':
        data = request.get_json()
        new_id = f"policy_{str(ObjectId())}"
        
        policy_doc = {
            "id": new_id,
            "title": data.get('title'),
            "category": data.get('category'),
            "version": data.get('version', '1.0'),
            "effectiveDate": data.get('effectiveDate'),
            "status": data.get('status', 'draft'),
            "approvedBy": data.get('approvedBy', ''),
            "content": data.get('content', ''),
            "created_by": current_user['username'],
            "createdAt": datetime.datetime.utcnow().isoformat(),
            "lastModified": datetime.datetime.utcnow().isoformat()
        }
        policies_col.insert_one(policy_doc)
        return jsonify({"success": True, "message": "Policy created", "id": new_id}), 201
        
    elif request.method == 'PUT':
        if not id_param:
            return jsonify({"success": False, "message": "ID is required"}), 400
        data = request.get_json()
        
        update_fields = {
            "title": data.get('title'),
            "category": data.get('category'),
            "version": data.get('version'),
            "effectiveDate": data.get('effectiveDate'),
            "status": data.get('status'),
            "approvedBy": data.get('approvedBy'),
            "content": data.get('content'),
            "lastModified": datetime.datetime.utcnow().isoformat()
        }
        update_fields = {k: v for k, v in update_fields.items() if v is not None}
        
        result = policies_col.update_one({"id": id_param}, {"$set": update_fields})
        if result.matched_count > 0:
            return jsonify({"success": True, "message": "Policy updated"})
        return jsonify({"success": False, "message": "Policy not found"}), 404
        
    elif request.method == 'DELETE':
        if not id_param:
            return jsonify({"success": False, "message": "ID is required"}), 400
        result = policies_col.delete_one({"id": id_param})
        if result.deleted_count > 0:
            return jsonify({"success": True, "message": "Policy deleted"})
        return jsonify({"success": False, "message": "Policy not found"}), 404

# --- ANNOUNCEMENTS ROUTES ---
@app.route('/api/announcements.php', methods=['GET', 'POST', 'PUT', 'DELETE'])
@app.route('/api/announcements', methods=['GET', 'POST'])
@app.route('/api/announcements/<id>', methods=['GET', 'PUT', 'DELETE'])
@token_required
def handle_announcements(current_user):
    id_param = request.args.get('id') or request.view_args.get('id')
    
    if request.method == 'GET':
        if id_param:
            announcement = announcements_col.find_one({"id": id_param})
            if announcement:
                return jsonify(serialize_doc(announcement))
            return jsonify({"message": "Announcement not found"}), 404
        else:
            announcements = list(announcements_col.find())
            return jsonify([serialize_doc(a) for a in announcements])
            
    elif request.method == 'POST':
        data = request.get_json()
        new_id = f"announcement_{str(ObjectId())}"
        
        announcement_doc = {
            "id": new_id,
            "title": data.get('title'),
            "priority": data.get('priority', 'medium'),
            "status": data.get('status', 'active'),
            "publishDate": data.get('publishDate'),
            "expiryDate": data.get('expiryDate'),
            "createdBy": current_user['name'],
            "content": data.get('content', ''),
            "createdAt": datetime.datetime.utcnow().isoformat()
        }
        announcements_col.insert_one(announcement_doc)
        return jsonify({"success": True, "message": "Announcement created", "id": new_id}), 201
        
    elif request.method == 'PUT':
        if not id_param:
            return jsonify({"success": False, "message": "ID is required"}), 400
        data = request.get_json()
        
        update_fields = {
            "title": data.get('title'),
            "priority": data.get('priority'),
            "status": data.get('status'),
            "publishDate": data.get('publishDate'),
            "expiryDate": data.get('expiryDate'),
            "content": data.get('content')
        }
        update_fields = {k: v for k, v in update_fields.items() if v is not None}
        
        result = announcements_col.update_one({"id": id_param}, {"$set": update_fields})
        if result.matched_count > 0:
            return jsonify({"success": True, "message": "Announcement updated"})
        return jsonify({"success": False, "message": "Announcement not found"}), 404
        
    elif request.method == 'DELETE':
        if not id_param:
            return jsonify({"success": False, "message": "ID is required"}), 400
        result = announcements_col.delete_one({"id": id_param})
        if result.deleted_count > 0:
            return jsonify({"success": True, "message": "Announcement deleted"})
        return jsonify({"success": False, "message": "Announcement not found"}), 404

# --- RUN SERVICE ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
