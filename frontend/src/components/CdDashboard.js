import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
    AppBar, Toolbar, Typography, Button, Container, Box, Grid, Card,
    CardContent, List, ListItem, ListItemText, CircularProgress, Snackbar, Alert, Divider, Chip
} from '@mui/material';

const CdDashboard = ({ session }) => {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchProposals = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/cd/proposals', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch proposals.');
            }
            const data = await response.json();
            setProposals(data);
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [session.access_token]);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    const handleValidation = async (proposalId, status) => {
        try {
            const response = await fetch('/api/cd/proposals/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ 
                    exam_id: proposalId, 
                    status: status 
                })
            });

            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.error || `Failed to ${status.toLowerCase()} proposal.`);
            }

            setSnackbar({ open: true, message: `Proposal has been ${status.toLowerCase()}.`, severity: 'success' });
            // Refresh the list by filtering out the validated proposal
            setProposals(prevProposals => prevProposals.filter(p => p.exam_id !== proposalId));

        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        }
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Course Director Dashboard
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>Logout</Button>
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5">Exam Proposals</Typography>
                                <Typography color="text.secondary">Review and validate pending exam proposals.</Typography>
                            </CardContent>
                            <Divider />
                            <List dense>
                                {loading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
                                ) : proposals.length > 0 ? (
                                    proposals.map(p => (
                                        <ListItem key={p.exam_id} divider sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                                            <ListItemText
                                                primary={p.discipline_name}
                                                secondary={`Proposed by: ${p.teacher_name}`}
                                            />
                                            <Chip label={`Date: ${new Date(p.exam_date).toLocaleDateString()}`} sx={{ mx: 2 }} />
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button variant="contained" color="success" size="small" onClick={() => handleValidation(p.exam_id, 'APROVADA')}>Approve</Button>
                                                <Button variant="contained" color="error" size="small" onClick={() => handleValidation(p.exam_id, 'RESPINSA')}>Reject</Button>
                                            </Box>
                                        </ListItem>
                                    ))
                                ) : (
                                    <ListItem><ListItemText primary="No pending proposals to review." /></ListItem>
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
        </Box>
    );
};

export default CdDashboard;
