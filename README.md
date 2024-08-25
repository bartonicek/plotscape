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

(if you prefer Node over Bun, you can achieve the same with `npm create vite@latest my-new-figure` and `npm i @abartonicek/plotscape`)

Now you should be ready to create your first interactive figure. Copy the following code into `src/index.ts`:

```typescript
import { fetchJSON, formatText, Plot, Scene } from "@abartonicek/plotscape";

// Where you want to mount your figure
const app = document.querySelector<HTMLDivElement>("#app")!;
const URL = `https://raw.githubusercontent.com/bartonicek/plotscape/master/datasets/sacramento.json`;
const sacramento = await fetchJSON(URL);

sacramento.city = sacramento.city.map((x) => formatText(x));

const scene = Scene.of(sacramento);
Scene.append(app, scene);

const r = { ratio: 1 };
const plot1 = Plot.scatter(scene, (d) => [d.longitude, d.latitude], r);
const plot2 = Plot.bar(scene, (d) => [d.city]);
const plot3 = Plot.histo(scene, (d) => [d.sqft]);
const plot4 = Plot.fluct(scene, (d) => [d.beds, d.baths]);

Scene.addPlot(scene, plot1);
Scene.addPlot(scene, plot2);
Scene.addPlot(scene, plot3);
Scene.addPlot(scene, plot4);
```

Finally, launch the development server:

```bash
bun run dev    # Or "npm run dev"
```

You should now see the following figure:

![plotscape figure showing a scatterplot, a barplot, a histogram, and a fluctuation diagram](https://github.com/bartonicek/plotscape/blob/master/images/screenshot.png?raw=true)

Your version will be fully interactive (the above above is just a snapshot, since Github doesn't allow JavaScript in README.md files).

Try clicking and dragging to select some points in the scatterplot in the top left corner of the the figure.

Happy data exploration!
