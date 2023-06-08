exports.customErrorHandler = (error, request, response, next) => {
	if (error.hasOwnProperty("status")) {
		response.status(error.status).send({ msg: error.msg });
	} else {
		console.log(error, "<--- unhandled error");
		next(error);
	}
};
