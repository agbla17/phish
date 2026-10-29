# PhishGuard - Run Guide

## 1. Install ML Dependencies

pip install -r ml/requirements.txt

---

## 2. Run the Node Backend and ML Service

node server.js

The Node API serves the frontend on `http://127.0.0.1:3000` and starts the
local Flask inference service on `http://127.0.0.1:5001`.
The backend binds to loopback by default. Set `HOST`, `PORT`, and
`CORS_ORIGINS` in the process environment to change the local configuration.
Do not expose the unauthenticated API directly to the internet.

SHAP is used for model explanations when its native dependencies are available.
If SHAP cannot be imported, the inference service logs a warning and falls back
to perturbation-based explanations; email, URL, and attachment inference remain
available.

To retrain from the checked-in datasets before starting the server:

```text
python ml/train.py
```

To train and compare BERT, RoBERTa, CNN, and LSTM email classifiers separately:

```text
python ml/train_neural_models.py
```

This trains on the full CEAS_08 dataset and writes model checkpoints to
`ml/artifacts/neural_models/`. It does not create evaluation metrics or a test
split. BERT and RoBERTa fetch pretrained model weights/tokenizers on first
use. The trained models are separate from the XGBoost models used by the
running application. For a smaller trial, use
`python ml/train_neural_models.py --models cnn lstm --epochs 1 --max-rows 5000`.

---

Open `http://127.0.0.1:3000` in the browser. Gmail sign-in uses the configured
Google Identity Services client ID in the frontend and requires that origin to
be authorized in the Google Cloud OAuth client settings.

---

## Features

- Email phishing detection
- URL phishing detection
- SHAP explainability graphs
- Gmail inbox scanning
- Email and Gmail attachment scanning (up to 35 MB total per email)
- Risk score visualization
- XGBoost-based ML prediction

---

## Technologies Used

- Flask
- XGBoost
- SHAP
- Plotly
- Gmail API
- OAuth 2.0
- HTML/CSS/JavaScript

Attachment model metrics are from synthetic training data only and are not a
real-world detection guarantee. Static analysis does not replace antivirus or
sandboxing.
