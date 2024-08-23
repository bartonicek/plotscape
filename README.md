# Plotscape

Plotscape is a library for creating interactive figures for data exploration. All plots in `plotscape` support linked selection by default, as well as wide variety of other interactions, including, zooming, panning, reordering, and parameter manipulation.

# Quick start

First, initialize a new frontend project using your build tool of choice. I like using Bun + Vite, so here's what I would do:

```bash
bun create vite my-new-figure
cd my-new-figure
```

Next, install plotscape as well as all other required dependencies:

```bash
bun i @abartonicek/plotscape
```

(if you prefer Node over Bun, you can achieve the same with `npm create vite@latest my-new-figure` and `npm i @abartonicek/plotscape`)

Now you should be ready to create your first interactive figure with plotscape. Copy the following code into your `index.ts`/`main.ts`:

```typescript
// Where you want to mount your figure
const app = document.querySelector<HTMLDivElement>("#app")!;

const URL = `https://raw.githubusercontent.com/bartonicek/plotscape/master/packages/plotscape/datasets/sacramento.json`;
const sacramento = await fetchJSON(URL);

const scene = newScene(app, sacramentoData);

const plot1 = Scatterplot.from(scene, (d) => ({
  v1: d.longitude,
  v2: d.latitude,
  v3: d.price,
}));

const plot2 = Fluctplot.from(scene, (d) => ({ v1: d.beds, v2: d.baths }));
const plot3 = Barplot.from(scene, (d) => ({ v1: d.city }));

const opts = { reducer: maxReducer };
const plot4 = Histogram.from(scene, (d) => ({ v1: d.sqft, v2: d.price }), opts);
const plot5 = Histogram2D.from(scene, (d) => ({ v1: d.sqft, v2: d.price }));
const plot6 = Noteplot.from(scene);

const plot7 = PCoordsplot.from(scene, (d) =>
  Object.fromEntries(Object.entries(d).map(([_, v], i) => [`v${i}`, v])),
);

scene.setLayout([
  [1, 1, 2, 3],
  [1, 1, 4, 5],
  [6, 7, 7, 7],
]);
```

Finally, launch a development server:

```bash
bun run dev    # Or "npm run dev"
```
