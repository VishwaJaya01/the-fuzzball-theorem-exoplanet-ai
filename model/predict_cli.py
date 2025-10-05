"""
CLI interface for the exoplanet prediction model
Reads JSON input from stdin, processes it, and outputs JSON result

Usage: echo '{"time": [...], "flux": [...], "model_dir": "..."}' | python predict_cli.py
"""

import json
import sys
import numpy as np
import pandas as pd
from pathlib import Path

# Add the model directory to path to import predict module
sys.path.append(str(Path(__file__).parent))

try:
    from predict import predict_from_lightcurve, load_model
except ImportError as e:
    print(json.dumps({"error": f"Failed to import predict module: {e}"}))
    sys.exit(1)

def main():
    try:
        # Read input from stdin
        input_text = sys.stdin.read().strip()
        if not input_text:
            raise ValueError("No input data received")
        
        input_data = json.loads(input_text)
        
        # Validate required fields
        if 'time' not in input_data or 'flux' not in input_data:
            raise ValueError("Both 'time' and 'flux' are required in input data")
        
        # Convert to numpy arrays
        time = np.array(input_data['time'], dtype=float)
        flux = np.array(input_data['flux'], dtype=float)
        
        # Optional fields
        flux_err = input_data.get('flux_err')
        if flux_err is not None:
            flux_err = np.array(flux_err, dtype=float)
        
        meta = input_data.get('meta', {})
        model_dir = input_data.get('model_dir', str(Path(__file__).parent.parent / "data" / "model"))
        
        # Validate arrays have same length
        if len(time) != len(flux):
            raise ValueError(f"Time and flux arrays must have same length: {len(time)} vs {len(flux)}")
        
        if flux_err is not None and len(flux_err) != len(flux):
            raise ValueError(f"Flux_err array must have same length as flux: {len(flux_err)} vs {len(flux)}")
        
        # Run prediction
        result = predict_from_lightcurve(
            time=time,
            flux=flux, 
            flux_err=flux_err,
            meta=meta,
            model_dir=model_dir
        )
        
        # Convert numpy types to JSON serializable
        def convert_numpy(obj):
            if isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, (np.float32, np.float64)):
                return float(obj)
            elif isinstance(obj, (np.int32, np.int64)):
                return int(obj)
            elif isinstance(obj, dict):
                return {k: convert_numpy(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_numpy(v) for v in obj]
            elif pd.isna(obj):
                return None
            return obj
        
        # Clean the result
        result = convert_numpy(result)
        
        # Ensure required fields are present
        if 'score' not in result:
            result['score'] = 0.0
        if 'warnings' not in result:
            result['warnings'] = []
        
        # Output result as JSON
        print(json.dumps(result))
        
    except json.JSONDecodeError as e:
        error_result = {
            'error': f'Invalid JSON input: {e}',
            'score': 0.0,
            'warnings': ['json_decode_error']
        }
        print(json.dumps(error_result))
        sys.exit(1)
        
    except Exception as e:
        error_result = {
            'error': f'Prediction failed: {str(e)}',
            'score': 0.0,
            'warnings': ['prediction_failed']
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()