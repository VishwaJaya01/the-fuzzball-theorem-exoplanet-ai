# Integration Testing Guide

This guide helps you test the complete exoplanet detection system integration.

## Prerequisites

1. **Python Environment**: Ensure Python is installed with required packages:

   ```bash
   pip install -r requirements.txt
   ```

   Or manually:

   ```bash
   pip install pandas numpy astropy joblib scikit-learn
   ```

2. **Model Artifacts**: Ensure the model files exist in `data/model/`:

   - `latest.txt`
   - `model_iso_v1_oc.pkl`
   - `scaler_v1_oc.pkl`
   - `feature_names_v1_oc.json`
   - `metrics_v1_oc.json`

3. **Data Files**: Ensure preprocessed data exists in:
   - `data/interim/features/` (TIC parquet files)
   - `data/processed/` (metadata and lightcurves)

## Testing Steps

### 1. Test API Health Check

Start your Next.js development server:

```bash
cd the-fuzzball-theorem-exoplanet-ai-fe
npm run dev
```

Then test the health endpoint:

**For PowerShell (Windows):**

```powershell
curl.exe http://localhost:3000/api/health
```

**For Bash (Linux/Mac):**

```bash
curl http://localhost:3000/api/health
```

Expected response should show:

- `status: "ok"` or `status: "degraded"`
- `ml_model: "loaded"`
- `data_service: "available"`
- Model version information

### 2. Test Python CLI Interface

Test the Python CLI directly:

```bash
cd model
echo '{"time": [1,2,3,4,5], "flux": [1.0,0.99,1.0,0.98,1.0]}' | python predict_cli.py
```

Expected output: JSON with score, features, and warnings.

### 3. Test API Endpoints

#### Test TESS Data Loading

**For PowerShell (Windows):**

```powershell
curl.exe "http://localhost:3000/api/tess?ticId=123456789"
```

**For Bash (Linux/Mac):**

```bash
curl "http://localhost:3000/api/tess?ticId=123456789"
```

#### Test Prediction with TIC ID

**For PowerShell (Windows):**

```powershell
curl.exe -X POST "http://localhost:3000/api/predict" -H "Content-Type: application/json" -d '{\"source\": \"tic\", \"ticId\": \"123456789\"}'
```

**For Bash (Linux/Mac):**

```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"source": "tic", "ticId": "123456789"}'
```

#### Test Analysis with CSV Data

**For PowerShell (Windows):**

```powershell
curl.exe -X POST "http://localhost:3000/api/analyze" -H "Content-Type: application/json" -d '{\"source\": \"csv\", \"csvData\": {\"time\": [1,2,3,4,5,6,7,8,9,10], \"flux\": [1.0,0.99,1.01,0.98,1.0,0.99,1.01,0.97,1.0,0.99]}}'
```

**For Bash (Linux/Mac):**

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "source": "csv",
    "csvData": {
      "time": [1,2,3,4,5,6,7,8,9,10],
      "flux": [1.0,0.99,1.01,0.98,1.0,0.99,1.01,0.97,1.0,0.99]
    }
  }'
```

### 4. Test Frontend Integration

1. Open http://localhost:3000 in your browser
2. Try entering a TIC ID that exists in your dataset
3. Try uploading a CSV file with time and flux columns
4. Verify that results display properly with:
   - Light curve plot
   - Detection scores
   - Model warnings
   - Star metadata (if available)

## Expected Test Results

### Successful Integration Should Show:

- Health check returns model loaded status
- Python CLI processes light curve data
- API endpoints return real predictions (not mock data)
- Frontend displays actual light curves and scores
- Error handling works for invalid TIC IDs

### Common Issues and Solutions:

**Issue**: `Python script failed` error

- **Solution**: Check Python is in PATH, required packages installed

**Issue**: `No light curve data found for TIC X`

- **Solution**: Verify TIC ID exists in your preprocessed dataset

**Issue**: `Model loading failed`

- **Solution**: Check model artifacts exist and are valid

**Issue**: `Failed to parse Python output`

- **Solution**: Check for Python syntax errors or missing dependencies

## Performance Notes

- First API call may be slow (model loading)
- Subsequent calls should be faster (model cached)
- Large datasets (>10k points) may take longer to process
- Consider implementing caching for frequently accessed TIC IDs

## Windows-Specific Issues

### PowerShell curl Commands

- Use `curl.exe` instead of `curl` to avoid PowerShell aliases
- Escape quotes in JSON: `\"` instead of `"`
- Use single-line format for complex JSON

### Python Module Issues

1. Install dependencies: `pip install -r requirements.txt`
2. If pip fails, try: `python -m pip install pandas numpy astropy joblib scikit-learn`
3. Check Python version: `python --version` (should be 3.8+)
4. Verify installation: `python -c "import astropy; print('astropy installed')"`

### Path Issues

- Ensure you're in the correct directory when running commands
- Use absolute paths if relative paths fail
- Check that Python is in your system PATH

## Debug Tips

1. Check browser developer console for frontend errors
2. Check terminal logs for Python/Node.js errors
3. Test Python CLI separately to isolate issues
4. Verify file paths are correct for your system
5. Check that all required dependencies are installed
6. For Windows: Use `curl.exe` and escape JSON properly
