# P&TA Snack Bestel App - Deployment Instructies

## 🎯 Overzicht

Deze app bestaat uit drie onderdelen:
- **Frontend** (React) → GitHub Pages (gratis)
- **Backend** (FastAPI) → Render.com (gratis tier)
- **Database** (MongoDB) → MongoDB Atlas (gratis tier)

---

## 📋 Stap-voor-stap Deployment

### STAP 1: MongoDB Atlas Database Aanmaken

1. Ga naar [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) en maak een gratis account
2. Klik op **"Build a Database"**
3. Kies **"M0 FREE"** (Shared cluster)
4. Kies een regio dichtbij (bijv. `eu-west-1` of `eu-central-1`)
5. Geef je cluster een naam (bijv. `pta-snack-cluster`)
6. Klik op **"Create"**

**Database User aanmaken:**
1. Ga naar **Database Access** in het linkermenu
2. Klik op **"Add New Database User"**
3. Kies een username en wachtwoord (bewaar deze!)
4. Zet **Database User Privileges** op **"Read and write to any database"**
5. Klik op **"Add User"**

**Network Access instellen:**
1. Ga naar **Network Access** in het linkermenu
2. Klik op **"Add IP Address"**
3. Klik op **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Klik op **"Confirm"**

**Connection String ophalen:**
1. Ga naar **Database** > Klik op **"Connect"** bij je cluster
2. Kies **"Drivers"**
3. Kopieer de connection string, deze ziet er zo uit:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Vervang `USERNAME` en `PASSWORD` met je credentials

---

### STAP 2: Backend op Render.com Deployen

1. Ga naar [Render.com](https://render.com) en maak een gratis account
2. Klik op **"New +"** > **"Web Service"**
3. Verbind je GitHub account en selecteer je repository
4. Configureer de service:

| Instelling | Waarde |
|------------|--------|
| Name | `pta-snack-api` |
| Root Directory | `backend` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn server:app --host 0.0.0.0 --port $PORT` |
| Instance Type | `Free` |

5. Scroll naar **"Environment Variables"** en voeg toe:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Je MongoDB Atlas connection string |
| `DB_NAME` | `pta_snack_app` |
| `CORS_ORIGINS` | `*` (later aanpassen naar je GitHub Pages URL) |

6. Klik op **"Create Web Service"**
7. Wacht tot de deployment klaar is (kan 2-5 minuten duren)
8. Noteer de URL die Render je geeft (bijv. `https://pta-snack-api.onrender.com`)

**Test je backend:**
Open in je browser: `https://pta-snack-api.onrender.com/health`
Je zou moeten zien: `{"status":"healthy","service":"P&TA Snack Bestel App API"}`

---

### STAP 3: Frontend op GitHub Pages Deployen

1. Push je code naar GitHub (als je dat nog niet gedaan hebt)

2. **Repository Variables instellen:**
   - Ga naar je GitHub repository
   - Ga naar **Settings** > **Secrets and variables** > **Actions**
   - Klik op het tabblad **"Variables"**
   - Klik op **"New repository variable"**
   - Name: `REACT_APP_API_URL`
   - Value: Je Render URL (bijv. `https://pta-snack-api.onrender.com`)
   - Klik op **"Add variable"**

3. **GitHub Pages inschakelen:**
   - Ga naar **Settings** > **Pages**
   - Onder **"Build and deployment"** > **Source**: Kies **"GitHub Actions"**

4. **Trigger de deployment:**
   - Ga naar het **Actions** tabblad
   - Klik op **"Deploy React App to GitHub Pages"**
   - Klik op **"Run workflow"** > **"Run workflow"**

5. Wacht tot de workflow klaar is (groen vinkje)

6. Je app is nu live op: `https://USERNAME.github.io/REPO-NAME/`

---

### STAP 4: CORS Bijwerken (Optioneel maar Aanbevolen)

Na de frontend deployment, update je CORS voor extra veiligheid:

1. Ga naar Render.com > Je service > **Environment**
2. Verander `CORS_ORIGINS` van `*` naar je GitHub Pages URL:
   ```
   https://username.github.io
   ```
3. Klik op **"Save Changes"** (service herstart automatisch)

---

## 🔧 Lokaal Ontwikkelen

**Backend:**
```bash
cd backend
cp .env.example .env
# Vul je MongoDB URI in
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
# Vul je backend URL in
yarn install
yarn start
```

---

## ⚠️ Belangrijke Notities

### Render.com Free Tier Limitaties:
- Service gaat na 15 minuten inactiviteit in **slaapstand**
- Eerste request na slaapstand kan **30-60 seconden** duren (cold start)
- 750 uur gratis per maand

### MongoDB Atlas Free Tier Limitaties:
- 512 MB opslag
- Shared cluster (geen dedicated resources)
- Voldoende voor kleine apps!

---

## 🆘 Troubleshooting

**"Failed to fetch" error in frontend:**
- Check of je Render backend draait
- Check of `REACT_APP_API_URL` correct is ingesteld
- Check browser console voor CORS errors

**Backend start niet op Render:**
- Check of `MONGODB_URI` correct is
- Check Render logs voor errors

**Database connectie mislukt:**
- Check of Network Access op MongoDB Atlas "0.0.0.0/0" toestaat
- Check of username/password correct zijn in de connection string

---

## 📁 Projectstructuur

```
/
├── frontend/           # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── backend/            # FastAPI backend
│   ├── server.py
│   ├── requirements.txt
│   ├── render.yaml
│   └── .env.example
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Actions workflow
```
