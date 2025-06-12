import React, { useState, useEffect } from 'react';
import {
    Typography, Container, Box, Grid, Card, CardContent, List, ListItem, 
    ListItemText, CircularProgress, Snackbar, Alert, Divider, Chip, Button,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    FormControl, InputLabel, Select, MenuItem, TextField
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

// Helper function to format dates properly
const formatDate = (dateValue) => {
    // Handle null, undefined, or "null" string
    if (!dateValue || dateValue === 'null') {
        return 'Not set';
    }
    
    // Try to parse the date
    const parsedDate = new Date(dateValue);
    
    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
        return 'Not set';
    }
    
    // Return formatted date
    return parsedDate.toLocaleDateString();
};

const TeacherExams = ({ session }) => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [reviewDialog, setReviewDialog] = useState({
        open: false,
        examId: null,
        action: '',
        alternateDate: null,
        alternateHour: ''
    });

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchExams = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/cd/exams', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch exams');
            }
            
            const data = await response.json();
            setExams(data);
        } catch (error) {
            console.error('Error fetching exams:', error);
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session.access_token]);

    const openReviewDialog = (examId, action) => {
        setReviewDialog({
            open: true,
            examId,
            action,
            alternateDate: null,
            alternateHour: ''
        });
    };

    const handleCloseDialog = () => {
        setReviewDialog({
            ...reviewDialog,
            open: false
        });
    };

    const handleReviewAction = async () => {
        try {
            const { examId, action, alternateDate, alternateHour } = reviewDialog;
            
            const requestBody = { action };
            
            // If action is ALTERNATE, include alternate date and hour
            if (action === 'ALTERNATE') {
                if (!alternateDate || !alternateHour) {
                    setSnackbar({ 
                        open: true, 
                        message: 'Please provide both alternate date and hour', 
                        severity: 'error' 
                    });
                    return;
                }
                
                requestBody.alternate_date = alternateDate.toISOString().split('T')[0];
                requestBody.alternate_hour = alternateHour;
            }
            
            const response = await fetch(`/api/cd/exams/${examId}/review`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(requestBody)
            });
            
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.error || `Failed to ${action.toLowerCase()} exam.`);
            }
            
            setSnackbar({ 
                open: true, 
                message: `Exam has been ${action.toLowerCase()}ed successfully.`, 
                severity: 'success' 
            });
            
            // Close dialog and refresh exams
            handleCloseDialog();
            fetchExams();
            
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        }
    };

    const handleConfirmExam = async (examId) => {
        try {
            const response = await fetch(`/api/cd/exams/${examId}/confirm`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            
            const responseData = await response.json();
            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to confirm exam.');
            }
            
            setSnackbar({ 
                open: true, 
                message: 'Exam has been confirmed successfully.', 
                severity: 'success' 
            });
            
            // Refresh exams
            fetchExams();
            
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        }
    };

    const getStatusChip = (status) => {
        const normalizedStatus = (status || '').toUpperCase();
        let color = 'default';
        switch (normalizedStatus) {
            case 'DRAFT':
                color = 'default';
                break;
            case 'PROPOSED':
                color = 'primary';
                break;
            case 'ACCEPTED':
                color = 'info';
                break;
            case 'REJECTED':
                color = 'error';
                break;
            case 'CANCELLED':
                color = 'warning';
                break;
            case 'CONFIRMED':
                color = 'success';
                break;
            default:
                color = 'default';
        }
        return <Chip label={normalizedStatus} color={color} size="small" />;
    };

    const renderExamActions = (exam) => {
        const status = (exam.status || '').toUpperCase();
        switch (status) {
            case 'PROPOSED':
                return (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                            variant="contained" 
                            color="success" 
                            size="small"
                            onClick={() => openReviewDialog(exam.id, 'ACCEPT')}
                        >
                            Accept
                        </Button>
                        <Button 
                            variant="contained" 
                            color="error" 
                            size="small"
                            onClick={() => openReviewDialog(exam.id, 'REJECT')}
                        >
                            Reject
                        </Button>
                        <Button 
                            variant="contained" 
                            color="warning" 
                            size="small"
                            onClick={() => openReviewDialog(exam.id, 'ALTERNATE')}
                        >
                            Propose Alternate
                        </Button>
                        <Button 
                            variant="contained" 
                            color="error" 
                            size="small"
                            onClick={() => openReviewDialog(exam.id, 'CANCEL')}
                        >
                            Cancel
                        </Button>
                    </Box>
                );
            case 'ACCEPTED':
                return (
                    <Button 
                        variant="contained" 
                        color="success" 
                        size="small"
                        onClick={() => handleConfirmExam(exam.id)}
                    >
                        Confirm
                    </Button>
                );
            default:
                return null;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5">My Exams</Typography>
                            <Typography color="text.secondary">
                                Review and manage your assigned exams
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
                                            <Grid item xs={12} sm={3}>
                                                <ListItemText 
                                                    primary={exam.discipline_name} 
                                                    secondary={`Type: ${exam.exam_type}`}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={2}>
                                                <Typography variant="body2">
                                                    Group: {exam.student_group}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Role: {exam.teacher_role}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={3}>
                                                <Typography variant="body2">
                                                    Date: {formatDate(exam.exam_date)}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Time: {exam.start_hour ? `${exam.start_hour}:00 (${exam.duration || 120} min)` : "Not set"}
                                                </Typography>
                                                <Typography variant="body2">
                                                    Room: {exam.room_name || "Not assigned"}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6} sm={2}>
                                                {getStatusChip(exam.status)}
                                            </Grid>
                                            <Grid item xs={6} sm={2}>
                                                {renderExamActions(exam)}
                                            </Grid>
                                        </Grid>
                                    </ListItem>
                                )) : (
                                    <ListItem>
                                        <ListItemText primary="No exams found." />
                                    </ListItem>
                                )}
                            </List>
                        )}
                    </Card>
                </Grid>
            </Grid>

            {/* Review Dialog */}
            <Dialog open={reviewDialog.open} onClose={handleCloseDialog}>
                <DialogTitle>
                    {reviewDialog.action === 'ACCEPT' && 'Accept Exam Proposal'}
                    {reviewDialog.action === 'REJECT' && 'Reject Exam Proposal'}
                    {reviewDialog.action === 'ALTERNATE' && 'Propose Alternate Date/Time'}
                    {reviewDialog.action === 'CANCEL' && 'Cancel Exam'}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {reviewDialog.action === 'ACCEPT' && 'Are you sure you want to accept this exam proposal?'}
                        {reviewDialog.action === 'REJECT' && 'Are you sure you want to reject this exam proposal?'}
                        {reviewDialog.action === 'ALTERNATE' && 'Please specify an alternate date and time for this exam:'}
                        {reviewDialog.action === 'CANCEL' && 'Are you sure you want to cancel this exam?'}
                    </DialogContentText>
                    
                    {reviewDialog.action === 'ALTERNATE' && (
                        <Box sx={{ mt: 2 }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Alternate Date"
                                    value={reviewDialog.alternateDate}
                                    onChange={(newDate) => setReviewDialog({
                                        ...reviewDialog,
                                        alternateDate: newDate
                                    })}
                                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                                />
                            </LocalizationProvider>
                            
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Alternate Hour</InputLabel>
                                <Select
                                    value={reviewDialog.alternateHour}
                                    label="Alternate Hour"
                                    onChange={(e) => setReviewDialog({
                                        ...reviewDialog,
                                        alternateHour: e.target.value
                                    })}
                                >
                                    {Array.from({ length: 11 }, (_, i) => i + 8).map((hour) => (
                                        <MenuItem key={hour} value={hour}>
                                            {hour}:00
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleReviewAction} variant="contained" color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TeacherExams;
