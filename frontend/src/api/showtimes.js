import client from './client';

export const fetchShowtimes = (params = {}) => client.get('/showtimes', { params }).then((r) => r.data.showtimes);
export const fetchShowtime = (id) => client.get(`/showtimes/${id}`).then((r) => r.data);
export const createShowtime = (payload) => client.post('/showtimes', payload).then((r) => r.data.showtime);
export const updateShowtime = (id, payload) => client.put(`/showtimes/${id}`, payload).then((r) => r.data.showtime);
export const deleteShowtime = (id) => client.delete(`/showtimes/${id}`);

export const fetchRooms = () => client.get('/rooms').then((r) => r.data.rooms);
export const fetchRoom = (id) => client.get(`/rooms/${id}`).then((r) => r.data);
export const createRoom = (payload) => client.post('/rooms', payload).then((r) => r.data.room);
export const deleteRoom = (id) => client.delete(`/rooms/${id}`);
