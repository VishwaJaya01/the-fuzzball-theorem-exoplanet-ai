/**
 * Bridge to communicate with Python model backend
 * Handles model predictions and data processing via CLI interface
 */

import { spawn } from "child_process";
import { join } from "path";

export interface ModelPrediction {
  score: number;
  period_days: number;
  duration_hours: number;
  depth_ppm: number;
  snr: number;
  t0: number;
  features: Record<string, number>;
  warnings: string[];
}

export interface LightCurveData {
  time: number[];
  flux: number[];
  flux_err?: number[];
}

export class PythonBridge {
  private modelDir: string;
  private dataDir: string;

  constructor() {
    // Navigate from frontend folder to project root
    const projectRoot = join(process.cwd(), "..");
    this.modelDir = join(projectRoot, "data", "model");
    this.dataDir = join(projectRoot, "data");
  }

  /**
   * Run Python model prediction on light curve data
   */
  async predictFromLightCurve(
    time: number[],
    flux: number[],
    flux_err?: number[],
    meta?: Record<string, any>
  ): Promise<ModelPrediction> {
    return new Promise((resolve, reject) => {
      const pythonScript = join(process.cwd(), "..", "model", "predict_cli.py");

      // Create input data object
      const input = {
        time,
        flux,
        flux_err: flux_err || null,
        meta: meta || {},
        model_dir: this.modelDir,
      };

      // Spawn Python process
      const python = spawn("python", [pythonScript], {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: join(process.cwd(), ".."),
      });

      let output = "";
      let error = "";

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        error += data.toString();
      });

      python.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(`Python script failed (exit code ${code}): ${error}`)
          );
          return;
        }

        try {
          const result = JSON.parse(output.trim());
          if (result.error) {
            reject(new Error(`Model error: ${result.error}`));
            return;
          }
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      });

      // Send input data to Python script
      python.stdin.write(JSON.stringify(input));
      python.stdin.end();
    });
  }

  /**
   * Load light curve data for a given TIC ID from preprocessed data
   */
  async loadLightCurveData(ticId: string): Promise<LightCurveData | null> {
    return new Promise((resolve, reject) => {
      const loadScript = `
import pandas as pd
import numpy as np
import json
import sys
from pathlib import Path

def load_tic_data(tic_id, data_dir):
    try:
        # Try to load from interim features folder
        features_path = Path(data_dir) / "interim" / "features" / f"TIC-{tic_id}.parquet"
        if features_path.exists():
            df = pd.read_parquet(features_path)
            if 'time' in df.columns and 'flux' in df.columns:
                result = {
                    'time': df['time'].tolist(),
                    'flux': df['flux'].tolist(),
                }
                if 'flux_err' in df.columns:
                    result['flux_err'] = df['flux_err'].tolist()
                return result
        
        # Try lightcurves folder
        lc_path = Path(data_dir) / "processed" / "lightcurves" / f"TIC-{tic_id}.parquet"
        if lc_path.exists():
            df = pd.read_parquet(lc_path)
            result = {
                'time': df['time'].tolist(),
                'flux': df['flux'].tolist(),
            }
            if 'flux_err' in df.columns:
                result['flux_err'] = df['flux_err'].tolist()
            return result
            
        return None
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    tic_id = sys.argv[1]
    data_dir = sys.argv[2]
    result = load_tic_data(tic_id, data_dir)
    print(json.dumps(result))
        `;

      const python = spawn("python", ["-c", loadScript, ticId, this.dataDir]);

      let output = "";
      let error = "";

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        error += data.toString();
      });

      python.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Failed to load TIC data: ${error}`));
          return;
        }

        try {
          const result = JSON.parse(output);
          if (result?.error) {
            reject(new Error(result.error));
            return;
          }
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse output: ${output}`));
        }
      });
    });
  }

  /**
   * Get metadata for a TIC ID from preprocessed metadata
   */
  async getStarMetadata(ticId: string): Promise<Record<string, any> | null> {
    return new Promise((resolve, reject) => {
      const metaScript = `
import pandas as pd
import json
import sys
from pathlib import Path

def get_tic_metadata(tic_id, data_dir):
    try:
        meta_path = Path(data_dir) / "processed" / "tic_meta.parquet"
        if meta_path.exists():
            df = pd.read_parquet(meta_path)
            # Look for TIC ID in various possible column names
            tic_cols = ['TIC', 'tic_id', 'tic', 'ID']
            tic_col = None
            for col in tic_cols:
                if col in df.columns:
                    tic_col = col
                    break
            
            if tic_col:
                row = df[df[tic_col].astype(str) == str(tic_id)]
                if len(row) > 0:
                    return row.iloc[0].to_dict()
        return None
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    tic_id = sys.argv[1]
    data_dir = sys.argv[2]
    result = get_tic_metadata(tic_id, data_dir)
    print(json.dumps(result, default=str))
        `;

      const python = spawn("python", ["-c", metaScript, ticId, this.dataDir]);

      let output = "";
      let error = "";

      python.stdout.on("data", (data) => {
        output += data.toString();
      });

      python.stderr.on("data", (data) => {
        error += data.toString();
      });

      python.on("close", (code) => {
        if (code !== 0) {
          console.warn(`Failed to load metadata: ${error}`);
          resolve(null);
          return;
        }

        try {
          const result = JSON.parse(output);
          if (result?.error) {
            console.warn("Metadata error:", result.error);
            resolve(null);
            return;
          }
          resolve(result);
        } catch (e) {
          console.warn("Failed to parse metadata:", output);
          resolve(null);
        }
      });
    });
  }
}

// Export singleton instance
export const pythonBridge = new PythonBridge();
