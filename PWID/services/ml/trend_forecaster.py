"""
Behavioral Trend Forecasting for PWIDs
Uses Exponential Smoothing and statistical analysis for interpretable predictions
Forecasts behavioral trends for proactive intervention
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from scipy import stats

class BehaviorTrendForecaster:
    """
    Forecasts behavioral trends for proactive intervention.
    Uses Exponential Smoothing for interpretable predictions.
    Handles missing data gracefully and provides confidence intervals.
    """
    
    def __init__(self):
        self.forecasters = {}
        self.trend_history = {}
        
    def create_time_series(self, observations: List[Any], metric: str) -> pd.Series:
        """Create daily aggregated time series for a metric"""
        data_points = []
        
        for obs in observations:
            if isinstance(obs, dict):
                timestamp = obs.get('created_at') or obs.get('timestamp', datetime.now())
                if isinstance(timestamp, str):
                    try:
                        timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                    except:
                        timestamp = datetime.now()
                value = self._extract_metric_value(obs, metric)
            else:
                timestamp = getattr(obs, 'created_at', datetime.now())
                value = self._extract_metric_value_from_obj(obs, metric)
            
            if value is not None:
                data_points.append({
                    'date': timestamp.date() if hasattr(timestamp, 'date') else timestamp,
                    'value': value
                })
        
        if not data_points:
            return pd.Series(dtype=float)
            
        df = pd.DataFrame(data_points)
        
        # Aggregate by date (take mean if multiple observations per day)
        daily = df.groupby('date')['value'].mean()
        
        # Reindex to fill missing dates
        if len(daily) > 1:
            date_range = pd.date_range(daily.index.min(), daily.index.max())
            daily = daily.reindex(date_range, fill_value=daily.mean())
        
        return daily
    
    def _extract_metric_value(self, obs: Dict, metric: str) -> Optional[float]:
        """Extract numerical value from observation dict"""
        metric_map = {
            'mood_score': lambda o: self._mood_to_score(o.get('mood', 'Unknown')),
            'sleep_score': lambda o: self._sleep_to_score(o.get('sleep_quality', 'Unknown')),
            'meal_score': lambda o: self._meal_to_score(o.get('meals', 'Unknown')),
            'incident_score': lambda o: self._incident_to_score(o.get('incident', 'None')),
            'medication_compliance': lambda o: 1 if o.get('medication_given') in ['yes', 'Yes', True] else 0,
            'activity_completion': lambda o: 1 if o.get('activity_done') in ['yes', 'Yes', True] else 0,
        }
        
        extractor = metric_map.get(metric)
        return extractor(obs) if extractor else None
    
    def _extract_metric_value_from_obj(self, obs: Any, metric: str) -> Optional[float]:
        """Extract numerical value from SQLAlchemy model object"""
        metric_map = {
            'mood_score': lambda o: self._mood_to_score(getattr(o, 'mood', 'Unknown')),
            'sleep_score': lambda o: self._sleep_to_score(getattr(o, 'sleep_quality', 'Unknown')),
            'meal_score': lambda o: self._meal_to_score(getattr(o, 'meals', 'Unknown')),
            'incident_score': lambda o: self._incident_to_score(getattr(o, 'incident', 'None')),
            'medication_compliance': lambda o: 1 if getattr(o, 'medication_given', 'no') in ['yes', 'Yes', True] else 0,
            'activity_completion': lambda o: 1 if getattr(o, 'activity_done', 'no') in ['yes', 'Yes', True] else 0,
        }
        
        extractor = metric_map.get(metric)
        return extractor(obs) if extractor else None
    
    def _mood_to_score(self, mood: str) -> int:
        return {'calm': 1, 'Calm': 1, 'happy': 1, 'Happy': 1, 'anxious': 3, 'Anxious': 3,
                'irritable': 4, 'Irritable': 4, 'aggressive': 5, 'Aggressive': 5}.get(mood, 2)
    
    def _sleep_to_score(self, sleep: str) -> int:
        return {'good': 1, 'Good': 1, 'disturbed': 2, 'Disturbed': 2, 
                'poor': 3, 'Poor': 3}.get(sleep, 2)
    
    def _meal_to_score(self, meals: str) -> int:
        return {'normal': 1, 'Normal': 1, 'taken': 1, 'Taken': 1,
                'reduced': 2, 'Reduced': 2, 'skipped': 3, 'Skipped': 3}.get(meals, 2)
    
    def _incident_to_score(self, incident: str) -> int:
        return {'none': 0, 'None': 0, 'no': 0, 'No': 0, 'minor': 2, 'Minor': 2,
                'concerning': 4, 'Concerning': 4, 'yes': 3, 'Yes': 3}.get(incident, 1)
    
    def forecast_risk(self, pwid_id: int, observations: List[Any], 
                      days_ahead: int = 7) -> Dict:
        """
        Forecast behavioral risk metrics for next N days.
        Returns trend direction, predicted values, and confidence intervals.
        """
        metrics = ['mood_score', 'sleep_score', 'incident_score', 'meal_score']
        forecasts = {}
        
        for metric in metrics:
            ts = self.create_time_series(observations, metric)
            
            if len(ts) < 7:  # Need at least a week of data
                continue
            
            try:
                forecast_result = self._simple_forecast(ts, days_ahead)
                forecasts[metric] = forecast_result
            except Exception as e:
                print(f"Forecasting error for {metric}: {e}")
                continue
        
        if not forecasts:
            return {
                'status': 'insufficient_data',
                'pwid_id': pwid_id,
                'message': 'Need at least 7 days of observations for forecasting',
                'days_available': len(observations)
            }
        
        # Compute overall risk trajectory
        risk_trajectory = self._compute_risk_trajectory(forecasts)
        
        return {
            'status': 'success',
            'pwid_id': pwid_id,
            'forecast_date': datetime.now().isoformat(),
            'days_ahead': days_ahead,
            'predictions': forecasts,
            'risk_trajectory': risk_trajectory,
            'summary': self._generate_forecast_summary(forecasts, risk_trajectory),
            'recommendations': self._get_forecast_recommendations(forecasts, risk_trajectory)
        }
    
    def _simple_forecast(self, ts: pd.Series, days_ahead: int) -> Dict:
        """
        Simple but robust forecasting using exponential moving average
        and linear trend analysis.
        """
        if len(ts) < 3:
            return None
        
        # Calculate trend using linear regression
        x = np.arange(len(ts))
        y = ts.values
        slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
        
        # Calculate exponential moving average
        ema = ts.ewm(span=min(7, len(ts)), adjust=False).mean()
        
        # Generate forecast
        last_value = ema.iloc[-1]
        forecast_values = []
        
        for i in range(1, days_ahead + 1):
            # Combine EMA with trend
            forecast_val = last_value + (slope * i)
            forecast_values.append(float(forecast_val))
        
        # Determine trend direction
        if slope > 0.05:
            trend = 'increasing'
        elif slope < -0.05:
            trend = 'decreasing'
        else:
            trend = 'stable'
        
        # Calculate confidence based on R-squared and data consistency
        r_squared = r_value ** 2
        data_std = ts.std()
        
        return {
            'current_value': float(ts.iloc[-1]),
            'forecast_values': forecast_values,
            'trend': trend,
            'trend_strength': abs(slope),
            'confidence': round(r_squared * 100, 1),
            'volatility': float(data_std),
            'forecast_mean': round(np.mean(forecast_values), 2),
            'forecast_range': {
                'low': round(min(forecast_values) - data_std, 2),
                'high': round(max(forecast_values) + data_std, 2)
            }
        }
    
    def _compute_risk_trajectory(self, forecasts: Dict) -> Dict:
        """Compute overall risk trajectory from individual metric forecasts"""
        risk_signals = 0
        total_weight = 0
        
        # Weighted risk factors
        weights = {
            'mood_score': 2.0,      # Mood has high impact
            'sleep_score': 1.5,     # Sleep affects mood
            'incident_score': 2.5,  # Incidents are critical
            'meal_score': 1.0       # Meals are important but less critical
        }
        
        for metric, forecast in forecasts.items():
            if not forecast:
                continue
                
            weight = weights.get(metric, 1.0)
            total_weight += weight
            
            # Higher scores = worse condition (except medication compliance)
            if forecast.get('trend') == 'increasing':
                risk_signals += weight * forecast.get('trend_strength', 0.5)
        
        if total_weight == 0:
            return {'level': 'unknown', 'score': 0, 'description': 'Insufficient data'}
        
        normalized_score = risk_signals / total_weight
        
        if normalized_score >= 0.3:
            level = 'HIGH_RISK_ESCALATION'
            description = 'Multiple indicators showing concerning trends'
        elif normalized_score >= 0.15:
            level = 'MODERATE_CONCERN'
            description = 'Some indicators showing negative trends'
        elif normalized_score >= 0.05:
            level = 'MILD_ATTENTION'
            description = 'Minor changes detected, continue monitoring'
        else:
            level = 'STABLE'
            description = 'All indicators stable or improving'
        
        return {
            'level': level,
            'score': round(normalized_score, 3),
            'description': description
        }
    
    def _generate_forecast_summary(self, forecasts: Dict, trajectory: Dict) -> str:
        """Generate human-readable forecast summary"""
        summaries = []
        
        for metric, forecast in forecasts.items():
            if not forecast:
                continue
                
            metric_name = metric.replace('_score', '').replace('_', ' ').title()
            trend = forecast.get('trend', 'stable')
            
            if trend == 'increasing':
                summaries.append(f"{metric_name} worsening")
            elif trend == 'decreasing':
                summaries.append(f"{metric_name} improving")
        
        if not summaries:
            return f"Overall trajectory: {trajectory['description']}"
        
        return f"{', '.join(summaries)}. {trajectory['description']}"
    
    def _get_forecast_recommendations(self, forecasts: Dict, trajectory: Dict) -> List[Dict]:
        """Generate actionable recommendations based on forecasts"""
        recommendations = []
        
        level = trajectory.get('level', 'STABLE')
        
        if level == 'HIGH_RISK_ESCALATION':
            recommendations.append({
                'priority': 'critical',
                'action': 'Increase monitoring frequency to every 2-3 hours',
                'reason': 'Multiple risk indicators trending negatively'
            })
            recommendations.append({
                'priority': 'high',
                'action': 'Prepare intervention strategies and notify medical staff',
                'reason': 'Predicted deterioration in coming days'
            })
        
        # Specific metric recommendations
        for metric, forecast in forecasts.items():
            if not forecast or forecast.get('trend') != 'increasing':
                continue
            
            if 'mood' in metric:
                recommendations.append({
                    'priority': 'high',
                    'action': 'Plan calming activities and reduce environmental stressors',
                    'reason': f"Mood trend: {forecast['trend']}"
                })
            elif 'sleep' in metric:
                recommendations.append({
                    'priority': 'medium',
                    'action': 'Review bedtime routine and sleep environment',
                    'reason': f"Sleep quality trend: {forecast['trend']}"
                })
            elif 'incident' in metric:
                recommendations.append({
                    'priority': 'critical',
                    'action': 'Review recent triggers and prepare de-escalation protocols',
                    'reason': f"Incident frequency trend: {forecast['trend']}"
                })
            elif 'meal' in metric:
                recommendations.append({
                    'priority': 'medium',
                    'action': 'Monitor food preferences and mealtime environment',
                    'reason': f"Meal intake trend: {forecast['trend']}"
                })
        
        return recommendations
    
    def get_trend_analysis(self, pwid_id: int, observations: List[Any], 
                          window_days: int = 30) -> Dict:
        """
        Comprehensive trend analysis for past N days.
        Includes statistics, patterns, and change points.
        """
        metrics = ['mood_score', 'sleep_score', 'incident_score', 'meal_score']
        analysis = {}
        
        for metric in metrics:
            ts = self.create_time_series(observations, metric)
            
            if len(ts) < 3:
                continue
            
            analysis[metric] = {
                'mean': float(ts.mean()),
                'std': float(ts.std()),
                'min': float(ts.min()),
                'max': float(ts.max()),
                'current': float(ts.iloc[-1]),
                'week_avg': float(ts.tail(7).mean()) if len(ts) >= 7 else float(ts.mean()),
                'trend': self._calculate_trend_direction(ts),
                'volatility': 'high' if ts.std() > ts.mean() * 0.3 else 'low'
            }
        
        return {
            'pwid_id': pwid_id,
            'analysis_period_days': window_days,
            'observations_analyzed': len(observations),
            'metrics': analysis,
            'overall_stability': self._assess_overall_stability(analysis)
        }
    
    def _calculate_trend_direction(self, ts: pd.Series) -> str:
        """Calculate trend direction from time series"""
        if len(ts) < 2:
            return 'insufficient_data'
        
        x = np.arange(len(ts))
        slope, _, _, _, _ = stats.linregress(x, ts.values)
        
        if slope > 0.05:
            return 'worsening'
        elif slope < -0.05:
            return 'improving'
        return 'stable'
    
    def _assess_overall_stability(self, analysis: Dict) -> Dict:
        """Assess overall stability from all metrics"""
        improving = 0
        worsening = 0
        stable = 0
        
        for metric, data in analysis.items():
            trend = data.get('trend', 'stable')
            if trend == 'improving':
                improving += 1
            elif trend == 'worsening':
                worsening += 1
            else:
                stable += 1
        
        if worsening >= 2:
            assessment = 'concerning'
            message = 'Multiple areas showing negative trends'
        elif improving >= 2:
            assessment = 'positive'
            message = 'Overall improvement observed'
        else:
            assessment = 'stable'
            message = 'Condition relatively stable'
        
        return {
            'assessment': assessment,
            'message': message,
            'improving_metrics': improving,
            'worsening_metrics': worsening,
            'stable_metrics': stable
        }
