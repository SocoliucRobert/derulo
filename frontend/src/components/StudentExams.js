import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography, Container, Box, Grid, Card, CardContent, List, ListItem,
    ListItemText, CircularProgress, Snackbar, Alert, Divider, Chip
} from '@mui/material';

const StudentExams = ({ session }) => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchExams = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/student/exams', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch exams.');
            }
            
            const data = await response.json();
            setExams(data);
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [session.access_token]);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    const getStatusChip = (status) => {
        let color = 'default';
        switch (status) {
            case 'CONFIRMED':
                color = 'success';
                break;
            default:
                color = 'default';
        }
        return <Chip label={status} color={color} size="small" />;
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5">My Exam Schedule</Typography>
                            <Typography color="text.secondary">
                                View your upcoming exams
                            </Typography>
                        </CardContent>
                        <Divider />
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <List>
                                {exams.length > 0 ? exams.map((exam) => (
                                    <ListItem 
                                        key={exam.id} 
                                        divider 
                                        sx={{ '&:hover': { backgroundColor: 'action.hover' } }}
                                    >
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} sm={4}>
                                                <ListItemText 
                                                    primary={exam.discipline_name} 
                                                    secondary={`Type: ${exam.exam_type}`}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={3}>
                                                <Typography variant="body2">
                                                    Date: {new Date(exam.exam_date).toLocaleDateString()}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Time: {exam.start_hour}:00 ({exam.duration} min)
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={3}>
                                                <Typography variant="body2">
                                                    Room: {exam.room_name}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Teachers: {exam.teachers.join(', ')}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={2}>
                                                {getStatusChip(exam.status)}
                                            </Grid>
                                        </Grid>
                                    </ListItem>
                                )) : (
                                    <ListItem>
                                        <ListItemText primary="No exams scheduled yet." />
                                    </ListItem>
                                )}
                            </List>
                        )}
                    </Card>
                </Grid>
            </Grid>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default StudentExams;
