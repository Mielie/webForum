module.exports = [
	{
		policyId: 1,
		maxLoginAttempts: 3,
		loginTimeoutValue: 60,
		sessionTimeoutValue: 600,
		passwordCrit:
			"(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})", // minimum 8 maximum 16 character, 1 uppercase letter, 1 lowercase letter, 1 special character and 1 number
		passwordTimeoutValue: null,
	},
];
