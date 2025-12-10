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

```mermaid
flowchart LR

U[User Opens App] --> H[Home Screen  
Large Buttons  
Simple Icons] 

H --> R[Select Routine / Task]  
H --> C[Start Guided Conversation]  
H --> E[Press Help Button]

R --> S1[Step-by-Step Task Guidance  
1 small instruction at a time]

C --> S2[AI Generates Safe,  
Emotion-Friendly Response]

E --> S3[Immediate Assistance  
Short, calming prompts]

S1 --> L[Logs Progress]  
S2 --> L  
S3 --> L

L --> CD[Caretaker Dashboard  
View Logs, Update Tasks]
```


```mermaid
flowchart TD

A[User Interface  
Simple UI  
Visual Buttons  
Guided Prompts] --> B[Backend API  
Task Engine  
Reminder Manager  
Emotion Handler]

B --> C[AI Processing Layer  
Safety Filters  
Conversation Manager  
Adaptive Response Generator]

C --> D[Database  
User Profile  
Task Lists  
Caretaker Notes  
Routines]

D --> E[Caretaker Dashboard  
Insights  
Usage Reports  
Custom Task Creation]

B --> F[Notification Scheduler  
Routine Alerts  
Task Reminders]

%% Styling
style A fill:#fff6a9,stroke:#000,color:#000
style B fill:#c9e5ff,stroke:#000,color:#000
style C fill:#e6d4ff,stroke:#000,color:#000
style D fill:#d2f7df,stroke:#000,color:#000
style E fill:#ffe0c2,stroke:#000,color:#000
style F fill:#ffd6d6,stroke:#000,color:#000
```




# 🔄 System Workflow for Assistive System for Intellectually Disabled Individuals

This document explains how the system operates from both user and technical perspectives. The goal is to provide a clear understanding of how daily tasks, reminders, communication assistance, and caregiver interactions flow through the application.

---

```mermaid
flowchart TD

A[User Interface  
- Simple UI  
- Visual Buttons  
- Guided Prompts] --> B[Backend API  
- Task Engine  
- Reminder Manager  
- Emotion Handler]

B --> C[AI Processing Layer  
- Safety Filters  
- Conversation Manager  
- Adaptive Response Generator]

C --> D[Database  
- User Profile  
- Task Lists  
- Caretaker Notes  
- Routines]

D --> E[Caretaker Dashboard  
- Insights  
- Usage Reports  
- Custom Task Creation]

B --> F[Notification Scheduler  
- Routine Alerts  
- Task Reminders]

%% Styling for dark background with white text
style A fill:#1E1E1E,stroke:#FFFFFF,color:#FFFFFF
style B fill:#2A2A2A,stroke:#FFFFFF,color:#FFFFFF
style C fill:#3A3A3A,stroke:#FFFFFF,color:#FFFFFF
style D fill:#2A3A2A,stroke:#FFFFFF,color:#FFFFFF
style E fill:#3A2A2A,stroke:#FFFFFF,color:#FFFFFF
style F fill:#3A1E1E,stroke:#FFFFFF,color:#FFFFFF
```

