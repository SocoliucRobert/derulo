import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
    AppBar, Toolbar, Typography, Button, Container, Box, Grid, Card,
    CardContent, List, ListItem, ListItemText, CircularProgress, Snackbar, Alert, Divider,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const SgDashboard = ({ session }) => {
    const [disciplines, setDisciplines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedDiscipline, setSelectedDiscipline] = useState(null);
    const [proposedDate, setProposedDate] = useState(null);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const handleOpenDialog = (discipline) => {
        setSelectedDiscipline(discipline);
        setProposedDate(null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedDiscipline(null);
    };

    const handleSubmitProposal = async () => {
        if (!proposedDate || !selectedDiscipline) return;

        try {
            const response = await fetch('/api/sg/propose-exam', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    discipline_id: selectedDiscipline.id,
                    exam_date: proposedDate.toISOString().split('T')[0] // Format as YYYY-MM-DD
                })
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to propose exam date.');
            }
            
            setSnackbar({ open: true, message: 'Exam date proposed successfully!', severity: 'success' });
            handleCloseDialog();
            fetchDisciplines(); // Refresh the list
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        }
    };

    const fetchDisciplines = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/sg/disciplines', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch disciplines.');
            }
            const data = await response.json();
            setDisciplines(data);
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [session.access_token]);

    useEffect(() => {
        fetchDisciplines();
    }, [fetchDisciplines]);

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Group Leader Dashboard
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>Logout</Button>
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5">My Disciplines</Typography>
                                <Typography color="text.secondary">Propose or view exam dates for your assigned disciplines.</Typography>
                            </CardContent>
                            <Divider />
                            <List dense>
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
                                ) : disciplines.length > 0 ? (
                                    disciplines.map(d => (
                                        <ListItem key={d.id} divider>
                                            <ListItemText
                                                primary={d.name}
                                                secondary={
                                                    d.exam_status ? 
                                                    `Status: ${d.exam_status} | Date: ${new Date(d.exam_date).toLocaleDateString()}` : 
                                                    'No exam proposed yet.'
                                                }
                                            />
                                            <Button
                                                variant="outlined"
                                                onClick={() => handleOpenDialog(d)}
                                                disabled={!!d.exam_status}
                                            >
                                                Propose Date
                                            </Button>
                                        </ListItem>
                                    ))
                                ) : (
                                    <ListItem><ListItemText primary="No disciplines assigned to you." /></ListItem>
                                )}
                            </List>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Propose Exam Date for {selectedDiscipline?.name}</DialogTitle>
                <DialogContent>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Exam Date"
                            value={proposedDate}
                            onChange={(newValue) => setProposedDate(newValue)}
                            renderInput={(params) => <TextField {...params} sx={{ mt: 2, minWidth: 300 }} />}
                        />
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmitProposal} variant="contained" disabled={!proposedDate}>Submit</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SgDashboard;
