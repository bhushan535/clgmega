import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import { loadCocoModel } from "../object/cocoModel.js"; 

// let model = null;

// export async function detectPersons(videoEl) {
//   if (!model) {
//     model = await cocoSsd.load();
//   }

//   const predictions = await model.detect(videoEl);

//   const persons = predictions.filter(
//     p => p.class === "person" && p.score > 0.6
//   );

//   return persons.length;
// }
let model = null;

export async function detectPersons(videoEl) {
  if (!videoEl || videoEl.readyState < 2) return 0;

  if (!model) {
    model = await loadCocoModel();
  }

  const predictions = await model.detect(videoEl);

  const persons = predictions.filter(
    (p) => p.class === "person" && p.score > 0.6
  );

  console.log("👥 PERSONS:", persons.length); // ✅ CONSOLE

  return persons.length;
}