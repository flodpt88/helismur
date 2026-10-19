# Assistant de vol SMUH

Site public des assistants de vol (membres d'équipage technique) de l'hélicoptère du SAMU.

- `index.html` : accueil
- `actualites/` : actualités, chargées depuis `data/news.json` (mis à jour chaque semaine)
- `reglementation/` : fiches réglementaires (SPA.HEMS, ORO.TC, médical, statut, temps de service, convention collective)
- `metier/` : article long format sur le métier
- `outils/` : boîte à outils (briefing, nuit aéronautique, GPS, heures décimales, kéro)
- `assets/` : style, scripts, illustration

## Ajouter une actualité

Ajouter un objet en tête de `items` dans `data/news.json` et mettre à jour `updated` :

```json
{
  "id": "AAAA-MM-JJ-slug",
  "date": "AAAA-MM-JJ",
  "category": "Bases | Hélistations | Réglementation | Réforme des secours | Convention collective | Sécurité des vols | Exploitants | Matériel | Métier",
  "title": "Titre court",
  "summary": "Résumé rédigé avec ses propres mots, 2 ou 3 phrases.",
  "source": "Nom du média",
  "url": "https://lien-vers-la-source"
}
```

Publié avec GitHub Pages (branche `main`, racine).
