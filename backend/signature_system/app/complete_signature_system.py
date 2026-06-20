# complete_signature_system.py
"""
COMPLETE SIGNATURE VERIFICATION SYSTEM
Phase 1: Forgery Detection (Fake vs Real) → UNCHANGED
Phase 2: Person Identification → NEW SINGLE EfficientNetB3 (97% acc)
"""

import os
import numpy as np
from PIL import Image, ImageEnhance
import tensorflow as tf
from tensorflow.keras.models import load_model
import pickle

# ==============================================================================
# CONFIGURATION - UPDATE THESE PATHS
# ==============================================================================

# Phase 1: Forgery Detection (UNCHANGED)
FORGERY_MODEL_DIR = 'D:/FYP/backend/signature_system/signature_models'
FORGERY_EFFICIENTNET = f'{FORGERY_MODEL_DIR}/efficientnet_best.h5'
FORGERY_RESNET = f'{FORGERY_MODEL_DIR}/resnet50_best.h5'
FORGERY_MOBILENET = f'{FORGERY_MODEL_DIR}/mobilenet_best.h5'
FORGERY_THRESHOLDS = f'{FORGERY_MODEL_DIR}/person_thresholds.pkl'
FORGERY_ENSEMBLE_CONFIG = f'{FORGERY_MODEL_DIR}/ensemble_config.pkl'

# Phase 2: NEW SINGLE MODEL
PERSON_ID_MODEL_DIR = 'D:/FYP/backend/signature_system/signature_person_id_simple'
PERSON_ID_MODEL = f'{PERSON_ID_MODEL_DIR}/person_id_model.h5'
PERSON_MAPPINGS = f'{PERSON_ID_MODEL_DIR}/person_mappings.pkl'

# ==============================================================================
# LOAD MODELS
# ==============================================================================

print("Loading Phase 1: Forgery Detection Models...")
custom_objects = {'focal_loss_fixed': lambda y_true, y_pred: tf.keras.losses.binary_crossentropy(y_true, y_pred)}

forgery_model_eff = load_model(FORGERY_EFFICIENTNET, custom_objects=custom_objects, compile=False)
forgery_model_res = load_model(FORGERY_RESNET, custom_objects=custom_objects, compile=False)
forgery_model_mob = load_model(FORGERY_MOBILENET, custom_objects=custom_objects, compile=False)

with open(FORGERY_THRESHOLDS, 'rb') as f:
    forgery_person_thresholds = pickle.load(f)
with open(FORGERY_ENSEMBLE_CONFIG, 'rb') as f:
    forgery_ensemble_config = pickle.load(f)
forgery_ensemble_weights = forgery_ensemble_config['weights']

print("Phase 1 models loaded")

print("\nLoading Phase 2: Person Identification (Single Model)...")
person_id_model = load_model(PERSON_ID_MODEL, compile=False)

with open(PERSON_MAPPINGS, 'rb') as f:
    mappings = pickle.load(f)
    label_to_person = mappings['label_to_person']
    persons_list = mappings['persons_list']

print(f"Phase 2 model loaded! Can identify {len(persons_list)} persons")

# ==============================================================================
# PREPROCESSING (Same for both phases)
# ==============================================================================

