"""
ML Orchestrator - Central coordinator for all ML services
Provides unified interface for ML operations
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

from .anomaly_detector import BehavioralAnomalyDetector
from .trend_forecaster import BehaviorTrendForecaster
from .nlp_extractor import ObservationNLPExtractor
from .trigger_engine import TriggerCorrelationEngine
from .crisis_predictor import CrisisPredictor
from .multimodal_fusion import MultiModalFusion
from .caregiver_monitor import CaregiverBurnoutDetector

class MLOrchestrator:
    """
    Central orchestrator for all ML services.
    Provides unified interface and coordinates between different ML components.
    """
    
    def __init__(self, models_dir: str = 'models'):
        self.anomaly_detector = BehavioralAnomalyDetector(f'{models_dir}/anomaly')
        self.trend_forecaster = BehaviorTrendForecaster()
        self.nlp_extractor = ObservationNLPExtractor()
        self.trigger_engine = TriggerCorrelationEngine()
        self.crisis_predictor = CrisisPredictor(f'{models_dir}/crisis')
        self.multimodal_fusion = MultiModalFusion()
        self.caregiver_monitor = CaregiverBurnoutDetector()
        
    def comprehensive_analysis(self, pwid_id: int, observations: List[Any],
                              include_forecast: bool = True,
                              include_crisis: bool = True) -> Dict:
        """
        Run comprehensive ML analysis on PWID observations.
        Returns unified report with all insights.
        """
        results = {
            'pwid_id': pwid_id,
            'analysis_timestamp': datetime.now().isoformat(),
            'observations_analyzed': len(observations),
            'status': 'success'
        }
        
        # 1. Anomaly Detection
        if len(observations) >= 14:
            latest_obs = observations[-1] if observations else None
            if latest_obs:
                anomaly_result = self.anomaly_detector.detect_anomaly(pwid_id, latest_obs)
                results['anomaly_detection'] = anomaly_result
        else:
            results['anomaly_detection'] = {
                'status': 'training_required',
                'message': 'Need 14+ observations to train baseline'
            }
        
        # 2. Trend Forecasting
        if include_forecast and len(observations) >= 7:
            forecast = self.trend_forecaster.forecast_risk(pwid_id, observations, days_ahead=7)
            results['trend_forecast'] = forecast
        
        # 3. Trigger Correlation Analysis
        if len(observations) >= 30:
            triggers = self.trigger_engine.analyze_triggers(pwid_id, observations)
            results['trigger_analysis'] = triggers
        else:
            results['trigger_analysis'] = {
                'status': 'insufficient_data',
                'message': 'Need 30+ observations for trigger analysis'
            }
        
        # 4. Crisis Prediction
        if include_crisis:
            crisis_pred = self.crisis_predictor.predict_crisis(pwid_id, observations)
            results['crisis_prediction'] = crisis_pred
        
        # 5. Generate unified risk assessment
        results['unified_risk_assessment'] = self._generate_unified_assessment(results)
        
        # 6. Action items
        results['recommended_actions'] = self._generate_action_items(results)
        
        return results
    
    def process_text_observation(self, text: str, pwid_id: Optional[int] = None) -> Dict:
        """
        Process free-text observation and extract structured data.
        Optionally includes anomaly check if pwid_id provided.
        """
        # Extract structured data from text
        extraction = self.nlp_extractor.extract_structured_data(text)
        
        result = {
            'extraction': extraction,
            'timestamp': datetime.now().isoformat()
        }
        
        # If PWID ID provided, check against baseline
        if pwid_id and extraction.get('behaviors'):
            # Convert extraction to observation format for anomaly detection
            mock_obs = {
                'mood': extraction.get('mood', 'Unknown'),
                'sleep_quality': extraction.get('sleep_quality', 'Unknown'),
                'meals': extraction.get('meal_status', 'Unknown'),
                'incident': extraction.get('severity', 'None'),
                'created_at': datetime.now()
            }
            
            anomaly = self.anomaly_detector.detect_anomaly(pwid_id, mock_obs)
            result['anomaly_check'] = anomaly
        
        return result
    
    def train_pwid_models(self, pwid_id: int, observations: List[Any]) -> Dict:
        """
        Train all applicable models for a PWID.
        Call this when sufficient historical data is available.
        """
        results = {
            'pwid_id': pwid_id,
            'training_timestamp': datetime.now().isoformat(),
            'observations_provided': len(observations)
        }
        
        # Train anomaly detector baseline
        if len(observations) >= 14:
            anomaly_training = self.anomaly_detector.train_baseline(pwid_id, observations)
            results['anomaly_model'] = anomaly_training
        else:
            results['anomaly_model'] = {
                'status': 'insufficient_data',
                'required': 14,
                'available': len(observations)
            }
        
        # Train crisis predictor
        if len(observations) >= 50:
            crisis_training = self.crisis_predictor.train(pwid_id, observations)
            results['crisis_model'] = crisis_training
        else:
            results['crisis_model'] = {
                'status': 'insufficient_data',
                'required': 50,
                'available': len(observations)
            }
        
        # Check if ready for trigger analysis
        if len(observations) >= 30:
            results['trigger_analysis_ready'] = True
        else:
            results['trigger_analysis_ready'] = False
        
        return results
    
    def analyze_caregiver_health(self, caregiver_id: int, logs: List[Any],
                                days: int = 30) -> Dict:
        """
        Analyze caregiver patterns for burnout detection.
        """
        return self.caregiver_monitor.analyze_caregiver_patterns(
            caregiver_id, logs, analysis_days=days
        )
    
    def get_daily_summary(self, pwid_id: int, observations: List[Any],
                         date: Optional[datetime] = None) -> Dict:
        """
        Generate daily summary report for a PWID.
        """
        if date is None:
            date = datetime.now()
        
        # Filter observations for the specific date
        day_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        daily_obs = []
        for obs in observations:
            obs_time = self._get_timestamp(obs)
            if day_start <= obs_time < day_end:
                daily_obs.append(obs)
        
        if not daily_obs:
            return {
                'status': 'no_data',
                'date': date.date().isoformat(),
                'message': 'No observations for this date'
            }
        
        summary = {
            'pwid_id': pwid_id,
            'date': date.date().isoformat(),
            'observations_count': len(daily_obs),
            'status': 'success'
        }
        
        # Analyze each observation for anomalies
        anomalies_detected = []
        for obs in daily_obs:
            anomaly = self.anomaly_detector.detect_anomaly(pwid_id, obs)
            if anomaly.get('is_anomaly'):
                anomalies_detected.append(anomaly)
        
        summary['anomalies_detected'] = len(anomalies_detected)
        summary['anomaly_details'] = anomalies_detected
        
        # Get overall day assessment
        summary['day_assessment'] = self._assess_day_quality(daily_obs, anomalies_detected)
        
        return summary
    
    def get_weekly_report(self, pwid_id: int, observations: List[Any]) -> Dict:
        """
        Generate comprehensive weekly report.
        """
        # Filter last 7 days
        week_ago = datetime.now() - timedelta(days=7)
        recent_obs = [
            obs for obs in observations
            if self._get_timestamp(obs) >= week_ago
        ]
        
        if len(recent_obs) < 3:
            return {
                'status': 'insufficient_data',
                'observations_available': len(recent_obs),
                'message': 'Need at least 3 observations for weekly report'
            }
        
        report = {
            'pwid_id': pwid_id,
            'report_period': f'{week_ago.date()} to {datetime.now().date()}',
            'observations_count': len(recent_obs),
            'status': 'success'
        }
        
        # Trend analysis
        if len(observations) >= 7:
            trends = self.trend_forecaster.get_trend_analysis(pwid_id, observations, window_days=30)
            report['trends'] = trends
        
        # Anomaly summary
        anomalies = []
        for obs in recent_obs:
            anomaly = self.anomaly_detector.detect_anomaly(pwid_id, obs)
            if anomaly.get('is_anomaly'):
                anomalies.append(anomaly)
        
        report['anomalies_this_week'] = len(anomalies)
        report['anomaly_rate'] = round(len(anomalies) / len(recent_obs), 2) if recent_obs else 0
        
        # Crisis risk
        crisis = self.crisis_predictor.predict_crisis(pwid_id, observations)
        report['crisis_risk'] = crisis
        
        # Weekly summary
        report['summary'] = self._generate_weekly_summary(report)
        
        return report
    
    def _generate_unified_assessment(self, analysis_results: Dict) -> Dict:
        """Generate unified risk assessment from all analyses"""
        risk_signals = []
        
        # Anomaly signals
        if analysis_results.get('anomaly_detection', {}).get('is_anomaly'):
            risk_signals.append({
                'source': 'anomaly_detection',
                'severity': analysis_results['anomaly_detection'].get('severity', 'unknown'),
                'score': analysis_results['anomaly_detection'].get('anomaly_score', 0)
            })
        
        # Crisis prediction signals
        if analysis_results.get('crisis_prediction', {}).get('crisis_probability'):
            crisis_prob = analysis_results['crisis_prediction']['crisis_probability']
            risk_signals.append({
                'source': 'crisis_prediction',
                'severity': analysis_results['crisis_prediction'].get('risk_level', 'unknown'),
                'score': crisis_prob
            })
        
        # Trend forecast signals
        if analysis_results.get('trend_forecast', {}).get('risk_trajectory'):
            trajectory = analysis_results['trend_forecast']['risk_trajectory']
            risk_signals.append({
                'source': 'trend_forecast',
                'severity': trajectory.get('level', 'unknown'),
                'score': trajectory.get('score', 0)
            })
        
        # Calculate overall risk
        if risk_signals:
            avg_score = sum(s['score'] for s in risk_signals) / len(risk_signals)
            severities = [s['severity'] for s in risk_signals]
            
            if any(s in ['CRITICAL', 'HIGH_RISK_ESCALATION'] for s in severities):
                overall_level = 'CRITICAL'
            elif any(s in ['HIGH', 'MODERATE_CONCERN'] for s in severities):
                overall_level = 'HIGH'
            else:
                overall_level = 'MODERATE'
        else:
            avg_score = 0
            overall_level = 'LOW'
        
        return {
            'overall_risk_level': overall_level,
            'risk_score': round(avg_score, 2),
            'contributing_signals': risk_signals,
            'confidence': 'high' if len(risk_signals) >= 2 else 'moderate'
        }
    
    def _generate_action_items(self, analysis_results: Dict) -> List[Dict]:
        """Generate prioritized action items from analysis"""
        actions = []
        
        # From crisis prediction
        if analysis_results.get('crisis_prediction', {}).get('recommended_actions'):
            for action in analysis_results['crisis_prediction']['recommended_actions']:
                actions.append(action)
        
        # From trend forecast
        if analysis_results.get('trend_forecast', {}).get('recommendations'):
            for rec in analysis_results['trend_forecast']['recommendations']:
                actions.append(rec)
        
        # From trigger analysis
        if analysis_results.get('trigger_analysis', {}).get('actionable_insights'):
            for insight in analysis_results['trigger_analysis']['actionable_insights']:
                actions.append({
                    'priority': insight.get('priority', 'medium'),
                    'action': insight.get('action', ''),
                    'reason': insight.get('message', '')
                })
        
        # Sort by priority
        priority_order = {'immediate': 0, 'critical': 1, 'high': 2, 'medium': 3, 'low': 4}
        actions.sort(key=lambda x: priority_order.get(x.get('priority', 'medium'), 3))
        
        return actions
    
    def _assess_day_quality(self, observations: List[Any], anomalies: List[Dict]) -> str:
        """Assess overall quality of a day"""
        if len(anomalies) >= 2:
            return 'Challenging day with multiple concerning observations'
        elif len(anomalies) == 1:
            return 'Day had one unusual incident requiring attention'
        elif len(observations) >= 3:
            return 'Normal day with regular monitoring'
        else:
            return 'Limited observations for comprehensive assessment'
    
    def _generate_weekly_summary(self, report: Dict) -> str:
        """Generate human-readable weekly summary"""
        obs_count = report.get('observations_count', 0)
        anomaly_rate = report.get('anomaly_rate', 0)
        crisis_level = report.get('crisis_risk', {}).get('risk_level', 'UNKNOWN')
        
        summary_parts = [
            f"Week monitored with {obs_count} observations."
        ]
        
        if anomaly_rate > 0.3:
            summary_parts.append(f"High anomaly rate ({anomaly_rate*100:.0f}%) indicates unstable period.")
        elif anomaly_rate > 0.1:
            summary_parts.append(f"Moderate anomaly rate ({anomaly_rate*100:.0f}%).")
        else:
            summary_parts.append("Stable week with minimal anomalies.")
        
        summary_parts.append(f"Crisis risk: {crisis_level}.")
        
        return ' '.join(summary_parts)
    
    def _get_timestamp(self, obs: Any) -> datetime:
        """Helper to extract timestamp from observation"""
        if isinstance(obs, dict):
            ts = obs.get('created_at') or obs.get('timestamp', datetime.now())
            if isinstance(ts, str):
                return datetime.fromisoformat(ts.replace('Z', '+00:00'))
            return ts
        return getattr(obs, 'created_at', datetime.now())
