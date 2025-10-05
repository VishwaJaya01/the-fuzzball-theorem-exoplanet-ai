"""
Integration test script for the exoplanet detection system
Tests the complete pipeline from data loading to model prediction
"""

import json
import sys
from pathlib import Path
import pandas as pd

# Add the model directory to path
model_dir = Path(__file__).parent.parent / "model"
sys.path.append(str(model_dir))

try:
    from predict import predict_from_lightcurve, load_model
    print("✓ Successfully imported predict functions")
except ImportError as e:
    print(f"✗ Failed to import predict module: {e}")
    sys.exit(1)

def test_model_loading():
    """Test if the model can be loaded"""
    try:
        model_dir_path = Path(__file__).parent.parent / "data" / "model"
        state = load_model(model_dir_path)
        print(f"✓ Model loaded successfully: {state['mode']} mode")
        print(f"  - Model type: {type(state['model'])}")
        print(f"  - Feature count: {len(state['feature_names'])}")
        return True
    except Exception as e:
        print(f"✗ Model loading failed: {e}")
        return False

def test_data_availability():
    """Test if preprocessed data is available"""
    data_dir = Path(__file__).parent.parent / "data"
    
    # Check interim features
    interim_dir = data_dir / "interim" / "features"
    if interim_dir.exists():
        parquet_files = list(interim_dir.glob("*.parquet"))
        print(f"✓ Found {len(parquet_files)} feature files in interim/features/")
        
        # Test loading one file
        if parquet_files:
            try:
                sample_file = parquet_files[0]
                df = pd.read_parquet(sample_file)
                print(f"  - Sample file: {sample_file.name} ({len(df)} rows, {len(df.columns)} cols)")
                print(f"  - Columns: {list(df.columns)[:5]}...")
                return True
            except Exception as e:
                print(f"✗ Failed to load sample data file: {e}")
    
    # Check processed lightcurves
    lc_dir = data_dir / "processed" / "lightcurves"
    if lc_dir.exists():
        lc_files = list(lc_dir.glob("*.parquet"))
        print(f"✓ Found {len(lc_files)} lightcurve files in processed/lightcurves/")
        return len(lc_files) > 0
    
    print("✗ No preprocessed data found")
    return False

def test_end_to_end():
    """Test complete prediction pipeline"""
    # Create mock light curve data
    import numpy as np
    
    # Generate synthetic transit-like data
    time = np.linspace(0, 30, 1000)  # 30 days
    flux = np.ones_like(time)
    
    # Add some transit-like dips
    period = 5.0
    transit_duration = 0.1
    transit_depth = 0.01
    
    for i in range(int(30 / period)):
        transit_center = i * period
        mask = np.abs(time - transit_center) < transit_duration / 2
        flux[mask] -= transit_depth
    
    # Add noise
    flux += np.random.normal(0, 0.001, len(flux))
    
    try:
        model_dir_path = Path(__file__).parent.parent / "data" / "model"
        result = predict_from_lightcurve(
            time=time,
            flux=flux,
            model_dir=model_dir_path
        )
        
        print("✓ End-to-end prediction successful")
        print(f"  - Score: {result.get('score', 'N/A'):.3f}")
        print(f"  - Period: {result.get('period_days', 'N/A'):.2f} days")
        print(f"  - Depth: {result.get('depth_ppm', 'N/A'):.0f} ppm")
        print(f"  - SNR: {result.get('snr', 'N/A'):.1f}")
        print(f"  - Warnings: {result.get('warnings', [])}")
        
        return True
    except Exception as e:
        print(f"✗ End-to-end test failed: {e}")
        return False

def main():
    """Run all integration tests"""
    print("Running Exoplanet Detection Integration Tests")
    print("=" * 50)
    
    tests = [
        ("Model Loading", test_model_loading),
        ("Data Availability", test_data_availability),
        ("End-to-End Pipeline", test_end_to_end),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        result = test_func()
        results.append(result)
    
    print("\n" + "=" * 50)
    print("Test Summary:")
    
    for i, (test_name, _) in enumerate(tests):
        status = "PASS" if results[i] else "FAIL"
        icon = "✓" if results[i] else "✗"
        print(f"  {icon} {test_name}: {status}")
    
    total_passed = sum(results)
    print(f"\nTotal: {total_passed}/{len(tests)} tests passed")
    
    if total_passed == len(tests):
        print("All tests passed! Integration is ready.")
        return 0
    else:
        print("Some tests failed. Check the integration.")
        return 1

if __name__ == "__main__":
    sys.exit(main())