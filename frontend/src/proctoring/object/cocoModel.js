// import * as cocoSsd from "@tensorflow-models/coco-ssd";
// import "@tensorflow/tfjs";

// let modelPromise = null;

// export function loadCocoModel() {
//   if (!modelPromise) {
//     modelPromise = cocoSsd.load();
//   }
//   return modelPromise;
// }
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

let modelPromise = null;

export function loadCocoModel() {
  if (!modelPromise) {
    console.log("📦 Loading COCO-SSD model...");
    modelPromise = cocoSsd.load();
  }
  return modelPromise;
}