def preprocess_image(img_path, size=224):
    if not os.path.exists(img_path):
        raise FileNotFoundError(f"Image not found: {img_path}")
    
    img = Image.open(img_path).convert('RGB')
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.3)
    
    w, h = img.size
    max_side = max(w, h)
    bg = Image.new('RGB', (max_side, max_side), (255, 255, 255))
    bg.paste(img, ((max_side - w) // 2, (max_side - h) // 2))
    img = bg.resize((size, size), Image.LANCZOS)
    
    x = np.array(img)
    x = np.expand_dims(x, axis=0)
    x = tf.keras.applications.efficientnet.preprocess_input(x)
    return x

# ==============================================================================
# PHASE 1: FORGERY DETECTION (UNCHANGED)
# ==============================================================================

def detect_forgery(img_path, person_name=None):
    x = preprocess_image(img_path)
    pred_eff = forgery_model_eff.predict(x, verbose=0)[0][0]
    pred_res = forgery_model_res.predict(x, verbose=0)[0][0]
    pred_mob = forgery_model_mob.predict(x, verbose=0)[0][0]
    
    ensemble_prob = np.average([pred_eff, pred_res, pred_mob], weights=forgery_ensemble_weights)
    threshold = forgery_person_thresholds.get(person_name, 0.5) if person_name else 0.5
    is_real = ensemble_prob >= threshold
    confidence = ensemble_prob if is_real else (1 - ensemble_prob)
    label = 'Real' if is_real else 'Fake'
    
    certainty = "VERY HIGH" if confidence >= 0.90 else \
                "HIGH" if confidence >= 0.75 else \
                "MODERATE" if confidence >= 0.60 else "LOW - UNCERTAIN"
    
    return {
        'is_real': bool(is_real),
        'label': label,
        'confidence': confidence * 100,
        'certainty': certainty,
        'ensemble_probability': ensemble_prob,
        'threshold_used': threshold
    }

# ==============================================================================
# PHASE 2: PERSON IDENTIFICATION (NEW SINGLE MODEL)
# ==============================================================================

def identify_person(img_path, top_k=3):
    x = preprocess_image(img_path)
    probs = person_id_model.predict(x, verbose=0)[0]
    
    top_k_indices = np.argsort(probs)[-top_k:][::-1]
    top_k_probs = probs[top_k_indices]
    top_k_persons = [label_to_person[idx] for idx in top_k_indices]
    
    best_person = top_k_persons[0]
    best_confidence = top_k_probs[0] * 100
    
    certainty = "VERY HIGH" if best_confidence >= 90 else \
                "HIGH" if best_confidence >= 75 else \
                "MODERATE" if best_confidence >= 60 else "LOW - UNCERTAIN"
    
    return {
        'predicted_person': best_person,
        'confidence': round(best_confidence, 2),
        'certainty': certainty,
        'top_predictions': [
            {'person': p, 'probability': round(pr * 100, 2)}
            for p, pr in zip(top_k_persons, top_k_probs)
        ]
    }

# ==============================================================================
# COMPLETE SYSTEM
# ==============================================================================

def verify_signature(img_path, expected_person=None):
    print("="*70)
    print("SIGNATURE VERIFICATION SYSTEM")
    print("="*70)
    
    # PHASE 1
    print("\n[PHASE 1] Running Forgery Detection...")
    forgery_result = detect_forgery(img_path, expected_person)
    print(f"Result: {forgery_result['label']} ({forgery_result['confidence']:.1f}% {forgery_result['certainty']})")
    
    result = {
        'phase_1_forgery_detection': forgery_result,
        'phase_2_person_identification': None,
        'final_verdict': None,
        'message': None
    }
    
    if not forgery_result['is_real']:
        result['final_verdict'] = 'REJECTED'
        result['message'] = f"REJECTED: Signature is FAKE with {forgery_result['confidence']:.1f}% confidence."
        print(f"\n{result['message']}")
        print("="*70)
        return result
    
    # PHASE 2
    print("\n[PHASE 2] Signature is REAL → Identifying Person...")
    person_result = identify_person(img_path)
    result['phase_2_person_identification'] = person_result
    
    print(f"Identified: {person_result['predicted_person']} ({person_result['confidence']:.1f}% {person_result['certainty']})")
    
    if expected_person:
        if person_result['predicted_person'] == expected_person:
            result['final_verdict'] = 'VERIFIED'
            result['message'] = f"VERIFIED: Matches {expected_person} with {person_result['confidence']:.1f}% confidence."
        else:
            result['final_verdict'] = 'MISMATCH'
            result['message'] = f"MISMATCH: Expected {expected_person}, got {person_result['predicted_person']}."
    else:
        result['final_verdict'] = 'IDENTIFIED'
        result['message'] = f"IDENTIFIED: This is {person_result['predicted_person']}'s signature ({person_result['confidence']:.1f}% confidence)."

    print(f"\n{result['message']}")
    print("="*70)
    return result

# ==============================================================================
# BATCH PROCESSING
# ==============================================================================

def verify_batch(folder_path):
    valid_ext = ('.jpg', '.jpeg', '.png', '.bmp')
    files = [f for f in os.listdir(folder_path) if f.lower().endswith(valid_ext)]
    results = []
    
    for i, f in enumerate(files, 1):
        path = os.path.join(folder_path, f)
        print(f"\n[{i}/{len(files)}] {f}")
        try:
            r = verify_signature(path)
            r['filename'] = f
            results.append(r)
        except Exception as e:
            results.append({'filename': f, 'error': str(e)})
    
    return results

# ==============================================================================
# TEST
# ==============================================================================

if __name__ == "__main__":
    test_img = "test_signature.jpg"
    if os.path.exists(test_img):
        result = verify_signature(test_img, expected_person="person_5")
        import json
        with open("result.json", "w") as f:
            json.dump(result, f, indent=2)

__all__ = ['detect_forgery', 'identify_person', 'verify_signature']