# 🛡️ BreatheBridge — Urban Air Quality & Smog Public Health Assistant

[![Build & Tests](https://img.shields.io/badge/Vitest-217%20Passed-success?style=flat-square&logo=vitest)](file:///c:/Users/ghosh/OneDrive/Attachments/Desktop/GOOGLE%20CHALLANHGES/challange%206/src/test)
[![Static Analysis](https://img.shields.io/badge/Oxlint-0%20Warnings%20%7C%200%20Errors-blue?style=flat-square)](file:///c:/Users/ghosh/OneDrive/Attachments/Desktop/GOOGLE%20CHALLANHGES/challange%206/.oxlintrc.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?style=flat-square&logo=typescript)](file:///c:/Users/ghosh/OneDrive/Attachments/Desktop/GOOGLE%20CHALLANHGES/challange%206/tsconfig.json)
[![Accessibility](https://img.shields.io/badge/WCAG%202.2-Level%20AA%20Compliant-emerald?style=flat-square)](file:///c:/Users/ghosh/OneDrive/Attachments/Desktop/GOOGLE%20CHALLANHGES/challange%206/src/components)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square)](file:///c:/Users/ghosh/OneDrive/Attachments/Desktop/GOOGLE%20CHALLANHGES/challange%206/LICENSE)

> Empowering vulnerable families, educators, commuters, and urban communities to navigate winter smog inversions through GenAI exposure routines, low-cost IAQ hacks, school safety advisories, and clean-corridor transit routing.

---

## 🌟 Key Features

### 1. 📡 Hyperlocal AQI & Winter Inversion Telemetry
- Real-time multi-pollutant tracking (**PM2.5, PM10, NO2, CO, O3**) across 5 municipal urban sectors.
- Boundary-layer thermal inversion risk modeling to detect surface smog trapping.
- Pure SVG Heatmap and 7-hour pollutant sparklines with complete `.sr-only` screen reader text twins.

### 2. ⏰ GenAI Daily Routine & Exposure Optimizer
- Persona-tailored hour-by-hour exposure schedules for 6 vulnerability profiles:
  - *Asthmatic Child & Family*, *Newborn & Mother*, *Elderly Relative*, *Daily Commuter*, *School Run Coordinator*, *Community Lead*.
- Solar convection window detection (1:00 PM – 4:00 PM) for minimal respiratory particulate inhalation.
- Powered by server-side **Google Gemini (`gemini-2.5-flash`)** with high-fidelity zero-downtime heuristic fallback.

### 3. 🏫 School Safety Mode (Parents & Teachers)
- Pure decision algorithms ([src/lib/compute/schoolAdvisory.ts](file:///c:/Users/ghosh/OneDrive/Attachments/Desktop/GOOGLE%20CHALLANHGES/challange%206/src/lib/compute/schoolAdvisory.ts)) computing traffic-light activity decisions (**Morning Assembly**, **Recess**, **PE Class**).
- Age-calibrated biological thresholds for **Primary (Ages 5–11)** and **Secondary (Ages 12–18)** groups.
- Clean printable **"Today's School Advisory"** card for bulletin boards and classroom distribution.

### 4. 📓 30-Day Health Diary & Clinical Correlation
- Daily symptom logger tracking **Cough**, **Eye Irritation**, and **Breathlessness** on a calibrated 0–3 clinical scale.
- Native SVG 30-day interactive dual-axis chart correlating symptom load against ambient AQI.
- Accessible `.sr-only` table twin for assistive screen readers.
- One-click printable **Weekly Health Summary Report** for doctor and pulmonologist visits.

### 5. 🚇 Low-Emission Transit & Clean Corridors
- Dijkstra graph pathfinding algorithm identifying minimal-inhalation corridors.
- Multi-modal transport comparison (**Metro**, **EV**, **Bus**, **Cycling**, **Walking**) calculating inhaled PM2.5 dose ($\mu g$) and estimated $CO_2$ abatement.

### 6. 🌿 Indoor Air Quality (IAQ) & Low-Cost Hacks
- Room-by-room CADR requirement calculator for target 4 Air Changes per Hour (ACH).
- Step-by-step blueprints for the DIY Corsi-Rosenthal Box ($40 DIY HEPA retrofit delivering 350 m³/h).
- Inversion-aware natural cross-ventilation schedule.

### 7. 🌍 Multilingual & Accessible AppShell
- Full localization in 5 languages: **English (`en`)**, **Hindi (`hi`)**, **Bengali (`bn`)**, **Arabic (`ar`)**, and **Spanish (`es`)**.
- Responsive navigation: collapsible left sidebar on desktop, fixed bottom tab bar on mobile.
- System-aware dark mode toggle respecting `prefers-color-scheme`.
- Full WCAG 2.2 AA compliance: ARIA landmarks, keyboard focus rings, skip-to-content bypass.

---

## 🏗️ Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Browser)                          │
│                                                                        │
│   AppShell (React 19 + TypeScript + Tailwind CSS v4)                   │
│   AppContext (Language, Theme, DarkMode, Accessibility, SelectedZone)  │
│                                                                        │
│   ┌───────────────────────────┐      ┌───────────────────────────┐     │
│   │    Domain Feature Hooks   │      │   Pure Compute Engine     │     │
│   │   (useAirAnalytics,       │ ────►│   (src/lib/compute/*)     │     │
│   │    useExposureRouting)    │      │  • Dijkstra Pathfinding   │     │
│   └───────────────────────────┘      │  • CADR & 4 ACH Decay     │     │
│                 │                    │  • School Advisory Rules  │     │
│                 ▼                    │  • Diary Correlation Math │     │
│   ┌───────────────────────────┐      └───────────────────────────┘     │
│   │   Presentation Layer      │                    ▲                   │
│   │  • Native SVG Visualizers │ ───────────────────┘                   │
│   │  • .sr-only Text Twins    │                                        │
│   └───────────────────────────┘                                        │
└────────────────────────────────────────────────────────────────────────┘
                    │                                    │
           (REST API via proxy)                 (Per-User Storage)
                    │                                    │
                    ▼                                    ▼
┌───────────────────────────────────────┐    ┌───────────────────────────┐
│        BACKEND GATEWAY (Node.js)      │    │      DATA ISOLATION       │
│                                       │    │                           │
│   Express 5 Security Pipeline         │    │  • Per-User Namespace     │
│   • Helmet (Strict CSP & Headers)     │    │  • Firestore Security     │
│   • Dynamic CORS Allowlist            │    │    (/users/{userId}/**)   │
│   • 15 KB JSON Body Cap               │    └───────────────────────────┘
│   • Rate Limiter (30 req/min/IP)      │
│   • SHA-256 LRU Cache (<10ms hits)    │
│   • Safe Error Masking (CWE-209 safe) │
│   • Server-Side Gemini 2.5 Flash      │
└───────────────────────────────────────┘
```

---

## ⚡ Quickstart

### Prerequisites
- Node.js $\ge$ 18.0.0
- npm $\ge$ 9.0.0

### 1. Installation
```bash
git clone https://github.com/[user]/breathebridge.git
cd breathebridge
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

### 3. Start Development Servers
```bash
# Terminal 1: Backend Express Gateway (Port 3001)
npm run server:dev

# Terminal 2: Frontend Vite Dev Server (Port 5173)
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Verification & Testing

BreatheBridge maintains a 100% pass rate with zero warnings:

```bash
# Run Vitest automated test suite (217 tests across 12 suites)
npm run test:run

# Run Oxlint static analysis (0 warnings, 0 errors across 92 files)
npm run lint

# Compile strict production build
npm run build
```

### Automated Test Suite Overview

| Test Suite | Focus Area | Tests | Status |
| :--- | :--- | :---: | :---: |
| `schoolAdvisory.test.ts` | Edge thresholds for outdoor school activities | 63 | ✅ Passed |
| `security.test.ts` | SHA-256 Cache TTL, safe CORS & validation boundaries | 30 | ✅ Passed |
| `aqiBreakpoints.test.ts` | EPA/CPCB piecewise interpolation & inversion math | 18 | ✅ Passed |
| `aqiCommute.test.ts` | Inhaled PM2.5 dose & carbon abatement formulas | 17 | ✅ Passed |
| `routineFallback.test.ts` | Heuristic fallback engine, 6 personas & inversion math | 16 | ✅ Passed |
| `translations.test.tsx` | Translation parity across EN, HI, BN, AR, ES | 15 | ✅ Passed |
| `healthDiary.test.tsx` | 30-day SVG coordinates, symptom math & report | 14 | ✅ Passed |
| `aqiIaq.test.ts` | CADR 4 ACH clearance & Corsi-Rosenthal calculations | 11 | ✅ Passed |
| `api.test.ts` | Live Express endpoints, rate limits & caching | 10 | ✅ Passed |
| `rendering.test.tsx` | UI layouts, responsive shells & screen reader twins | 9 | ✅ Passed |
| `dom.test.tsx` | User events, tab navigation & ARIA updates | 7 | ✅ Passed |
| `routing.test.ts` | Dijkstra lowest-exposure pathfinder | 7 | ✅ Passed |
| **TOTAL** | **Full Automated Verification Suite** | **217** | **✅ 217 / 217** |

---

## 🚢 Deployment

### Option 1: Full-Stack Web Service (Render / Railway / Cloud Run)
BreatheBridge serves both API endpoints and the built frontend SPA from a single process:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run server`
- **Environment Variables**: `GEMINI_API_KEY`, `NODE_ENV=production`

*(A ready-to-deploy [render.yaml](file:///c:/Users/ghosh/OneDrive/Attachments/Desktop/GOOGLE%20CHALLANHGES/challange%206/render.yaml) blueprint is included)*

### Option 2: Docker Container
```bash
docker build -t breathebridge:latest .
docker run -p 3001:3001 -e GEMINI_API_KEY="your-key" breathebridge:latest
```

### Option 3: Vercel (Frontend SPA)
Configured with [vercel.json](file:///c:/Users/ghosh/OneDrive/Attachments/Desktop/GOOGLE%20CHALLANHGES/challange%206/vercel.json) for automatic static asset serving and SPA URL rewrites.

---

## 🔒 Security Standards

- **Server-Side Key Custody**: `GEMINI_API_KEY` is strictly executed in Node.js and never exposed to the client.
- **Defensive Headers**: `helmet()` enforcing strict Content Security Policy, `X-Content-Type-Options: nosniff`, and origin validation.
- **Abuse Prevention**: 30 requests/minute/IP rate limiter on GenAI endpoints; 15 KB JSON body size cap.
- **Data Isolation**: Per-user Firestore security rules (`match /users/{userId}/{document=**}`).
- **Information Masking**: Safe global error handler prevents stack trace leakage (CWE-209 safe).

---

## 📄 License
This project is open-source under the [MIT License](file:///c:/Users/ghosh/OneDrive/Attachments/Desktop/GOOGLE%20CHALLANHGES/challange%206/LICENSE).
