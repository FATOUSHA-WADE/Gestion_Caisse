# Guide de Déploiement sur Render

## Prérequis
1. Un compte Render (render.com)
2. Une base de données PostgreSQL créée sur Render
3. Un compte Gmail avec "Mot de passe d'application" configuré

## Étape 1: Créer la base de données PostgreSQL

1. Allez sur Render Dashboard > New > PostgreSQL
2. Choisissez le plan "Free"
3. Nommez-la `gestion-caisse-db`
4. Attendez que la base soit créée
5. Notez l' "Internal Connection String" (format: `postgres://...`)

## Étape 2: Déployer le service Web

### Option A: Blueprints (Recommandé)
1. Poussez les modifications sur GitHub
2. Sur Render Dashboard > New > Blueprint
3. Sélectionnez le fichier `render.yaml` dans le dossier `backend`
4. Render va:
   - Créer la base de données PostgreSQL
   - Déployer le service web
   - Lier automatiquement le DATABASE_URL

### Option B: Déploiement manuel
1. Créez un Web Service sur Render
2. Choisissez "Backend" comme repository
3. Configurez:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`

## Étape 3: Configurer les variables d'environnement

Sur Render Dashboard > Votre Web Service > Environment:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<Internal Connection String de votre PostgreSQL>
JWT_SECRET=<générez avec: openssl rand -base64 32>
API_BASE_URL=https://votre-app.onrender.com

# SMTP (pour les emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=<mot de passe d'application Gmail (16 caractères)>
SMTP_FROM=votre_email@gmail.com
```

**Important**: Ajoutez `?sslmode=require` à la fin du DATABASE_URL:
```
postgres://user:password@hostname:5432/dbname?sslmode=require
```

## Étape 4: Configurer le mot de passe d'application Gmail

1. Allez sur https://myaccount.google.com/security
2. Activez la "Validation en 2 étapes"
3. Cliquez sur "Mots de passe d'application"
4. Créez un nouveau mot de passe (nom: "GESTICOM")
5. Copiez le mot de passe généré (16 caractères)

## Étape 5: Vérifier le déploiement

1. Allez sur `/health` pour vérifier que le serveur fonctionne
2. Testez la connexion à la base de données
3. Vérifiez les logs pour d'éventuelles erreurs

## Dépannage

### Erreur "Can't reach database server"
1. Vérifiez que DATABASE_URL est correctement configuré
2. Ajoutez `?sslmode=require` à la fin
3. Vérifiez que la base PostgreSQL est active

### Erreur "Emails not sent"
1. Vérifiez les variables SMTP
2. Utilisez un "Mot de passe d'application" Gmail
3. Vérifiez les logs pour les erreurs SMTP

### Base de données qui dort (Free tier)
Le plan gratuit de Render met la base en sommeil après 90 jours d'inactivité.
Pour la réveiller:
1. Connectez-vous au dashboard de la base
2. Cliquez sur "Wake up"

## Structure des fichiers

```
backend/
├── render.yaml          # Configuration du déploiement
├── prisma/
│   └── schema.prisma # Schéma de la base de données
├── src/
│   └── config/
│       └── database.js # Configuration Prisma
├── prisma.config.js  # Configuration Prisma pour le build
└── server.js        # Point d'entrée
```