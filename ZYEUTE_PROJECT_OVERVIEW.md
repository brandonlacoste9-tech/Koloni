# 🇨🇦 ZYEUTÉ - Réseau Social Québécois

**TikTok + Instagram Clone exclusif au Québec, en français**

---

## 📋 Vue d'ensemble du projet

ZYEUTÉ est un réseau social combinant les meilleures fonctionnalités de TikTok et Instagram, conçu spécifiquement pour le Québec avec une interface 100% en français.

### ✅ Fonctionnalités principales

- **📱 Feed TikTok/Instagram hybride** - Publications photos et vidéos
- **📖 Stories** - Contenu éphémère (24h)
- **👥 Profils utilisateurs** - Abonnés/Abonnements
- **❤️ Interactions sociales** - J'aime, commentaires, partages
- **🔍 Découverte** - Explore avec tendances québécoises
- **📍 Localisation** - Filtrage par régions du Québec
- **#️⃣ Hashtags** - Tendances et découverte de contenu
- **🔔 Notifications** - Interactions en temps réel
- **🎵 Support vidéo** - Upload et lecture vidéo (style TikTok)

---

## 🗂️ Structure du projet

### 📦 Fichiers créés

```
Koloni/
├── database/
│   └── zyeute-schema.sql          # Schéma complet PostgreSQL/Supabase
│
├── src/
│   ├── fil.html                    # Page principale du feed
│   ├── css/
│   │   └── feed.css               # Styles du feed
│   └── js/
│       └── feed.js                # Logique du feed
```

### 📊 Schéma de base de données

#### Tables principales

**1. `users` (étendue)**
- Profils utilisateurs avec bio, avatar, localisation
- Compteurs: abonnés, abonnements, publications
- Régions du Québec prédéfinies

**2. `posts`**
- Publications photos/vidéos
- Support carousel (plusieurs médias)
- Métadonnées: région, hashtags, mentions
- Compteurs: likes, commentaires, partages, vues

**3. `likes`**
- Système de j'aime sur publications
- Contrainte unique par utilisateur/post

**4. `comments`**
- Commentaires hiérarchiques (réponses)
- Support likes sur commentaires

**5. `follows`**
- Relation abonnés/abonnements
- Empêche auto-abonnement

**6. `stories`**
- Contenu éphémère (24h)
- Photos et vidéos
- Tracking des vues

**7. `hashtags`**
- Tendances et popularité
- Compteurs de posts et vues

**8. `notifications`**
- Notifications pour: likes, commentaires, follows, mentions
- Statut lu/non-lu

#### 🔐 Sécurité (RLS)

- **Row-Level Security** activé sur toutes les tables
- Policies pour lecture/écriture basées sur `auth.uid()`
- Posts publics visibles par tous
- Données privées accessibles uniquement par propriétaire

#### ⚡ Triggers automatiques

- ✅ Incrémentation/décrémentation automatique des compteurs
- ✅ Création de notifications sur interactions
- ✅ Mise à jour `updated_at` automatique
- ✅ Nettoyage des stories expirées

---

## 🎨 Design & Interface

### 🌈 Palette de couleurs ZYEUTÉ

```css
Couleurs principales:
- Primary: #0ea5e9 (Bleu ciel)
- Secondary: #8b5cf6 (Violet)
- Gradient: linear-gradient(135deg, #0ea5e9, #8b5cf6)
- Accent Québec: linear-gradient(135deg, #10b981, #0ea5e9)

Backgrounds:
- Dark: #0a0a0a, #1a1a1a
- Glass: rgba(255, 255, 255, 0.03) avec blur

Texte:
- Primary: #fff
- Secondary: #aaa
- Tertiary: #888
```

### 🖼️ Style visuel

- **Glass-morphism** - Cartes semi-transparentes avec flou
- **Gradients colorés** - Boutons et badges
- **Animations fluides** - Hover, transitions
- **Responsive** - Mobile-first design
- **Dark mode** - Optimisé pour vision nocturne

---

## 🚀 Fonctionnement technique

### 📱 Page principale (fil.html)

#### Structure

1. **Navigation fixe**
   - Logo ZYEUTÉ avec badge "Québec"
   - Barre de recherche
   - Boutons: Accueil, Découvrir, Publier, Notifications, Profil

2. **Section Stories**
   - Scroll horizontal
   - Bouton "Ajouter story"
   - Stories des utilisateurs suivis

3. **Feed avec onglets**
   - **Pour toi** - Algorithme de recommandation
   - **Abonnés** - Posts des comptes suivis
   - **Québec** 🇨🇦 - Contenu régional

