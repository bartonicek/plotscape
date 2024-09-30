# Plotscape

Plotscape is a library for creating interactive figures for data exploration. All plots in `plotscape` support linked selection by default, as well as wide variety of other interactions, including, zooming, panning, reordering, and parameter manipulation.

Plotscape is written in (mostly) vanilla TypeScript and uses no external framework for reactivity.

If you're looking for the corresponding R package, go to [plotscaper](https://github.com/bartonicek/plotscaper).

# Quick start

First, initialize a new frontend project using your build tool of choice. I like using Bun + Vite, so here's what I would do:

```bash
bun create vite my-new-figure
cd my-new-figure
```

Next, install plotscape:

```bash
bun i @abartonicek/plotscape
```

(or, if you use Node, `npm create vite@latest my-new-figure` and `npm i @abartonicek/plotscape`)

Now you should be ready to create your first interactive figure. Copy the following code into `src/index.ts`:

```typescript
import { fetchJSON, formatText, Plot, Scene } from "@abartonicek/plotscape";

// Where you want to mount your figure
const app = document.querySelector<HTMLDivElement>("#app")!;

// Set fixed app width and height
if (!app.style.width) app.style.width = `800px`;
if (!app.style.height) app.style.height = `500px`;

// Fetch data
const URL = `https://raw.githubusercontent.com/bartonicek/plotscape/master/datasets/sacramento.json`;
const sacramento = await fetchJSON(URL);
sacramento.city = sacramento.city.map((x: string) => formatText(x));

// Set up a scene
const scene = Scene.of(sacramento);
Scene.append(app, scene);

// Add plots
const r = { ratio: 1 };
const plot1 = Plot.scatter(scene, (d) => [d.longitude, d.latitude], r);
const plot2 = Plot.histo(scene, (d) => [d.price]);
const plot3 = Plot.bibar(scene, (d) => [d.city, d.price]);
const plot4 = Plot.fluct(scene, (d) => [d.beds, d.baths]);
const plot5 = Plot.histo2d(scene, (d) => [d.sqft, d.price]);
const plot6 = Plot.pcoords(scene, (d) => Object.values(d));

Scene.addPlot(scene, plot1);
Scene.addPlot(scene, plot2);
Scene.addPlot(scene, plot3);
Scene.addPlot(scene, plot4);
Scene.addPlot(scene, plot5);
Scene.addPlot(scene, plot6);

// Set layout
Scene.setLayout(scene, [
  [0, 0, 1],
  [0, 0, 2],
  [3, 4, 5],
]);
```

Finally, launch the development server:

```bash
bun run dev    # Or "npm run dev"
```

You should now see the following figure:

![plotscape figure showing a scatterplot, a barplot, a histogram, and a fluctuation diagram](https://github.com/bartonicek/plotscape/blob/master/images/screenshot.png?raw=true)

Your version will be fully interactive (the above above is just a static snapshot, since Github doesn't allow JavaScript in README.md files).

Try clicking and dragging to select some points in the scatterplot in the top left corner of the the figure.

Happy data exploration!
