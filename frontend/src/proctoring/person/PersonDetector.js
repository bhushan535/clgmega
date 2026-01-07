import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

let model = null;

export async function detectPersons(videoEl) {
  if (!model) {
    model = await cocoSsd.load();
  }

  const predictions = await model.detect(videoEl);

  const persons = predictions.filter(
    p => p.class === "person" && p.score > 0.6
  );

  return persons.length;
}
