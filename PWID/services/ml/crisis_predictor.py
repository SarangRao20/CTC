"""
Crisis Prediction Model
Predicts probability of behavioral crisis in next 24-72 hours
Uses Gradient Boosting with SHAP explainability
"""

import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import shap
import warnings
warnings.filterwarnings('ignore', category=FutureWarning)

class CrisisPredictor:
    """
    Predicts probability of behavioral crisis in next 24-72 hours.
    Uses ensemble learning with explainable features.
    Maintains individual models per PWID.
    """
    
    def __init__(self, models_dir: str = 'models/crisis'):
        self.pwid_models = {}  # Individual models per PWID
        self.feature_names = []
        self.shap_explainers = {}  # SHAP explainers per PWID
        self.models_dir = models_dir
        os.makedirs(models_dir, exist_ok=True)
        
    def build_features(self, pwid_id: int, observations: List[Any],
                       window_days: int = 7) -> Optional[np.ndarray]:
        """
        Build feature vector for crisis prediction.
        Uses rolling statistics and trend indicators from past week.
        """
        # Get recent observations
        recent = []
        cutoff_date = datetime.now() - timedelta(days=window_days)
        
        for o in observations:
            if isinstance(o, dict):
                timestamp = o.get('created_at') or o.get('timestamp', datetime.now())
                if isinstance(timestamp, str):
                    timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            else:
                timestamp = getattr(o, 'created_at', datetime.now())
            
            if timestamp >= cutoff_date:
                recent.append(o)
        
        if not recent:
            return None
        
        features = []
        
        # Extract values for statistical features
        sleep_scores = [self._sleep_to_score(self._get_value(o, 'sleep_quality')) for o in recent]
        mood_scores = [self._mood_to_score(self._get_value(o, 'mood')) for o in recent]
        meal_scores = [self._meal_to_score(self._get_value(o, 'meals')) for o in recent]
        incident_scores = [self._incident_to_score(self._get_value(o, 'incident')) for o in recent]
        
        # Sleep features
        if sleep_scores:
            features.extend([
                np.mean(sleep_scores),
                np.std(sleep_scores) if len(sleep_scores) > 1 else 0,
                np.min(sleep_scores),
                sleep_scores[-1] - np.mean(sleep_scores),  # Recent deviation
            ])
        else:
            features.extend([0, 0, 0, 0])
        
        # Mood features
        if mood_scores:
            features.extend([
                np.mean(mood_scores),
                np.std(mood_scores) if len(mood_scores) > 1 else 0,
                self._compute_trend(mood_scores),
                len([m for m in mood_scores if m >= 4]) / len(mood_scores),  # % bad mood
            ])
        else:
            features.extend([0, 0, 0, 0])
        
        # Meal features
        if meal_scores:
            features.extend([
                np.mean(meal_scores),
                len([m for m in meal_scores if m >= 2]) / len(meal_scores),  # % poor meals
            ])
        else:
            features.extend([0, 0])
        
        # Incident features
        if incident_scores:
            features.extend([
                sum(incident_scores),  # Total incident severity
                max(incident_scores),  # Worst incident
                self._compute_trend(incident_scores),
                self._days_since_last_incident(recent),
            ])
        else:
            features.extend([0, 0, 0, 30])
        
        # Medication compliance
        med_compliance = [1 if self._get_value(o, 'medication_given') in ['yes', 'Yes', True] else 0 for o in recent]
        features.append(np.mean(med_compliance) if med_compliance else 0)
        
        # Day of week (one-hot encoded)
        dow = datetime.now().weekday()
        features.extend([1 if i == dow else 0 for i in range(7)])
        
        # Time since last observation
        if recent:
            last_obs = recent[-1]
            last_time = self._get_value(last_obs, 'created_at')
            if isinstance(last_time, str):
                last_time = datetime.fromisoformat(last_time.replace('Z', '+00:00'))
            hours_since = (datetime.now() - last_time).total_seconds() / 3600
            features.append(min(hours_since, 48))
        else:
            features.append(48)
        
        # Store feature names (once)
        if not self.feature_names:
            self.feature_names = [
                'sleep_mean', 'sleep_std', 'sleep_min', 'sleep_deviation',
                'mood_mean', 'mood_std', 'mood_trend', 'bad_mood_pct',
                'meal_mean', 'poor_meal_pct',
                'incident_total', 'incident_max', 'incident_trend', 'days_since_incident',
                'medication_compliance',
                'dow_0', 'dow_1', 'dow_2', 'dow_3', 'dow_4', 'dow_5', 'dow_6',
                'hours_since_last_obs'
            ]
        
        return np.array(features).reshape(1, -1)
    
    def train(self, pwid_id: int, observations: List[Any]) -> Dict:
        """
        Train crisis prediction model for a specific PWID.
        Requires labeled data (observations with known outcomes).
        """
        X, y = self._prepare_training_data(observations)
        
        if X is None or len(X) < 50:
            return {
                'status': 'insufficient_data',
                'samples': len(X) if X is not None else 0,
                'required': 50,
                'message': 'Need at least 50 observations with outcomes for training'
            }
        
        # Check class balance
        positive_rate = np.mean(y)
        if positive_rate < 0.05 or positive_rate > 0.95:
            return {
                'status': 'imbalanced_data',
                'positive_rate': float(positive_rate),
                'message': 'Data too imbalanced. Need more varied observations.'
            }
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Train model
        model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=4,
            min_samples_leaf=5,
            learning_rate=0.1,
            random_state=42
        )
        
        # Cross-validation
        try:
            cv_scores = cross_val_score(model, X_scaled, y, cv=min(5, len(X)//10), scoring='roc_auc')
            cv_score = np.mean(cv_scores)
        except:
            cv_score = 0.0
        
        # Train final model on all data
        model.fit(X_scaled, y)
        
        # Save model artifacts
        self.pwid_models[pwid_id] = {
            'model': model,
            'scaler': scaler,
            'cv_score': cv_score,
            'feature_importance': dict(zip(self.feature_names, model.feature_importances_)),
            'trained_at': datetime.now().isoformat(),
            'training_samples': len(X),
            'positive_rate': positive_rate
        }
        
        self._save_model(pwid_id)
        
        return {
            'status': 'trained',
            'pwid_id': pwid_id,
            'auc_score': float(cv_score),
            'samples_used': len(X),
            'model_quality': 'good' if cv_score > 0.7 else ('moderate' if cv_score > 0.6 else 'poor'),
            'top_features': self._get_top_features(pwid_id, n=5)
        }
    
    def predict_crisis(self, pwid_id: int, observations: List[Any]) -> Dict:
        """
        Predict crisis probability for next 24-72 hours.
        Returns risk level, probability, and SHAP-based contributing factors.
        """
        if pwid_id not in self.pwid_models:
            if not self._load_model(pwid_id):
                return {
                    'status': 'no_model',
                    'recommendation': 'Model needs to be trained first with sufficient historical data'
                }
        
        features = self.build_features(pwid_id, observations)
        
        if features is None:
            return {
                'status': 'insufficient_recent_data',
                'recommendation': 'Need at least 7 days of recent observations'
            }
        
        model_data = self.pwid_models[pwid_id]
        model = model_data['model']
        scaler = model_data['scaler']
        
        # Scale and predict
        features_scaled = scaler.transform(features)
        proba = model.predict_proba(features_scaled)[0]
        crisis_prob = proba[1] if len(proba) > 1 else proba[0]
        
        # Get SHAP-based feature contributions
        shap_explanation = self._explain_with_shap(pwid_id, features, features_scaled)
        
        # Determine risk level
        risk_level = self._determine_risk_level(crisis_prob)
        
        result = {
            'status': 'prediction_ready',
            'pwid_id': pwid_id,
            'prediction_date': datetime.now().isoformat(),
            'crisis_probability': float(crisis_prob),
            'crisis_probability_percent': round(crisis_prob * 100, 1),
            'risk_level': risk_level,
            'model_confidence': model_data['cv_score'],
            'recommended_actions': self._get_recommendations(risk_level, shap_explanation.get('top_factors', [])),
            'model_quality': 'good' if model_data['cv_score'] > 0.7 else 'moderate',
            'trained_on_samples': model_data.get('training_samples', 0)
        }
        
        # Add SHAP explanation
        if shap_explanation:
            result['shap_explanation'] = shap_explanation
            result['top_risk_factors'] = shap_explanation.get('top_factors', [])[:5]
            result['protective_factors'] = shap_explanation.get('protective_factors', [])[:3]
            result['human_readable_explanation'] = shap_explanation.get('summary', '')
        
        return result
    
    def _prepare_training_data(self, observations: List[Any]) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        """
        Prepare training data with proper labels.
        Label: 1 if incident occurred within 72 hours after observation.
        """
        X_list = []
        y_list = []
        
        # Sort observations by date
        sorted_obs = sorted(observations, key=lambda o: self._get_timestamp(o))
        
        for i, obs in enumerate(sorted_obs[:-3]):  # Leave last 3 days unlabeled
            # Build features for this observation using past 7 days
            past_window = sorted_obs[max(0, i-7):i+1]
            
            if len(past_window) < 3:
                continue
            
            features = self._build_features_from_window(past_window)
            if features is None:
                continue
            
            # Check if incident occurred in next 72 hours (3 days)
            obs_time = self._get_timestamp(obs)
            future_window = sorted_obs[i+1:min(i+4, len(sorted_obs))]
            
            has_future_incident = any(
                self._incident_to_score(self._get_value(fo, 'incident')) >= 2
                for fo in future_window
            )
            
            X_list.append(features)
            y_list.append(1 if has_future_incident else 0)
        
        if len(X_list) < 10:
            return None, None
        
        return np.array(X_list), np.array(y_list)
    
    def _build_features_from_window(self, window: List[Any]) -> Optional[np.ndarray]:
        """Build features from a window of observations"""
        if not window:
            return None
        
        features = []
        
        sleep_scores = [self._sleep_to_score(self._get_value(o, 'sleep_quality')) for o in window]
        mood_scores = [self._mood_to_score(self._get_value(o, 'mood')) for o in window]
        meal_scores = [self._meal_to_score(self._get_value(o, 'meals')) for o in window]
        incident_scores = [self._incident_to_score(self._get_value(o, 'incident')) for o in window]
        
        features.extend([
            np.mean(sleep_scores), np.std(sleep_scores) if len(sleep_scores) > 1 else 0,
            np.min(sleep_scores), sleep_scores[-1] - np.mean(sleep_scores)
        ])
        
        features.extend([
            np.mean(mood_scores), np.std(mood_scores) if len(mood_scores) > 1 else 0,
            self._compute_trend(mood_scores),
            len([m for m in mood_scores if m >= 4]) / len(mood_scores)
        ])
        
        features.extend([
            np.mean(meal_scores),
            len([m for m in meal_scores if m >= 2]) / len(meal_scores)
        ])
        
        features.extend([
            sum(incident_scores), max(incident_scores),
            self._compute_trend(incident_scores),
            self._days_since_last_incident(window)
        ])
        
        med_compliance = [1 if self._get_value(o, 'medication_given') in ['yes', 'Yes', True] else 0 for o in window]
        features.append(np.mean(med_compliance))
        
        last_time = self._get_timestamp(window[-1])
        dow = last_time.weekday()
        features.extend([1 if i == dow else 0 for i in range(7)])
        
        features.append(0)  # hours_since_last_obs (not applicable in training)
        
        return np.array(features)
    
    def _compute_trend(self, values: List[float]) -> float:
        """Compute trend direction (-1 to 1)"""
        if len(values) < 2:
            return 0
        x = np.arange(len(values))
        slope, _ = np.polyfit(x, values, 1)
        return float(np.tanh(slope))  # Normalize to -1 to 1
    
    def _days_since_last_incident(self, observations: List[Any]) -> float:
        """Days since last behavioral incident"""
        now = datetime.now()
        for obs in reversed(observations):
            if self._incident_to_score(self._get_value(obs, 'incident')) >= 2:
                obs_time = self._get_timestamp(obs)
                return (now - obs_time).days
        return 30  # Cap at 30 days
    
    def _determine_risk_level(self, probability: float) -> str:
        """Determine risk level from probability"""
        if probability >= 0.7:
            return 'CRITICAL'
        elif probability >= 0.5:
            return 'HIGH'
        elif probability >= 0.3:
            return 'MODERATE'
        else:
            return 'LOW'
    
    def _explain_prediction(self, model, features, importance_dict) -> List[Dict]:
        """Explain which factors contributed to prediction (legacy method)"""
        contributions = []
        
        for i, (name, imp) in enumerate(importance_dict.items()):
            if i < len(features[0]):
                contributions.append({
                    'factor': name.replace('_', ' ').title(),
                    'importance': round(float(imp), 3),
                    'current_value': round(float(features[0][i]), 2),
                    'contribution': round(float(imp * features[0][i]), 3)
                })
        
        return sorted(contributions, key=lambda x: abs(x['contribution']), reverse=True)
    
    def _explain_with_shap(self, pwid_id: int, features_raw: np.ndarray, features_scaled: np.ndarray) -> Dict:
        """
        Use SHAP to explain predictions with true feature importance.
        Returns human-readable explanations with percentage contributions.
        """
        try:
            model_data = self.pwid_models[pwid_id]
            model = model_data['model']
            
            # Initialize or get SHAP explainer
            if pwid_id not in self.shap_explainers:
                self.shap_explainers[pwid_id] = shap.TreeExplainer(model)
            
            explainer = self.shap_explainers[pwid_id]
            
            # Get SHAP values for this prediction
            shap_values = explainer.shap_values(features_scaled)
            
            # Handle binary classification (shap_values might be list or array)
            if isinstance(shap_values, list) and len(shap_values) > 1:
                # Use class 1 (crisis) SHAP values
                shap_values_crisis = shap_values[1]
            else:
                shap_values_crisis = shap_values
            
            # Get base value (expected value)
            base_value = explainer.expected_value
            if isinstance(base_value, (list, np.ndarray)):
                base_value = base_value[1] if len(base_value) > 1 else base_value[0]
            
            # Extract SHAP values for this single prediction
            if len(shap_values_crisis.shape) > 1:
                shap_vals = shap_values_crisis[0]
            else:
                shap_vals = shap_values_crisis
            
            # Calculate total absolute contribution for percentage
            total_abs_contribution = np.sum(np.abs(shap_vals))
            
            # Build feature explanations
            feature_contributions = []
            for i, (feat_name, shap_val) in enumerate(zip(self.feature_names, shap_vals)):
                if i < len(features_raw[0]):
                    contribution_pct = (abs(shap_val) / total_abs_contribution * 100) if total_abs_contribution > 0 else 0
                    
                    feature_contributions.append({
                        'feature': feat_name.replace('_', ' ').title(),
                        'shap_value': float(shap_val),
                        'raw_value': float(features_raw[0][i]),
                        'contribution_percent': round(contribution_pct, 1),
                        'impact': 'increases risk' if shap_val > 0 else 'decreases risk',
                        'magnitude': 'high' if abs(shap_val) > 0.1 else ('moderate' if abs(shap_val) > 0.05 else 'low')
                    })
            
            # Sort by absolute SHAP value
            feature_contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)
            
            # Separate risk-increasing and protective factors
            risk_factors = [f for f in feature_contributions if f['shap_value'] > 0]
            protective_factors = [f for f in feature_contributions if f['shap_value'] < 0]
            
            # Generate human-readable summary
            summary_parts = []
            for i, factor in enumerate(risk_factors[:3]):
                summary_parts.append(
                    f"{factor['contribution_percent']:.0f}% due to {factor['feature'].lower()}"
                )
            
            summary = "This prediction was " + ", ".join(summary_parts[:2])
            if len(summary_parts) > 2:
                summary += f", and {summary_parts[2]}"
            
            return {
                'method': 'SHAP (TreeExplainer)',
                'base_value': float(base_value),
                'prediction_value': float(base_value + np.sum(shap_vals)),
                'top_factors': risk_factors[:5],
                'protective_factors': protective_factors[:3],
                'all_contributions': feature_contributions,
                'summary': summary,
                'interpretation': self._interpret_shap_results(risk_factors, protective_factors)
            }
        
        except Exception as e:
            print(f"SHAP explanation failed: {e}")
            # Fallback to legacy method
            legacy = self._explain_prediction(model, features_raw, model_data['feature_importance'])
            return {
                'method': 'fallback',
                'top_factors': legacy,
                'protective_factors': [],
                'summary': 'SHAP explanation unavailable',
                'error': str(e)
            }
    
    def _interpret_shap_results(self, risk_factors: List[Dict], protective_factors: List[Dict]) -> str:
        """
        Generate clinical interpretation of SHAP results.
        """
        interpretation_parts = []
        
        if risk_factors:
            top_risk = risk_factors[0]
            interpretation_parts.append(
                f"Primary risk driver is {top_risk['feature'].lower()} "
                f"(contributing {top_risk['contribution_percent']:.0f}% to crisis probability)."
            )
        
        if protective_factors:
            top_protective = protective_factors[0]
            interpretation_parts.append(
                f"Main protective factor is {top_protective['feature'].lower()} "
                f"(reducing risk by {top_protective['contribution_percent']:.0f}%)."
            )
        
        return " ".join(interpretation_parts)
    
    def _get_recommendations(self, risk_level: str, factors: List[Dict]) -> List[Dict]:
        """Generate actionable recommendations"""
        recs = []
        
        if risk_level in ['CRITICAL', 'HIGH']:
            recs.append({
                'priority': 'immediate',
                'action': 'Increase monitoring frequency to every 2 hours',
                'reason': f'Crisis probability is {risk_level.lower()}'
            })
            recs.append({
                'priority': 'immediate',
                'action': 'Prepare de-escalation strategies and notify supervisor',
                'reason': 'Proactive intervention needed'
            })
        
        # Factor-specific recommendations
        for factor in factors[:3]:
            factor_name = factor['factor'].lower()
            
            if 'sleep' in factor_name and factor['importance'] > 0.1:
                recs.append({
                    'priority': 'high',
                    'action': 'Focus on improving sleep quality tonight',
                    'reason': f'Sleep is a key risk factor (importance: {factor["importance"]:.2f})'
                })
            elif 'mood' in factor_name and factor['importance'] > 0.1:
                recs.append({
                    'priority': 'high',
                    'action': 'Plan calming activities and reduce stressors',
                    'reason': 'Mood trend indicates increased risk'
                })
            elif 'medication' in factor_name:
                recs.append({
                    'priority': 'critical',
                    'action': 'Verify medication schedule adherence',
                    'reason': 'Medication compliance critical for stability'
                })
            elif 'incident' in factor_name:
                recs.append({
                    'priority': 'high',
                    'action': 'Review recent triggers and prepare protocols',
                    'reason': 'Recent incident pattern concerning'
                })
        
        return recs
    
    def _get_top_features(self, pwid_id: int, n: int = 5) -> List[Dict]:
        """Get top N most important features"""
        if pwid_id not in self.pwid_models:
            return []
        
        importance = self.pwid_models[pwid_id]['feature_importance']
        sorted_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)
        
        return [
            {'feature': k.replace('_', ' ').title(), 'importance': round(v, 3)}
            for k, v in sorted_features[:n]
        ]
    
    def _save_model(self, pwid_id: int):
        """Save model artifacts to disk"""
        if pwid_id not in self.pwid_models:
            return
        
        model_path = os.path.join(self.models_dir, f'crisis_model_{pwid_id}.joblib')
        joblib.dump(self.pwid_models[pwid_id], model_path)
    
    def _load_model(self, pwid_id: int) -> bool:
        """Load model from disk"""
        model_path = os.path.join(self.models_dir, f'crisis_model_{pwid_id}.joblib')
        
        if os.path.exists(model_path):
            try:
                self.pwid_models[pwid_id] = joblib.load(model_path)
                return True
            except Exception as e:
                print(f"Error loading model for PWID {pwid_id}: {e}")
                return False
        return False
    
    # Helper methods
    def _get_value(self, obs: Any, key: str) -> Any:
        """Get value from observation (dict or object)"""
        if isinstance(obs, dict):
            return obs.get(key)
        return getattr(obs, key, None)
    
    def _get_timestamp(self, obs: Any) -> datetime:
        """Get timestamp from observation"""
        if isinstance(obs, dict):
            ts = obs.get('created_at') or obs.get('timestamp', datetime.now())
            if isinstance(ts, str):
                return datetime.fromisoformat(ts.replace('Z', '+00:00'))
            return ts
        return getattr(obs, 'created_at', datetime.now())
    
    def _sleep_to_score(self, sleep) -> int:
        if sleep is None:
            return 2
        sleep_str = str(sleep)
        return {'good': 1, 'Good': 1, 'disturbed': 2, 'Disturbed': 2, 
                'poor': 3, 'Poor': 3}.get(sleep_str, 2)
    
    def _mood_to_score(self, mood) -> int:
        if mood is None:
            return 2
        mood_str = str(mood)
        return {'calm': 1, 'Calm': 1, 'happy': 1, 'Happy': 1, 'anxious': 3, 'Anxious': 3,
                'irritable': 4, 'Irritable': 4, 'aggressive': 5, 'Aggressive': 5}.get(mood_str, 2)
    
    def _meal_to_score(self, meals) -> int:
        if meals is None:
            return 2
        meal_str = str(meals)
        return {'normal': 1, 'Normal': 1, 'taken': 1, 'Taken': 1,
                'reduced': 2, 'Reduced': 2, 'skipped': 3, 'Skipped': 3}.get(meal_str, 2)
    
    def _incident_to_score(self, incident) -> int:
        if incident is None:
            return 0
        inc_str = str(incident)
        return {'none': 0, 'None': 0, 'no': 0, 'No': 0, 'minor': 2, 'Minor': 2,
                'concerning': 4, 'Concerning': 4, 'yes': 3, 'Yes': 3}.get(inc_str, 1)
