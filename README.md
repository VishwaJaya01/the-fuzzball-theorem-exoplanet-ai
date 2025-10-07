# 🌌 The Fuzzball Theorem - Exoplanet AI

![NASA Space Apps Challenge](https://img.shields.io/badge/NASA-Space_Apps_Challenge-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Python](https://img.shields.io/badge/Python-3.12-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)
![HuggingFace](https://img.shields.io/badge/Backend-HuggingFace-yellow)

An AI-powered web application for detecting exoplanets from TESS (Transiting Exoplanet Survey Satellite) light curve data using machine learning. This project was developed for the **NASA Space Apps Challenge 2025** and combines advanced signal processing, Box Least Squares (BLS) algorithm, and XGBoost classification to identify potential exoplanet transit signals.

**🚀 Deployment:**
- **Frontend**: Deployed on [Vercel](https://the-fuzzball-theorem-exoplanet-ai-f.vercel.app/) with automated CI/CD
- **Backend**: Deployed on [HuggingFace Spaces](https://huggingface.co/spaces) 
- **CI/CD**: Automated pipelines using GitHub Actions for continuous integration and deployment

## 🌟 Features

- **🔍 TIC ID Search**: Search and analyze TESS targets by their TIC (TESS Input Catalog) identifier
- **📊 CSV Upload**: Upload custom light curve data for analysis
- **🤖 ML-Powered Detection**: XGBoost-based classification with BLS feature engineering
- **🌍 3D Visualization**: Interactive planet simulator with orbital mechanics
- **📈 Real-time Analysis**: Transit signal detection with period, depth, and confidence metrics
- **📱 Responsive UI**: Modern, mobile-friendly interface built with Next.js and TailwindCSS
- **☁️ Production Ready**: Deployed on Vercel (frontend) and HuggingFace Spaces (backend)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Input Panel │  │ Results View │  │ Planet View  │      │
│  │  - TIC ID    │  │ - Charts     │  │ - 3D Render  │      │
│  │  - CSV Upload│  │ - Metrics    │  │ - Animation  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │ API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   API Layer  │  │   Features   │  │    Models    │      │
│  │  - /health   │  │   - BLS      │  │  - XGBoost   │      │
│  │  - /predict  │  │   - Stats    │  │  - Scaler    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  - TESS Light Curves (Parquet)                              │
│  - Cached Features                                           │
│  - Model Artifacts                                           │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.12+
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/VishwaJaya01/the-fuzzball-theorem-exoplanet-ai.git
cd the-fuzzball-theorem-exoplanet-ai
```

### 2. Frontend Setup

```bash
cd the-fuzzball-theorem-exoplanet-ai-fe

# Install dependencies
npm install

# Create environment file
cat > .env.local << EOF
# Production backend (deployed)
NEXT_PUBLIC_BACKEND_API_URL_PROD=https://jayasankha-exo-orbit-lab.hf.space

# Local backend (only when running locally)
NEXT_PUBLIC_BACKEND_API_URL=http://127.0.0.1:7860
EOF

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
export MODEL_DIR="../artifacts"
export PROCESSED_DIR="../data/processed"
export INTERIM_DIR="../data/interim"

# Run the backend server
./run_local.sh
```

The API will be available at [http://127.0.0.1:7860](http://127.0.0.1:7860)

## 📁 Project Structure

```
the-fuzzball-theorem-exoplanet-ai/
├── backend/                          # FastAPI backend service
│   ├── app/
│   │   ├── main.py                  # API entry point
│   │   ├── config.py                # Configuration management
│   │   ├── schemas.py               # Pydantic models
│   │   ├── dataaccess/              # Data loading layer
│   │   ├── features/                # BLS feature engineering
│   │   ├── models/                  # ML model inference
│   │   └── tests/                   # API tests
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                   # Container definition
│   └── run_local.sh                 # Local development script
│
├── the-fuzzball-theorem-exoplanet-ai-fe/  # Next.js frontend
│   ├── src/
│   │   ├── app/                     # Next.js app directory
│   │   │   ├── page.tsx            # Main application page
│   │   │   └── api/                # API proxy routes
│   │   ├── components/              # React components
│   │   │   ├── InputPanel.tsx      # TIC ID / CSV input
│   │   │   ├── ResultsPanel.tsx    # Analysis results
│   │   │   ├── PlanetView.tsx      # 3D visualization
│   │   │   └── LightCurveChart.tsx # Time series charts
│   │   └── lib/
│   │       ├── api.ts              # API client with fallback
│   │       ├── types.ts            # TypeScript definitions
│   │       └── utils.ts            # Helper functions
│   ├── package.json                 # Node dependencies
│   └── next.config.ts               # Next.js configuration
│
├── model/                           # ML training scripts
│   ├── train_xgb.py                # XGBoost supervised training
│   ├── predict.py                  # Batch inference script
│   └── export_model.py             # Model export utilities
│
├── scripts/                         # Data processing scripts
│   ├── make_dataset.py             # Dataset creation
│   ├── build_features.py           # Feature engineering
│   ├── fetch_tess_lightcurve.py   # TESS data fetching
│   └── eval_model.py               # Model evaluation
│
├── data/                            # Data directory
│   ├── processed/                   # Processed light curves
│   ├── interim/                     # Cached features
│   └── model/                       # Model artifacts
│
├── notebooks/                       # Jupyter notebooks
│   ├── make_dataset.ipynb          # Data exploration
│   └── exoplanet_bls_baseline_features_train.ipynb
│
└── artifacts/                       # Trained model artifacts
    ├── model_iso_v1_oc.pkl         # Isolation Forest model
    ├── scaler_v1_oc.pkl            # Feature scaler
    ├── feature_names_v1_oc.json    # Feature definitions
    └── metrics_v1_oc.json          # Performance metrics
```

## 🔌 API Endpoints

### Base URL
- **Production**: `https://jayasankha-exo-orbit-lab.hf.space`
- **Local**: `http://127.0.0.1:7860`

### Endpoints

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model_version": "v1_oc",
  "timestamp": "2025-10-07T12:00:00Z"
}
```

#### `GET /version`
Get API and model version information.

**Response:**
```json
{
  "api_version": "1.0.0",
  "model_version": "v1_oc"
}
```

#### `GET /model/info`
Get detailed model information.

**Response:**
```json
{
  "version": "v1_oc",
  "type": "IsolationForest/XGBoost",
  "features_count": 42,
  "trained_date": "2025-10-01"
}
```

#### `POST /predict/by_tic`
Predict exoplanet transits for a TIC ID.

**Query Parameters:**
- `tic_id` (required): TESS Input Catalog identifier
- `sector` (optional): Specific TESS sector to analyze

**Response:**
```json
{
  "tic_id": "102713734",
  "score": 0.87,
  "label": 1,
  "detections": [
    {
      "period_days": 2.47,
      "epoch_bjd": 2458354.2,
      "duration_hours": 2.1,
      "depth_ppm": 1200,
      "snr": 15.3,
      "confidence": 0.92
    }
  ],
  "metadata": {
    "ra": 285.7,
    "dec": -45.2,
    "magnitude": 12.4
  }
}
```

#### `POST /predict/from_lightcurve`
Predict from custom light curve CSV data.

**Request Body:**
```json
{
  "csv_data": "time,flux\n0.0,1.0\n0.02,0.99\n..."
}
```

**Response:** Same as `/predict/by_tic`

## 🧠 Machine Learning Pipeline

### 1. Data Collection
- Fetches TESS light curves from MAST archive
- Supports both 2-minute and 30-minute cadence data
- Handles multiple sectors per target

### 2. Feature Engineering
The system computes **42 BLS-derived features**:

- **Period Features**: Transit period, uncertainty, grid coverage
- **Depth Features**: Transit depth, depth SNR, odd-even differences
- **Duration Features**: Transit duration, ingress/egress times
- **Shape Features**: Transit shape asymmetry, smoothness
- **Statistical Features**: Power, SNR, significance
- **Harmonics**: First and second harmonic analysis

### 3. Model Training

**Isolation Forest (One-Class)**:
- For scenarios with limited labeled negatives
- Anomaly detection approach
- Fast inference, robust to outliers

**XGBoost (Supervised)**:
- When labeled positive and negative samples available
- Gradient boosting with calibration
- Higher accuracy with proper labels

### 4. Inference
- Real-time feature computation
- Cached features for repeated TIC queries
- Returns probability scores and transit parameters

## 🎨 Frontend Features

### Input Methods
1. **TIC ID Search**: Enter a TESS target identifier
2. **CSV Upload**: Upload custom light curve data (time, flux columns)

### Visualizations
- **Light Curve Plot**: Raw flux vs. time with interactive zoom
- **Phase-Folded Transit**: Folded light curve at detected period
- **BLS Periodogram**: Power spectrum showing potential periods
- **3D Planet Simulator**: Animated orbital visualization

### Smart API Fallback
The frontend includes intelligent API routing:
- Tries local backend first (3-5 second timeout)
- Automatically falls back to production if local unavailable
- Seamless development-to-production workflow

## 🐳 Docker Deployment

### Backend

```bash
cd backend
docker build -t exoplanet-backend .
docker run -p 7860:7860 \
  -v $(pwd)/../artifacts:/data/model \
  -v $(pwd)/../data/processed:/data/processed \
  -v $(pwd)/../data/interim:/data/interim \
  exoplanet-backend
```

### Frontend

```bash
cd the-fuzzball-theorem-exoplanet-ai-fe
docker build -t exoplanet-frontend .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_BACKEND_API_URL_PROD=https://jayasankha-exo-orbit-lab.hf.space \
  exoplanet-frontend
```

## 🔄 CI/CD Pipeline

The project includes **automated CI/CD pipelines** using GitHub Actions for both frontend and backend components.

### Frontend Pipeline (`ci_frontend.yaml`)

**Triggers:**
- Push to any branch
- Pull requests to any branch

**Workflow Steps:**

1. **Build Job**
   - Checkout code with full history
   - Setup Node.js 20 with npm caching
   - Restore Next.js build cache for faster builds
   - Install dependencies with `npm ci`
   - Run ESLint for code quality checks
   - Build production bundle with environment variables

2. **Deploy to Production** (only on `main` branch)
   - Install Vercel CLI
   - Configure Vercel project settings
   - Deploy to production with `--prod` flag
   - Uses environment variables from GitHub Secrets

3. **Preview Build** (on non-main branches)
   - Create preview deployment on Vercel
   - Generates unique preview URL for each PR
   - Uses development environment variables

**Required GitHub Secrets:**
```
VERCEL_TOKEN           # Vercel authentication token
VERCEL_ORG_ID          # Vercel organization ID
VERCEL_PROJECT_ID      # Vercel project ID
NEXT_PUBLIC_BACKEND_API_URL_PROD  # Production backend URL
BACKEND_API_URL        # Development backend URL (for previews)
```

### Backend Pipeline (`ci_backend.yaml`)

**Triggers:**
- Push to any branch
- Pull requests to any branch

**Workflow Steps:**

1. **Build & Test Job**
   - Matrix testing on Python 3.11 and 3.12
   - Checkout code
   - Setup Python with pip caching
   - Install dependencies from `requirements.txt`
   - **Linting**: Run flake8 for syntax and style checks
   - **Type Checking**: Run mypy for static type analysis
   - Create test data directories
   - **Testing**: Run pytest with coverage reporting
   - Upload coverage to Codecov
   - Test FastAPI application startup
   - Build Docker image for validation

**Test Coverage:**
- Unit tests for API endpoints
- Health check tests
- Prediction endpoint tests
- Code coverage reports

### Setting Up CI/CD

1. **Fork/Clone the repository**

2. **Configure GitHub Secrets**
   - Go to: `Settings` → `Secrets and variables` → `Actions`
   - Add the following secrets:

   **Frontend Secrets:**
   ```bash
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   NEXT_PUBLIC_BACKEND_API_URL_PROD=https://jayasankha-exo-orbit-lab.hf.space
   BACKEND_API_URL=http://127.0.0.1:7860
   ```

   **Optional Backend Secrets:**
   ```bash
   CODECOV_TOKEN=your_codecov_token  # For coverage reporting
   ```

3. **Push to trigger workflows**
   ```bash
   git add .
   git commit -m "Trigger CI/CD pipeline"
   git push origin main
   ```

4. **Monitor workflow runs**
   - Navigate to `Actions` tab in GitHub repository
   - View real-time logs and build status
   - Check deployment URLs in workflow outputs

### Pipeline Features

✅ **Automated Testing**
- Backend: pytest with coverage
- Frontend: ESLint validation
- Multi-version Python testing

✅ **Caching Strategy**
- Node modules caching
- Pip dependencies caching
- Next.js build cache
- Faster subsequent builds

✅ **Branch-based Deployments**
- `main` branch → Production deployment
- Other branches → Preview deployments
- Automatic rollback on failure

✅ **Code Quality Checks**
- Python: flake8 linting + mypy type checking
- JavaScript/TypeScript: ESLint
- Continuous code quality monitoring

✅ **Docker Validation**
- Automated Docker image builds
- Ensures containerization compatibility

## ☁️ Production Deployment

### Frontend (Vercel)

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Configure Environment**:
   ```bash
   NEXT_PUBLIC_BACKEND_API_URL_PROD=https://jayasankha-exo-orbit-lab.hf.space
   ```
3. **Deploy**: Automatic deployment via GitHub Actions on push to main branch
4. **Preview Deployments**: Automatic preview URLs for pull requests

### Backend (HuggingFace Spaces)

1. **Create Space**: Create a new Docker space
2. **Upload Files**: Push backend code and artifacts
3. **Configure Secrets**: Set environment variables in Space settings
4. **Deploy**: Automatic deployment with persistent storage

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest app/tests/
```

### Frontend Tests

```bash
cd the-fuzzball-theorem-exoplanet-ai-fe
npm test
```

### Manual Testing

```bash
# Test backend health
curl http://127.0.0.1:7860/health

# Test prediction
curl -X GET "http://127.0.0.1:7860/predict/by_tic?tic_id=102713734"
```

## 📊 Model Performance

**Current Model (v1_oc - Isolation Forest)**:
- Precision: 0.85
- Recall: 0.78
- F1 Score: 0.81
- Average Precision: 0.83

**Training Data**:
- ~1,000 confirmed TESS exoplanet candidates
- Features derived from BLS analysis
- Cross-validated performance metrics

## 🛠️ Development

### Adding New Features

1. **Backend Feature**: Add to `backend/app/features/`
2. **Update Schema**: Modify `backend/app/schemas.py`
3. **Frontend Integration**: Update `src/lib/types.ts`
4. **UI Component**: Create/modify in `src/components/`

### Code Style

**Frontend**:
- TypeScript strict mode
- ESLint + Prettier
- Tailwind CSS for styling

**Backend**:
- PEP 8 compliance
- Type hints with Pydantic
- FastAPI best practices

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Environment Variables Reference

### Frontend (.env.local)
```bash
# Production backend URL (required for production)
NEXT_PUBLIC_BACKEND_API_URL_PROD=https://jayasankha-exo-orbit-lab.hf.space

# Local backend URL (for development)
NEXT_PUBLIC_BACKEND_API_URL=http://127.0.0.1:7860
```

### Backend
```bash
# Model and data directories
MODEL_DIR=/data/model              # Model artifacts location
PROCESSED_DIR=/data/processed      # Light curves location
INTERIM_DIR=/data/interim          # Feature cache location

# CORS settings
ALLOW_CORS=*                       # Allowed origins (* for all)

# BLS parameters
PERIOD_MIN=0.5                     # Minimum period (days)
PERIOD_MAX=30.0                    # Maximum period (days)
N_PERIODS=5000                     # Number of period samples
DUR_MIN_H=0.5                      # Minimum duration (hours)
DUR_MAX_H=10.0                     # Maximum duration (hours)
```

## 🐛 Troubleshooting

### Frontend Issues

**Problem**: `/undefined/health` 404 error in production
- **Solution**: Ensure `NEXT_PUBLIC_BACKEND_API_URL_PROD` is set in Vercel environment variables

**Problem**: Local backend not connecting
- **Solution**: Check backend is running on port 7860 and `NEXT_PUBLIC_BACKEND_API_URL` is correct

### Backend Issues

**Problem**: Model artifacts not found
- **Solution**: Verify `MODEL_DIR` points to correct location with `.pkl` and `.json` files

**Problem**: Light curve not found for TIC ID
- **Solution**: Run `fetch_tess_lightcurve.py` to download the data first

## 📚 Resources

- [TESS Mission](https://tess.mit.edu/)
- [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/)
- [Lightkurve Documentation](https://docs.lightkurve.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## 👥 Team

**The Fuzzball Theorem Team**
- [Vishwa Jayasankha](https://github.com/VishwaJaya01)
- [Jalina Hirushan](https://github.com/JalinaH)
- [Kavindya Kariyawasam](https://github.com/Kavindya-Kariyawasam)
- [Navoda Rajapakshe](https://github.com/Navoda-Rajapakshe01)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- NASA Space Apps Challenge for the opportunity
- TESS team for providing high-quality data
- Open-source community for amazing tools and libraries

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

<div align="center">
Made with ❤️ for NASA Space Apps Challenge 2025
</div>
