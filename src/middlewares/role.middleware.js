const roleMiddleware = (roles) => {

  return (req, res, next) => {

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé : rôle insuffisant"
      });
    }

    next();
  };
};

export default roleMiddleware;
