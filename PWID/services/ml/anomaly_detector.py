"""
Behavioral Anomaly Detection for PWIDs
Uses PyOD ensemble models for advanced anomaly detection:
- LOF (Local Outlier Factor) for contextual anomalies
- COPOD (Copula-based) for multivariate anomalies
- AutoEncoder for deep learning-based detection
Includes advanced time-series feature extraction and SHAP explainability
"""

import numpy as np
from pyod.models.lof import LOF  # Local Outlier Factor for contextual anomalies
from pyod.models.copod import COPOD  # Copula-based for multivariate
from pyod.models.auto_encoder import AutoEncoder  # Deep learning anomalies
from sklearn.preprocessing import StandardScaler
import pandas as pd
from datetime import datetime, timedelta
import joblib
import os
from typing import List, Dict, Optional, Any
import ruptures as rpt  # Change point detection
from scipy import signal
from scipy.stats import linregress
import shap
import warnings
warnings.filterwarnings('ignore', category=FutureWarning)

class BehavioralAnomalyDetector:
    """
    Detects unusual behavioral patterns for individual PWIDs.
    Uses PyOD ensemble approach with three models:
    1. LOF - Detects contextual anomalies based on local neighborhood density
    2. COPOD - Fast, parameter-free multivariate anomaly detection
    3. AutoEncoder - Deep learning for complex pattern recognition
    Maintains separate baseline models per PWID.
    """
    
    def __init__(self, models_dir: str = 'models/anomaly'):
        self.lof_models = {}  # LOF models per PWID
        self.copod_models = {}  # COPOD models per PWID
        self.ae_models = {}  # AutoEncoder models per PWID
        self.scalers = {}
        self.baselines = {}  # Store baseline statistics
        self.shap_explainers = {}  # SHAP explainers per PWID
        self.models_dir = models_dir
        os.makedirs(models_dir, exist_ok=True)
        
    def prepare_features(self, observations: List[Any]) -> pd.DataFrame:
        """Convert observations to feature matrix for anomaly detection"""
        features = []
        
        for obs in observations:
            # Handle both dict and object inputs
            if isinstance(obs, dict):
                timestamp = obs.get('timestamp') or obs.get('created_at', datetime.now())
                if isinstance(timestamp, str):
                    timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                
                feature_row = {
                    'hour_of_day': timestamp.hour,
                    'day_of_week': timestamp.weekday(),
                    'mood_score': self._mood_to_score(obs.get('mood', 'Unknown')),
                    'sleep_score': self._sleep_to_score(obs.get('sleep_quality', 'Unknown')),
                    'meal_score': self._meal_to_score(obs.get('meals', 'Unknown')),
                    'medication_compliance': 1 if obs.get('medication_given') in ['yes', 'Yes', True] else 0,
                    'activity_done': 1 if obs.get('activity_done') in ['yes', 'Yes', True] else 0,
                    'incident_severity': self._incident_to_score(obs.get('incident', 'None')),
                }
            else:
                # SQLAlchemy model object
                timestamp = getattr(obs, 'created_at', datetime.now())
                
                feature_row = {
                    'hour_of_day': timestamp.hour,
                    'day_of_week': timestamp.weekday(),
                    'mood_score': self._mood_to_score(getattr(obs, 'mood', 'Unknown')),
                    'sleep_score': self._sleep_to_score(getattr(obs, 'sleep_quality', 'Unknown')),
                    'meal_score': self._meal_to_score(getattr(obs, 'meals', 'Unknown')),
                    'medication_compliance': 1 if getattr(obs, 'medication_given', 'no') in ['yes', 'Yes', True] else 0,
                    'activity_done': 1 if getattr(obs, 'activity_done', 'no') in ['yes', 'Yes', True] else 0,
                    'incident_severity': self._incident_to_score(getattr(obs, 'incident', 'None')),
                }
            
            features.append(feature_row)
            
        return pd.DataFrame(features)
    
    def extract_ts_features(self, series: pd.Series, feature_name: str = 'value') -> Dict:
        """
        Extract advanced time-series features from a behavioral metric series.
        Returns dict with autocorrelation, Hurst exponent, Lyapunov exponent, 
        seasonality, and change points.
        """
        if len(series) < 7:
            return {}
        
        # Remove NaN values
        series_clean = series.dropna()
        if len(series_clean) < 7:
            return {}
        
        ts_features = {}
        
        # 1. Autocorrelation (lag-1): measures short-term memory
        try:
            ts_features[f'{feature_name}_autocorr_lag1'] = series_clean.autocorr(lag=1)
            if len(series_clean) >= 7:
                ts_features[f'{feature_name}_autocorr_lag7'] = series_clean.autocorr(lag=7)
        except:
            ts_features[f'{feature_name}_autocorr_lag1'] = 0
            ts_features[f'{feature_name}_autocorr_lag7'] = 0
        
        # 2. Hurst exponent: measures long-term memory and trend persistence
        try:
            ts_features[f'{feature_name}_hurst'] = self._compute_hurst(series_clean.values)
        except:
            ts_features[f'{feature_name}_hurst'] = 0.5  # Random walk
        
        # 3. Lyapunov exponent approximation: measures predictability/chaos
        try:
            ts_features[f'{feature_name}_lyapunov'] = self._compute_lyapunov(series_clean.values)
        except:
            ts_features[f'{feature_name}_lyapunov'] = 0
        
        # 4. Seasonal strength: measures cyclical patterns
        try:
            ts_features[f'{feature_name}_seasonal_strength'] = self._compute_seasonality(series_clean.values)
        except:
            ts_features[f'{feature_name}_seasonal_strength'] = 0
        
        # 5. Change points: when behavior fundamentally changed
        try:
            ts_features[f'{feature_name}_changepoints_count'] = self._detect_changepoints(series_clean.values)
        except:
            ts_features[f'{feature_name}_changepoints_count'] = 0
        
        # 6. Trend strength
        try:
            ts_features[f'{feature_name}_trend_slope'] = self._compute_trend_slope(series_clean.values)
        except:
            ts_features[f'{feature_name}_trend_slope'] = 0
        
        # 7. Volatility (standard deviation of differences)
        try:
            diffs = np.diff(series_clean.values)
            ts_features[f'{feature_name}_volatility'] = np.std(diffs) if len(diffs) > 0 else 0
        except:
            ts_features[f'{feature_name}_volatility'] = 0
        
        return ts_features
    
    def _compute_hurst(self, series: np.ndarray) -> float:
        """
        Compute Hurst exponent using rescaled range (R/S) analysis.
        H < 0.5: Mean-reverting (anti-persistent)
        H = 0.5: Random walk (no memory)
        H > 0.5: Trending (persistent, long memory)
        """
        if len(series) < 20:
            return 0.5
        
        lags = range(2, min(20, len(series) // 2))
        tau = []
        
        for lag in lags:
            # Split series into chunks
            n_chunks = len(series) // lag
            if n_chunks == 0:
                continue
                
            chunks = [series[i*lag:(i+1)*lag] for i in range(n_chunks)]
            rs_values = []
            
            for chunk in chunks:
                if len(chunk) < 2:
                    continue
                mean = np.mean(chunk)
                cumsum = np.cumsum(chunk - mean)
                R = np.max(cumsum) - np.min(cumsum)
                S = np.std(chunk)
                if S > 0:
                    rs_values.append(R / S)
            
            if rs_values:
                tau.append(np.mean(rs_values))
        
        if len(tau) < 2:
            return 0.5
        
        # Hurst = slope of log(R/S) vs log(lag)
        try:
            log_lags = np.log(list(lags)[:len(tau)])
            log_tau = np.log(tau)
            slope, _, _, _, _ = linregress(log_lags, log_tau)
            return max(0, min(1, slope))  # Bound between 0 and 1
        except:
            return 0.5
    
    def _compute_lyapunov(self, series: np.ndarray, max_lag: int = 10) -> float:
        """
        Approximate Lyapunov exponent (largest) using time-delayed embedding.
        Positive: Chaotic/unpredictable
        Zero: Stable/neutral
        Negative: Converging/predictable
        """
        if len(series) < 20:
            return 0
        
        # Normalize series
        series_norm = (series - np.mean(series)) / (np.std(series) + 1e-10)
        
        # Time-delayed embedding
        n = len(series_norm) - max_lag
        if n < 10:
            return 0
        
        divergence_sum = 0
        count = 0
        
        for i in range(n - 1):
            # Find nearest neighbor
            distances = []
            for j in range(n):
                if abs(i - j) > 1:  # Exclude immediate neighbors
                    dist = abs(series_norm[i] - series_norm[j])
                    distances.append((dist, j))
            
            if not distances:
                continue
            
            distances.sort()
            nearest_idx = distances[0][1]
            
            # Measure divergence after one step
            div = abs(series_norm[i + 1] - series_norm[nearest_idx + 1])
            if div > 1e-10:
                divergence_sum += np.log(div)
                count += 1
        
        return divergence_sum / count if count > 0 else 0
    
    def _compute_seasonality(self, series: np.ndarray, period: int = 7) -> float:
        """
        Compute seasonal strength using STL decomposition approximation.
        Returns value between 0 (no seasonality) and 1 (strong seasonality).
        """
        if len(series) < 2 * period:
            return 0
        
        # Simple seasonal strength: correlation with lagged version
        try:
            if len(series) >= period:
                seasonal_corr = np.corrcoef(series[:-period], series[period:])[0, 1]
                return max(0, seasonal_corr)  # Only positive correlations
            return 0
        except:
            return 0
    
    def _detect_changepoints(self, series: np.ndarray, penalty: int = 3) -> int:
        """
        Detect change points in time series using ruptures library.
        Returns number of significant regime changes.
        """
        if len(series) < 10:
            return 0
        
        try:
            # Use PELT (Pruned Exact Linear Time) algorithm
            algo = rpt.Pelt(model="rbf", min_size=3, jump=1).fit(series.reshape(-1, 1))
            change_points = algo.predict(pen=penalty)
            # Subtract 1 because last point is always included
            return max(0, len(change_points) - 1)
        except:
            return 0
    
    def _compute_trend_slope(self, series: np.ndarray) -> float:
        """
        Compute linear trend slope.
        Positive: Increasing trend
        Negative: Decreasing trend
        """
        if len(series) < 3:
            return 0
        
        x = np.arange(len(series))
        slope, _, _, _, _ = linregress(x, series)
        return slope
    
    def prepare_features_with_history(self, observations: List[Any], include_ts_features: bool = True) -> pd.DataFrame:
        """
        Enhanced feature preparation that includes time-series features
        when sufficient historical data is available.
        """
        # Get basic features
        df = self.prepare_features(observations)
        
        if not include_ts_features or len(observations) < 7:
            return df
        
        # Extract time-series features for key metrics
        ts_features_list = []
        
        for idx in range(len(df)):
            # For each observation, look at historical window
            window_size = min(idx + 1, 14)  # Up to 2 weeks history
            if window_size < 7:
                ts_features_list.append({})
                continue
            
            window_df = df.iloc[max(0, idx - window_size + 1):idx + 1]
            
            # Extract TS features for mood, sleep, and incident
            ts_feats = {}
            if 'mood_score' in window_df.columns:
                ts_feats.update(self.extract_ts_features(window_df['mood_score'], 'mood'))
            if 'sleep_score' in window_df.columns:
                ts_feats.update(self.extract_ts_features(window_df['sleep_score'], 'sleep'))
            if 'incident_severity' in window_df.columns:
                ts_feats.update(self.extract_ts_features(window_df['incident_severity'], 'incident'))
            
            ts_features_list.append(ts_feats)
        
        # Convert to DataFrame and concatenate
        if ts_features_list and any(ts_features_list):
            ts_df = pd.DataFrame(ts_features_list).fillna(0)
            df = pd.concat([df.reset_index(drop=True), ts_df.reset_index(drop=True)], axis=1)
        
        return df
    
    def _mood_to_score(self, mood: str) -> int:
        """Convert mood string to numerical score (higher = worse)"""
        mood_map = {
            'calm': 1, 'Calm': 1,
            'happy': 1, 'Happy': 1,
            'anxious': 3, 'Anxious': 3,
            'irritable': 4, 'Irritable': 4,
            'aggressive': 5, 'Aggressive': 5,
            'unknown': 2, 'Unknown': 2
        }
        return mood_map.get(mood, 2)
    
    def _sleep_to_score(self, sleep: str) -> int:
        """Convert sleep quality to numerical score"""
        sleep_map = {
            'good': 1, 'Good': 1,
            'disturbed': 2, 'Disturbed': 2,
            'poor': 3, 'Poor': 3,
            'unknown': 2, 'Unknown': 2
        }
        return sleep_map.get(sleep, 2)
    
    def _meal_to_score(self, meals: str) -> int:
        """Convert meal status to numerical score"""
        meal_map = {
            'normal': 1, 'Normal': 1, 'taken': 1, 'Taken': 1,
            'reduced': 2, 'Reduced': 2,
            'skipped': 3, 'Skipped': 3,
            'unknown': 2, 'Unknown': 2
        }
        return meal_map.get(meals, 2)
    
    def _incident_to_score(self, incident: str) -> int:
        """Convert incident status to numerical score"""
        incident_map = {
            'none': 0, 'None': 0, 'no': 0, 'No': 0,
            'minor': 2, 'Minor': 2,
            'concerning': 4, 'Concerning': 4,
            'yes': 3, 'Yes': 3,
            'unknown': 1, 'Unknown': 1
        }
        return incident_map.get(incident, 1)
    
    def train_baseline(self, pwid_id: int, observations: List[Any], use_ts_features: bool = True) -> Dict:
        """
        Train individual behavioral baseline for a PWID.
        Requires at least 14 days (2 weeks) of observations for reliable baseline.
        Includes time-series features for better temporal pattern recognition.
        """
        if len(observations) < 14:
            return {
                'status': 'insufficient_data',
                'message': f'Need at least 14 observations, got {len(observations)}',
                'samples_available': len(observations),
                'samples_required': 14
            }
        
        # Use enhanced feature extraction with time-series features
        df = self.prepare_features_with_history(observations, include_ts_features=use_ts_features)
        
        # Store baseline statistics
        self.baselines[pwid_id] = {
            'mean': df.mean().to_dict(),
            'std': df.std().to_dict(),
            'median': df.median().to_dict(),
            'samples_used': len(observations),
            'trained_at': datetime.now().isoformat(),
            'ts_features_enabled': use_ts_features
        }
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(df)
        
        # Train LOF model for contextual anomalies
        lof_model = LOF(
            n_neighbors=min(20, max(5, len(observations) // 3)),
            contamination=0.1,
            n_jobs=-1
        )
        lof_model.fit(X_scaled)
        
        # Train COPOD for fast multivariate detection
        copod_model = COPOD(contamination=0.1)
        copod_model.fit(X_scaled)
        
        # Train AutoEncoder for deep learning detection
        ae_model = AutoEncoder(
            hidden_neuron_list=[8, 4, 4, 8],  # Corrected parameter name
            contamination=0.1,
            epochs=50,
            batch_size=min(32, len(observations) // 2),
            verbose=0
        )
        ae_model.fit(X_scaled)
        
        # Store all models and scaler
        self.lof_models[pwid_id] = lof_model
        self.copod_models[pwid_id] = copod_model
        self.ae_models[pwid_id] = ae_model
        self.scalers[pwid_id] = scaler
        
        # Save to disk
        self._save_model(pwid_id)
        
        return {
            'status': 'trained',
            'pwid_id': pwid_id,
            'samples_used': len(observations),
            'baseline_stats': self.baselines[pwid_id],
            'message': f'Baseline trained successfully with {len(observations)} observations'
        }
    
    def detect_anomaly(self, pwid_id: int, observation: Any, historical_observations: List[Any] = None) -> Dict:
        """
        Check if a single observation is anomalous using ensemble approach.
        Combines predictions from LOF, COPOD, and AutoEncoder.
        If historical_observations provided, includes time-series features.
        Returns anomaly score, boolean flag, and explanation.
        """
        if pwid_id not in self.lof_models:
            # Try to load from disk
            if not self._load_model(pwid_id):
                return {
                    'is_anomaly': False,
                    'confidence': 0,
                    'reason': 'No baseline model exists for this PWID',
                    'recommendation': 'Need at least 14 observations to build baseline'
                }
        
        # Check if time-series features were used during training
        ts_enabled = self.baselines.get(pwid_id, {}).get('ts_features_enabled', False)
        
        if ts_enabled and historical_observations and len(historical_observations) >= 7:
            # Include time-series features
            all_obs = historical_observations + [observation]
            df = self.prepare_features_with_history(all_obs, include_ts_features=True)
            df = df.iloc[[-1]]  # Get only the last row
        else:
            # Use basic features only
            df = self.prepare_features([observation])
        
        # Ensure feature alignment with training
        expected_features = list(self.baselines[pwid_id]['mean'].keys())
        for feat in expected_features:
            if feat not in df.columns:
                df[feat] = 0
        df = df[expected_features]
        
        X_scaled = self.scalers[pwid_id].transform(df)
        
        # Get predictions from all three models
        lof_score = self.lof_models[pwid_id].decision_function(X_scaled)[0]
        lof_pred = self.lof_models[pwid_id].predict(X_scaled)[0]
        
        copod_score = self.copod_models[pwid_id].decision_function(X_scaled)[0]
        copod_pred = self.copod_models[pwid_id].predict(X_scaled)[0]
        
        ae_score = self.ae_models[pwid_id].decision_function(X_scaled)[0]
        ae_pred = self.ae_models[pwid_id].predict(X_scaled)[0]
        
        # Ensemble voting: anomaly if 2+ models agree
        anomaly_votes = [lof_pred, copod_pred, ae_pred]
        is_anomaly = sum(anomaly_votes) >= 2
        
        # Average normalized anomaly scores (higher = more anomalous)
        avg_score = (lof_score + copod_score + ae_score) / 3
        
        # Identify which features triggered the anomaly
        triggered_features = self._identify_triggers(pwid_id, df.iloc[0])
        
        # Add SHAP explanation for interpretability
        shap_explanation = self._explain_anomaly_with_shap(pwid_id, X_scaled, df.columns.tolist())
        
        result = {
            'is_anomaly': is_anomaly,
            'anomaly_score': float(avg_score),
            'confidence': min(abs(avg_score) * 100, 100),
            'model_agreement': {
                'lof_anomaly': bool(lof_pred),
                'copod_anomaly': bool(copod_pred),
                'autoencoder_anomaly': bool(ae_pred),
                'consensus': f'{sum(anomaly_votes)}/3 models'
            },
            'triggered_features': triggered_features,
            'severity': self._classify_severity(avg_score),
            'recommendation': self._get_recommendation(is_anomaly, triggered_features)
        }
        
        # Add SHAP explanation if available
        if shap_explanation:
            result['shap_explanation'] = shap_explanation
            result['human_readable_explanation'] = shap_explanation.get('summary', '')
        
        return result
    
    def detect_batch_anomalies(self, pwid_id: int, observations: List[Any]) -> Dict:
        """Detect anomalies in a batch of observations"""
        results = []
        anomaly_count = 0
        
        for obs in observations:
            result = self.detect_anomaly(pwid_id, obs)
            results.append(result)
            if result.get('is_anomaly'):
                anomaly_count += 1
        
        return {
            'total_observations': len(observations),
            'anomalies_detected': anomaly_count,
            'anomaly_rate': anomaly_count / len(observations) if observations else 0,
            'details': results
        }
    
    def _identify_triggers(self, pwid_id: int, observation_row: pd.Series) -> List[Dict]:
        """Identify which features are most different from baseline"""
        if pwid_id not in self.baselines:
            return []
        
        baseline = self.baselines[pwid_id]
        triggers = []
        
        for feature, value in observation_row.items():
            if feature in baseline['mean'] and baseline['std'].get(feature, 0) > 0:
                z_score = (value - baseline['mean'][feature]) / baseline['std'][feature]
                if abs(z_score) > 1.5:  # Beyond 1.5 standard deviations
                    triggers.append({
                        'feature': feature,
                        'current_value': float(value),
                        'baseline_mean': round(baseline['mean'][feature], 2),
                        'deviation': round(z_score, 2),
                        'direction': 'above_normal' if z_score > 0 else 'below_normal'
                    })
        
        return sorted(triggers, key=lambda x: abs(x['deviation']), reverse=True)
    
    def _classify_severity(self, anomaly_score: float) -> str:
        """Classify anomaly severity based on score"""
        if anomaly_score > 0.5:
            return 'critical'
        elif anomaly_score > 0.3:
            return 'high'
        elif anomaly_score > 0.1:
            return 'moderate'
        else:
            return 'low'
    
    def _get_recommendation(self, is_anomaly: bool, triggers: List[Dict]) -> str:
        """Generate actionable recommendation based on anomaly detection"""
        if not is_anomaly:
            return 'Observation within normal range. Continue standard monitoring.'
        
        if not triggers:
            return 'Unusual pattern detected. Increase observation frequency.'
        
        # Generate specific recommendations based on triggered features
        recommendations = []
        
        for trigger in triggers[:3]:  # Top 3 triggers
            feature = trigger['feature']
            direction = trigger['direction']
            
            if 'mood' in feature:
                if direction == 'above_normal':
                    recommendations.append('Mood appears worse than usual - consider calming activities')
            elif 'sleep' in feature:
                if direction == 'above_normal':
                    recommendations.append('Sleep quality deteriorating - review bedtime routine')
            elif 'incident' in feature:
                recommendations.append('Incident severity unusual - document details and triggers')
            elif 'medication' in feature:
                recommendations.append('Medication compliance issue - verify administration')
        
        return '; '.join(recommendations) if recommendations else 'Unusual pattern detected. Monitor closely.'
    
    def _explain_anomaly_with_shap(self, pwid_id: int, X_scaled: np.ndarray, feature_names: List[str]) -> Optional[Dict]:
        """
        Use SHAP KernelExplainer to explain anomaly detection.
        Since PyOD models don't support TreeExplainer, we use KernelExplainer.
        """
        try:
            if pwid_id not in self.copod_models:
                return None
            
            # Use COPOD model for SHAP (fastest PyOD model)
            copod_model = self.copod_models[pwid_id]
            
            # Create prediction function for SHAP
            def predict_fn(X):
                # Return decision function (anomaly scores)
                return copod_model.decision_function(X)
            
            # Initialize SHAP explainer if not exists
            if pwid_id not in self.shap_explainers:
                # Use a subset of training data as background for KernelExplainer
                baseline = self.baselines.get(pwid_id, {})
                if baseline and 'mean' in baseline:
                    # Create synthetic background data from baseline statistics
                    background = np.array([[baseline['mean'].get(f, 0) for f in feature_names]])
                else:
                    background = X_scaled
                
                self.shap_explainers[pwid_id] = shap.KernelExplainer(predict_fn, background)
            
            explainer = self.shap_explainers[pwid_id]
            
            # Get SHAP values (limit to 100 samples to avoid timeout)
            shap_values = explainer.shap_values(X_scaled, nsamples=100)
            
            # Extract SHAP values
            if len(shap_values.shape) > 1:
                shap_vals = shap_values[0]
            else:
                shap_vals = shap_values
            
            # Calculate total absolute contribution
            total_abs_contribution = np.sum(np.abs(shap_vals))
            
            # Build feature explanations
            feature_contributions = []
            for i, (feat_name, shap_val) in enumerate(zip(feature_names, shap_vals)):
                contribution_pct = (abs(shap_val) / total_abs_contribution * 100) if total_abs_contribution > 0 else 0
                
                feature_contributions.append({
                    'feature': feat_name.replace('_', ' ').title(),
                    'shap_value': float(shap_val),
                    'contribution_percent': round(contribution_pct, 1),
                    'impact': 'increases anomaly' if shap_val > 0 else 'decreases anomaly',
                    'magnitude': 'high' if contribution_pct > 20 else ('moderate' if contribution_pct > 10 else 'low')
                })
            
            # Sort by absolute contribution
            feature_contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)
            
            # Generate human-readable summary
            top_factors = feature_contributions[:3]
            summary_parts = []
            for factor in top_factors:
                if factor['contribution_percent'] > 5:  # Only mention significant factors
                    summary_parts.append(
                        f"{factor['contribution_percent']:.0f}% due to {factor['feature'].lower()}"
                    )
            
            summary = "This anomaly was detected: " + ", ".join(summary_parts) if summary_parts else "Multiple factors contributed to this anomaly"
            
            return {
                'method': 'SHAP (KernelExplainer)',
                'top_contributors': feature_contributions[:5],
                'all_contributions': feature_contributions,
                'summary': summary
            }
        
        except Exception as e:
            print(f"SHAP explanation failed for anomaly detection: {e}")
            return None
    
    def _save_model(self, pwid_id: int):
        """Save all models and scaler to disk"""
        lof_path = os.path.join(self.models_dir, f'lof_model_{pwid_id}.joblib')
        copod_path = os.path.join(self.models_dir, f'copod_model_{pwid_id}.joblib')
        ae_path = os.path.join(self.models_dir, f'ae_model_{pwid_id}.joblib')
        scaler_path = os.path.join(self.models_dir, f'anomaly_scaler_{pwid_id}.joblib')
        baseline_path = os.path.join(self.models_dir, f'anomaly_baseline_{pwid_id}.joblib')
        
        joblib.dump(self.lof_models[pwid_id], lof_path)
        joblib.dump(self.copod_models[pwid_id], copod_path)
        joblib.dump(self.ae_models[pwid_id], ae_path)
        joblib.dump(self.scalers[pwid_id], scaler_path)
        joblib.dump(self.baselines[pwid_id], baseline_path)
    
    def _load_model(self, pwid_id: int) -> bool:
        """Load all models from disk if they exist"""
        lof_path = os.path.join(self.models_dir, f'lof_model_{pwid_id}.joblib')
        copod_path = os.path.join(self.models_dir, f'copod_model_{pwid_id}.joblib')
        ae_path = os.path.join(self.models_dir, f'ae_model_{pwid_id}.joblib')
        scaler_path = os.path.join(self.models_dir, f'anomaly_scaler_{pwid_id}.joblib')
        baseline_path = os.path.join(self.models_dir, f'anomaly_baseline_{pwid_id}.joblib')
        
        if all(os.path.exists(p) for p in [lof_path, copod_path, ae_path, scaler_path]):
            try:
                self.lof_models[pwid_id] = joblib.load(lof_path)
                self.copod_models[pwid_id] = joblib.load(copod_path)
                self.ae_models[pwid_id] = joblib.load(ae_path)
                self.scalers[pwid_id] = joblib.load(scaler_path)
                if os.path.exists(baseline_path):
                    self.baselines[pwid_id] = joblib.load(baseline_path)
                return True
            except Exception as e:
                print(f"Error loading models for PWID {pwid_id}: {e}")
                return False
        return False
    
    def get_baseline_summary(self, pwid_id: int) -> Optional[Dict]:
        """Get summary of learned baseline for a PWID"""
        if pwid_id in self.baselines:
            return self.baselines[pwid_id]
        
        # Try loading from disk
        baseline_path = os.path.join(self.models_dir, f'anomaly_baseline_{pwid_id}.joblib')
        if os.path.exists(baseline_path):
            return joblib.load(baseline_path)
        
        return None
