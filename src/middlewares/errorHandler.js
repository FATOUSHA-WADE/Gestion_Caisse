const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.message || err);
  console.error('[STACK]', err.stack);

  // Prisma unique constraint error (ex: SKU déjà existant)
  if (err.code === 'P2002' && err.meta && err.meta.target && err.meta.target.includes('sku')) {
    return res.status(400).json({
      success: false,
      message: "Ce SKU existe déjà. Veuillez en choisir un autre.",
      statusCode: 400
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: "Enregistrement non trouvé.",
      statusCode: 404
    });
  }

  // Handle JSON parse errors for modesPaiement
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: "Format de données invalide.",
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
