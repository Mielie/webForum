const {
	getUserByUsername,
	getUserGroups,
	getAllUserDetails,
	checkUserGroupMembership,
} = require("../models/userModels");

exports.fetchUserDetails = (request, response, next) => {
	return getUserByUsername(request.user.username)
		.then((user) => {
			response.status(200).send({ user });
		})
		.catch(next);
};

exports.fetchUserGroups = (request, response, next) => {
	return getUserGroups(request.user.username)
		.then((groups) => {
			response.status(200).send({ groups });
		})
		.catch(next);
};

exports.fetchAllUserDetails = (request, response, next) => {
	const users = getAllUserDetails();
	const admin = checkUserGroupMembership(
		request.user.username,
		"Administrator"
	);
	return Promise.all([users, admin])
		.then(([users]) => {
			response.status(200).send({ users });
		})
		.catch(next);
};

exports.fetchUserDetailsByUsername = (request, response, next) => {
	const { username } = request.params;
	const admin = checkUserGroupMembership(
		request.user.username,
		"Administrator"
	);
	const user = getUserByUsername(username);
	return Promise.all([user, admin])
		.then(([user]) => {
			response.status(200).send({ user });
		})
		.catch(next);
};

exports.fetchUserGroupsByUsername = (request, response, next) => {
	const { username } = request.params;
	const admin = checkUserGroupMembership(
		request.user.username,
		"Administrator"
	);
	const groups = getUserGroups(username);
	const user = getUserByUsername(username);
	return Promise.all([groups, user, admin])
		.then(([groups]) => {
			response.status(200).send({ groups });
		})
		.catch(next);
};
