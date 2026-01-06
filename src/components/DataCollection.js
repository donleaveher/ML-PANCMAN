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
    galleryDataAtom,
} from "../GlobalState";

const DIRECTIONS = {
    up: <ArrowUpward />,
    down: <ArrowDownward />,
    left: <ArrowBack />,
    right: <ArrowForward />,
};

const LABEL_NAMES = {
    up: "Up",
    down: "Down",
    left: "Left",
    right: "Right",
};

export default function DataCollection({ webcamRef, onHover, onLeave }) {
    const [predictedDirection] = useAtom(predictedDirectionAtom);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [showGallery, setShowGallery] = useState(false);

    // ---- Model Training ----
    const [imgSrcArr, setImgSrcArr] = useAtom(imgSrcArrAtom);
    const [galleryData, setGalleryData] = useAtom(galleryDataAtom);

    // ---- Configurations ----
    const [, setBatchSize] = useAtom(batchSizeAtom);
    const [gameRunning] = useAtom(gameRunningAtom);

    // ---- UI Display ----

    const capture = (direction) => async () => {
        // Capture image from webcam
        const newImageSrc = webcamRef.current.getScreenshot();

        // If image is not null, proceed with adding it to the dataset
        if (newImageSrc) {
            const uniqueId = Date.now();
            // Add example to the dataset
            const newImageArr = [...imgSrcArr, {id: uniqueId, src: newImageSrc, label: direction }];
            setImgSrcArr(newImageArr);
            setBatchSize(Math.floor(newImageArr.length * 0.4));

            // Also store for gallery visualization
            setGalleryData((prev) => [
                ...prev,
                {
                    id: Date.now(),
                    label: direction,
                    imageSrc: newImageSrc,
                },
            ]);
        }
    };

    // ✨ Added: clear data for a specific direction
    const clearData = (direction) => () => {
        // Filter out entries whose label matches the current direction
        const newImageArr = imgSrcArr.filter((item) => item.label !== direction);
        setImgSrcArr(newImageArr);
        // Also update batchSize so it does not stay oversized after pruning
        setBatchSize(Math.floor(newImageArr.length * 0.4));

        // Remove gallery entries for the same direction
        setGalleryData((prev) => prev.filter((item) => item.label !== direction));
    };

    const removeExample = (idToRemove) => {
        setGalleryData(prevData => {
                return prevData.filter(item => item.id !== idToRemove);
            });

        // 2. Update the main data source above (Count source)
        setImgSrcArr(prevImages => {
            // Ensure the outer argument name (prevImages) matches the usage inside
            const newImages = prevImages.filter(item => item.id !== idToRemove);
            setBatchSize(Math.floor(newImages.length * 0.4));
            return newImages;
        });
    }

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
        <>
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
                        // ✨✨✨ Start change: wrap Webcam so we can add a sibling node ✨✨✨
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            
                            {/* 1. This is your original Webcam */}
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

                            {/* 2. ✨✨✨ Insert the arrow display here (below the Webcam) ✨✨✨ */}
                            <Box sx={{ 
                                mt: 2, 
                                p: 1,
                                border: '2px dashed #ccc', 
                                borderRadius: 2,
                                minWidth: 100,
                                textAlign: 'center'
                            }}>
                                {!predictedDirection && <Typography variant="caption">Waiting for prediction...</Typography>}
                                {predictedDirection === "up" && <ArrowUpward sx={{ fontSize: 60, color: '#ff1744' }} />}
                                {predictedDirection === "down" && <ArrowDownward sx={{ fontSize: 60, color: '#ff1744' }} />}
                                {predictedDirection === "left" && <ArrowBack sx={{ fontSize: 60, color: '#ff1744' }} />}
                                {predictedDirection === "right" && <ArrowForward sx={{ fontSize: 60, color: '#ff1744' }} />}
                            </Box>
                        </Box>
                        // ✨✨✨ End change ✨✨✨
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
                        label={directionKey} // Pass the label name for the tooltip
                        onClear={clearData(directionKey)} // Pass the clear handler
                        
                    />
                );
            })}
        </Grid>

        {/* Visualization panel: show collected images grouped by direction */}
        <Box
            sx={{
            
                mt: 3,
                pt: 2,
                borderTop: "2px solid #dcdcdc",
                backgroundColor: "#fafafa",
                borderRadius: 1,
            }}
        >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="h6">Training Data Visualization</Typography>
                <Button variant="outlined" size="small" onClick={() => setShowGallery((v) => !v)}>
                    {showGallery ? "Hide" : "Show All"}
                </Button>

            </Box>
                    <Typography
                        variant="caption"
                        sx={{
                            color: '#d32f2f', // Bright red warning color
                            fontStyle: 'italic',
                            display: 'block',
                            marginTop: '5px'
                        }}
                    >
                        ⚠️ Note: If you delete an image, please click "Train Model" again to update the AI.
                    </Typography>    
            <Typography variant="body2" sx={{ mb: 2 }}>
                Hover over a thumbnail to quickly audit collected samples.
            </Typography>
            {showGallery && (
                <Grid container spacing={2}>
                    {Object.keys(DIRECTIONS).map((labelKey) => (
                        <Grid item xs={6} sm={3} key={labelKey}>
                            <Box sx={{ textAlign: "center", mb: 1 }}>
                                <Typography variant="subtitle1">{LABEL_NAMES[labelKey]}</Typography>
                            </Box>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                {galleryData
                                    .filter((item) => item.label === labelKey)
                                    .map((item) => (
                                        <Box
                                            key={item.id}
                                            sx={{
                                                position: "relative",
                                                border: "1px solid #e0e0e0",
                                                borderRadius: 1,
                                                overflow: "hidden",
                                            }}
                                            onMouseEnter={(e) => onHover(item.imageSrc, e)}
                                            onMouseLeave={onLeave}
                                        >
                                            <img
                                                src={item.imageSrc}
                                                alt={LABEL_NAMES[labelKey]}
                                                style={{ width: "100%", display: "block" }}
                                            />

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeExample(item.id);
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    right: 0,
                                                    background: 'rgba(255, 0, 0, 0.8)', // Semi-transparent red
                                                    color: 'white',
                                                    border: 'none',
                                                    width: '20px',
                                                    height: '20px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '0 0 0 4px' // Slight rounding on the bottom-left corner
                                                }}
                                                title="Remove this image"
                                            >
                                                x
                                            </button>


                                        </Box>
                                    ))}
                                {galleryData.filter((item) => item.label === labelKey).length === 0 && (
                                    <Typography variant="caption" color="textSecondary">
                                        No samples yet
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
        </>
    );
}

const OneDirection = ({ directionIcon, onCapture, onClear, dirImgSrcArr, disabled, label }) => {
    const hasData = dirImgSrcArr.length > 0;

    return (
        <Grid item xs={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Button controls */}
            <Box 
                textAlign="center" 
                display="flex" 
                flexDirection="column" // Stack vertically because xs={3} may be narrow
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
                
                {/* Clear button: only visible or enabled when data exists */}
                <Tooltip title={`Clear ${label} data`}>
                    <span> {/* Wrap disabled button in a span so the tooltip still shows */}
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

            {/* Image preview and count */}
            <Box textAlign="center" sx={{ width: "100%", height: "80px", position: 'relative', my:3}}>
                {hasData ? (
                    <>
                        <img
                            height={"100%"}
                            src={dirImgSrcArr[dirImgSrcArr.length - 1].src}
                            style={{ padding: "2px", border: '1px solid #ccc', borderRadius: '4px' }}
                            alt="preview"
                        />
                        {/* Display collected count */}
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
