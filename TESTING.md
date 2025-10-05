# Testing Guide

This guide helps you test the exoplanet detection system.

## Prerequisites

1. **Python Environment**: Ensure Python is installed with required packages:

   ```bash
   pip install pandas numpy astropy joblib scikit-learn
   ```

2. **Model Files**: Verify model artifacts exist in `data/model/`:

   - `latest.txt`, `model_iso_v1_oc.pkl`, `scaler_v1_oc.pkl`, `feature_names_v1_oc.json`

3. **Data Files**: Ensure lightcurve data exists in:
   - `data/processed/lightcurves/` (TIC parquet files)

## Quick Start

### 1. Start the Application

```bash
cd the-fuzzball-theorem-exoplanet-ai-fe
npm run dev
```

Open http://localhost:3000 in your browser.

### 2. Test with Known Planet Candidates

Try these TIC IDs from the dataset:

- **TIC 148673433** - High confidence candidate
- **TIC 396740648** - Deep transit detection
- **TIC 254113311** - Good period candidate

### 3. Test API Health

```bash
curl http://localhost:3000/api/health
```

Expected: `status: "ok"` with model version info.

## Expected Results

### Confidence Scoring

The system uses robust confidence calculation based on transit parameters:

- **≥70%**: "Likely Planet" (high confidence)
- **40-69%**: "Possible Planet" (medium confidence)
- **15-39%**: "Unlikely Planet" (low confidence)
- **<15%**: "No Transit Detected"

### For TIC 148673433 (Test Case)

- **Expected Score**: ~72%
- **Label**: "Likely Planet"
- **Parameters**: Period ~3.77 days, Depth ~944 ppm

## Common Issues

**Issue**: All detections show 0% confidence

- **Solution**: Check model files exist in `data/model/`

**Issue**: "No light curve data found"

- **Solution**: Verify TIC ID exists in `data/processed/lightcurves/`

**Issue**: Python/API errors

- **Solution**: Ensure all dependencies installed via `pip install pandas numpy astropy joblib scikit-learn`

## Architecture Notes

- **Frontend**: Next.js React app with TypeScript
- **Backend**: Python CLI integration via spawn processes
- **ML Model**: IsolationForest anomaly detection with BLS feature extraction
- **Scoring**: Robust parameter-based confidence calculation with ML fallback
- **Data**: Preprocessed TESS lightcurves and candidate metadata

## Performance

- First prediction may be slower (model loading)
- Subsequent calls are faster (model cached)
- ~15K data points per lightcurve processed efficiently
