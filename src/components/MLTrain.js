import {
  Button,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  LinearProgress,
} from "@mui/material";
import React, { useEffect, useState, Suspense, useRef } from "react";
import { buildModel, processImages, predictDirection } from "../model";
import {
  batchArrayAtom,
  trainingProgressAtom,
  lossAtom,
  modelAtom,
  truncatedMobileNetAtom,
  epochsAtom,
  batchSizeAtom,
  learningRateAtom,
  hiddenUnitsAtom,
  stopTrainingAtom,
  imgSrcArrAtom,
  gameRunningAtom,
  predictionAtom,
  valLossAtom,
  accAtom,
} from "../GlobalState";
import { useAtom } from "jotai";
import DataCollection from "./DataCollection";
import { data, train } from "@tensorflow/tfjs";
// import JSONWriter from "./JSONWriter";
// import JSONLoader from "./JSONLoader";
import { predictedDirectionAtom } from "../GlobalState"; // Bring in the predicted direction atom we added
function generateSelectComponent(
  label,
  options,
  handleChange,
  currentValue,
  isDisabled = false
) {
  return (
    <>
      <InputLabel id="demo-simple-select-label">{label}</InputLabel>
      <Select
        size="small"
        sx={{ minWidth: 120 }}
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={currentValue}
        label={label}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isDisabled}
      >
        {options.map((option) => (
          <MenuItem value={option}>{option}</MenuItem>
        ))}
      </Select>
    </>
  );
}

export default function MLTrain({ webcamRef }) {
  // ---- Configurations ----
  const [learningRate, setLearningRate] = useAtom(learningRateAtom);
  const [epochs, setEpochs] = useAtom(epochsAtom);
  const [hiddenUnits, setHiddenUnits] = useAtom(hiddenUnitsAtom);
  const [isRunning] = useAtom(gameRunningAtom);

  // Atom for game logic
  const [, setPredictionDirection] = useAtom(predictionAtom);
  // ✨ UI display atom (big arrow)
  const [, setPredictedDirectionUI] = useAtom(predictedDirectionAtom);

  // ---- Model Training ----
  const [model, setModel] = useAtom(modelAtom);
  const [truncatedMobileNet] = useAtom(truncatedMobileNetAtom);
  const [imgSrcArr] = useAtom(imgSrcArrAtom);

  // ---- UI Display ----
  const [lossVal, setLossVal] = useAtom(lossAtom);
  const [trainingProgress, setTrainingProgress] = useAtom(trainingProgressAtom);
  const [valLoss, setValLoss] = useAtom(valLossAtom);
  const [acc, setAcc] = useAtom(accAtom);

  const [batchSize, setBatchSize] = useAtom(batchSizeAtom);
  const batchValueArray = [0.05, 0.1, 0.4, 1].map((r) =>
    Math.floor(imgSrcArr.length * r)
  );
  // Enable hover to inspect how each sample performs during training
  const [hoverInfo, setHoverInfo] = useState(null);

  const [, setStopTraining] = useAtom(stopTrainingAtom);

  // Reference to update isRunning
  const isRunningRef = useRef(isRunning);
  const SAMPLE_DELAY_MS = 30;
  const WINDOW_SIZE = 5;
  const historyRef = useRef([]);
  const directionLabels = {
    0: "right",
    1: "up",
    2: "left",
    3: "down",
  };

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getMostFrequent = (arr) => {
    if (arr.length === 0) return -1;
    const counts = {};
    let maxCount = 0;
    let maxElement = arr[0];

    for (const val of arr) {
      counts[val] = (counts[val] || 0) + 1;
      if (counts[val] > maxCount) {
        maxCount = counts[val];
        maxElement = val;
      }
    }
    return maxElement;
  };

  // Loop to predict direction with frame voting
  async function runPredictionLoop() {
    while (isRunningRef.current) {
      const currentPrediction = await predictDirection(
        webcamRef,
        truncatedMobileNet,
        model
      );

      if (typeof currentPrediction === "number" && currentPrediction >= 0) {
        historyRef.current.push(currentPrediction);

        if (historyRef.current.length > WINDOW_SIZE) {
          historyRef.current.shift();
        }

        if (historyRef.current.length === WINDOW_SIZE) {
          const decision = getMostFrequent(historyRef.current);
          setPredictionDirection(decision);
          setPredictedDirectionUI(
            decision >= 0 ? directionLabels[decision] : null
          );
        }
      }

      await sleep(SAMPLE_DELAY_MS);
    }

    setPredictedDirectionUI(null);
  }

  // Call to run prediction loop
  useEffect(() => {
    if (isRunning && webcamRef.current != null && model != null) {
      runPredictionLoop();
    }
  }, [isRunning]);

  // Train the model when called
  async function trainModel() {
    setTrainingProgress("Stop");
    const dataset = await processImages(imgSrcArr, truncatedMobileNet);
    const model = await buildModel(
      truncatedMobileNet,
      setLossVal,
      setValLoss,
      setAcc,
      dataset,
      hiddenUnits,
      batchSize,
      epochs,
      learningRate
    );
    setModel(model);
  }

  const stopTrain = () => {
    setStopTraining(true);
  };

  const EmptyDatasetDisaply = (
    <Typography variant="h6" sx={{ marginTop: "10px" }}>
      Please collect some data first!
      {/* Or <JSONLoader /> */}
    </Typography>
  );

  const ReguarlDisplay = (
    <Grid
      container
      space={2}
      sx={{
        // 👇 Core change: add a top border and spacing here
        borderTop: "2px solid #e0e0e0", // Light gray line (use 2px for a heavier look)
        pt: 2,                          // Padding between the line and the content below
        mt: 2,                          // Margin to separate from the image wall above
        width: '100%',                  // Ensure the line spans the full row
        alignItems: "flex-start"            // Optional: align items toward the top
    }}
    >
      <Grid item xs={6}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            trainingProgress == -1 ? trainModel() : stopTrain();
          }}
        >
          {trainingProgress == -1 ? "Train" : lossVal ? "Stop" : "Loading..."}
        </Button>
        <LinearProgress
          variant="determinate"
          value={trainingProgress}
          style={{
            display: trainingProgress === 0 ? "none" : "block",
            width: "75%",
            marginTop: "10px",
          }}
        />
        <Typography variant="h6">
          <Grid container spacing={1} sx={{ mt: 1, fontSize: "0.9rem" }}>
            <Grid item xs={12}>
              Dataset Size: {imgSrcArr.length}
            </Grid>
            <Grid item xs={12}>
              <strong>Train Loss:</strong> {lossVal || "-"}
            </Grid>
            <Grid item xs={12} sx={{ color: "#ed6c02" }}>
              {/* Highlight Val Loss in orange */}
              <strong>Val Loss:</strong> {valLoss || "-"}
            </Grid>
            <Grid item xs={12} sx={{ color: "#2e7d32" }}>
              {/* Highlight Accuracy in green */}
              <strong>Accuracy:</strong> {acc || "-"}
            </Grid>
          </Grid>
        </Typography>
        {/* <JSONWriter /> <br /> */}
      </Grid>
      <Grid item xs={6}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems:'flex-end'
        }}>
        <div className="hyper-params">
          {/* <label>Learning rate</label> */}
          {generateSelectComponent(
            "Learning Rate",
            [0.003, 0.001, 0.0001, 0.00001],
            setLearningRate,
            learningRate
          )}

          {/* <label>Epochs</label> */}
          {generateSelectComponent(
            "Epochs",
            [10, 100, 200, 500],
            setEpochs,
            epochs
          )}

          {/* <label>Batch size </label> */}
          {generateSelectComponent(
            "Batch Size",
            batchValueArray,
            setBatchSize,
            batchSize,
            false
          )}

          {/* <label>Hidden units</label> */}
          {generateSelectComponent(
            "Hidden units",
            [10, 100, 200],
            setHiddenUnits,
            hiddenUnits
          )}
        </div>
      </Grid>
    </Grid>
  );

  // When hovering over a thumbnail
  const handleImageHover = async (imageSrc, event) => {
    if (!model || !truncatedMobileNet) return;

    const { clientX, clientY } = event;
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = `anonymous`;
    img.onload = async () => {
        const result = tf.tidy(() => {
          let imgTensor = tf.browser.fromPixels(img);
          // Must mirror the preprocessing used in addExample
          imgTensor = tf.image.resizeBilinear(imgTensor, [224, 224]); 
          imgTensor = imgTensor.expandDims(0);
          imgTensor = imgTensor.div(255.0); 

          // 1. Extract features
          const activation = truncatedMobileNet.predict(imgTensor);
          // 2. Predict probabilities
          const predictions = model.predict(activation);
          return predictions.dataSync(); // Get the array
      });

      // Update state to show the tooltip
      setHoverInfo({
          predictions: Array.from(result),
          x: clientX,
          y: clientY
      });
    };
  };
  // --- When the mouse leaves ---
  const handleImageLeave = () => {
    setHoverInfo(null); // Close the tooltip
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Grid container direction="column" spacing={3}>
        <Grid item xs={12}>
          <DataCollection 
              webcamRef={webcamRef} 
              onHover={handleImageHover} // Pass prediction handling
              onLeave={handleImageLeave} // Pass clearing handler
          />
        </Grid>

        <Grid item xs={12}>
          {/* Keep the original behavior: show prompt when empty, controls when data exists */}
          {imgSrcArr.length === 0 ? EmptyDatasetDisaply : ReguarlDisplay}
        </Grid>
          <PredictionTooltip info={hoverInfo} />
        </Grid>
    </Suspense>
  );

}

