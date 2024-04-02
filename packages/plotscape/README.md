# Plotscape

Plotscape is a TypeScript library designed for making interactive figures geared towards data exploration. All plots in a `plotscaper` figures support linked highlighting by default, as well as a wide variety of other interactions, including switching representation, changing parameters, zooming, panning, and reordering.

# Quick start

First, initialize a new frontend project using your build tool of choice. I like using Bun + Vite, so here's what I would do:

```
bun create vite my-new-figure
cd my-new-figure
```

Next, install plotscape as well as all other required dependencies:

```
bun i @abartonicek/plotscape
```

(if you prefer Node over Bun, you can achieve the same with `npm create vite@latest my-new-figure` and `npm i @abartonicek/plotscape`)

Now you should be ready to create your first interactive figure with plotscape. Paste the following code into your `index.ts`/`main.ts`:

```typescript
// Where you want to mount your figure
const app = document.querySelector<HTMLDivElement>("#app")!;

const URL = `https://raw.githubusercontent.com/bartonicek/plotscape/master/packages/plotscape/datasets/sacramento.json`;
const sacramentoJSON = await fetchJSON(URL);

const spec = {
  city: col(`discrete`).toLowerCase().capitalize(),
  beds: col(`discrete`),
  baths: col(`discrete`),
  sqft: col(`continuous`),
  price: col(`continuous`),
  latitude: col(`continuous`),
  longitude: col(`continuous`),
  type: col(`discrete`),
};

// Parse data and set up a scene object
const sacramentoData = parseColumns(sacramentoJSON, spec);
const scene = newScene(app, sacramentoData);

// Add a some plots
const plot1 = newScatter(scene, (d) => ({ v1: d.longitude, v2: d.latitude }));
const plot2 = newFluctplot(scene, (d) => ({ v1: d.beds, v2: d.baths }));
const plot3 = newBarplot(scene, (d) => ({ v1: d.city }));
const plot4 = newHistogram(scene, (d) => ({ v1: d.sqft }));
const plot5 = newHistogram2D(scene, (d) => ({ v1: d.sqft, v2: d.price }));
const plot6 = newNoteplot(scene);
const plot7 = newPCoordsplot(scene, (d) => ({
  v1: d.latitude,
  v2: d.longitude,
  v3: d.price,
}));

// Set a grid layout for the figure
scene.setLayout([
  [1, 1, 3, 3],
  [1, 1, 4, 5],
  [6, 7, 7, 7],
]);
```

That's it! You should now be able to try the interactive by launching a development server:

`bun run dev`

(or `npm run dev`)

You should now see your interactive figure. Try selecting some objects in one of the plots by clicking/clicking and dragging. To see a list of the available ways of interacting with the figure, click on the question mark in the top right.

More information about the package to come, happy data exploring!
