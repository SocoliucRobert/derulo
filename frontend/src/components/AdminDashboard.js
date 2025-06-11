import React, { useState, useEffect, useCallback } from 'react';

import {
    AppBar, Toolbar, Typography, Button, Container, Box, Grid, Card,
    CardContent, CircularProgress, Snackbar, Alert, Divider, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const AdminDashboard = ({ session }) => {
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const usersResponse = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${session.access_token}` } });

            if (!usersResponse.ok) {
                throw new Error('Failed to fetch users.');
            }

            const usersData = await usersResponse.json();
            setUsers(usersData);

        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [session.access_token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Placeholder handlers
    const handleAddUser = () => setSnackbar({ open: true, message: 'Add user functionality not implemented yet.', severity: 'info' });
    const handleEditUser = (userId) => setSnackbar({ open: true, message: `Edit user ${userId} not implemented yet.`, severity: 'info' });
    const handleDeleteUser = (userId) => setSnackbar({ open: true, message: `Delete user ${userId} not implemented yet.`, severity: 'info' });

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Administrator Dashboard
                    </Typography>
                    <Button color="inherit" onClick={handleLogout}>Logout</Button>
                </Toolbar>
            </AppBar>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h5">User Management</Typography>
                                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddUser}>
                                        Add User
                                    </Button>
                                </Box>
                            </CardContent>
                            <Divider />
                            {loading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
                            ) : (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table aria-label="user management table">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Full Name</TableCell>
                                                <TableCell>Email</TableCell>
                                                <TableCell>Role</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {users.map((user) => (
                                                <TableRow key={user.id} hover>
                                                    <TableCell component="th" scope="row">{user.full_name}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.role_name}</TableCell>
                                                    <TableCell align="right">
                                                        <IconButton onClick={() => handleEditUser(user.id)} size="small">
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton onClick={() => handleDeleteUser(user.id)} size="small">
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
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

export default AdminDashboard;
