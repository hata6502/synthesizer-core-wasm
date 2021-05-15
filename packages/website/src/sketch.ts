import type { Component, Destination } from "./component";

interface Sketch {
  name: string;
  component: Record<string, Component>;
  inputDestinations: Destination[];
  outputComponentID?: string;
}

const initialSketch: Sketch = {
  name: "example",
  component: {
    "df5bb750-e9fe-fbf3-26e0-bbd601fe98c9": {
      name: "sine",
      type: 10,
      outputDestinations: [
        { componentID: "d417eb39-d2d7-4023-a58f-f058658b7c40", inputIndex: 1 },
      ],
      position: { x: 285, y: 36 },
      extendedData: {},
    },
    "d417eb39-d2d7-4023-a58f-f058658b7c40": {
      name: "speaker",
      outputDestinations: [],
      position: { x: 545, y: 25 },
      type: 18,
      extendedData: {},
    },
    "e02d7ee9-dcf2-40ab-ba7f-8beac91e411b": {
      name: "input",
      outputDestinations: [
        { componentID: "df5bb750-e9fe-fbf3-26e0-bbd601fe98c9", inputIndex: 1 },
      ],
      position: { x: 40, y: 41 },
      type: 15,
      extendedData: { value: "440" },
    },
  },
  inputDestinations: []
};

export { initialSketch };
export type { Sketch };
