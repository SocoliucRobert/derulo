import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
    AppBar, Toolbar, Typography, Button, Container, Box, Grid, Card,
    CardContent, CardActions, Divider, Snackbar, Alert, Stack
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ExamAssignment from './ExamAssignment';

const SecDashboard = ({ session }) => {
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [approvedExams, setApprovedExams] = useState([]);
    const [loadingExams, setLoadingExams] = useState(true);
    const [downloading, setDownloading] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchApprovedExams = useCallback(async () => {
        try {
            setLoadingExams(true);
            const response = await fetch('/api/sec/approved-exams', {
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

    const handleDownloadExcel = async () => {
        try {
            setDownloading(true);
            const response = await fetch('/api/sec/exams/export', {
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            if (!response.ok) throw new Error('Failed to download Excel.');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const date = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `exam_schedule_${date}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            setSnackbar({ open: true, message: 'Excel file downloaded successfully!', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Secretariat Dashboard
                    </Typography>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                        {session.user.email}
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>Logout</Button>
                </Toolbar>
            </AppBar>

            <Container sx={{ mt: 4 }}>
                <Grid container spacing={3}>
                    {/* Exam Assignment Form */}
                    <Grid item xs={12}>
                        <ExamAssignment session={session} />
                    </Grid>

                    {/* Export Exams Card */}
                    <Grid item xs={12}>
                        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                            <CardContent>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <CloudDownloadIcon fontSize="large" color="primary" />
                                    <Typography variant="h5" component="div">Export Confirmed Exams</Typography>
                                </Stack>
                                <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 2 }}>
                                    Download a complete list of all confirmed exams in Excel format. The file includes details such as discipline name, exam type, student group, exam date, time, duration, room, and teachers.
                                </Typography>
                            </CardContent>
                            <Divider />
                            <CardActions sx={{ p: 2, justifyContent: 'center' }}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleDownloadExcel}
                                    disabled={loadingExams || approvedExams.length === 0 || downloading}
                                    sx={{ px: 4, py: 1 }}
                                >
                                    {downloading ? 'Downloading...' : `Download Excel (${approvedExams.length} exams)`}
                                </Button>
                            </CardActions>
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

export default SecDashboard;
