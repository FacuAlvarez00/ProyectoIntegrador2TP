export function errorHandler(err, req, res, next) { // eslint-disable-line
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Error interno' });
}
