"""
Trigger Correlation Engine
Discovers hidden correlations between environmental factors and behavioral incidents
Uses statistical analysis to identify significant triggers
"""

import pandas as pd
import numpy as np
from scipy import stats
from collections import defaultdict, Counter
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

class TriggerCorrelationEngine:
    """
    Discovers hidden correlations between environmental factors
    and behavioral incidents using statistical analysis.
    """
    
    def __init__(self):
        self.correlation_cache = {}
        self.min_samples_required = 30  # Minimum samples for reliable analysis
        
    def analyze_triggers(self, pwid_id: int, observations: List[Any], 
                        incidents: List[Any] = None) -> Dict:
        """
        Find statistically significant correlations between
        environmental factors and behavioral incidents.
        """
        if len(observations) < self.min_samples_required:
            return {
                'status': 'insufficient_data',
                'samples_available': len(observations),
                'samples_required': self.min_samples_required,
                'message': f'Need at least {self.min_samples_required} observations for reliable analysis'
            }
        
        # Build feature matrix
        features_df = self._build_feature_matrix(observations)
        
        if features_df.empty:
            return {
                'status': 'error',
                'message': 'Could not build feature matrix from observations'
            }
        
        # Identify incidents (either from separate list or from observations)
        if incidents:
            incidents_df = self._build_incident_matrix(incidents)
            merged = features_df.merge(incidents_df, left_index=True, right_index=True, how='left')
        else:
            # Extract incidents from observations
            merged = features_df.copy()
            merged['has_incident'] = merged.apply(self._is_incident_day, axis=1)
        
        merged['has_incident'] = merged.get('has_incident', 0).fillna(0).astype(bool)
        
        # Test correlations for each factor
        correlations = self._compute_all_correlations(merged)
        
        # Find interaction effects
        interactions = self._find_interactions(merged, correlations)
        
        # Generate insights
        insights = self._generate_insights(correlations, interactions)
        
        # Assess data quality
        data_quality = self._assess_data_quality(merged)
        
        return {
            'status': 'success',
            'pwid_id': pwid_id,
            'analysis_date': datetime.now().isoformat(),
            'samples_analyzed': len(merged),
            'incident_rate': float(merged['has_incident'].mean()),
            'significant_triggers': correlations,
            'interaction_effects': interactions,
            'actionable_insights': insights,
            'data_quality': data_quality
        }
    
    def _build_feature_matrix(self, observations: List[Any]) -> pd.DataFrame:
        """Build daily feature matrix from observations"""
        features = []
        
        for obs in observations:
            if isinstance(obs, dict):
                timestamp = obs.get('created_at') or obs.get('timestamp', datetime.now())
                if isinstance(timestamp, str):
                    timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                
                feature_row = {
                    'date': timestamp.date(),
                    'day_of_week': timestamp.weekday(),
                    'hour': timestamp.hour,
                    'sleep_score': self._sleep_to_score(obs.get('sleep_quality', 'Unknown')),
                    'mood_score': self._mood_to_score(obs.get('mood', 'Unknown')),
                    'meal_score': self._meal_to_score(obs.get('meals', 'Unknown')),
                    'medication_given': 1 if obs.get('medication_given') in ['yes', 'Yes', True] else 0,
                    'activity_done': 1 if obs.get('activity_done') in ['yes', 'Yes', True] else 0,
                    'incident_score': self._incident_to_score(obs.get('incident', 'None')),
                }
            else:
                timestamp = getattr(obs, 'created_at', datetime.now())
                
                feature_row = {
                    'date': timestamp.date(),
                    'day_of_week': timestamp.weekday(),
                    'hour': timestamp.hour,
                    'sleep_score': self._sleep_to_score(getattr(obs, 'sleep_quality', 'Unknown')),
                    'mood_score': self._mood_to_score(getattr(obs, 'mood', 'Unknown')),
                    'meal_score': self._meal_to_score(getattr(obs, 'meals', 'Unknown')),
                    'medication_given': 1 if getattr(obs, 'medication_given', 'no') in ['yes', 'Yes', True] else 0,
                    'activity_done': 1 if getattr(obs, 'activity_done', 'no') in ['yes', 'Yes', True] else 0,
                    'incident_score': self._incident_to_score(getattr(obs, 'incident', 'None')),
                }
            
            features.append(feature_row)
        
        df = pd.DataFrame(features)
        
        # Aggregate by date (take mean for scores, sum for incidents)
        if 'date' in df.columns:
            daily_df = df.groupby('date').agg({
                'day_of_week': 'first',
                'sleep_score': 'mean',
                'mood_score': 'mean',
                'meal_score': 'mean',
                'medication_given': 'min',  # 0 if missed even once
                'activity_done': 'max',     # 1 if done at least once
                'incident_score': 'max',    # Take worst incident
            }).reset_index()
            
            return daily_df
        
        return df
    
    def _build_incident_matrix(self, incidents: List[Any]) -> pd.DataFrame:
        """Build daily incident matrix"""
        incident_data = []
        
        for inc in incidents:
            if isinstance(inc, dict):
                timestamp = inc.get('created_at') or inc.get('timestamp', datetime.now())
                if isinstance(timestamp, str):
                    timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                
                incident_data.append({
                    'date': timestamp.date(),
                    'incident_count': 1
                })
            else:
                timestamp = getattr(inc, 'created_at', datetime.now())
                incident_data.append({
                    'date': timestamp.date(),
                    'incident_count': 1
                })
        
        if not incident_data:
            return pd.DataFrame(columns=['date', 'incident_count'])
        
        df = pd.DataFrame(incident_data)
        daily_incidents = df.groupby('date')['incident_count'].sum().reset_index()
        daily_incidents['has_incident'] = daily_incidents['incident_count'] > 0
        
        return daily_incidents.set_index('date')
    
    def _is_incident_day(self, row: pd.Series) -> bool:
        """Determine if a day had an incident based on scores"""
        return (row.get('incident_score', 0) >= 2 or 
                row.get('mood_score', 0) >= 4)
    
    def _compute_all_correlations(self, df: pd.DataFrame) -> List[Dict]:
        """Compute correlations for all factors"""
        correlations = []
        
        factors = {
            'sleep_score': 'Sleep Quality',
            'mood_score': 'Mood',
            'meal_score': 'Meal Intake',
            'medication_given': 'Medication Compliance',
            'activity_done': 'Activity Participation',
            'day_of_week': 'Day of Week',
        }
        
        for factor_col, factor_name in factors.items():
            if factor_col not in df.columns:
                continue
            
            try:
                corr_result = self._compute_correlation(
                    df[factor_col],
                    df['has_incident']
                )
                
                if corr_result and corr_result.get('p_value', 1.0) < 0.05:  # Significant
                    corr_result['factor'] = factor_name
                    corr_result['factor_column'] = factor_col
                    correlations.append(corr_result)
            except Exception as e:
                print(f"Error computing correlation for {factor_col}: {e}")
                continue
        
        # Sort by effect size
        correlations.sort(key=lambda x: x.get('effect_size', 0), reverse=True)
        
        return correlations
    
    def _compute_correlation(self, factor: pd.Series, outcome: pd.Series) -> Optional[Dict]:
        """Compute correlation between a factor and binary outcome"""
        # Remove NaN values
        valid_mask = ~(factor.isna() | outcome.isna())
        factor_clean = factor[valid_mask]
        outcome_clean = outcome[valid_mask]
        
        if len(factor_clean) < 10:  # Need minimum samples
            return None
        
        # Handle categorical vs continuous factors
        if factor_clean.dtype == 'object' or factor_clean.nunique() < 5:
            # Categorical - use chi-square test
            try:
                contingency = pd.crosstab(factor_clean, outcome_clean)
                chi2, p_value, dof, expected = stats.chi2_contingency(contingency)
                effect_size = np.sqrt(chi2 / (len(factor_clean) * (min(contingency.shape) - 1)))
                
                return {
                    'test': 'chi_square',
                    'statistic': float(chi2),
                    'p_value': float(p_value),
                    'effect_size': float(effect_size),
                    'interpretation': self._interpret_effect(effect_size),
                    'sample_size': len(factor_clean)
                }
            except:
                return None
        else:
            # Continuous - use point-biserial correlation
            try:
                correlation, p_value = stats.pointbiserialr(outcome_clean, factor_clean)
                
                return {
                    'test': 'point_biserial',
                    'correlation': float(correlation),
                    'p_value': float(p_value),
                    'effect_size': float(abs(correlation)),
                    'direction': 'increases_risk' if correlation > 0 else 'decreases_risk',
                    'interpretation': self._interpret_effect(abs(correlation)),
                    'sample_size': len(factor_clean)
                }
            except:
                return None
    
    def _find_interactions(self, df: pd.DataFrame, correlations: List[Dict]) -> List[Dict]:
        """Find significant interaction effects between factors"""
        interactions = []
        
        # Only test interactions between significant factors
        significant_factors = [c['factor_column'] for c in correlations if c.get('effect_size', 0) > 0.1]
        
        for i, f1 in enumerate(significant_factors[:5]):  # Limit to avoid combinatorial explosion
            for f2 in significant_factors[i+1:5]:
                if f1 not in df.columns or f2 not in df.columns:
                    continue
                
                try:
                    # Create interaction term
                    interaction = df[f1] * df[f2]
                    corr = self._compute_correlation(interaction, df['has_incident'])
                    
                    if corr and corr.get('p_value', 1.0) < 0.05:
                        interactions.append({
                            'factors': [f1, f2],
                            'effect': corr,
                            'insight': f"Combination of {f1} and {f2} significantly affects incidents",
                            'effect_size': corr.get('effect_size', 0)
                        })
                except:
                    continue
        
        interactions.sort(key=lambda x: x.get('effect_size', 0), reverse=True)
        return interactions[:5]  # Return top 5
    
    def _generate_insights(self, correlations: List[Dict], 
                          interactions: List[Dict]) -> List[Dict]:
        """Generate actionable, plain-language insights"""
        insights = []
        
        for corr in correlations[:5]:  # Top 5 correlations
            factor = corr.get('factor', 'Unknown')
            effect_size = corr.get('effect_size', 0)
            direction = corr.get('direction', 'unknown')
            
            if 'Sleep' in factor:
                if direction == 'increases_risk':
                    insights.append({
                        'type': 'critical_finding',
                        'priority': 'high',
                        'factor': factor,
                        'message': f"Poor sleep strongly correlates with incidents (effect: {effect_size:.2f})",
                        'action': "Prioritize consistent 8+ hour sleep schedule",
                        'expected_impact': f"Could reduce incident risk by ~{int(effect_size * 30)}%"
                    })
            
            elif 'Medication' in factor:
                if direction == 'increases_risk':
                    insights.append({
                        'type': 'critical_finding',
                        'priority': 'high',
                        'factor': factor,
                        'message': "Medication non-compliance correlates with more incidents",
                        'action': "Set strict medication schedule with reminders",
                        'expected_impact': "Critical for stability"
                    })
            
            elif 'Mood' in factor:
                insights.append({
                    'type': 'pattern_detected',
                    'priority': 'medium',
                    'factor': factor,
                    'message': f"Mood is a strong predictor (effect: {effect_size:.2f})",
                    'action': "Monitor mood closely as early warning sign",
                    'expected_impact': "Enable proactive intervention"
                })
            
            elif 'Meal' in factor:
                if direction == 'increases_risk':
                    insights.append({
                        'type': 'recommendation',
                        'priority': 'medium',
                        'factor': factor,
                        'message': "Skipped meals correlate with incidents",
                        'action': "Ensure regular meal times and preferred foods",
                        'expected_impact': f"Could reduce risk by ~{int(effect_size * 20)}%"
                    })
            
            elif 'Day of Week' in factor:
                insights.append({
                    'type': 'temporal_pattern',
                    'priority': 'low',
                    'factor': factor,
                    'message': "Weekly patterns detected",
                    'action': "Review routine differences across days",
                    'expected_impact': "Optimize weekly schedule"
                })
        
        # Add interaction insights
        for interaction in interactions[:2]:
            insights.append({
                'type': 'interaction_effect',
                'priority': 'medium',
                'factor': ' + '.join(interaction['factors']),
                'message': interaction['insight'],
                'action': "Address both factors together for maximum impact",
                'expected_impact': "Synergistic effect"
            })
        
        return insights
    
    def _interpret_effect(self, effect_size: float) -> str:
        """Interpret effect size in plain language"""
        if effect_size < 0.1:
            return "negligible"
        elif effect_size < 0.2:
            return "small but notable"
        elif effect_size < 0.4:
            return "moderate - worth addressing"
        elif effect_size < 0.6:
            return "large - important factor"
        else:
            return "very large - critical factor"
    
    def _assess_data_quality(self, df: pd.DataFrame) -> Dict:
        """Assess data quality for reliable insights"""
        total_cells = df.size
        missing_cells = df.isnull().sum().sum()
        completeness = (1 - missing_cells / total_cells) * 100 if total_cells > 0 else 0
        
        days_of_data = len(df)
        incident_days = df['has_incident'].sum() if 'has_incident' in df.columns else 0
        
        recommendations = []
        
        if completeness < 70:
            recommendations.append("Data completeness below 70% - log more consistently")
        
        if days_of_data < 30:
            recommendations.append(f"Only {days_of_data} days analyzed - need 30+ for reliable patterns")
        
        if incident_days < 5:
            recommendations.append("Very few incidents recorded - analysis may be preliminary")
        
        quality_score = (completeness / 100) * min(days_of_data / 30, 1.0)
        
        return {
            'completeness_percent': round(completeness, 1),
            'days_of_data': days_of_data,
            'incident_days': int(incident_days),
            'sufficient_for_analysis': days_of_data >= 30 and completeness >= 70,
            'quality_score': round(quality_score, 2),
            'recommendations': recommendations
        }
    
    # Helper conversion methods
    def _sleep_to_score(self, sleep: str) -> int:
        return {'good': 1, 'Good': 1, 'disturbed': 2, 'Disturbed': 2, 
                'poor': 3, 'Poor': 3}.get(sleep, 2)
    
    def _mood_to_score(self, mood: str) -> int:
        return {'calm': 1, 'Calm': 1, 'happy': 1, 'Happy': 1, 'anxious': 3, 'Anxious': 3,
                'irritable': 4, 'Irritable': 4, 'aggressive': 5, 'Aggressive': 5}.get(mood, 2)
    
    def _meal_to_score(self, meals: str) -> int:
        return {'normal': 1, 'Normal': 1, 'taken': 1, 'Taken': 1,
                'reduced': 2, 'Reduced': 2, 'skipped': 3, 'Skipped': 3}.get(meals, 2)
    
    def _incident_to_score(self, incident: str) -> int:
        return {'none': 0, 'None': 0, 'no': 0, 'No': 0, 'minor': 2, 'Minor': 2,
                'concerning': 4, 'Concerning': 4, 'yes': 3, 'Yes': 3}.get(incident, 1)
