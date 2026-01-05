import { atom } from "jotai";
import { loadTruncatedMobileNet } from "./model";

// ---- Configurations ----
export const epochsAtom = atom(100); // Number of epochs
export const batchSizeAtom = atom(1); // Selected batch size
export const batchArrayAtom = atom([]); // Optional batch array holder
export const hiddenUnitsAtom = atom(100); // Number of hidden units
export const learningRateAtom = atom(0.0001); // Learning rate
export const gameRunningAtom = atom(false); // Game state
export const predictionAtom = atom(null); // Current prediction
export const dataSetSizeAtom = atom(0); // Dataset size tracking

// ---- Model Training ----
export const modelAtom = atom(null); // Model
export const truncatedMobileNetAtom = atom(loadTruncatedMobileNet()); // truncatedMobileNet
export const imgSrcArrAtom = atom([]); // collected images, formate {src: string, label: string}

// ---- UI Display ----
export const lossAtom = atom(null); // Loss value
export const trainingProgressAtom = atom(-1); // Training progress
export const stopTrainingAtom = atom(false); // Flag to stop training

// ✨ 新增：存储当前预测的方向 (例如 'up', 'down', 'left', 'right' 或 null)
export const predictedDirectionAtom = atom(null);

export const valLossAtom = atom(null);
export const accAtom = atom(null);

// Gallery data for visualization (id, label, imageSrc)
export const galleryDataAtom = atom([]);
