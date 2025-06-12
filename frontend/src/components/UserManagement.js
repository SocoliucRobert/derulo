import React, { useState, useEffect } from 'react';
import {
    Stack,
    Container,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Button, TextField, Select, MenuItem, FormControl, Box, Typography, Alert,
    IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const UserManagement = ({ session }) => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editedUser, setEditedUser] = useState({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchUsers = () => {
        fetch('http://localhost:5000/api/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
            }
        })
        .then(res => res.json())
        .then(data => setUsers(data))
        .catch(err => setError(err.message));
    };

    const fetchRoles = () => {
        // Hardcoded for now, but could be fetched from the backend
        setRoles(['STUDENT', 'CADRU_DIDACTIC', 'ADMIN', 'SEF_GRUPA', 'SEC']);
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const handleEditClick = (user) => {
        setEditingUserId(user.id);
        setEditedUser({ ...user });
    };

    const handleCancelClick = () => {
        setEditingUserId(null);
        setEditedUser({});
    };

    const handleSaveClick = (userId) => {
        // Construct payload, including student details if applicable
        const payload = {
            full_name: editedUser.full_name,
            email: editedUser.email,
            role: editedUser.role,
        };

        if (editedUser.role === 'STUDENT' || editedUser.role === 'SEF_GRUPA') {
            payload.student_group = editedUser.student_group;
            payload.year_of_study = editedUser.year_of_study;
        }

        fetch(`http://localhost:5000/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
            },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if (res.ok) {
                setSuccess('User updated successfully!');
                setEditingUserId(null);
                fetchUsers(); // Refresh the user list
            } else {
                setError('Failed to update user.');
            }
        })
        .catch(err => setError(err.message));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedUser(prev => ({ ...prev, [name]: value }));
    };
    
    const handleRoleChange = (e) => {
        setEditedUser(prev => ({ ...prev, role: e.target.value }));
    }

    const handleDeleteClick = (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            fetch(`http://localhost:5000/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            })
            .then(res => {
                if (res.ok) {
                    setSuccess('User deleted successfully!');
                    fetchUsers(); // Refresh the user list
                } else {
                    res.json().then(data => setError(data.message || 'Failed to delete user.'));
                }
            })
            .catch(err => setError(err.message));
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ my: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
                User Management
            </Typography>
            
            {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}
            
            <TableContainer component={Paper} sx={{ mt: 3, mb: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Full Name</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Group</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Year</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map(user => (
                            <TableRow key={user.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                {editingUserId === user.id ? (
                                    <>
                                        <TableCell component="th" scope="row">
                                            <TextField
                                                name="full_name"
                                                value={editedUser.full_name}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                type="email"
                                                name="email"
                                                value={editedUser.email}
                                                onChange={handleInputChange}
                                                variant="outlined"
                                                fullWidth
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <FormControl variant="outlined" sx={{ minWidth: 150 }}>
                                                <Select
                                                    name="role"
                                                    value={editedUser.role}
                                                    onChange={handleRoleChange}
                                                >
                                                    {roles.map(role => (
                                                        <MenuItem key={role} value={role}>{role}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        {(editedUser.role === 'STUDENT' || editedUser.role === 'SEF_GRUPA') && (
                                            <>
                                                <TableCell>
                                                    <TextField
                                                        name="student_group"
                                                        label="Group"
                                                        value={editedUser.student_group || ''}
                                                        onChange={handleInputChange}
                                                        variant="outlined"
                                                        fullWidth
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        name="year_of_study"
                                                        label="Year"
                                                        type="number"
                                                        value={editedUser.year_of_study || ''}
                                                        onChange={handleInputChange}
                                                        variant="outlined"
                                                        fullWidth
                                                    />
                                                </TableCell>
                                            </>
                                        )}
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1}>
                                                <Button variant="contained" color="primary" onClick={() => handleSaveClick(user.id)}>
                                                    Save
                                                </Button>
                                                <Button variant="outlined" onClick={handleCancelClick}>
                                                    Cancel
                                                </Button>
                                            </Stack>
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell component="th" scope="row">{user.full_name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        {(user.role === 'STUDENT' || user.role === 'SEF_GRUPA') && (
                                            <>
                                                <TableCell>{user.student_group}</TableCell>
                                                <TableCell>{user.year_of_study}</TableCell>
                                            </>
                                        )}
                                        <TableCell align="right">
                                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                <IconButton onClick={() => handleEditClick(user)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton onClick={() => handleDeleteClick(user.id)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            </Box>
        </Container>
    );
};

export default UserManagement;
