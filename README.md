# WORLD TRAGEDIES — application HTML / CSS / JavaScript

Application web responsive conçue pour mobile, installable comme PWA et préparée pour une conversion Android avec Capacitor.

## Contenu de cette V1

- Interface sombre responsive.
- Chronologie et recherche textuelle.
- Filtres par catégorie et grandes périodes.
- Fiches avec contexte, conséquences, bilan et degré de certitude.
- Sources cliquables.
- Carte Leaflet/OpenStreetMap (connexion nécessaire pour les fonds de carte).
- Statistiques par catégorie et période.
- Service worker pour mettre en cache les fichiers de l'application.
- Workflow GitHub Actions qui génère une APK debug.

## Démarrer localement

N'ouvre pas `index.html` en double-cliquant : le navigateur bloque le chargement du JSON local. Utilise un serveur :

```bash
npm install
npm run start
```

Vite affiche l'adresse locale à ouvrir.

## Publier sur GitHub Pages

1. Crée un dépôt GitHub.
2. Envoie le contenu de ce dossier à la racine.
3. Dans Settings > Pages, choisis GitHub Actions ou configure le déploiement statique.
4. Pour une publication statique simple, le contenu du dossier peut être servi par n'importe quel hébergeur web statique. Vérifie que les chemins relatifs restent actifs.

## Générer l'APK

Le workflow `.github/workflows/build-apk.yml` :
1. installe Node et Java ;
2. construit les fichiers web avec Vite ;
3. crée le projet Android avec Capacitor ;
4. synchronise les ressources ;
5. compile `assembleDebug` ;
6. publie l'APK en artefact GitHub Actions.

Après avoir poussé les fichiers sur la branche `main` ou `master`, ouvre l'onglet **Actions**, sélectionne le workflow terminé et télécharge `world-tragedies-debug-apk`.

Pour un APK de production distribuable, il faudra configurer une signature Android (keystore) dans des secrets GitHub et ajouter une étape de signature. L'APK debug n'est pas une version Play Store.

## Base de données

Les événements sont stockés dans `public/data/events.json`. Chaque entrée contient :
- `id` : identifiant unique ;
- `year` : année numérique (négative avant notre ère) ;
- `date`, `title`, `category`, `region`, `country` ;
- `lat`, `lng` : coordonnées approximatives pour la carte ;
- `deaths` : nombre numérique si établi, sinon `null` ;
- `deathsLabel` : formulation éditoriale du bilan ;
- `summary`, `impact`, `confidence` ;
- `sources` : liens de référence.

La base fournie est une **sélection initiale**, pas un inventaire exhaustif. Elle ne doit pas être présentée comme « tous les événements depuis la création de la Terre ». Les bilans et interprétations doivent être recoupés et datés avant une diffusion publique. Un chiffre nul ou inconnu ne signifie pas zéro victime.

## Carte et fonctionnement hors ligne

Les fichiers principaux et la base JSON sont mis en cache par le service worker. Les fonds cartographiques OpenStreetMap, Leaflet et Google Fonts sont des ressources externes : la carte et certaines polices nécessitent une connexion. Ne pas redistribuer des tuiles OpenStreetMap en cache massif ; respecter leur politique d'utilisation.

## Sécurité API

Aucune clé API n'est nécessaire pour cette V1. Si un service nécessitant une clé est ajouté, ne jamais placer une clé privée dans le JavaScript livré au navigateur ou dans un dépôt public. Utiliser un backend et des variables secrètes côté serveur.

## Qualité et sources

Les bilans historiques sont souvent des fourchettes ou des estimations. Distinguer décès directs, décès indirects, disparus et mortalité à long terme. Les événements préhistoriques décrivent des crises géologiques ou biologiques et ne sont pas des tragédies humaines. Les liens fournis sont des pistes de consultation ; une future édition doit ajouter des références précises par événement (étude, rapport, page et date de consultation).

## Licence

Les contenus tiers et les fonds cartographiques sont soumis à leurs propres licences et conditions d'utilisation. Vérifier ces conditions avant publication ou commercialisation.
