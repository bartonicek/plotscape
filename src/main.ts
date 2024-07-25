import { ExpanseContinuous } from "./scales/ExpanseContinuous";
import { ExpansePoint } from "./scales/ExpansePoint";
import { Scale } from "./scales/Scale";

// Marker.update(m, [1, 2, 3], 4);
// Marker.update(m, [1, 2, 3, 4, 5, 6], Transient);

// console.log(m.indices);
// Marker.clearTransient(m);

// // const foof = Expanse;

const expanse1 = ExpansePoint.of(["a", "b", "c", "d"]);
const expanse2 = ExpanseContinuous.of(1, 10);

const foo = Scale.of(expanse1, expanse2);
console.log(Scale.pushforward(foo, "b"));
