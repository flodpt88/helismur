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

## Effets

- `assets/hero3d.js` : scène 3D de l'accueil (Three.js + bloom), hélicoptère construit en code, relief néon calculé sur le GPU. Repli sur la photo si WebGL est indisponible ; image fixe si l'utilisateur a demandé moins d'animations.
- `assets/home.js` : frise 2011 → 2028 épinglée en défilement horizontal (GSAP ScrollTrigger), parallaxe de la photo.
- `assets/site.js` : apparitions au scroll, cartes en tilt 3D, halo du curseur, compteurs, fond néon des pages intérieures.
- Bibliothèques embarquées dans `assets/vendor/` (Three.js r169, GSAP 3.12), sans dépendance à un CDN.
