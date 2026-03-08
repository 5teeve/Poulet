# Todo List

## QOUI
- Une application de gestion de lot de poulet
- Donnees:
    - Lot de poulet: id, nombre, date arriver, date sortie, race, mort
    - Race: id, nom, prix nourriture(ar/g), prix de vente(ar/g), prix oeuf(piece), prix poussins
    - Suivi de croissance par race: semaine, race, poids moyen, consommation de nourriture
    - Pondage: date, id lot, nombre d'oeufs
    - Incubation: date, id pondage, nombre de poussins
    - Vente poulet: date, id lot, nombre de poulet vendus, montant total
    - Vente oeuf: date, id pondage, nombre d'oeufs vendus, montant total

- Fonctionnalités:
    - Voir benefices par la date choisi (par defaut ajourd'hui)
    - Voir les depenses par la date choisi (par defaut ajourd'hui)
    - Voir les ventes par la date choisi (par defaut ajourd'hui)
    - Une page pour faire les incubations directement (les poussins seront automatiquement ajoutés au lot)
    - Afficher la montant estimer si on veut vendre les oeufs ou les poulets aujourd'hui (en se basant sur le poids moyen et le prix de vente par gramme)

### Format de resultat:
Date picker:

Lot | Prix poussin | Prix nourriture | Mort | Prix de vente | Prix oeuf | Poids Moyen |Benefice | Depense
--- | --- | --- | --- | --- | ---

---

## COMMENT
- BACKEND: 
    - NodeJS
- FRONTEND:
    - Angular
- DATABASE:
    -SQLserver: sqlcmd -S DESKTOP-HLNUSF3\MSSQLSERVER02 -No -E
- SUPPORT:
    - Docker