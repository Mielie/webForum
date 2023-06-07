exports.customErrorHandler = (error, request, response, next) => {
	if (error.hasOwnProperty("status")) {
		response.status(error.status).send({ msg: error.msg });
	} else {
		next(error);
	}
};