// --- Defined at the bottom of MLTrain.js; could also live in its own file ---

const PredictionTooltip = ({ info }) => {
  if (!info) return null;

  return (
    <Paper
      elevation={6} // Add shadow depth
      sx={{
        position: 'fixed', // Key: float above everything
        left: info.x + 15, // Slightly offset from the cursor to avoid covering it
        top: info.y + 15,
        zIndex: 9999,      // Ensure it sits above all content
        bgcolor: 'rgba(33, 33, 33, 0.95)', // Dark background with slight transparency
        color: '#fff',
        p: 1.5,            // padding
        borderRadius: 2,
        minWidth: 140,
        pointerEvents: 'none', // Let the mouse pass through to prevent flicker
      }}
    >
      <Typography variant="subtitle2" sx={{ mb: 1, borderBottom: '1px solid #555', pb: 0.5 }}>
        Model Confidence
      </Typography>

      {['Up', 'Down', 'Left', 'Right', 'Neutral'].map((label, idx) => {
        const prob = info.predictions[idx] || 0;
        const percentage = (prob * 100).toFixed(1) + '%';
        const isHigh = prob > 0.5;

        return (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: isHigh ? '#66bb6a' : '#aaa' }}>
              {label}:
            </Typography>
            <Typography 
                variant="caption" 
                sx={{ 
                    fontWeight: isHigh ? 'bold' : 'normal',
                    color: isHigh ? '#66bb6a' : '#fff' 
                }}
            >
              {percentage}
            </Typography>
          </Box>
        );
      })}
    </Paper>
  );
};
