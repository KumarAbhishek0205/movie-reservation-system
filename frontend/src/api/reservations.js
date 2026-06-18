import client from './client';

export const createReservation = (payload) =>
  client.post('/reservations', payload).then((r) => r.data.reservation);
export const fetchMyReservations = () => client.get('/reservations/me').then((r) => r.data.reservations);
export const cancelReservation = (id) => client.delete(`/reservations/${id}`).then((r) => r.data.reservation);