4. **Sidebar (desktop)**
   - Suggestions d'utilisateurs
   - Tendances du Québec
   - Footer avec liens

#### Fonctionnalités implémentées

✅ Chargement des posts avec infinite scroll
✅ Affichage photos et vidéos
✅ Like/unlike avec animation
✅ Compteurs formatés (12.5K, 1.2M)
✅ Timestamp relatif en français ("il y a 2 heures")
✅ Play/pause vidéo au clic
✅ Suggestions d'utilisateurs
✅ Hashtags tendances
✅ Responsive mobile/desktop

---

## 🔧 À implémenter (Prochaines étapes)

### Pages manquantes

1. **`/publier.html`** - Upload de photos/vidéos
2. **`/profil.html`** - Page profil utilisateur
3. **`/decouvrir.html`** - Explore et tendances
4. **`/notifications.html`** - Centre de notifications

### API Endpoints (Netlify Functions)

Créer ces endpoints:

```
POST /.netlify/functions/create-post
GET  /.netlify/functions/get-feed
POST /.netlify/functions/toggle-like
POST /.netlify/functions/add-comment
GET  /.netlify/functions/get-comments
POST /.netlify/functions/follow-user
POST /.netlify/functions/unfollow-user
GET  /.netlify/functions/get-profile
POST /.netlify/functions/upload-media
POST /.netlify/functions/create-story
GET  /.netlify/functions/get-stories
GET  /.netlify/functions/get-notifications
GET  /.netlify/functions/search-users
GET  /.netlify/functions/search-hashtags
GET  /.netlify/functions/get-trending
```

### Upload de médias

Options recommandées:
1. **Supabase Storage** - Stockage fichiers avec CDN
2. **Cloudinary** - Optimisation images/vidéos
3. **AWS S3** - Stockage scalable

### Fonctionnalités additionnelles

- 🎥 **Enregistrement vidéo** - Directement dans l'app
- 🎵 **Bibliothèque musicale** - Sons pour vidéos (style TikTok)
- 📊 **Analytics** - Stats pour créateurs
- 💬 **Messages directs** - Chat privé
- 🔒 **Modération** - Signalements, filtres contenu
- 🌍 **Carte interactive** - Découverte géolocalisée
- 🏆 **Badges** - Vérification, achievements
- 📈 **Algorithme de recommandation** - Feed "Pour toi"

---

## 🛠️ Guide d'implémentation

### 1. Installer le schéma

```sql
-- Dans Supabase SQL Editor
-- Copier/coller le contenu de database/zyeute-schema.sql
```

### 2. Configurer Supabase Storage

```javascript
// Créer buckets pour médias
- posts-media (public)
- stories-media (public)
- profile-pictures (public)
```

### 3. Variables d'environnement

Ajouter à `.env`:
```bash
# Existing vars...
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Media upload
CLOUDINARY_CLOUD_NAME=optional
CLOUDINARY_API_KEY=optional
CLOUDINARY_API_SECRET=optional
```

### 4. Build et déploiement

```bash
# Build le projet
npm run build

# Tester localement
netlify dev

# Déployer
git push origin main
```

---

## 📝 API Endpoints - Spécifications

### GET /get-feed

**Paramètres:**
- `tab`: 'pour-toi' | 'abonnes' | 'quebec'
- `page`: number (pagination)
- `limit`: number (default 20)

