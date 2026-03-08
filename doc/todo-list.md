# Todo List - Application de Gestion de Lot de Poulet

## 📋 Vue d'ensemble
Application de gestion complète pour l'élevage de poulet avec suivi des lots, races, pondages, incubations et ventes.

## 🏗️ Architecture
- **Backend**: NodeJS + Express + SQL Server
- **Frontend**: Angular (Standalone Components)
- **Database**: SQL Server sur port 64686

## ✅ Étapes Déjà Réalisées

### Backend
- [x] Configuration de la connexion SQL Server
- [x] Modèle Lot (CRUD complet)
- [x] Modèle Race (CRUD complet)
- [x] Contrôleurs Lot et Race
- [x] Routes API pour lots et races
- [x] Organisation des fichiers de routes

### Frontend
- [x] Configuration Angular avec HttpClient
- [x] Page Lots (affichage de la liste)
- [x] Page Races (affichage de la liste)
- [x] Routage Angular configuré
- [x] Services pour appels API

## 🚧 Tâches Restantes

### 1. Backend - Modèles et Contrôleurs

#### Pondage
- [x] Créer modèle `Pondage.js`
  - Champs: id, date, idLot, nombreOeufs
- [x] Créer contrôleur `pondageController.js`
  - CRUD complet pour les pondages
- [x] Créer routes `pondageRoutes.js`
  - GET /api/pondages
  - POST /api/pondages
  - GET /api/pondages/:id
  - PUT /api/pondages/:id
  - DELETE /api/pondages/:id

#### Incubation
- [x] Créer modèle `Incubation.js`
  - Champs: id, date, idPondage, nombrePoussins
- [x] Créer contrôleur `incubationController.js`
  - CRUD complet pour les incubations
- [x] Créer routes `incubationRoutes.js`
  - GET /api/incubations
  - POST /api/incubations
  - GET /api/incubations/:id
  - PUT /api/incubations/:id
  - DELETE /api/incubations/:id

#### Vente Poulet
- [x] Créer modèle `VentePoulet.js`
  - Champs: id, date, idLot, nombre, montantTotal
- [x] Créer contrôleur `ventePouletController.js`
  - CRUD complet pour les ventes de poulet
- [x] Créer routes `ventePouletRoutes.js`
  - GET /api/vente-poulets
  - POST /api/vente-poulets
  - GET /api/vente-poulets/:id
  - PUT /api/vente-poulets/:id
  - DELETE /api/vente-poulets/:id

#### Vente Oeuf
- [x] Créer modèle `VenteOeuf.js`
  - Champs: id, date, idPondage, nombre, montantTotal
- [x] Créer contrôleur `venteOeufController.js`
  - CRUD complet pour les ventes d'oeufs
- [x] Créer routes `venteOeufRoutes.js`
  - GET /api/vente-oeufs
  - POST /api/vente-oeufs
  - GET /api/vente-oeufs/:id
  - PUT /api/vente-oeufs/:id
  - DELETE /api/vente-oeufs/:id

#### Suivi Croissance
- [x] Créer modèle `SuiviCroissance.js`
  - Champs: id, semaine, idRace, poidsMoyen, consommationNourriture
- [x] Créer contrôleur `suiviCroissanceController.js`
  - CRUD complet pour le suivi de croissance
- [x] Créer routes `suiviCroissanceRoutes.js`
  - GET /api/suivi-croissance
  - POST /api/suivi-croissance
  - GET /api/suivi-croissance/:id
  - PUT /api/suivi-croissance/:id
  - DELETE /api/suivi-croissance/:id

### 2. Backend - API Spéciales

#### Calculs Financiers
- [wip] API pour calculer les bénéfices par date
  - GET /api/benefices?date=YYYY-MM-DD
- [ ] API pour calculer les dépenses par date
  - GET /api/depenses?date=YYYY-MM-DD
- [ ] API pour calculer les ventes par date
  - GET /api/ventes?date=YYYY-MM-DD
- [ ] API pour estimer la valeur actuelle du stock
  - GET /api/estimation-stock

#### Relations et Jointures
- [ ] API pour récupérer les lots avec leur race
  - GET /api/lots-avec-race
- [ ] API pour récupérer les pondages avec leur lot
  - GET /api/pondages-avec-lot
- [ ] API pour récupérer les incubations avec leur pondage
  - GET /api/incubations-avec-pondage

### 3. Frontend - Pages et Composants

#### Pages Principales
- [ ] Page Pondage
  - Liste des pondages
  - Filtrage par lot et date
- [ ] Page Incubation
  - Liste des incubations
  - Formulaire d'ajout
  - Auto-ajout des poussins au lot
- [ ] Page Ventes Poulet
  - Liste des ventes
  - Calcul automatique du montant
- [ ] Page Ventes Oeuf
  - Liste des ventes
  - Calcul automatique du montant

#### Tableaux de Bord
- [ ] Dashboard Principal
  - Résumé des lots actifs
  - Dernières pondages
  - Dernières ventes
  - Graphiques de performance
- [ ] Page Financière
  - Bénéfices/dépenses du jour
  - Sélecteur de date
  - Graphiques financiers
- [ ] Page Estimation
  - Valeur estimée du stock actuel
  - Basé sur poids moyen et prix de vente

#### Formulaires et Modales
- [ ] Formulaire Lot (création/modification)
  - Sélecteur de race
  - Validation des dates
- [ ] Formulaire Race (création/modification)
  - Validation des prix
- [ ] Formulaire Pondage
  - Sélecteur de lot
  - Calcul automatique
- [ ] Formulaire Incubation
  - Sélecteur de pondage
  - Auto-ajout au lot

### 4. Frontend - Services et Utilitaires

#### Services
- [ ] `PondageService`
- [ ] `IncubationService`
- [ ] `VentePouletService`
- [ ] `VenteOeufService`
- [ ] `SuiviCroissanceService`
- [ ] `FinanceService` (pour les calculs)

#### Utilitaires
- [ ] `DateUtils` - formatage et manipulation de dates
- [ ] `CalculUtils` - calculs financiers
- [ ] `ValidationUtils` - validation des formulaires

### 5. Interface Utilisateur

#### Navigation
- [ ] Menu de navigation principal
  - Lien vers Dashboard
  - Lien vers Lots
  - Lien vers Races
  - Lien vers Pondage
  - Lien vers Incubation
  - Lien vers Ventes
  - Lien vers Finances

#### Design et UX
- [ ] Thème graphique cohérent
- [ ] Responsive design (mobile)
- [ ] Messages de confirmation
- [ ] Gestion des erreurs
- [ ] Indicateurs de chargement

### 6. Fonctionnalités Avancées

#### Recherche et Filtrage
- [ ] Recherche dans les lots
- [ ] Filtrage par date
- [ ] Filtrage par race
- [ ] Export des données (CSV/Excel)

#### Rapports
- [ ] Rapport mensuel des ventes
- [ ] Rapport de performance par race
- [ ] Rapport de mortalité
- [ ] Bilan annuel

#### Notifications
- [ ] Alertes pour lots à vendre
- [ ] Rappels de pondages
- [ ] Notifications d'incubation

### 7. 
## 📝 Notes
- Utiliser des composants Angular standalone pour la modularité
- Maintenir la cohérence des noms entre backend et frontend
- Implémenter une gestion d'erreurs robuste
- Prévoir des données de test pour démonstration

sqlcmd -S localhost\MSSQLSERVER02 -U sa -P Motdepasse1303!?
