# Team Nartan Dance Studio Suite 💃

A turnkey demo ecosystem built for **Team Nartan Dance Studio**, featuring:
1. **Student Portal (`/student`)**: Mobile-first dance academy app for students. Supports quick phone login with default OTP **`000000`**, digital dance pass card, class timetable, attendance percentage tracker, fee renewal simulator, and studio bulletins.
2. **Admission Form (`/admission`)**: Public registration portal for new dancers to select their discipline (Kathak, Bollywood, Hip-Hop, Contemporary, Zumba), choose batch timings, pick membership plans, and receive an instant enrollment receipt.
3. **Studio Manager (`/manager`)**: Complete administration dashboard for studio owners and instructors to track KPIs, mark batch attendance, collect fees, approve admission applications, and broadcast notices.
4. **Demo Switchboard (`/`)**: Main hub providing single-click access to all portals, demo phone numbers, and default credentials.

---

## 🔑 Demo Login Credentials
- **Default Master OTP**: `000000` (Universal master OTP for all accounts)
- **Sample Enrolled Students**:
  - `9876543210` — Aarav Sharma (Kathak Classical)
  - `9123456789` — Ananya Roy (Bollywood Commercial)
  - `9988776655` — Rohan Verma (Urban Hip-Hop)
  - `9811223344` — Meera Nair (Contemporary)
  - `9822334455` — Kabir Kapoor (Zumba Fitness)

---

## 🚀 Running the Studio Suite

```bash
cd /Users/ashish/team-nartan
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Demo Hub**: [http://localhost:3000/](http://localhost:3000/)
- **Student Portal**: [http://localhost:3000/student](http://localhost:3000/student)
- **Admission Form**: [http://localhost:3000/admission](http://localhost:3000/admission)
- **Studio Manager**: [http://localhost:3000/manager](http://localhost:3000/manager)

---

## 📂 Project Architecture

```
team-nartan/
├── server.js               # Express server (Port 3000)
├── package.json            # Dependencies (express, cors, dotenv)
├── data/
│   ├── db.json             # Local JSON database pre-filled with realistic studio data
│   └── store.js            # Persistence engine and helper methods
├── public/
│   ├── index.html          # Central Demo Switchboard
│   ├── shared/
│   │   └── branding.css    # Team Nartan visual tokens & fonts
│   ├── student/            # Student Portal (HTML, CSS, JS)
│   ├── admission/          # Online Admission Form (HTML, CSS, JS)
│   └── manager/            # Studio Manager Dashboard (HTML, CSS, JS)
```
