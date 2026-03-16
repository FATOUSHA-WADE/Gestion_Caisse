
const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Prisma unique constraint error (ex: SKU déjà existant)
  if (err.code === 'P2002' && err.meta && err.meta.target && err.meta.target.includes('sku')) {
    return res.status(400).json({
      success: false,
      message: "Ce SKU existe déjà. Veuillez en choisir un autre.",
      statusCode: 400
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Erreur interne serveur",
    statusCode: err.statusCode || 500
  });
};

export default errorHandler;
