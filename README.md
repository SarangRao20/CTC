# 🌟 Smart Assistive System for Intellectually Disabled Individuals

A fully software-based assistive platform designed to help intellectually disabled individuals manage daily routines through guided tasks, reminders, and communication support.

---

## 📌 Executive Summary
This system empowers intellectually disabled individuals by offering step-by-step task guidance, daily schedules, communication tools, and caregiver dashboards. The focus is on simplicity, accessibility, and independence, without relying on any hardware. It reduces caregiver burden and enables structured daily living.

---

## 🎯 Approach

- Accessible web/mobile application  
- Large buttons, minimal text, friendly visuals  
- Step-by-step audio–visual task guidance  
- Text-to-speech & speech-to-text communication aid  
- Routine tracking and caregiver reports  
- Visual & audio reminders  

---

## 🧩 Tech Stack

**Frontend:** HTML, CSS, Bootstrap, JavaScript / React  
**Backend:** Python Flask  
**Database:** SQLite / PostgreSQL  
**AI:** gTTS, SpeechRecognition, Google Speech APIs  

---

## 🔄 Workflow

1. **User Login / Caregiver Login**  
2. **Dashboard** shows daily tasks and reminders  
3. **Task Execution** with step-by-step audio & images  
4. **Communication Assistance** converts speech to text and text to speech  
5. **Progress Tracking** stored in the database  
6. **Notifications** triggered based on schedule  

---

## 🏗️ Software Architecture

```mermaid
graph TD

    U[User / Caregiver] --> UI[Web / Mobile Frontend]

    subgraph Frontend
        UI --> TTS[Text-to-Speech Client]
        UI --> STT[Speech-to-Text Client]
        UI --> APIClient[REST API Client]
    end

    subgraph Backend[Flask Backend]
        API[API Gateway / app.py]
        TaskSvc[Task Management Service]
        CommSvc[Communication Service]
        NotifySvc[Notification Service]
        ReportSvc[Reporting Service]
    end

    APIClient -->|HTTP| API
    TTS -->|Send Text| API
    STT -->|Send Audio| API

    API --> TaskSvc
    API --> CommSvc
    API --> NotifySvc
    API --> ReportSvc

    subgraph Storage
        DB[(SQLite / PostgreSQL)]
    end

    TaskSvc --> DB
    NotifySvc --> DB
    ReportSvc --> DB

    subgraph AI
        GoogleTTS[Text-to-Speech Engine]
        GoogleSTT[Speech-to-Text Engine]
    end

    CommSvc --> GoogleTTS
    CommSvc --> GoogleSTT
