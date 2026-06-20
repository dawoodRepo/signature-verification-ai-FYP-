from flask import Flask, request, jsonify
import os
import uuid
from complete_signature_system import verify_signature, detect_forgery, identify_person
from flask_cors import CORS  # ADD THIS LINE

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def save_and_process_file(file):
    """Helper function to save uploaded file and return temp path"""
    if not file.filename:
        return None, {"error": "No file selected"}, 400
    
    ext = os.path.splitext(file.filename)[1]
    temp_path = os.path.join(UPLOAD_FOLDER, f"{uuid.uuid4().hex}{ext}")
    file.save(temp_path)
    return temp_path, None, None

def cleanup_file(path):
    """Helper function to cleanup temporary files"""
    if os.path.exists(path):
        os.remove(path)

@app.route('/')
def home():
    return """
    <h2>Signature Verification API</h2>
    
    <h3>Complete Verification</h3>
    <form method="post" action="/verify" enctype="multipart/form-data">
        <input type="file" name="signature" required><br><br>
        Expected person (optional): <input type="text" name="expected_person"><br><br>
        <input type="submit" value="Verify Single">
    </form>
    
    <hr>
    
    <h3>Forgery Detection Only</h3>
    <form method="post" action="/detect-forgery" enctype="multipart/form-data">
        <input type="file" name="signature" required><br><br>
        Expected person (optional): <input type="text" name="expected_person"><br><br>
        <input type="submit" value="Detect Forgery">
    </form>
    
    <h3>Person Identification Only</h3>
    <form method="post" action="/identify-person" enctype="multipart/form-data">
        <input type="file" name="signature" required><br><br>
        <input type="submit" value="Identify Person">
    </form>
    
    <hr>
    
    <h3>Multiple Files Upload (Complete Verification)</h3>
    <form method="post" action="/verify-batch" enctype="multipart/form-data">
        <input type="file" name="signatures" multiple required><br><br>
        Expected person (optional): <input type="text" name="expected_person"><br><br>
        <input type="submit" value="Verify Multiple">
    </form>
    """

# ==============================================================================
# COMPLETE VERIFICATION ENDPOINTS (ORIGINAL)
# ==============================================================================

@app.route('/verify', methods=['POST'])
def verify():
    """Single file verification endpoint"""
    if 'signature' not in request.files:
        return jsonify({"error": "No file"}), 400
    
    file = request.files['signature']
    temp_path, error, status = save_and_process_file(file)
    if error:
        return jsonify(error), status

    expected = request.form.get('expected_person')

    try:
        result = verify_signature(temp_path, expected)
        result['filename'] = file.filename
        cleanup_file(temp_path)
        return jsonify(result), 200
    except Exception as e:
        cleanup_file(temp_path)
        return jsonify({"error": str(e)}), 500

