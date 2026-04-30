"""
app.py - Flask API server for the NLP complaint analysis service.
Endpoints:
  POST /predict   { "text": "..." } -> { category, priority, ... }
  GET  /health    -> { status: "ok" }
  POST /train     -> triggers model retraining (admin only)

Run:
  python train.py   # first time to create models
  python app.py     # start the service
"""

import os
import sys
from flask import Flask, request, jsonify

app = Flask(__name__)

# Lazy-load predict only after train has run
predict_fn = None


def get_predict():
    global predict_fn
    if predict_fn is None:
        try:
            from predict import predict
            predict_fn = predict
        except FileNotFoundError:
            return None
    return predict_fn


@app.route('/health', methods=['GET'])
def health():
    model_ready = get_predict() is not None
    return jsonify({
        'status': 'ok',
        'model_ready': model_ready,
        'service': 'NLP Complaint Analysis Service',
    })


@app.route('/predict', methods=['POST'])
def predict_route():
    data = request.get_json(force=True, silent=True)
    if not data or 'text' not in data:
        return jsonify({'error': 'Missing "text" field in request body'}), 400

    text = str(data['text']).strip()
    if len(text) < 3:
        return jsonify({'error': 'Text is too short'}), 400

    predict = get_predict()
    if predict is None:
        return jsonify({
            'error': 'Model not trained yet. Run python train.py first.',
        }), 503

    try:
        result = predict(text)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/train', methods=['POST'])
def retrain_route():
    """Re-train the models on demand."""
    try:
        import train as train_module
        train_module.train()
        global predict_fn
        predict_fn = None  # Reset so it reloads models
        return jsonify({'success': True, 'message': 'Models retrained successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('ML_PORT', 5001))
    print(f'[*] NLP ML Service starting on port {port}')

    # Auto-train if models don't exist
    from model import CATEGORY_MODEL_PATH, PRIORITY_MODEL_PATH
    if not os.path.exists(CATEGORY_MODEL_PATH) or not os.path.exists(PRIORITY_MODEL_PATH):
        print('Models not found. Training now...')
        try:
            import train as train_module
            train_module.train()
        except Exception as e:
            print(f'Auto-training failed: {e}')

    app.run(host='0.0.0.0', port=port, debug=False)
