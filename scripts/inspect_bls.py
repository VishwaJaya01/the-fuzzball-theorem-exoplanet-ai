import numpy as np
import pandas as pd
from astropy.timeseries import BoxLeastSquares

path = 'data/processed/lightcurves/TIC-286923464.parquet'
df = pd.read_parquet(path)
print('rows', len(df))
flux = df['flux'].to_numpy()
time = df['time'].to_numpy()
flux = flux / np.median(flux) - 1
bls = BoxLeastSquares(time, flux)
periods = np.linspace(0.5, 30.0, 5000)
durations = np.linspace(0.5/24.0, 10.0/24.0, 20)
res = bls.power(periods, durations)
idx = int(np.nanargmax(res.power))
period = res.period[idx]
duration = res.duration[idx]
t0 = res.transit_time[idx]
stats = bls.compute_stats(period, duration, t0)
print('type', type(stats))
print('has colnames', getattr(stats, 'colnames', None))
print('keys', list(stats.keys()) if hasattr(stats, 'keys') else None)
print(stats)