@app.route('/verify-batch', methods=['POST'])
def verify_batch():
    """Multiple files verification endpoint"""
    if 'signatures' not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    files = request.files.getlist('signatures')
    
    if not files or all(not f.filename for f in files):
        return jsonify({"error": "No files selected"}), 400
    
    expected = request.form.get('expected_person')
    results = []
    temp_paths = []
    
    try:
        # Process each file
        for file in files:
            if not file.filename:
                continue
                
            temp_path, error, status = save_and_process_file(file)
            if error:
                results.append({
                    'filename': file.filename,
                    'status': 'error',
                    'error': error['error']
                })
                continue
                
            temp_paths.append(temp_path)
            
            try:
                result = verify_signature(temp_path, expected)
                result['filename'] = file.filename
                result['status'] = 'success'
                results.append(result)
            except Exception as e:
                results.append({
                    'filename': file.filename,
                    'status': 'error',
                    'error': str(e)
                })
        
        # Cleanup temporary files
        for path in temp_paths:
            cleanup_file(path)
        
        # Summary statistics
        total = len(results)
        successful = sum(1 for r in results if r.get('status') == 'success')
        verified = sum(1 for r in results if r.get('final_verdict') == 'VERIFIED')
        rejected = sum(1 for r in results if r.get('final_verdict') == 'REJECTED')
        
        response = {
            'total_files': total,
            'successful_verifications': successful,
            'verified_count': verified,
            'rejected_count': rejected,
            'results': results
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        # Cleanup on error
        for path in temp_paths:
            cleanup_file(path)
        return jsonify({"error": str(e)}), 500

# ==============================================================================
# INDIVIDUAL MODEL ENDPOINTS
# ==============================================================================

@app.route('/detect-forgery', methods=['POST'])
def detect_forgery_endpoint():
    """Forgery detection only endpoint"""
    if 'signature' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['signature']
    temp_path, error, status = save_and_process_file(file)
    if error:
        return jsonify(error), status

    expected = request.form.get('expected_person')

    try:
        result = detect_forgery(temp_path, expected)
        result['filename'] = file.filename
        cleanup_file(temp_path)
        return jsonify({
            'service': 'forgery_detection',
            'filename': file.filename,
            'result': result
        }), 200
    except Exception as e:
        cleanup_file(temp_path)
        return jsonify({"error": str(e)}), 500

@app.route('/identify-person', methods=['POST'])
def identify_person_endpoint():
    """Person identification only endpoint"""
    if 'signature' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['signature']
    temp_path, error, status = save_and_process_file(file)
    if error:
        return jsonify(error), status

    try:
        result = identify_person(temp_path)
        result['filename'] = file.filename
        cleanup_file(temp_path)
        return jsonify({
            'service': 'person_identification',
            'filename': file.filename,
            'result': result
        }), 200
    except Exception as e:
        cleanup_file(temp_path)
        return jsonify({"error": str(e)}), 500

# ==============================================================================
# BATCH ENDPOINTS FOR INDIVIDUAL MODELS
# ==============================================================================

@app.route('/detect-forgery-batch', methods=['POST'])
def detect_forgery_batch():
    """Batch forgery detection endpoint"""
    if 'signatures' not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    files = request.files.getlist('signatures')
    
    if not files or all(not f.filename for f in files):
        return jsonify({"error": "No files selected"}), 400
    
    expected = request.form.get('expected_person')
    results = []
    temp_paths = []
    
    try:
        for file in files:
            if not file.filename:
                continue
                
            temp_path, error, status = save_and_process_file(file)
            if error:
                results.append({
                    'filename': file.filename,
                    'status': 'error',
                    'error': error['error']
                })
                continue
                
            temp_paths.append(temp_path)
            
            try:
                result = detect_forgery(temp_path, expected)
                result['filename'] = file.filename
                result['status'] = 'success'
                results.append(result)
            except Exception as e:
                results.append({
                    'filename': file.filename,
                    'status': 'error',
                    'error': str(e)
                })
        
        # Cleanup
        for path in temp_paths:
            cleanup_file(path)
        
        # Statistics
        total = len(results)
        successful = sum(1 for r in results if r.get('status') == 'success')
        real_count = sum(1 for r in results if r.get('status') == 'success' and r.get('is_real'))
        fake_count = sum(1 for r in results if r.get('status') == 'success' and not r.get('is_real'))
        
        response = {
            'service': 'batch_forgery_detection',
            'total_files': total,
            'successful_detections': successful,
            'real_count': real_count,
            'fake_count': fake_count,
            'results': results
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        for path in temp_paths:
            cleanup_file(path)
        return jsonify({"error": str(e)}), 500

@app.route('/identify-person-batch', methods=['POST'])
def identify_person_batch():
    """Batch person identification endpoint"""
    if 'signatures' not in request.files:
        return jsonify({"error": "No files provided"}), 400
    
    files = request.files.getlist('signatures')
    
    if not files or all(not f.filename for f in files):
        return jsonify({"error": "No files selected"}), 400
    
    results = []
    temp_paths = []
    
    try:
        for file in files:
            if not file.filename:
                continue
                
            temp_path, error, status = save_and_process_file(file)
            if error:
                results.append({
                    'filename': file.filename,
                    'status': 'error',
                    'error': error['error']
                })
                continue
                
            temp_paths.append(temp_path)
            
            try:
                result = identify_person(temp_path)
                result['filename'] = file.filename
                result['status'] = 'success'
                results.append(result)
            except Exception as e:
                results.append({
                    'filename': file.filename,
                    'status': 'error',
                    'error': str(e)
                })
        
        # Cleanup
        for path in temp_paths:
            cleanup_file(path)
        
        # Statistics
        total = len(results)
        successful = sum(1 for r in results if r.get('status') == 'success')
        
        # Count predictions per person
        person_counts = {}
        for r in results:
            if r.get('status') == 'success':
                person = r.get('predicted_person')
                person_counts[person] = person_counts.get(person, 0) + 1
        
        response = {
            'service': 'batch_person_identification',
            'total_files': total,
            'successful_identifications': successful,
            'person_distribution': person_counts,
            'results': results
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        for path in temp_paths:
            cleanup_file(path)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)