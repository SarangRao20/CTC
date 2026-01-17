"""
Caregiver Burnout Detection
Monitors caregiver behavior patterns to detect signs of burnout
Ensures quality of care by tracking the caregivers themselves
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import Counter
import pandas as pd
import numpy as np

class CaregiverBurnoutDetector:
    """
    Monitors caregiver behavior patterns to detect burnout.
    Analyzes logging frequency, detail level, response times, and sentiment.
    """
    
    def __init__(self):
        self.baseline_thresholds = {
            'min_daily_logs': 3,
            'min_avg_words': 15,
            'max_response_minutes': 45,
            'min_consistency_score': 0.7
        }
        
    def analyze_caregiver_patterns(self, caregiver_id: int, 
                                   logs: List[Any],
                                   analysis_days: int = 30) -> Dict:
        """
        Analyze caregiver patterns over past N days to detect burnout signs.
        Returns burnout risk score and specific indicators.
        """
        if not logs or len(logs) < 5:
            return {
                'status': 'insufficient_data',
                'caregiver_id': caregiver_id,
                'logs_available': len(logs),
                'message': 'Need at least 5 logs for analysis'
            }
        
        # Analyze different aspects
        patterns = {
            'logging_frequency': self._analyze_frequency(logs, analysis_days),
            'detail_level': self._analyze_detail_level(logs),
            'consistency': self._analyze_consistency(logs),
            'time_distribution': self._analyze_time_distribution(logs),
            'sentiment': self._analyze_sentiment(logs)
        }
        
        # Detect burnout indicators
        burnout_indicators = self._identify_burnout_indicators(patterns)
        
        # Calculate burnout score
        burnout_score = self._calculate_burnout_score(burnout_indicators, patterns)
        
        # Generate recommendations
        recommendations = self._get_support_recommendations(burnout_score, burnout_indicators, patterns)
        
        return {
            'status': 'success',
            'caregiver_id': caregiver_id,
            'analysis_date': datetime.now().isoformat(),
            'analysis_period_days': analysis_days,
            'logs_analyzed': len(logs),
            'burnout_risk_score': round(burnout_score, 2),
            'burnout_risk_level': self._score_to_level(burnout_score),
            'indicators': burnout_indicators,
            'patterns': patterns,
            'recommendations': recommendations,
            'overall_assessment': self._generate_assessment(burnout_score, burnout_indicators)
        }
    
    def _analyze_frequency(self, logs: List[Any], days: int) -> Dict:
        """Analyze logging frequency patterns"""
        # Group logs by date
        log_dates = []
        for log in logs:
            if isinstance(log, dict):
                timestamp = log.get('created_at') or log.get('timestamp', datetime.now())
            else:
                timestamp = getattr(log, 'created_at', datetime.now())
            
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            
            log_dates.append(timestamp.date())
        
        # Count logs per day
        date_counts = Counter(log_dates)
        
        # Calculate metrics
        total_days = days
        days_with_logs = len(date_counts)
        avg_logs_per_day = len(logs) / total_days if total_days > 0 else 0
        
        # Calculate trend (comparing first half vs second half)
        sorted_dates = sorted(log_dates)
        if len(sorted_dates) >= 4:
            midpoint = len(sorted_dates) // 2
            first_half_rate = midpoint / ((sorted_dates[midpoint] - sorted_dates[0]).days + 1)
            second_half_rate = (len(sorted_dates) - midpoint) / ((sorted_dates[-1] - sorted_dates[midpoint]).days + 1)
            
            if second_half_rate < first_half_rate * 0.7:
                trend = 'decreasing'
            elif second_half_rate > first_half_rate * 1.3:
                trend = 'increasing'
            else:
                trend = 'stable'
        else:
            trend = 'insufficient_data'
        
        return {
            'avg_logs_per_day': round(avg_logs_per_day, 2),
            'days_with_logs': days_with_logs,
            'coverage_percent': round((days_with_logs / total_days) * 100, 1) if total_days > 0 else 0,
            'trend': trend,
            'is_concerning': avg_logs_per_day < self.baseline_thresholds['min_daily_logs']
        }
    
    def _analyze_detail_level(self, logs: List[Any]) -> Dict:
        """Analyze detail level in caregiver notes"""
        word_counts = []
        
        for log in logs:
            if isinstance(log, dict):
                notes = log.get('notes', '') or ''
            else:
                notes = getattr(log, 'notes', '') or ''
            
            word_count = len(str(notes).split()) if notes else 0
            word_counts.append(word_count)
        
        if not word_counts:
            return {
                'avg_words': 0,
                'trend': 'unknown',
                'is_concerning': True
            }
        
        avg_words = np.mean(word_counts)
        
        # Calculate trend
        if len(word_counts) >= 4:
            first_half = word_counts[:len(word_counts)//2]
            second_half = word_counts[len(word_counts)//2:]
            
            if np.mean(second_half) < np.mean(first_half) * 0.7:
                trend = 'decreasing'
            else:
                trend = 'stable'
        else:
            trend = 'insufficient_data'
        
        return {
            'avg_words': round(avg_words, 1),
            'min_words': min(word_counts),
            'max_words': max(word_counts),
            'trend': trend,
            'is_concerning': avg_words < self.baseline_thresholds['min_avg_words']
        }
    
    def _analyze_consistency(self, logs: List[Any]) -> Dict:
        """Analyze consistency of logging patterns"""
        # Check if logs are spread throughout the day
        log_hours = []
        
        for log in logs:
            if isinstance(log, dict):
                timestamp = log.get('created_at') or log.get('timestamp', datetime.now())
            else:
                timestamp = getattr(log, 'created_at', datetime.now())
            
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            
            log_hours.append(timestamp.hour)
        
        # Calculate distribution across time periods
        morning = sum(1 for h in log_hours if 6 <= h < 12)
        afternoon = sum(1 for h in log_hours if 12 <= h < 18)
        evening = sum(1 for h in log_hours if 18 <= h < 24)
        night = sum(1 for h in log_hours if 0 <= h < 6)
        
        total = len(log_hours)
        time_distribution = {
            'morning': round(morning/total*100, 1) if total > 0 else 0,
            'afternoon': round(afternoon/total*100, 1) if total > 0 else 0,
            'evening': round(evening/total*100, 1) if total > 0 else 0,
            'night': round(night/total*100, 1) if total > 0 else 0
        }
        
        # Calculate consistency score (entropy-based)
        distributions = [v/100 for v in time_distribution.values() if v > 0]
        if distributions:
            entropy = -sum(p * np.log2(p) for p in distributions if p > 0)
            max_entropy = np.log2(4)  # 4 time periods
            consistency_score = entropy / max_entropy if max_entropy > 0 else 0
        else:
            consistency_score = 0
        
        return {
            'consistency_score': round(consistency_score, 2),
            'time_distribution': time_distribution,
            'is_concerning': consistency_score < self.baseline_thresholds['min_consistency_score']
        }
    
    def _analyze_time_distribution(self, logs: List[Any]) -> Dict:
        """Analyze when logs are being created"""
        late_night_logs = 0
        early_morning_logs = 0
        
        for log in logs:
            if isinstance(log, dict):
                timestamp = log.get('created_at') or log.get('timestamp', datetime.now())
            else:
                timestamp = getattr(log, 'created_at', datetime.now())
            
            if isinstance(timestamp, str):
                timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            
            hour = timestamp.hour
            
            if 0 <= hour < 5:
                late_night_logs += 1
            elif 5 <= hour < 7:
                early_morning_logs += 1
        
        total = len(logs)
        
        return {
            'late_night_percent': round((late_night_logs / total) * 100, 1) if total > 0 else 0,
            'early_morning_percent': round((early_morning_logs / total) * 100, 1) if total > 0 else 0,
            'is_concerning': (late_night_logs / total) > 0.2 if total > 0 else False  # >20% late night
        }
    
    def _analyze_sentiment(self, logs: List[Any]) -> Dict:
        """Analyze sentiment in caregiver notes"""
        # Simple keyword-based sentiment analysis
        negative_keywords = [
            'tired', 'exhausted', 'overwhelmed', 'stressed', 'difficult',
            'challenging', 'frustrated', 'cannot', 'impossible', 'too much'
        ]
        
        positive_keywords = [
            'good', 'great', 'excellent', 'cooperative', 'calm',
            'peaceful', 'progressing', 'improved', 'well'
        ]
        
        negative_count = 0
        positive_count = 0
        total_notes = 0
        
        for log in logs:
            if isinstance(log, dict):
                notes = str(log.get('notes', '')).lower()
            else:
                notes = str(getattr(log, 'notes', '')).lower()
            
            if notes and len(notes) > 5:
                total_notes += 1
                if any(kw in notes for kw in negative_keywords):
                    negative_count += 1
                if any(kw in notes for kw in positive_keywords):
                    positive_count += 1
        
        if total_notes == 0:
            return {
                'sentiment_score': 0,
                'trend': 'unknown',
                'is_concerning': False
            }
        
        # Sentiment score: -1 (all negative) to +1 (all positive)
        sentiment_score = (positive_count - negative_count) / total_notes
        
        return {
            'sentiment_score': round(sentiment_score, 2),
            'negative_notes_percent': round((negative_count / total_notes) * 100, 1),
            'positive_notes_percent': round((positive_count / total_notes) * 100, 1),
            'trend': 'more_negative' if negative_count > positive_count else 'neutral',
            'is_concerning': sentiment_score < -0.3
        }
    
    def _identify_burnout_indicators(self, patterns: Dict) -> List[str]:
        """Identify specific burnout indicators"""
        indicators = []
        
        if patterns['logging_frequency'].get('trend') == 'decreasing':
            indicators.append('reduced_engagement')
        
        if patterns['logging_frequency'].get('is_concerning'):
            indicators.append('low_logging_frequency')
        
        if patterns['detail_level'].get('is_concerning'):
            indicators.append('minimal_documentation')
        
        if patterns['detail_level'].get('trend') == 'decreasing':
            indicators.append('declining_detail_quality')
        
        if patterns['sentiment'].get('is_concerning'):
            indicators.append('negative_sentiment')
        
        if patterns['consistency'].get('is_concerning'):
            indicators.append('inconsistent_patterns')
        
        if patterns['time_distribution'].get('is_concerning'):
            indicators.append('abnormal_working_hours')
        
        return indicators
    
    def _calculate_burnout_score(self, indicators: List[str], patterns: Dict) -> float:
        """Calculate overall burnout score (0-1)"""
        # Base score from number of indicators
        base_score = len(indicators) / 7  # 7 possible indicators
        
        # Adjust based on severity of patterns
        severity_adjustments = 0
        
        if patterns['logging_frequency'].get('avg_logs_per_day', 0) < 1:
            severity_adjustments += 0.1
        
        if patterns['detail_level'].get('avg_words', 0) < 5:
            severity_adjustments += 0.1
        
        if patterns['sentiment'].get('sentiment_score', 0) < -0.5:
            severity_adjustments += 0.15
        
        final_score = min(base_score + severity_adjustments, 1.0)
        
        return final_score
    
    def _score_to_level(self, score: float) -> str:
        """Convert burnout score to risk level"""
        if score >= 0.7:
            return 'CRITICAL'
        elif score >= 0.5:
            return 'HIGH'
        elif score >= 0.3:
            return 'MODERATE'
        else:
            return 'LOW'
    
    def _get_support_recommendations(self, score: float, indicators: List[str],
                                    patterns: Dict) -> List[Dict]:
        """Generate support recommendations for caregiver"""
        recs = []
        
        if score >= 0.5:
            recs.append({
                'type': 'urgent',
                'priority': 'high',
                'action': 'Schedule immediate wellness check-in with caregiver',
                'reason': f'High burnout risk detected (score: {score:.2f})'
            })
            recs.append({
                'type': 'operational',
                'priority': 'high',
                'action': 'Consider rotating caregiver assignments or reducing workload',
                'reason': 'Prevent quality of care deterioration'
            })
        
        if 'reduced_engagement' in indicators:
            recs.append({
                'type': 'support',
                'priority': 'medium',
                'action': 'Provide additional training or resources',
                'reason': 'Engagement levels declining'
            })
        
        if 'negative_sentiment' in indicators:
            recs.append({
                'type': 'support',
                'priority': 'medium',
                'action': 'Offer counseling or peer support sessions',
                'reason': 'Negative sentiment detected in notes'
            })
        
        if 'abnormal_working_hours' in indicators:
            recs.append({
                'type': 'operational',
                'priority': 'medium',
                'action': 'Review and adjust work schedule',
                'reason': 'Working abnormal hours (late night/early morning)'
            })
        
        if 'minimal_documentation' in indicators:
            recs.append({
                'type': 'training',
                'priority': 'low',
                'action': 'Provide documentation templates or training',
                'reason': 'Documentation quality declining'
            })
        
        return recs
    
    def _generate_assessment(self, score: float, indicators: List[str]) -> str:
        """Generate human-readable assessment"""
        if score >= 0.7:
            return f"Critical burnout risk detected with {len(indicators)} warning signs. Immediate intervention required."
        elif score >= 0.5:
            return f"High burnout risk with {len(indicators)} concerning patterns. Support and workload adjustment recommended."
        elif score >= 0.3:
            return f"Moderate burnout risk showing {len(indicators)} indicators. Monitor closely and provide support."
        else:
            return "Low burnout risk. Caregiver showing healthy engagement patterns."
