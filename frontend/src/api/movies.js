import client from './client';

export const fetchMovies = (params = {}) => client.get('/movies', { params }).then((r) => r.data.movies);
export const fetchMovie = (id) => client.get(`/movies/${id}`).then((r) => r.data.movie);
export const createMovie = (payload) => client.post('/movies', payload).then((r) => r.data.movie);
export const updateMovie = (id, payload) => client.put(`/movies/${id}`, payload).then((r) => r.data.movie);
export const deleteMovie = (id) => client.delete(`/movies/${id}`);
export const uploadMoviePoster = (id, file) => {
  const form = new FormData();
  form.append('poster', file);
  return client
    .post(`/movies/${id}/poster`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data.movie);
};

export const fetchGenres = () => client.get('/genres').then((r) => r.data.genres);
export const createGenre = (name) => client.post('/genres', { name }).then((r) => r.data.genre);
export const deleteGenre = (id) => client.delete(`/genres/${id}`);
