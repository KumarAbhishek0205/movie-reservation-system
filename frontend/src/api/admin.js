import client from './client';

export const fetchAllReservations = (params = {}) =>
  client.get('/admin/reservations', { params }).then((r) => r.data.reservations);
export const fetchOverview = () => client.get('/admin/reports/overview').then((r) => r.data);
export const fetchRevenueReport = (params = {}) =>
  client.get('/admin/reports/revenue', { params }).then((r) => r.data);
export const fetchCapacityReport = (params = {}) =>
  client.get('/admin/reports/capacity', { params }).then((r) => r.data.rows);

export const fetchUsers = () => client.get('/users').then((r) => r.data.users);
export const setUserRole = (id, role) => client.patch(`/users/${id}/role`, { role }).then((r) => r.data.user);
