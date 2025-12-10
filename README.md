graph TD
  subgraph Client
    U[User App (PWA)]
    C[Caregiver Web Dashboard]
  end
  U -->|REST / Sync| API[Backend API (Flask)]
  C -->|REST| API
  API --> DB[(SQLite / Postgres)]
  API --> TTS[TTS / STT Service]
  API --> Auth[Auth Service (JWT)]
  API --> Analytics[Analytics Service]
  TTS -->|audio| U
  Analytics -->|reports| C


sequenceDiagram
  participant CG as Caregiver
  participant S as Server
  participant U as User Device
  CG->>S: Create task template + schedule
  S->>DB: Save task + schedule
  S->>U: Push task (or next time U syncs)
  U->>U: Show visual + play TTS
  U->>S: Mark task complete (or store locally then sync)
  S->>Analytics: Log event
  S->>CG: Weekly summary / alert (if missed)
