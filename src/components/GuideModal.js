import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';

export default function GuideModal({ open, onClose }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#1976d2', color: 'white' }}>
                🎮 How to Play (Instructions)
            </DialogTitle>
            
            <DialogContent dividers>
                <Box sx={{ mb: 2, mt: 1 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                        Step 1: Calibration (Setup)
                    </Typography>
                    <Typography variant="body2" paragraph>
                        Teach the AI how to recognize your head movements:
                    </Typography>
                    <List dense>
                        <ListItem>
                            <ListItemText 
                                primary="UP / DOWN" 
                                secondary="Tilt your head up/down and hold the corresponding 'ADD TO' buttons." 
                            />
                        </ListItem>
                        <ListItem>
                            <ListItemText 
                                primary="LEFT / RIGHT" 
                                secondary="Turn your head left/right and hold the corresponding buttons." 
                            />
                        </ListItem>
                    </List>
                </Box>

                <Divider />

                <Box sx={{ mb: 2, mt: 2 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                        Step 2: Training & Playing
                    </Typography>
                    <Typography variant="body2">
                        1. Click <strong>TRAIN</strong> and wait for the loss to drop.<br />
                        2. Click <strong>START</strong> to control Pac-Man with your head!<br />
                    </Typography>
                </Box>
                
                <Box sx={{ bgcolor: '#fff3e0', p: 1, borderRadius: 1 }}>
                    <Typography variant="caption" color="orange">
                        ⚠️ <strong>Tip:</strong> Ensure good lighting and collect about 20 images per direction.
                    </Typography>
                </Box>
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary">
                    Got it, Let's Play!
                </Button>
            </DialogActions>
        </Dialog>
    );
}