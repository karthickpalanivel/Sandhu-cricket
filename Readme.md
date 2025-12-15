# 🏏 Sandhu Cricket - Street Cricket Scorer

**Sandhu Cricket** is a street-cricket scoring application built with React Native and Expo. It replaces the need for pen and paper in box cricket, gully cricket, or casual matches.

---

## ✨ Features

### 🎨 Vibe Check (UI/UX)
* **Immersive Dark/Light mode:** Switch between themes with a Sun/Moon toggle.
* **Smooth Animations:** Fluid transitions for scoring and navigation.
* **Haptic-style Interactions:** Tactile feel for buttons and inputs.

### 📏 Flexible Rules
* **Custom Overs:** Set match length from 1 to 20 overs.
* **Configurable Extras:** You decide the rules—choose if Wides/No-Balls count as 1 Run, Re-ball, or Both.

### ⚙️ Pro Scoring Engine
* **Timeline:** A visual ticker showing every ball history (e.g., `1`, `4`, `W`, `WD+1`).
* **Undo System:** Made a mistake? One-tap undo reverses runs, balls, and wickets instantly.
* **Smart Wickets:** Infinite wicket tracking specifically designed for street rules.
* **Extras Handling:** Advanced modal to handle complex scenarios like "Runs off Bat" during Wides or No-Balls.

### 🧠 Match Awareness
* **Read-Only View:** Browse 1st innings stats while playing the 2nd innings without risking accidental edits.
* **Auto-Conclusion:** Automatically detects when the match ends, calculates the winner, and displays the summary.
* **Persistence:** Auto-saves the match state locally, so you never lose progress if the app closes.

---

## 🛠 Tech Stack
* **Framework:** React Native
* **Platform:** Expo
* **Storage:** Async Storage
* **Icons:** Lucide Icons

---

## 🚀 Installation

1. **Clone or Unzip** this project to your local machine.

2. **Install Dependencies:**
   Run the following commands in your terminal:

   ```bash
   npm install