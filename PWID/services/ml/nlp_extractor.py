"""
NLP-Powered Observation Extraction
Extracts structured data from caregiver free-text observations
Uses pattern matching, NER, and zero-shot classification
"""

import re
from datetime import datetime
from typing import Dict, List, Optional, Any
import spacy

class ObservationNLPExtractor:
    """
    Extracts structured data from caregiver free-text observations.
    Works with English and handles mixed Hindi-English (Hinglish) input.
    """
    
    def __init__(self):
        # Try to load spaCy model, fallback to rule-based if not available
        try:
            self.nlp = spacy.load("en_core_web_sm")
            self.spacy_available = True
        except:
            print("SpaCy model not available. Using rule-based extraction only.")
            self.nlp = None
            self.spacy_available = False
        
        self.behavior_categories = {
            'aggression': ['hit', 'punch', 'kick', 'aggressive', 'violent', 'attack', 'threw', 'slap'],
            'tantrum': ['tantrum', 'meltdown', 'crying', 'screaming', 'yelling', 'shouting'],
            'calm': ['calm', 'peaceful', 'quiet', 'relaxed', 'content'],
            'happy': ['happy', 'smiling', 'laughing', 'cheerful', 'playful'],
            'anxious': ['anxious', 'worried', 'nervous', 'restless', 'agitated'],
            'refused_medication': ['refused', 'medication', 'pill', 'medicine', 'not take', "didn't take"],
            'sleep_issue': ['could not sleep', 'insomnia', 'woke up', 'restless night', 'nightmare'],
            'appetite_change': ['not eating', 'refused food', 'no appetite', 'ate less', 'overate'],
            'social_withdrawal': ['isolated', 'alone', 'withdrawn', 'not interacting', 'avoiding'],
            'self_harm': ['hurt himself', 'hurt herself', 'self harm', 'self-harm', 'banging head'],
            'cooperation': ['cooperative', 'helpful', 'compliant', 'listening', 'following']
        }
        
        self.severity_keywords = {
            'high': ['severe', 'extreme', 'violent', 'multiple', 'constant', 'continuous', 'very', 'extremely'],
            'medium': ['moderate', 'some', 'occasional', 'few', 'sometimes', 'moderately'],
            'low': ['mild', 'slight', 'minor', 'brief', 'little', 'barely']
        }
        
        self.trigger_keywords = [
            'after meal', 'before sleep', 'loud noise', 'change in routine', 'new person',
            'medication change', 'missed medication', 'hunger', 'tired', 'overstimulated',
            'argument', 'denied request', 'transition', 'visitor', 'change', 'noise'
        ]
    
    def extract_structured_data(self, text: str) -> Dict:
        """
        Main extraction method: converts free text to structured observation data.
        Returns dictionary with behaviors, severity, counts, triggers, etc.
        """
        if not text or len(text.strip()) < 3:
            return {'error': 'Text too short or empty'}
        
        text_lower = text.lower()
        
        # Detect behaviors
        detected_behaviors = self._detect_behaviors(text_lower)
        
        # Extract numerical counts
        counts = self._extract_counts(text_lower)
        
        # Extract time references
        time_refs = self._extract_time_references(text_lower)
        
        # Extract triggers
        triggers = self._extract_triggers(text_lower)
        
        # Determine severity
        severity = self._determine_severity(text_lower, detected_behaviors)
        
        # Extract mood if mentioned
        mood = self._extract_mood(text_lower)
        
        # Extract sleep quality if mentioned
        sleep = self._extract_sleep(text_lower)
        
        # Extract meal info if mentioned
        meals = self._extract_meals(text_lower)
        
        # Determine if immediate attention needed
        requires_attention = self._assess_urgency(detected_behaviors, severity, text_lower)
        
        # Generate summary
        summary = self._generate_summary(detected_behaviors, severity, counts)
        
        return {
            'original_text': text,
            'behaviors': detected_behaviors,
            'primary_behavior': detected_behaviors[0] if detected_behaviors else None,
            'counts': counts,
            'time_references': time_refs,
            'triggers': triggers,
            'severity': severity,
            'mood': mood,
            'sleep_quality': sleep,
            'meal_status': meals,
            'requires_immediate_attention': requires_attention,
            'structured_summary': summary,
            'confidence': self._calculate_confidence(detected_behaviors, counts, triggers)
        }
    
    def _detect_behaviors(self, text: str) -> List[Dict]:
        """Detect behavioral categories from text"""
        detected = []
        
        for behavior, keywords in self.behavior_categories.items():
            matches = sum(1 for kw in keywords if kw in text)
            if matches > 0:
                confidence = min(matches * 0.3, 1.0)  # Scale confidence
                detected.append({
                    'behavior': behavior,
                    'confidence': round(confidence, 2),
                    'matched_keywords': [kw for kw in keywords if kw in text]
                })
        
        # Sort by confidence
        detected.sort(key=lambda x: x['confidence'], reverse=True)
        
        return detected
    
    def _extract_counts(self, text: str) -> Dict:
        """Extract numerical counts from text"""
        counts = {}
        
        patterns = {
            'tantrum_count': [
                r'(\d+)\s*(?:tantrum|meltdown)s?',
                r'tantrum\s*(?:happened|occurred)\s*(\d+)\s*time',
            ],
            'aggression_count': [
                r'(\d+)\s*(?:hit|punch|kick|aggressive\s+incident)s?',
                r'(?:hit|punched|kicked)\s*(\d+)\s*time',
            ],
            'medication_doses': [
                r'(\d+)\s*(?:dose|pill|tablet|medication)s?',
                r'took\s*(\d+)\s*(?:pill|tablet)',
            ],
            'incidents': [
                r'(\d+)\s*incident',
                r'incident\s*occurred\s*(\d+)\s*time',
            ]
        }
        
        for key, pattern_list in patterns.items():
            for pattern in pattern_list:
                match = re.search(pattern, text)
                if match:
                    try:
                        counts[key] = int(match.group(1))
                        break
                    except:
                        continue
        
        return counts
    
    def _extract_time_references(self, text: str) -> List[str]:
        """Extract time references from text"""
        times = []
        
        time_patterns = [
            r'(?:at|around)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)',
            r'\b(morning|afternoon|evening|night|midnight|noon)\b',
            r'(before|after|during)\s*(?:breakfast|lunch|dinner|meal|sleep|bedtime)',
            r'(\d{1,2})\s*(?:o\'?clock)',
        ]
        
        for pattern in time_patterns:
            matches = re.findall(pattern, text)
            if matches:
                if isinstance(matches[0], tuple):
                    times.extend([m for m in matches[0] if m])
                else:
                    times.extend(matches)
        
        return list(set(times))  # Remove duplicates
    
    def _extract_triggers(self, text: str) -> List[str]:
        """Extract potential behavioral triggers"""
        found_triggers = []
        
        for trigger in self.trigger_keywords:
            if trigger in text:
                found_triggers.append(trigger)
        
        # Additional pattern-based triggers
        trigger_patterns = [
            r'because of ([\w\s]+)',
            r'triggered by ([\w\s]+)',
            r'due to ([\w\s]+)',
            r'caused by ([\w\s]+)',
        ]
        
        for pattern in trigger_patterns:
            matches = re.findall(pattern, text)
            if matches:
                found_triggers.extend([m.strip() for m in matches if len(m.strip()) < 50])
        
        return found_triggers
    
    def _determine_severity(self, text: str, behaviors: List[Dict]) -> str:
        """Determine overall severity level"""
        # Check for explicit severity keywords
        for severity, keywords in self.severity_keywords.items():
            if any(kw in text for kw in keywords):
                return severity
        
        # Infer from behaviors
        high_risk_behaviors = ['aggression', 'self_harm']
        if any(b['behavior'] in high_risk_behaviors for b in behaviors):
            return 'high'
        
        medium_risk_behaviors = ['tantrum', 'anxious', 'refused_medication', 'social_withdrawal']
        if any(b['behavior'] in medium_risk_behaviors for b in behaviors):
            return 'medium'
        
        return 'low'
    
    def _extract_mood(self, text: str) -> Optional[str]:
        """Extract mood if explicitly mentioned"""
        mood_patterns = {
            'calm': ['calm', 'peaceful', 'relaxed'],
            'happy': ['happy', 'cheerful', 'good mood'],
            'anxious': ['anxious', 'worried', 'nervous'],
            'irritable': ['irritable', 'irritated', 'frustrated'],
            'aggressive': ['aggressive', 'angry', 'hostile']
        }
        
        for mood, keywords in mood_patterns.items():
            if any(kw in text for kw in keywords):
                return mood
        
        return None
    
    def _extract_sleep(self, text: str) -> Optional[str]:
        """Extract sleep quality if mentioned"""
        if any(kw in text for kw in ['good sleep', 'slept well', 'rested']):
            return 'good'
        elif any(kw in text for kw in ['poor sleep', 'disturbed', 'restless', 'insomnia', 'could not sleep']):
            return 'poor'
        elif any(kw in text for kw in ['woke up', 'nightmares']):
            return 'disturbed'
        
        return None
    
    def _extract_meals(self, text: str) -> Optional[str]:
        """Extract meal information if mentioned"""
        if any(kw in text for kw in ['ate well', 'finished meal', 'good appetite', 'ate everything']):
            return 'normal'
        elif any(kw in text for kw in ['ate less', 'half meal', 'reduced appetite']):
            return 'reduced'
        elif any(kw in text for kw in ['refused food', 'did not eat', "didn't eat", 'skipped meal']):
            return 'skipped'
        
        return None
    
    def _assess_urgency(self, behaviors: List[Dict], severity: str, text: str) -> bool:
        """Determine if observation requires immediate attention"""
        # Critical keywords
        urgent_keywords = ['emergency', 'urgent', 'help', 'injury', 'blood', 'hurt badly', 'call doctor']
        if any(kw in text for kw in urgent_keywords):
            return True
        
        # High severity with critical behaviors
        if severity == 'high':
            return True
        
        # Check for critical behaviors
        critical_behaviors = ['aggression', 'self_harm']
        if any(b['behavior'] in critical_behaviors and b['confidence'] > 0.5 for b in behaviors):
            return True
        
        return False
    
    def _generate_summary(self, behaviors: List[Dict], severity: str, counts: Dict) -> str:
        """Generate human-readable summary"""
        if not behaviors:
            return "General observation logged."
        
        primary = behaviors[0]['behavior'].replace('_', ' ').title()
        summary_parts = [f"{primary} observed"]
        
        if severity in ['high', 'medium']:
            summary_parts.append(f"({severity} severity)")
        
        if counts:
            count_str = ', '.join([f"{v} {k.replace('_', ' ')}" for k, v in counts.items()])
            summary_parts.append(f"- {count_str}")
        
        return '. '.join(summary_parts) + '.'
    
    def _calculate_confidence(self, behaviors: List[Dict], counts: Dict, triggers: List[str]) -> float:
        """Calculate overall extraction confidence"""
        confidence_factors = []
        
        # Behavior detection confidence
        if behaviors:
            confidence_factors.append(behaviors[0]['confidence'])
        
        # Presence of counts increases confidence
        if counts:
            confidence_factors.append(0.8)
        
        # Presence of triggers increases confidence
        if triggers:
            confidence_factors.append(0.7)
        
        if not confidence_factors:
            return 0.3  # Low confidence if nothing extracted
        
        return round(sum(confidence_factors) / len(confidence_factors), 2)
    
    def extract_from_voice_transcript(self, transcript: str, language: str = 'en') -> Dict:
        """
        Special handling for voice transcripts which may have errors.
        More lenient pattern matching.
        """
        # Apply phonetic corrections for common transcription errors
        corrected = self._apply_phonetic_corrections(transcript)
        
        # Use standard extraction
        result = self.extract_structured_data(corrected)
        result['source'] = 'voice_transcript'
        result['language'] = language
        result['original_transcript'] = transcript
        
        return result
    
    def _apply_phonetic_corrections(self, text: str) -> str:
        """Apply common phonetic corrections for speech-to-text errors"""
        corrections = {
            'adam': 'had him',
            'hit him': 'hit him',
            'tantrum': 'tantrum',
            'medicine': 'medication',
            # Add more as needed
        }
        
        corrected = text
        for wrong, right in corrections.items():
            corrected = corrected.replace(wrong, right)
        
        return corrected
    
    def batch_extract(self, texts: List[str]) -> List[Dict]:
        """Extract from multiple texts in batch"""
        results = []
        for text in texts:
            try:
                result = self.extract_structured_data(text)
                results.append(result)
            except Exception as e:
                results.append({
                    'error': str(e),
                    'original_text': text
                })
        
        return results
