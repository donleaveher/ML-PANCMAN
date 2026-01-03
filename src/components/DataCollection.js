import Webcam from "react-webcam";
import { Grid, Button, Box, IconButton, Tooltip, Typography } from "@mui/material";
import {
    ArrowUpward,
    ArrowDownward,
    ArrowBack,
    ArrowForward,
    Delete as DeleteIcon,
} from "@mui/icons-material/";
import { useState, useRef } from "react";
import { useAtom } from "jotai";
import {
    imgSrcArrAtom,
    dataSetSizeAtom,
    batchArrayAtom,
    batchSizeAtom,
    gameRunningAtom,
    predictedDirectionAtom,
} from "../GlobalState";

const DIRECTIONS = {
    up: <ArrowUpward />,
    down: <ArrowDownward />,
    left: <ArrowBack />,
    right: <ArrowForward />,
};

export default function DataCollection({ webcamRef }) {
    const [predictedDirection] = useAtom(predictedDirectionAtom);
    const [isCameraOn, setIsCameraOn] = useState(false);

    // ---- Model Training ----
    const [imgSrcArr, setImgSrcArr] = useAtom(imgSrcArrAtom);

    // ---- Configurations ----
    const [, setBatchSize] = useAtom(batchSizeAtom);
    const [gameRunning] = useAtom(gameRunningAtom);

    // ---- UI Display ----

    const capture = (direction) => async () => {
        // Capture image from webcam
        const newImageSrc = webcamRef.current.getScreenshot();

        // If image is not null, proceed with adding it to the dataset
        if (newImageSrc) {

            // Add example to the dataset
            const newImageArr = [...imgSrcArr, { src: newImageSrc, label: direction }];
            setImgSrcArr(newImageArr);
            setBatchSize(Math.floor(newImageArr.length * 0.4));
        }
    };

    // ✨ 新增：清除特定方向数据的函数
    const clearData = (direction) => () => {
        // 过滤掉 label 等于当前方向的数据
        const newImageArr = imgSrcArr.filter((item) => item.label !== direction);
        setImgSrcArr(newImageArr);
        // 同样更新 batchSize，防止数据变少后 batchSize 过大
        setBatchSize(Math.floor(newImageArr.length * 0.4));
    };

    const cameraPlaceholder = (
        <Box
            display="flex"
            textAlign={"center"}
            justifyContent="center"
            alignItems="center"
            sx={{
                p: 2,
                border: "1px dashed grey",
                height: "224px",
                width: "224px",
                margin: "auto",
                backgroundColor: "#ddd",
            }}
        >
            Camera is off
        </Box>
    );

    return (
        <Grid container>
            {/* first row */}

            <Grid
                item
                xs={12}
                sx={{ marginBottom: 2 }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexDirection="column"
            >
                <Box textAlign="center">
                    <Button
                        variant="contained"
                        onClick={() => setIsCameraOn(!isCameraOn)}
                        disabled={gameRunning}
                    >
                        {" "}
                        {isCameraOn ? "Stop" : "Start"} Camera
                    </Button>
                </Box>
                <Box sx={{ marginTop: 1 }}>
                    {isCameraOn ? (
                        // ✨✨✨ 修改开始：我们需要给 Webcam 加个兄弟节点，所以外面要包一层 Box 或 <> ✨✨✨
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            
                            {/* 1. 这是你原来的 Webcam */}
                            <Webcam
                            mirrored
                            width={224}
                            height={224}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{
                                width: 224,
                                height: 224,
                                facingMode: "user",
                            }}
                            />

                            {/* 2. ✨✨✨ 在这里插入箭头显示代码 (Webcam 下方) ✨✨✨ */}
                            <Box sx={{ 
                                mt: 2, 
                                p: 1,
                                border: '2px dashed #ccc', 
                                borderRadius: 2,
                                minWidth: 100,
                                textAlign: 'center'
                            }}>
                                {!predictedDirection && <Typography variant="caption">等待预测...</Typography>}
                                {predictedDirection === "up" && <ArrowUpward sx={{ fontSize: 60, color: '#ff1744' }} />}
                                {predictedDirection === "down" && <ArrowDownward sx={{ fontSize: 60, color: '#ff1744' }} />}
                                {predictedDirection === "left" && <ArrowBack sx={{ fontSize: 60, color: '#ff1744' }} />}
                                {predictedDirection === "right" && <ArrowForward sx={{ fontSize: 60, color: '#ff1744' }} />}
                            </Box>
                        </Box>
                        // ✨✨✨ 修改结束 ✨✨✨
                    ) : (
                        cameraPlaceholder
                    )}
                </Box>
        </Grid>

            {Object.keys(DIRECTIONS).map((directionKey) => {
                const currentDirImages = imgSrcArr.filter((d) => d.label === directionKey);
                return (
                    <OneDirection
                        key={directionKey}
                        disabled={!isCameraOn}
                        directionIcon={DIRECTIONS[directionKey]}
                        onCapture={capture(directionKey)}
                        dirImgSrcArr={imgSrcArr.filter((d) => d.label == directionKey)}
                        label={directionKey} // 传入标签名用于 tooltip
                        onClear={clearData(directionKey)} // 传入清除函数
                        
                    />
                );
            })}
        </Grid>
    );
}

const OneDirection = ({ directionIcon, onCapture, onClear, dirImgSrcArr, disabled, label }) => {
    const hasData = dirImgSrcArr.length > 0;

    return (
        <Grid item xs={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* 按钮控制区 */}
            <Box 
                textAlign="center" 
                display="flex" 
                flexDirection="column" // 垂直排列按钮，因为水平空间 xs={3} 可能不够
                gap={1} 
                mb={1}
            >
                <Button
                    variant="outlined"
                    endIcon={directionIcon}
                    onClick={onCapture}
                    disabled={disabled}
                    size="small"
                >
                    Add
                </Button>
                
                {/* 清除按钮：只有当有数据时才显示或者是disabled状态 */}
                <Tooltip title={`Clear ${label} data`}>
                    <span> {/* span用于包裹disabled的按钮以显示tooltip */}
                        <IconButton 
                            onClick={onClear} 
                            disabled={!hasData} 
                            color="error"
                            size="small"
                            aria-label="delete"
                        >
                            <DeleteIcon />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>

            {/* 图片预览和计数区 */}
            <Box textAlign="center" sx={{ width: "100%", height: "80px", position: 'relative' }}>
                {hasData ? (
                    <>
                        <img
                            height={"100%"}
                            src={dirImgSrcArr[dirImgSrcArr.length - 1].src}
                            style={{ padding: "2px", border: '1px solid #ccc', borderRadius: '4px' }}
                            alt="preview"
                        />
                        {/* 显示采集数量 */}
                        <Typography variant="caption" display="block">
                            Count: {dirImgSrcArr.length}
                        </Typography>
                    </>
                ) : (
                    <Typography variant="caption" color="textSecondary">
                        No Data
                    </Typography>
                )}
            </Box>
        </Grid>
    );
};
