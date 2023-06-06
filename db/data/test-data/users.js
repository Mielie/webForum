const dateOffset = (seconds = 0) => {
	const offset = seconds * 1000;
	return new Date(+new Date() + offset);
};

module.exports = [
	{
		username: "testuser",
		password:
			"cf7c41b992f148cc96d1ff8910105387ce944eed431bf856f8ff1f28d76cadd1", //password123
		salt: "ef74a08271890ff84cad62823eb93890",
		incorrectLogins: 0,
		lastLoginAttempt: dateOffset(),
		lastPasswordSet: dateOffset(),
		accountLocked: false,
		policyId: 1,
	},
	{
		username: "testuser2",
		password:
			"cf7c41b992f148cc96d1ff8910105387ce944eed431bf856f8ff1f28d76cadd1", //password123
		salt: "ef74a08271890ff84cad62823eb93890",
		incorrectLogins: 2,
		lastLoginAttempt: dateOffset(),
		lastPasswordSet: dateOffset(),
		accountLocked: false,
		policyId: 1,
	},
	{
		username: "testuser3",
		password:
			"cf7c41b992f148cc96d1ff8910105387ce944eed431bf856f8ff1f28d76cadd1", //password123
		salt: "ef74a08271890ff84cad62823eb93890",
		incorrectLogins: 3,
		lastLoginAttempt: dateOffset(-70),
		lastPasswordSet: dateOffset(-70),
		accountLocked: false,
		policyId: 1,
	},
	{
		username: "testuser4",
		password:
			"cf7c41b992f148cc96d1ff8910105387ce944eed431bf856f8ff1f28d76cadd1", //password123
		salt: "ef74a08271890ff84cad62823eb93890",
		incorrectLogins: 0,
		lastLoginAttempt: dateOffset(-70),
		lastPasswordSet: dateOffset(-604801),
		accountLocked: false,
		policyId: 1,
	},
	{
		username: "testuser5",
		password:
			"cf7c41b992f148cc96d1ff8910105387ce944eed431bf856f8ff1f28d76cadd1", //password123
		salt: "ef74a08271890ff84cad62823eb93890",
		incorrectLogins: 0,
		lastLoginAttempt: dateOffset(),
		lastPasswordSet: dateOffset(),
		accountLocked: true,
		policyId: 1,
	},
	{
		username: "testuser6",
		password:
			"cf7c41b992f148cc96d1ff8910105387ce944eed431bf856f8ff1f28d76cadd1", //password123
		salt: "ef74a08271890ff84cad62823eb93890",
		incorrectLogins: 0,
		lastLoginAttempt: dateOffset(),
		lastPasswordSet: dateOffset(),
		accountLocked: false,
		policyId: 1,
	},
];
