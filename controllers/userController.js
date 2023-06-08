const {
	getUserByUsername,
	getUserAndPolicyByUsername,
	getUserGroups,
	getAllUserDetails,
	checkUserGroupMembership,
	updateUserPassword,
} = require("../models/userModels");

const { passwordHasher } = require("../passport");

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

exports.setUserPassword = (request, response, next) => {
	const { username, oldPassword, newPassword } = request.body;
	return getUserAndPolicyByUsername(username)
		.then((user) => {
			const { hashedPassword } = passwordHasher(oldPassword, user.salt);
			if (hashedPassword === user.password) {
				const passwordTest = new RegExp(user.password_criteria);
				if (!passwordTest.test(newPassword)) {
					response.status(400).send({
						msg: "New password does not meet complexity requirements",
					});
				} else {
					const { newSalt, newPasswordHashed } =
						passwordHasher(newPassword);
					return updateUserPassword(
						username,
						String(newSalt),
						newPasswordHashed
					).then(() =>
						response
							.status(200)
							.send({ msg: "Password successfully changed" })
					);
				}
			} else {
				return response
					.status(401)
					.send({ msg: "Incorrect username or password" });
			}
		})
		.catch(next);
};
