import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { 
    AppBar, Toolbar, Typography, Button, Container, Box, Grid, Card, 
    CardContent, CardActions, Divider, CircularProgress, Snackbar, Alert,
    List, ListItem, ListItemText, Switch, ListSubheader, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import * as XLSX from 'xlsx';

const SecDashboard = ({ session }) => {
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [periods, setPeriods] = useState([]);
    const [loadingPeriods, setLoadingPeriods] = useState(true);
    const [newPeriod, setNewPeriod] = useState({ start_date: null, end_date: null });
    const [approvedExams, setApprovedExams] = useState([]);
    const [loadingExams, setLoadingExams] = useState(true);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const handleDownloadTemplate = () => {
        // Create a new workbook
        const wb = XLSX.utils.book_new();
        // Create a worksheet with headers
        const ws = XLSX.utils.aoa_to_sheet([["Discipline Name", "Teacher Name", "Teacher Email"]]);
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, "Disciplines");
        // Write the workbook and trigger a download
        XLSX.writeFile(wb, "disciplines_template.xlsx");
    };

        const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                const response = await fetch('/api/disciplines/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify(json)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to upload file.');
                }

                setSnackbar({ open: true, message: `${result.message} Disciplines added: ${result.disciplines_added}, New Users: ${result.users_added}`, severity: 'success' });

            } catch (error) {
                setSnackbar({ open: true, message: error.message, severity: 'error' });
            } finally {
                setLoading(false);
                event.target.value = null;
            }
        };
        reader.readAsArrayBuffer(file);
    };

        const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchPeriods = useCallback(async () => {
        try {
            setLoadingPeriods(true);
            const response = await fetch('/api/exam-periods', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch exam periods.');
            const data = await response.json();
            setPeriods(data);
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoadingPeriods(false);
        }
    }, [session.access_token]);

    const handleCreatePeriod = async () => {
        if (!newPeriod.start_date || !newPeriod.end_date) {
            setSnackbar({ open: true, message: 'Please select both a start and end date.', severity: 'warning' });
            return;
        }
        try {
            const response = await fetch('/api/exam-periods', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    start_date: newPeriod.start_date.toISOString().split('T')[0],
                    end_date: newPeriod.end_date.toISOString().split('T')[0]
                })
            });
            if (!response.ok) throw new Error('Failed to create period.');
            const createdPeriod = await response.json();
            setPeriods([createdPeriod, ...periods]);
            setNewPeriod({ start_date: null, end_date: null });
            setSnackbar({ open: true, message: 'Exam period created successfully.', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        }
    };

    const handleTogglePeriod = async (id, isActive) => {
        try {
            const response = await fetch(`/api/exam-periods/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ is_active: isActive })
            });
            if (!response.ok) throw new Error('Failed to update period status.');
            setPeriods(periods.map(p => p.id === id ? { ...p, is_active: isActive } : p));
            setSnackbar({ open: true, message: 'Period status updated.', severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        }
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

    const handleFinalizeSchedule = async () => {
        try {
            const response = await fetch('/api/sec/finalize-schedule', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to finalize schedule.');
            setSnackbar({ open: true, message: result.message, severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        }
    };

    useEffect(() => {
        fetchPeriods();
        fetchApprovedExams();
    }, [fetchPeriods, fetchApprovedExams]);

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
                    {/* Data Management Card */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" component="div">Data Management</Typography>
                                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                    Upload and download student and course data.
                                </Typography>
                            </CardContent>
                            <Divider />
                            <CardActions sx={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', p: 2}}>
                                <Button 
                                    variant="outlined" 
                                    startIcon={<DownloadIcon />} 
                                    onClick={handleDownloadTemplate}
                                    sx={{mb: 1}} >
                                    Download Disciplines Template
                                </Button>
                                <Button variant="contained" component="label" startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />} disabled={loading}>
                                    Upload Disciplines File
                                    <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>

                    {/* Exam Configuration Card */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" component="div">Exam Period Configuration</Typography>
                                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                    Define date ranges when exams can be scheduled.
                                </Typography>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <Box sx={{ display: 'flex', gap: 2, mt: 2, mb: 2 }}>
                                        <DatePicker
                                            label="Start Date"
                                            value={newPeriod.start_date}
                                            onChange={(newValue) => setNewPeriod({ ...newPeriod, start_date: newValue })}
                                            renderInput={(params) => <TextField {...params} />}
                                        />
                                        <DatePicker
                                            label="End Date"
                                            value={newPeriod.end_date}
                                            onChange={(newValue) => setNewPeriod({ ...newPeriod, end_date: newValue })}
                                            renderInput={(params) => <TextField {...params} />}
                                        />
                                    </Box>
                                </LocalizationProvider>
                                <Button variant="contained" onClick={handleCreatePeriod}>Create Period</Button>
                            </CardContent>
                            <Divider />
                            <List dense subheader={<ListSubheader>Existing Periods</ListSubheader>}>
                                {loadingPeriods ? <CircularProgress sx={{m: 2}}/> : periods.map(period => (
                                    <ListItem key={period.id}>
                                        <ListItemText 
                                            primary={`From ${new Date(period.start_date).toLocaleDateString()} to ${new Date(period.end_date).toLocaleDateString()}`}
                                        />
                                        <Switch
                                            edge="end"
                                            checked={period.is_active}
                                            onChange={(e) => handleTogglePeriod(period.id, e.target.checked)}
                                            inputProps={{ 'aria-labelledby': `switch-list-label-${period.id}` }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Card>
                    </Grid>

                    {/* Final Schedule Card */}
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Typography variant="h5" component="div">Final Exam Schedule</Typography>
                                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                    Review all approved exams before finalizing the schedule.
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
                            <Divider />
                            <CardActions sx={{p: 2}}>
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    onClick={handleFinalizeSchedule}
                                    disabled={loadingExams || approvedExams.length === 0}
                                >
                                    Finalize Schedule
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
