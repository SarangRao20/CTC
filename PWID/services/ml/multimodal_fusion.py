"""
Multi-Modal Fusion for Comprehensive Assessment
Fuses insights from multiple data sources for unified risk assessment
"""

from typing import Dict, List, Optional, Any
from datetime import datetime

class MultiModalFusion:
    """
    Fuses insights from multiple data sources:
    - Text observations
    - Voice notes (with potential tone analysis)
    - Structured logs
    - ML predictions
    
    Creates unified risk assessment with conflict detection.
    """
    
    def __init__(self):
        # Default weights for each modality (can be adjusted based on reliability)
        self.default_weights = {
            'structured': 0.40,  # Highest weight - most reliable
            'text': 0.25,
            'ml_prediction': 0.20,
            'voice': 0.15
        }
        
    def fuse_modalities(self, pwid_id: int,
                       structured_data: Optional[Dict] = None,
                       text_obs: Optional[Dict] = None,
                       voice_analysis: Optional[Dict] = None,
                       ml_predictions: Optional[Dict] = None) -> Dict:
        """
        Weighted fusion of multiple modalities.
        Returns unified risk assessment with confidence scores.
        """
        # Collect available modalities
        available_modalities = {}
        
        if structured_data:
            available_modalities['structured'] = structured_data
        if text_obs:
            available_modalities['text'] = text_obs
        if voice_analysis:
            available_modalities['voice'] = voice_analysis
        if ml_predictions:
            available_modalities['ml_prediction'] = ml_predictions
        
        if not available_modalities:
            return {
                'status': 'error',
                'message': 'No data provided for fusion'
            }
        
        # Extract risk signals from each modality
        signals = {}
        for modality, data in available_modalities.items():
            signals[modality] = self._extract_signals(modality, data)
        
        # Adjust weights based on available modalities
        weights = self._adjust_weights(available_modalities.keys())
        
        # Weighted fusion
        fused_risk = self._compute_fused_risk(signals, weights)
        
        # Detect conflicts between modalities
        conflicts = self._detect_conflicts(signals)
        
        # Compute overall confidence
        confidence = self._compute_fusion_confidence(signals, conflicts, weights)
        
        # Determine dominant signal
        dominant = max(signals.items(), 
                      key=lambda x: x[1]['risk_score'] if x[1] else 0)[0]
        
        return {
            'status': 'success',
            'pwid_id': pwid_id,
            'fusion_timestamp': datetime.now().isoformat(),
            'fused_risk_score': round(fused_risk, 2),
            'fused_risk_level': self._score_to_level(fused_risk),
            'modality_signals': signals,
            'weights_used': weights,
            'conflicts_detected': conflicts,
            'fusion_confidence': round(confidence, 2),
            'dominant_signal': dominant,
            'recommendation': self._generate_fusion_recommendation(fused_risk, conflicts, confidence)
        }
    
    def _extract_signals(self, modality: str, data: Dict) -> Optional[Dict]:
        """Extract risk signals from each modality"""
        if modality == 'structured':
            return self._extract_structured_signals(data)
        elif modality == 'text':
            return self._extract_text_signals(data)
        elif modality == 'voice':
            return self._extract_voice_signals(data)
        elif modality == 'ml_prediction':
            return self._extract_ml_signals(data)
        return None
    
    def _extract_structured_signals(self, data: Dict) -> Dict:
        """Extract signals from structured routine logs"""
        risk_score = 0
        indicators = []
        
        # Mood assessment
        mood = data.get('mood', 'Unknown')
        if mood in ['Aggressive', 'aggressive']:
            risk_score += 3
            indicators.append('aggressive mood')
        elif mood in ['Irritable', 'irritable']:
            risk_score += 2
            indicators.append('irritable mood')
        elif mood in ['Anxious', 'anxious']:
            risk_score += 1.5
            indicators.append('anxious mood')
        
        # Sleep quality
        sleep = data.get('sleep_quality', 'Unknown')
        if sleep in ['Poor', 'poor']:
            risk_score += 2
            indicators.append('poor sleep')
        elif sleep in ['Disturbed', 'disturbed']:
            risk_score += 1
            indicators.append('disturbed sleep')
        
        # Meal intake
        meals = data.get('meals', 'Unknown')
        if meals in ['Skipped', 'skipped']:
            risk_score += 1.5
            indicators.append('skipped meals')
        elif meals in ['Reduced', 'reduced']:
            risk_score += 0.5
            indicators.append('reduced appetite')
        
        # Incident
        incident = data.get('incident', 'None')
        if incident in ['Concerning', 'concerning']:
            risk_score += 3
            indicators.append('concerning incident')
        elif incident in ['yes', 'Yes', 'Minor', 'minor']:
            risk_score += 1.5
            indicators.append('minor incident')
        
        # Medication compliance
        if data.get('medication_given') in ['no', 'No', False]:
            risk_score += 1
            indicators.append('missed medication')
        
        # Normalize to 0-10 scale
        normalized_score = min(risk_score, 10)
        
        return {
            'risk_score': normalized_score,
            'raw_score': risk_score,
            'indicators': indicators,
            'confidence': 0.9,  # High confidence in structured data
            'source': 'structured_log'
        }
    
    def _extract_text_signals(self, data: Dict) -> Dict:
        """Extract signals from NLP-processed text observations"""
        risk_score = 0
        indicators = []
        
        # From NLP extraction
        behaviors = data.get('behaviors', [])
        severity = data.get('severity', 'low')
        
        # Behavior-based risk
        high_risk_behaviors = ['aggression', 'self_harm', 'tantrum']
        for behavior in behaviors:
            if isinstance(behavior, dict):
                behavior_name = behavior.get('behavior', '')
                confidence = behavior.get('confidence', 0)
                
                if behavior_name in high_risk_behaviors:
                    risk_score += 3 * confidence
                    indicators.append(f"{behavior_name} detected")
        
        # Severity adjustment
        severity_multiplier = {'high': 1.5, 'medium': 1.0, 'low': 0.5}.get(severity, 1.0)
        risk_score *= severity_multiplier
        
        # Triggers present
        if data.get('triggers'):
            indicators.append('triggers identified')
        
        # Urgent attention flag
        if data.get('requires_immediate_attention'):
            risk_score += 2
            indicators.append('urgent attention required')
        
        normalized_score = min(risk_score, 10)
        
        return {
            'risk_score': normalized_score,
            'indicators': indicators,
            'confidence': data.get('confidence', 0.6),
            'source': 'text_nlp'
        }
    
    def _extract_voice_signals(self, data: Dict) -> Dict:
        """Extract signals from voice analysis"""
        risk_score = 0
        indicators = []
        
        # Basic transcription-based analysis
        transcript = data.get('transcript', '')
        
        # Check for stress indicators in voice (if available)
        if data.get('stress_level'):
            stress = data.get('stress_level', 0)
            risk_score += stress * 2
            if stress > 0.5:
                indicators.append('elevated stress in voice')
        
        # Urgency in speech
        if data.get('urgent_tone'):
            risk_score += 1.5
            indicators.append('urgent tone detected')
        
        # Sentiment from voice (if available)
        sentiment = data.get('sentiment', 'neutral')
        if sentiment == 'negative':
            risk_score += 1
            indicators.append('negative sentiment')
        
        normalized_score = min(risk_score, 10)
        
        return {
            'risk_score': normalized_score,
            'indicators': indicators,
            'confidence': 0.6,  # Medium confidence - voice analysis can be noisy
            'source': 'voice_analysis'
        }
    
    def _extract_ml_signals(self, data: Dict) -> Dict:
        """Extract signals from ML predictions"""
        risk_score = 0
        indicators = []
        
        # Crisis prediction
        if data.get('crisis_probability'):
            crisis_prob = data.get('crisis_probability', 0)
            risk_score = crisis_prob * 10  # Scale to 0-10
            
            risk_level = data.get('risk_level', 'LOW')
            indicators.append(f"crisis risk: {risk_level}")
        
        # Anomaly detection
        if data.get('is_anomaly'):
            anomaly_score = data.get('anomaly_score', 0)
            risk_score += anomaly_score * 3
            indicators.append('behavioral anomaly detected')
        
        # Trend forecast
        if data.get('risk_trajectory'):
            trajectory = data.get('risk_trajectory', {})
            if trajectory.get('level') == 'HIGH_RISK_ESCALATION':
                risk_score += 2
                indicators.append('escalation trajectory')
        
        normalized_score = min(risk_score, 10)
        model_confidence = data.get('model_confidence', data.get('confidence', 0.7))
        
        return {
            'risk_score': normalized_score,
            'indicators': indicators,
            'confidence': model_confidence,
            'source': 'ml_predictions'
        }
    
    def _adjust_weights(self, available_modalities: List[str]) -> Dict:
        """Adjust weights based on available modalities"""
        weights = {}
        total_weight = sum(self.default_weights[m] for m in available_modalities)
        
        # Normalize weights to sum to 1.0
        for modality in available_modalities:
            weights[modality] = self.default_weights[modality] / total_weight
        
        return weights
    
    def _compute_fused_risk(self, signals: Dict, weights: Dict) -> float:
        """Compute weighted fusion of risk scores"""
        fused_score = 0
        
        for modality, weight in weights.items():
            if modality in signals and signals[modality]:
                signal_score = signals[modality].get('risk_score', 0)
                signal_confidence = signals[modality].get('confidence', 1.0)
                fused_score += weight * signal_score * signal_confidence
        
        return fused_score
    
    def _detect_conflicts(self, signals: Dict) -> List[Dict]:
        """Detect conflicts between different modality signals"""
        conflicts = []
        
        modalities = list(signals.keys())
        
        for i, mod1 in enumerate(modalities):
            for mod2 in modalities[i+1:]:
                if signals[mod1] and signals[mod2]:
                    score1 = signals[mod1].get('risk_score', 0)
                    score2 = signals[mod2].get('risk_score', 0)
                    
                    # Significant difference (>3 points on 0-10 scale)
                    if abs(score1 - score2) > 3:
                        conflicts.append({
                            'modalities': [mod1, mod2],
                            'scores': [round(score1, 2), round(score2, 2)],
                            'difference': round(abs(score1 - score2), 2),
                            'severity': 'high' if abs(score1 - score2) > 5 else 'moderate',
                            'recommendation': f'Verify {mod1} and {mod2} data for accuracy'
                        })
        
        return conflicts
    
    def _compute_fusion_confidence(self, signals: Dict, conflicts: List[Dict], 
                                   weights: Dict) -> float:
        """Compute overall confidence in the fusion"""
        # Start with average confidence of signals
        confidences = [s.get('confidence', 0) for s in signals.values() if s]
        
        if not confidences:
            return 0.0
        
        avg_confidence = sum(confidences) / len(confidences)
        
        # Reduce confidence if conflicts exist
        if conflicts:
            conflict_penalty = len(conflicts) * 0.1
            avg_confidence -= conflict_penalty
        
        # Boost confidence if multiple modalities agree
        if len(signals) >= 3:
            risk_scores = [s.get('risk_score', 0) for s in signals.values() if s]
            std_dev = np.std(risk_scores) if len(risk_scores) > 1 else 0
            
            if std_dev < 2:  # Low variance = agreement
                avg_confidence += 0.1
        
        return max(0, min(avg_confidence, 1.0))
    
    def _score_to_level(self, score: float) -> str:
        """Convert numeric score to risk level"""
        if score >= 7:
            return 'CRITICAL'
        elif score >= 5:
            return 'HIGH'
        elif score >= 3:
            return 'MODERATE'
        else:
            return 'LOW'
    
    def _generate_fusion_recommendation(self, risk_score: float, conflicts: List[Dict],
                                       confidence: float) -> str:
        """Generate recommendation based on fusion result"""
        recommendations = []
        
        # Risk-based recommendations
        if risk_score >= 7:
            recommendations.append('Immediate intervention required')
        elif risk_score >= 5:
            recommendations.append('Increased monitoring recommended')
        elif risk_score >= 3:
            recommendations.append('Continue standard care with attention')
        else:
            recommendations.append('Condition stable, maintain routine')
        
        # Conflict-based recommendations
        if conflicts:
            recommendations.append('Data conflicts detected - verify observations')
        
        # Confidence-based recommendations
        if confidence < 0.5:
            recommendations.append('Low confidence - gather more data')
        
        return '. '.join(recommendations)


import numpy as np  # Import at top if not already there
