# Installation et lancement de l'app sur une autre machine

Ce guide permet d'installer et de lancer le projet `POULET` sur un nouveau PC (Windows).

## 1) Prerequis

- Node.js 20+ et npm (npm 10 recommande)
- SQL Server (Express ou Developer)
- SQL Server Management Studio (SSMS) ou `sqlcmd`
- Git

Verifications rapides:

```powershell
node -v
npm -v
sqlcmd -?
```

## 2) Recuperer le projet

```powershell
git clone <URL_DU_REPO>
cd POULET
```

## 3) Configurer la base de donnees SQL Server

1. Creer une base `poulet` dans SQL Server.
2. Executer le schema:

```powershell
sqlcmd -S localhost,<PORT_SQLSERVER> -U sa -P "<MOT_DE_PASSE_SA>" -d poulet -i "database/migrations/data.sql"
```

3. Inserer les donnees de test:

```powershell
sqlcmd -S localhost,<PORT_SQLSERVER> -U sa -P "<MOT_DE_PASSE_SA>" -d poulet -i "database/seeds/test_data.sql"
```

Notes:
- Le projet actuel attend SQL Server avec authentification SQL (`sa`).
- Si vous utilisez une instance nommee, adaptez `-S` (exemple: `DESKTOP-XXX\\SQLEXPRESS`).

## 4) Configurer le backend

Fichier a modifier: `backend/src/config/db.js`

Valeurs a adapter:
- `user`
- `password`
- `server`
- `database` (doit etre `poulet`)
- `options.port` (port SQL Server)

Exemple:

```js
module.exports = {
  user: "sa",
  password: "<MOT_DE_PASSE>",
  server: "localhost",
  database: "poulet",
  options: { encrypt: true, trustServerCertificate: true, port: 1433 }
}
```

Installer les dependances backend:

```powershell
cd backend
npm install
```

Lancer le backend:

```powershell
node app.js
```

Le backend tourne sur: `http://localhost:3000`

## 5) Configurer et lancer le frontend

Dans un nouveau terminal:

```powershell
cd frontend
npm install
npm start
```

Le frontend tourne sur: `http://localhost:4200`

## 6) Verification rapide

- Ouvrir `http://localhost:4200`
- Aller sur la page `Lots`
- Les lots de test doivent s'afficher (ex: "Lot A - Poulet de chair")

API test:

```powershell
curl http://localhost:3000/api/lots
```

## 7) Probleme frequents

### Port 4200 deja utilise

```powershell
Get-NetTCPConnection -LocalPort 4200 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

### Port 3000 deja utilise

```powershell
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
Stop-Process -Id <PID> -Force
```

### Erreur de connexion SQL Server

- Verifier que SQL Server est demarre
- Verifier le port SQL Server dans `backend/src/config/db.js`
- Verifier login/password
- Verifier que la base `poulet` existe

### Donnees non affichees

- Verifier que backend (`node app.js`) et frontend (`npm start`) tournent en meme temps
- Tester `http://localhost:3000/api/lots`
- Verifier la console navigateur et terminal backend

## 8) Ordre de demarrage recommande

1. SQL Server
2. Backend (`cd backend ; node app.js`)
3. Frontend (`cd frontend ; npm start`)

L'application est prete quand:
- `http://localhost:3000/` repond `Backend OK`
- `http://localhost:4200` affiche le dashboard