**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "type": "photo|video",
      "user": {
        "username": "string",
        "display_name": "string",
        "profile_picture_url": "string",
        "is_verified": boolean
      },
      "caption": "string",
      "hashtags": ["string"],
      "media_urls": ["string"],
      "location": "string",
      "region": "string",
      "likes_count": number,
      "comments_count": number,
      "views_count": number,
      "is_liked": boolean,
      "created_at": "timestamp"
    }
  ],
  "has_more": boolean,
  "total": number
}
```

### POST /toggle-like

**Body:**
```json
{
  "post_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "is_liked": boolean,
  "likes_count": number
}
```

### POST /create-post

**Body:**
```json
{
  "type": "photo|video",
  "caption": "string",
  "media_urls": ["string"],
  "location": "string",
  "region": "string",
  "hashtags": ["string"]
}
```

---

## 🎯 Régions du Québec supportées

1. **Montréal** - Métropole
2. **Québec** - Capitale
3. **Gatineau** - Outaouais
4. **Sherbrooke** - Estrie
5. **Trois-Rivières** - Mauricie
6. **Saguenay** - Saguenay–Lac-Saint-Jean
7. **Lévis** - Chaudière-Appalaches
8. **Laval** - Région de Laval
9. **Autre** - Autres régions

---

## 🌟 Fonctionnalités uniques ZYEUTÉ

### 1. **Filtre Québec**
Contenu exclusivement québécois avec filtrage par région

### 2. **Interface 100% française**
Terminologie adaptée au français québécois

### 3. **Badge "Vérifié Québec"**
Vérification pour créateurs québécois authentiques

### 4. **Tendances locales**
Hashtags et contenus populaires par région

### 5. **Événements québécois**
Calendrier culturel et festivals

---

## 📱 Expérience utilisateur

### Parcours utilisateur type

1. **Inscription** → Créer compte avec email
2. **Profil** → Ajouter photo, bio, région
3. **Découverte** → Explorer contenu québécois
4. **Abonnements** → Suivre créateurs
5. **Création** → Publier photos/vidéos
6. **Engagement** → Likes, commentaires, partages
7. **Stories** → Contenu éphémère quotidien
8. **Notifications** → Rester connecté

### Performance cibles

- ⚡ **Chargement initial**: < 2s
- 📊 **Feed scroll**: Infinite, fluide
- 🎥 **Vidéos**: Lecture immédiate
- 📱 **Mobile**: First-class experience
- 🔄 **Real-time**: Notifications instantanées

---

## 🔐 Considérations de sécurité

### Implémentées
✅ Row-Level Security (RLS)
✅ JWT Authentication
✅ HTTPS uniquement
✅ CORS configuré
✅ Helmet headers

### À implémenter
⚠️ Rate limiting
⚠️ Content moderation (AI)
⚠️ Spam detection
⚠️ DMCA compliance
⚠️ User blocking
⚠️ Private accounts
⚠️ 2FA authentication

---

## 🚀 Roadmap

### Phase 1 - MVP (En cours) ✅
- [x] Database schema
- [x] Feed page UI
- [x] Basic post display
- [ ] Upload functionality
- [ ] Profile pages
- [ ] Follow system

### Phase 2 - Core Features
- [ ] Stories
- [ ] Comments system
- [ ] Notifications
- [ ] Search & Explore
- [ ] Video recording
- [ ] Direct messages

### Phase 3 - Growth
- [ ] Algorithm optimization
- [ ] Analytics dashboard
- [ ] Creator tools
- [ ] Monetization
- [ ] Live streaming
- [ ] Events & meetups

### Phase 4 - Scale
- [ ] Mobile apps (iOS/Android)
- [ ] Advanced moderation
- [ ] Community features
- [ ] Business accounts
- [ ] Advertising platform

---

## 📞 Support & Documentation

### Resources

- **Supabase Docs**: https://supabase.com/docs
- **Netlify Functions**: https://docs.netlify.com/functions/overview/
- **PostgreSQL**: https://www.postgresql.org/docs/

### Code Structure

```
src/
├── fil.html         # Main feed (done)
├── publier.html     # Create post (todo)
├── profil.html      # User profile (todo)
├── decouvrir.html   # Explore (todo)
├── notifications.html # Notifications (todo)
├── css/
│   ├── global.css   # Design system (exists)
│   └── feed.css     # Feed styles (done)
└── js/
    └── feed.js      # Feed logic (done)

netlify/functions/
├── get-feed.js           # (todo)
├── create-post.js        # (todo)
├── toggle-like.js        # (todo)
├── add-comment.js        # (todo)
├── follow-user.js        # (todo)
└── ... more endpoints
```

---

## 💡 Tips pour l'éditeur

### Quick wins
1. **Créer page upload** - Utiliser Supabase Storage
2. **API endpoint get-feed** - Requête simple PostgreSQL
3. **Page profil** - Réutiliser styles feed.css
4. **Toggle like API** - INSERT/DELETE dans table likes

### Patterns à suivre
- ✅ Tous les textes en français
- ✅ Glass-morphism design
- ✅ Mobile-first responsive
- ✅ Optimistic UI updates
- ✅ Error handling avec toasts

### Code examples disponibles
- `/js/feed.js` - Post rendering, infinite scroll
- `/css/feed.css` - Component styles
- `/database/zyeute-schema.sql` - Complete schema

---

## 🎉 Conclusion

ZYEUTÉ est prêt à devenir **le réseau social du Québec**!

La fondation est solide:
- ✅ Base de données complète
- ✅ Interface moderne et performante
- ✅ Architecture scalable
- ✅ Design québécois authentique

**Prochaines étapes critiques:**
1. Implémenter upload de médias
2. Créer endpoints API manquants
3. Ajouter pages profil, explorer, publier
4. Tests utilisateurs québécois
5. Lancement beta! 🚀

---

**Fait avec ❤️ pour le Québec**
