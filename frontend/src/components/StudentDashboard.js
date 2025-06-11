import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
    AppBar, Toolbar, Typography, Button, Container, Box, Grid, Card, 
    CardContent, CircularProgress, Snackbar, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';

const StudentDashboard = ({ session }) => {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [approvedExams, setApprovedExams] = useState([]);
    const [loadingExams, setLoadingExams] = useState(true);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchApprovedExams = useCallback(async () => {
        try {
            setLoadingExams(true);
            const response = await fetch('/api/sec/approved-exams', { // Students can use the same endpoint as SEC
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch approved exams.');
            const data = await response.json();
            setApprovedExams(data);
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoadingExams(false);
        }
    }, [session.access_token]);

    useEffect(() => {
        fetchApprovedExams();
    }, [fetchApprovedExams]);

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Student Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                        {session.user.email}
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>Logout</Button>
                </Toolbar>
            </AppBar>
            <Container sx={{ mt: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" component="div">Final Exam Schedule</Typography>
                                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                    Here are the approved exams for the upcoming session.
                                </Typography>
                                {loadingExams ? <CircularProgress /> : (
                                    <TableContainer component={Paper}>
                                        <Table sx={{ minWidth: 650 }} aria-label="approved exams table">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Discipline</TableCell>
                                                    <TableCell>Teacher</TableCell>
                                                    <TableCell>Exam Date</TableCell>
                                                    <TableCell>Year</TableCell>
                                                    <TableCell>Specialization</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {approvedExams.length > 0 ? approvedExams.map((exam) => (
                                                    <TableRow key={exam.exam_id}>
                                                        <TableCell>{exam.discipline_name}</TableCell>
                                                        <TableCell>{exam.teacher_name}</TableCell>
                                                        <TableCell>{new Date(exam.exam_date).toLocaleDateString()}</TableCell>
                                                        <TableCell>{exam.year_of_study || 'N/A'}</TableCell>
                                                        <TableCell>{exam.specialization || 'N/A'}</TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} align="center">No approved exams yet.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
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

export default StudentDashboard;
