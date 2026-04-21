# Configuration SMTP pour Render (Production)

## Problème
L'envoi d'emails fonctionne en local mais échoue en production sur Render.

## Causes possibles
1. Variables d'environnement non configurées sur Render
2. Port SMTP bloqué par le firewall Render
3. Timeout trop court pour les connexions SMTP
4. Problème d'authentification avec Gmail

## Solution étape par étape

### Étape 1: Créer un Mot de passe d'application Gmail
1. Allez sur https://myaccount.google.com/security
2. Activez la "Validation en 2 étapes"
3. Cliquez sur "Mots de passe d'application" (dans "Validation en 2 étapes")
4. Créez un nouveau mot de passe d'application (nom: "GESTICOM")
5. Copiez le mot de passe généré (16 caractères)

### Étape 2: Configurer les variables sur Render
 Allez sur Render Dashboard > Votre Backend > Environment

Ajoutez ces variables:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASS=le_mot_de_passe_application (16 caractères)
SMTP_FROM=votre_email@gmail.com
NODE_ENV=production
```

### Étape 3: Vérifier les logs
Après le redéploiement, check the logs:
```
Render Dashboard > Backend > Logs
```
Recherchez les messages commençant par `[EMAIL]`.

### Étape 4: Tester l'envoi d'email
1. Connectez-vous à l'application
2. Allez dans Paramètres > Sécurité (ou similar)
3. Cherchez "Tester email" ou utilisez `/test-email`

## Alternative: Utiliser un service SMTP tiers

Si Gmail ne fonctionne pas, utilisez un service comme:

### Resend (recommandé - gratuit jusqu'à 100 emails/jour)
1. Inscrivez-vous sur https://resend.com
2. Créez une API key
3. Configurez:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=re_xxxxx
SMTP_PASS=re_xxxxx (votre API key Resend)
SMTP_FROM=onboarding@resend.com
```

### Brevo (ex Sendinblue - gratuit jusqu'à 300 emails/jour)
1. Inscrivez-vous sur https://www.brevo.com
2. Créez une clé SMTP
3. Configurez:

```
SMTP_HOST=smtp-relay.sendinblue.com
SMTP_PORT=587
SMTP_USER=votre_email@domaine.com
SMTP_PASS=votre_mot_de_passe_smtp
SMTP_FROM=votre_email@domaine.com
```

## Debugging

### Vérifier que les variables sont chargées
Ajoutez temporairement dans `server.js`:
```javascript
console.log('[DEBUG] SMTP_USER:', process.env.SMTP_USER ? 'SET' : 'NOT SET');
console.log('[DEBUG] SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
console.log('[DEBUG] SMTP_HOST:', process.env.SMTP_HOST);
```

### Test manuel
Dans le terminal Render:
```bash
curl -X POST https://votre-backend.onrender.com/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"votre_email@test.com"}'
```

## Résolution des erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `ETIMEDOUT` | Firewall bloque le port 587 | Utilisez le port 465 ou un service SMTP tiers |
| `EAUTH` | Identifiants incorrects | Vérifiez le mot de passe d'application |
| `ECONNREFUSED` | Serveur SMTP inaccessible | Vérifiez le host SMTP |
| `ESOCKET` | Timeout connexion | Augmentez les timeouts |