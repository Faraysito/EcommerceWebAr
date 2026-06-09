const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const cookie = req.cookie.authorization;

    if (!authHeader) {
        return res.status(401).json({
            mensaje: "No autorizado"
        });
    }

    try {
        const payload = jwt.verify(
            cookie,
            process.env.JWT_SECRET
        );

        req.user = payload;

        next();
    } catch {
        res.status(401).json(
            {
                mensaje: "Token inválido"
            }
        )
    }
}