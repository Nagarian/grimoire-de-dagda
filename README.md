# Le Grimoire de Dagda

Une application compagnon pour [La Saga de Dagda](https://www.lasagadedagda.fr/) de Fabien Olicard. Elle permet aux lecteurs de suivre leur progression et leur personnage dans les livres interactifs.

---

## ✨ Fonctionnalités

- **Story Progresser** : Lecture pensée pour mobile, choix de chapitre au
  premier plan et plusieurs parcours nommés sauvegardés dans le navigateur.
  L’historique et la gestion des parcours sont dans le menu ; les sauts
  manuels restent accessibles à la demande. Les fiches de personnage adaptées
  à chaque tome, les sauvegardes T01 et les capsules du Royaume des Ombres sont
  enregistrées par parcours.
- **Visualisation des livres** : Exploration graphique des embranchements et
  recherche de chapitres.
- **Compatibilité multi-tomes** :
  - La Harpe des Quatre Saisons
  - La Confrérie de Nuada
  - Les Entrailles du Temps
  - La Prophétie Sombre
  - L’Éveil des Oubliés
  - Extension : Le Royaume des Ombres

---

## 🧪 Vérifications

```sh
pnpm lint
pnpm test:coverage
pnpm build
```

Les tests navigateur Playwright se lancent localement après l’installation de
Chromium :

```sh
pnpm exec playwright install chromium
pnpm test:e2e
```

La stratégie et le périmètre des tests sont détaillés dans
[docs/testing.md](./docs/testing.md).

---

## ✅ À venir

- Simplification des combats et calcul automatique des jets
- Intégration des extensions futures

## 📜 Licence

Ce projet est sous licence MIT.  
Les droits sur la saga appartiennent à **Fabien Olicard**.

## 💡 Contribuer

Les contributions sont les bienvenues !  
Veuillez ouvrir une issue ou soumettre une pull request.
