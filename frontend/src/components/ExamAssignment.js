import React, { useState, useEffect, useCallback } from 'react';
import {
    Typography, Box, Grid, Card, CardContent, CardActions, Button,
    FormControl, InputLabel, Select, MenuItem, Divider,
    CircularProgress, Snackbar, Alert, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

const ExamAssignment = ({ session }) => {
    const [disciplines, setDisciplines] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [studentGroups, setStudentGroups] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [assignments, setAssignments] = useState([]);
    const [formData, setFormData] = useState({
        discipline_id: '',
        student_group: '',
        exam_type: 'EXAM',
        main_teacher_id: '',
        second_teacher_id: '',
        room_id: ''
    });

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch disciplines
            const disciplinesResponse = await fetch('/api/sec/disciplines', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (!disciplinesResponse.ok) throw new Error('Failed to fetch disciplines');
            const disciplinesData = await disciplinesResponse.json();
            setDisciplines(disciplinesData);
            
            // Fetch teachers
            const teachersResponse = await fetch('/api/sec/teachers', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (!teachersResponse.ok) throw new Error('Failed to fetch teachers');
            const teachersData = await teachersResponse.json();
            setTeachers(teachersData);
            
            // Fetch student groups
            const groupsResponse = await fetch('/api/student-groups', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (!groupsResponse.ok) throw new Error('Failed to fetch student groups');
            const groupsData = await groupsResponse.json();
            setStudentGroups(groupsData);
            
            // Fetch rooms
            const roomsResponse = await fetch('/api/rooms', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (!roomsResponse.ok) throw new Error('Failed to fetch rooms');
            const roomsData = await roomsResponse.json();
            setRooms(roomsData);
            
            // Fetch existing exam assignments
            const assignmentsResponse = await fetch('/api/sec/exams', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            if (!assignmentsResponse.ok) throw new Error('Failed to fetch exam assignments');
            const assignmentsData = await assignmentsResponse.json();
            setAssignments(assignmentsData);
            
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [session.access_token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async () => {
        // Validate form data
        const requiredFields = ['discipline_id', 'student_group', 'exam_type', 'main_teacher_id', 'second_teacher_id', 'room_id'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        
        if (missingFields.length > 0) {
            setSnackbar({
                open: true,
                message: `Please fill in all required fields: ${missingFields.join(', ')}`,
                severity: 'warning'
            });
            return;
        }
        
        if (formData.main_teacher_id === formData.second_teacher_id) {
            setSnackbar({
                open: true,
                message: 'Main teacher and second teacher cannot be the same',
                severity: 'warning'
            });
            return;
        }
        
        try {
            setSubmitting(true);
            
            const response = await fetch('/api/sec/exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to create exam assignment');
            }
            
            // Reset form and refresh data
            setFormData({
                discipline_id: '',
                student_group: '',
                exam_type: 'EXAM',
                main_teacher_id: '',
                second_teacher_id: '',
                room_id: ''
            });
            
            setSnackbar({
                open: true,
                message: 'Exam assignment created successfully',
                severity: 'success'
            });
            
            // Refresh assignments
            fetchData();
            
        } catch (error) {
            setSnackbar({
                open: true,
                message: error.message,
                severity: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusChip = (status) => {
        let color = 'default';
        switch (status) {
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
        return <Chip label={status} color={color} size="small" />;
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Card>
                <CardContent>
                    <Typography variant="h5" gutterBottom>
                        Assign Exams to Groups
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                        Create exam assignments for student groups. Group leaders will be notified to propose dates.
                    </Typography>
                    
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Discipline</InputLabel>
                                    <Select
                                        name="discipline_id"
                                        value={formData.discipline_id}
                                        onChange={handleInputChange}
                                        label="Discipline"
                                    >
                                        {disciplines.map((discipline) => (
                                            <MenuItem key={discipline.id} value={discipline.id}>
                                                {discipline.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Student Group</InputLabel>
                                    <Select
                                        name="student_group"
                                        value={formData.student_group}
                                        onChange={handleInputChange}
                                        label="Student Group"
                                    >
                                        {studentGroups.map((group) => (
                                            <MenuItem key={group.id || group.name} value={group.name || group}>
                                                {group.name || group}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Exam Type</InputLabel>
                                    <Select
                                        name="exam_type"
                                        value={formData.exam_type}
                                        onChange={handleInputChange}
                                        label="Exam Type"
                                    >
                                        <MenuItem value="EXAM">Exam</MenuItem>
                                        <MenuItem value="PROJECT">Project</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Main Teacher</InputLabel>
                                    <Select
                                        name="main_teacher_id"
                                        value={formData.main_teacher_id}
                                        onChange={handleInputChange}
                                        label="Main Teacher"
                                    >
                                        {teachers.map((teacher) => (
                                            <MenuItem key={teacher.id} value={teacher.id}>
                                                {teacher.full_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Second Teacher</InputLabel>
                                    <Select
                                        name="second_teacher_id"
                                        value={formData.second_teacher_id}
                                        onChange={handleInputChange}
                                        label="Second Teacher"
                                    >
                                        {teachers.map((teacher) => (
                                            <MenuItem key={teacher.id} value={teacher.id}>
                                                {teacher.full_name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Room</InputLabel>
                                    <Select
                                        name="room_id"
                                        value={formData.room_id}
                                        onChange={handleInputChange}
                                        label="Room"
                                    >
                                        {rooms.map((room) => (
                                            <MenuItem key={room.id} value={room.id}>
                                                {room.name} ({room.building_name}, Capacity: {room.capacity})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    )}
                </CardContent>
                <Divider />
                <CardActions>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleSubmit}
                        disabled={loading || submitting}
                    >
                        {submitting ? <CircularProgress size={24} /> : 'Create Exam Assignment'}
                    </Button>
                </CardActions>
                
                <Divider />
                
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Current Exam Assignments
                    </Typography>
                    
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Discipline</TableCell>
                                        <TableCell>Group</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Main Teacher</TableCell>
                                        <TableCell>Second Teacher</TableCell>
                                        <TableCell>Room</TableCell>
                                        <TableCell>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {assignments.length > 0 ? (
                                        assignments.map((assignment) => (
                                            <TableRow key={assignment.id}>
                                                <TableCell>{assignment.discipline_name}</TableCell>
                                                <TableCell>{assignment.student_group}</TableCell>
                                                <TableCell>{assignment.exam_type}</TableCell>
                                                <TableCell>{assignment.main_teacher_name}</TableCell>
                                                <TableCell>{assignment.second_teacher_name}</TableCell>
                                                <TableCell>{assignment.room_name || 'Not assigned'}</TableCell>
                                                <TableCell>{getStatusChip(assignment.status)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                No exam assignments yet
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </CardContent>
            </Card>
            
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </LocalizationProvider>
    );
};

export default ExamAssignment;
