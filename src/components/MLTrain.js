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
  // 增加一个鼠标悬停的功能，然后得到关于单个图片训练效果的功能
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
        // 👇 【核心修改】在这里加上顶部边框和间距
        borderTop: "2px solid #e0e0e0", // 灰色细线 (想要粗一点可以改成 2px)
        pt: 2,                          // paddingTop: 线和下面内容的内部距离 (让内容不顶着线)
        mt: 2,                          // marginTop: 线和上面图片墙的外部距离 (拉开两块区域)
        width: '100%',                  // 确保线占满整行
        alignItems: "flex-start"            // (可选) 垂直居中对齐
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

  //当鼠标悬停的时候
  const handleImageHover = async (imageSrc, event) => {
    if (!model || !truncatedMobileNet) return;

    const { clientX, clientY } = event;
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = `anonymous`;
    img.onload = async () => {
        const result = tf.tidy(() => {
          let imgTensor = tf.browser.fromPixels(img);
          // 必须和你 addExample 时的预处理完全一致
          imgTensor = tf.image.resizeBilinear(imgTensor, [224, 224]); 
          imgTensor = imgTensor.expandDims(0);
          imgTensor = imgTensor.div(255.0); 

          // 1. 提取特征
          const activation = truncatedMobileNet.predict(imgTensor);
          // 2. 预测概率
          const predictions = model.predict(activation);
          return predictions.dataSync(); // 获取数组
      });

      // 更新 State，显示悬浮窗
      setHoverInfo({
          predictions: Array.from(result),
          x: clientX,
          y: clientY
      });
    };
  };
  // --- 鼠标移开时 ---
  const handleImageLeave = () => {
    setHoverInfo(null); // 关闭悬浮窗
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Grid container direction="column" spacing={3}>
        <Grid item xs={12}>
          <DataCollection 
              webcamRef={webcamRef} 
              onHover={handleImageHover} // 核心：传递预测功能
              onLeave={handleImageLeave} // 核心：传递清除功能
          />
        </Grid>

        <Grid item xs={12}>
          {/* 这里保留你原有的逻辑：没数据显提示，有数据显控制台 */}
          {imgSrcArr.length === 0 ? EmptyDatasetDisaply : ReguarlDisplay}
        </Grid>
          <PredictionTooltip info={hoverInfo} />
        </Grid>
    </Suspense>
  );

}

// --- 定义在 MLTrain.js 文件的最下面，或者单独一个文件也可以 ---

const PredictionTooltip = ({ info }) => {
  if (!info) return null;

  return (
    <Paper
      elevation={6} // 添加阴影深度
      sx={{
        position: 'fixed', // 关键：悬浮在最上层
        left: info.x + 15, // 稍微偏移鼠标，防止遮挡
        top: info.y + 15,
        zIndex: 9999,      // 确保盖过所有东西
        bgcolor: 'rgba(33, 33, 33, 0.95)', // 深色背景，略微透明
        color: '#fff',
        p: 1.5,            // padding
        borderRadius: 2,
        minWidth: 140,
        pointerEvents: 'none', // 关键：让鼠标穿透，防止闪烁
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