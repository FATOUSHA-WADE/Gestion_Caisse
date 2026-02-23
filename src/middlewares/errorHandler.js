const errorHandler = (err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Erreur interne serveur",
    statusCode: err.statusCode || 500
  });
};

export default errorHandler;
