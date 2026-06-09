const jwt = require("jsonwebtoken");

function auth(req, res, next) {
    const cookie = req.cookie.authorization;

    if (!cookie) {
        throw new AppError(HTTP_STATUS.unauthorized, "La cookie es necesaria");
    }

    try {
        const payload = jwt.verify(
            cookie,
            process.env.JWT_SECRET
        );

        req.user = payload;

        next();
    } catch {
        throw new AppError(HTTP_STATUS.unauthorized, "Token inválido");
    }

}

module.exports = "auth";