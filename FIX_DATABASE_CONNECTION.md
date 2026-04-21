# Solution: Base de données PostgreSQL inaccessible sur Render

## ❌ Erreur actuelle
```
Error: P1001: Can't reach database server at `dpg-d6s9fti4d50c73bjnq6g-a:5432`
```

## 🔍 Cause
Votre base de données PostgreSQL **dpg-d6s9fti4d50c73bjnq6g-a** est probablement en **mode veille** (le plan gratuit se met en veille après 90 jours d'inactivité).

## ✅ Solution à faire SUR RENDER (pas dans le code)

### Étape 1: Réveiller la base de données
1. Allez sur https://dashboard.render.com
2. Cliquez sur **Dashboard** > **PostgreSQL** (ou recherchez `dpg-d6s9fti4d50c73bjnq6g-a`)
3. Si vous voyez un message "Database is sleeping" ou "Wake up", cliquez sur **Wake Up / Connect**
4. Attendez que le statut passe à "Available" (vert)

### Étape 2: Vérifier la connexion DATABASE_URL
1. Toujours dans le dashboard PostgreSQL
2. Cliquez sur **Connection Details**
3. Cliquez sur **Internal Connection String**
4. **Copiez** la valeur (commence par `postgres://`)

### Étape 3: Configurer sur le Web Service
1. Allez sur **Dashboard** > **gestion-caisse** (votre web service)
2. Cliquez sur **Environment**
3. Cherchez **DATABASE_URL**
4. **IMPORTANT**: Ajoutez `?sslmode=require` à la fin de l'URL:
   ```
   postgres://user:password@host:5432/dbname?sslmode=require
   ```
5. Sauvegardez

### Étape 4: Redéployer
1. Dans le web service, cliquez sur **Manual Deploy** > **Deploy latest commit**
2. Attendez le déploiement

## 🔧 Alternative: Créer une nouvelle base de données

Si la base actuelle ne se réveille pas:

1. **Dashboard** > **New** > **PostgreSQL**
2. Nommez-la `caissedb-prod`
3. Plan: **Free**
4. Régions: **Oregon** (same region as your web service)
5. Créez
6. Une fois disponible, copiez l'Internal Connection String
7. Mettez à jour DATABASE_URL dans les Environment du web service
8. Redéployez

## ✅ Vérification

Après réveil, vérifiez sur `/health`:
```json
{
  "status": "ok",
  "database": "connected"
}
```

## 📋 Checklist Render
- [ ] PostgreSQL status: **Available** (vert, pas gris)
- [ ] DATABASE_URL configuré dans Environment
- [ ] DATABASE_URL se termine par `?sslmode=require`
- [ ] Web service redéployé

## ⚠️ Note importante
Le plan **Free** de Render PostgreSQL:
- Se met en veille après **90 jours** d'inactivité
- Se réveille automatiquement si lié à un web service actif
- Se réveille en klikant "Wake Up" depuis le dashboard