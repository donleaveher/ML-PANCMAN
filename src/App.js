import React from "react";
import { useState } from "react";
import PacMan from "./components/PacMan";
import MLTrain from "./components/MLTrain";
import DataCollection from "./components/DataCollection";
import GuideModal from "./components/GuideModal";
import {
    Box,
    CssBaseline,
    AppBar,
    Toolbar,
    Typography,
    Container,
    Grid,
    Paper,
    Button,
} from "@mui/material";

export default function App() {
    const webcamRef = React.useRef(null);
    const [openGuide, setOpenGuide] = useState(false);
    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />
            <AppBar position="absolute">
                <Toolbar
                    sx={{
                        pl: "24px", // left padding
                    }}
                >
                    <Typography component="h1" variant="h3" color="inherit" noWrap sx={{ flexGrow: 1 }}>
                        Control PAC MAN via the camera!
                    </Typography>
                    
                    <Button 
                        color="inherit" 
                        variant="outlined" 
                        sx={{ borderColor: 'white', color: 'white' }}
                        onClick={() => setOpenGuide(true)}
                    >
                        ❓ Instructions
                    </Button>

                </Toolbar>
            </AppBar>

            <Box
                component="main"
                sx={{
                    backgroundColor: (theme) => theme.palette.grey[800],
                    flexGrow: 1,
                    height: "100vh",
                    width: "100vw",
                    overflow: "auto",
                }}
            >
                <Toolbar />
                <Container sx={{ paddingTop: 3 }}>
                    <Grid container spacing={3}>
                        {/* Chart */}
                        <Grid item xs={12} md={6} lg={6}>
                            <Paper
                                sx={{
                                    p: 2,
                                    display: "flex",
                                    flexDirection: "column",
                                    // ⚠️ Important: remove the old height: 340 or change it to 'auto'
                                    // The photo wall increases the height, so a fixed 340px cuts it off
                                    height: "auto", 
                                    minHeight: "80vh" // Optional: give a minimum height to keep it neat
                                }}
                            >
                                {/* Keep only this line! DataCollection is nested inside */}
                                <MLTrain webcamRef={webcamRef} />
                            </Paper>
                        </Grid>
                        {/* Recent Deposits */}
                        <Grid item xs={12} md={6} lg={6}>
                            <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
                                <PacMan />
                            </Paper>
                        </Grid>
                    </Grid>
                    <GuideModal open={openGuide} onClose={() => setOpenGuide(false)} />
                </Container>
            </Box>
        </Box>
    );
}
