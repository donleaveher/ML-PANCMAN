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
import { data, train } from "@tensorflow/tfjs";
// import JSONWriter from "./JSONWriter";
// import JSONLoader from "./JSONLoader";
import { predictedDirectionAtom } from "../GlobalState"; // 引入刚才写的
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

  // 游戏逻辑用的 atom
  const [, setPredictionDirection] = useAtom(predictionAtom);
  // ✨ UI 显示用的 atom (大箭头)
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

  const [, setStopTraining] = useAtom(stopTrainingAtom);

  // Reference to update isRunning
  const isRunningRef = useRef(isRunning);

  // Loop to predict direction
  // Loop to predict direction
  async function runPredictionLoop() {
    while (isRunningRef.current) {
      // 1. 先获取预测结果
      const result = await predictDirection(
        webcamRef,
        truncatedMobileNet,
        model
      );

      // 2. 传给游戏逻辑 (PacMan 移动)
      setPredictionDirection(result);

      // 3. ✨ 传给 UI 显示 (屏幕上的大箭头)
      setPredictedDirectionUI(result);

      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    // 循环结束后，清空箭头显示
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
    <Grid container space={2}>
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
              {/* 用橙色突出 Val Loss */}
              <strong>Val Loss:</strong> {valLoss || "-"}
            </Grid>
            <Grid item xs={12} sx={{ color: "#2e7d32" }}>
              {/* 用绿色突出 Accuracy */}
              <strong>Accuracy:</strong> {acc || "-"}
            </Grid>
          </Grid>
        </Typography>
        {/* <JSONWriter /> <br /> */}
      </Grid>
      <Grid item xs={6}>
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

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {imgSrcArr.length === 0 ? EmptyDatasetDisaply : ReguarlDisplay}
    </Suspense>
  );
}
