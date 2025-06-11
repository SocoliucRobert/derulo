import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Chip,
    OutlinedInput
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const DisciplineManagement = () => {
    const [disciplines, setDisciplines] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editState, setEditState] = useState({}); // { id: { name: '...', teacher_ids: [...] } }
    const [newDisciplineName, setNewDisciplineName] = useState('');
    const [newDisciplineTeachers, setNewDisciplineTeachers] = useState([]);
    const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

    const adminToken = localStorage.getItem('admin_token');

    const fetchDisciplines = useCallback(async () => {
        try {
            const response = await fetch('/api/disciplines', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('Failed to fetch disciplines');
            const data = await response.json();
            setDisciplines(data);
        } catch (err) {
            setError(err.message);
        }
    }, [adminToken]);

    const fetchTeachers = useCallback(async () => {
        try {
            const response = await fetch('/api/teachers', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (!response.ok) throw new Error('Failed to fetch teachers');
            const data = await response.json();
            setTeachers(data);
        } catch (err) {
            setError(err.message);
        }
    }, [adminToken]);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchDisciplines(), fetchTeachers()])
            .finally(() => setLoading(false));
    }, [fetchDisciplines, fetchTeachers]);

    const handleAddDiscipline = async () => {
        if (!newDisciplineName) {
            setError('Discipline name cannot be empty.');
            return;
        }
        try {
            const response = await fetch('/api/disciplines', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ name: newDisciplineName, teacher_ids: newDisciplineTeachers })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to add discipline');
            setSuccess('Discipline added successfully!');
            setNewDisciplineName('');
            setNewDisciplineTeachers([]);
            fetchDisciplines(); // Refresh list
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`/api/disciplines/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to delete discipline');
            setSuccess('Discipline deleted successfully!');
            fetchDisciplines(); // Refresh list
        } catch (err) {
            setError(err.message);
        }
        setDeleteConfirm({ open: false, id: null });
    };

    const handleUpdate = async (id) => {
        const { name, teacher_ids } = editState[id];
        if (!name) {
            setError('Discipline name cannot be empty.');
            return;
        }
        try {
            const response = await fetch(`/api/disciplines/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({ name, teacher_ids: teacher_ids || [] })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update discipline');
            setSuccess('Discipline updated successfully!');
            setEditState(prev => { const newState = { ...prev }; delete newState[id]; return newState; });
            fetchDisciplines(); // Refresh list
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEditClick = (discipline) => {
        setEditState(prev => ({
            ...prev,
            [discipline.id]: {
                name: discipline.name,
                teacher_ids: discipline.teachers ? discipline.teachers.map(t => t.id) : []
            }
        }));
    };

    const handleCancelClick = (id) => {
        setEditState(prev => { const newState = { ...prev }; delete newState[id]; return newState; });
    };

    const handleInputChange = (e, id) => {
        const { name, value } = e.target;
        setEditState(prev => ({
            ...prev,
            [id]: { ...prev[id], [name]: value }
        }));
    };

    const handleTeacherChange = (e, id) => {
        const { target: { value } } = e;
        setEditState(prev => ({
            ...prev,
            [id]: { ...prev[id], teacher_ids: typeof value === 'string' ? value.split(',') : value }
        }));
    };

    const handleNewTeacherChange = (event) => {
        const { target: { value } } = event;
        setNewDisciplineTeachers(
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ p: 3, mt: 2 }}>
            <Typography variant="h4" gutterBottom>Discipline Management</Typography>
            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6">Add New Discipline</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                    <TextField
                        label="Discipline Name"
                        value={newDisciplineName}
                        onChange={(e) => setNewDisciplineName(e.target.value)}
                        variant="outlined"
                        sx={{ flexGrow: 1 }}
                    />
                    <FormControl sx={{ minWidth: 250, flexGrow: 1 }}>
                        <InputLabel>Teachers</InputLabel>
                        <Select
                            multiple
                            value={newDisciplineTeachers}
                            onChange={handleNewTeacherChange}
                            input={<OutlinedInput label="Teachers" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={teachers.find(t => t.id === value)?.full_name || ''} />
                                    ))}
                                </Box>
                            )}
                            MenuProps={MenuProps}
                        >
                            {teachers.map(teacher => (
                                <MenuItem key={teacher.id} value={teacher.id}>
                                    {teacher.full_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button variant="contained" color="primary" onClick={handleAddDiscipline}>Add Discipline</Button>
                </Box>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Discipline Name</TableCell>
                            <TableCell>Teachers</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {disciplines.map((d) => (
                            <TableRow key={d.id}>
                                {
                                    editState[d.id] ? (
                                        <>
                                            <TableCell sx={{ width: '30%' }}>
                                                <TextField
                                                    value={editState[d.id].name}
                                                    onChange={(e) => handleInputChange(e, d.id)}
                                                    name="name"
                                                    fullWidth
                                                />
                                            </TableCell>
                                            <TableCell sx={{ width: '50%' }}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Teachers</InputLabel>
                                                    <Select
                                                        multiple
                                                        value={editState[d.id].teacher_ids || []}
                                                        onChange={(e) => handleTeacherChange(e, d.id)}
                                                        input={<OutlinedInput label="Teachers" />}
                                                        renderValue={(selected) => (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                {selected.map((value) => (
                                                                    <Chip key={value} label={teachers.find(t => t.id === value)?.full_name || ''} />
                                                                ))}
                                                            </Box>
                                                        )}
                                                        MenuProps={MenuProps}
                                                    >
                                                        {teachers.map(teacher => (
                                                            <MenuItem key={teacher.id} value={teacher.id}>
                                                                {teacher.full_name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => handleUpdate(d.id)}><SaveIcon color="primary" /></IconButton>
                                                <IconButton onClick={() => handleCancelClick(d.id)}><CancelIcon /></IconButton>
                                            </TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell>{d.name}</TableCell>
                                            <TableCell>{d.teachers ? d.teachers.map(t => t.full_name).join(', ') : 'N/A'}</TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => handleEditClick(d)}><EditIcon /></IconButton>
                                                <IconButton onClick={() => setDeleteConfirm({ open: true, id: d.id })}><DeleteIcon color="error" /></IconButton>
                                            </TableCell>
                                        </>
                                    )
                                }
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={deleteConfirm.open}
                onClose={() => setDeleteConfirm({ open: false, id: null })}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this discipline? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancel</Button>
                    <Button onClick={() => handleDelete(deleteConfirm.id)} color="error" autoFocus>Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DisciplineManagement;
