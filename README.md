graph TD
    User((User))
    Caregiver((Caregiver))
    
    subgraph Frontend [Web/Mobile App]
        UI[Accessible UI (Large Buttons, Icons)]
        TaskModule[Task Guidance Interface]
        CommModule[Communication Assist UI]
        ReportsView[Progress Reports]
    end
    
    subgraph Backend [Flask Backend APIs]
        APIGateway[API Gateway / App.py]
        AuthService[Authentication Service]
        TaskService[Task & Guidance Service]
        CommService[Speech/Text Processing]
        ProgressService[Progress Tracker]
        NotifService[Notifications Engine]
    end
    
    subgraph Infra [Infrastructure Layer]
        DB[(SQLite/PostgreSQL Database)]
        Cache[(Redis Cache)]
        TTS[Text-to-Speech Engine]
        STT[Speech-to-Text Engine]
    end
    
    %% User and UI
    User --> UI
    Caregiver --> ReportsView
    UI -->|HTTP| APIGateway
    
    %% Routing
    APIGateway --> AuthService
    APIGateway --> TaskService
    APIGateway --> CommService
    APIGateway --> ProgressService
    APIGateway --> NotifService
    
    %% Modules Interaction
    TaskService --> DB
    ProgressService --> DB
    CommService --> TTS
    CommService --> STT
    NotifService --> Cache
    Cache --> NotifService
    ProgressService --> Cache


sequenceDiagram
    autonumber
    participant U as User
    participant UI as App UI
    participant S as Server
    participant T as Task Module
    participant C as Comm Engine
    participant D as Database
    participant N as Notification Engine

    U->>UI: Opens App
    UI->>S: Login Request
    S->>D: Validate Credentials
    D-->>S: OK
    S-->>UI: Load Dashboard

    U->>UI: Selects Daily Task
    UI->>S: GET /task/{id}
    S->>T: Fetch Task Steps
    T->>D: Fetch Step Data
    D-->>T: Steps
    T-->>S: Steps with Media
    S-->>UI: Display Step-by-Step Guide

    U->>UI: Plays Audio Instruction
    UI->>S: Request TTS
    S->>C: Generate Audio
    C-->>S: Audio File
    S-->>UI: Play Audio

    U->>UI: Marks Step Complete
    UI->>S: POST /progress
    S->>D: Update Progress
    S->>N: Schedule Next Reminder
    N-->>S: Reminder Confirmed
    S-->>UI: “Task Completed”
