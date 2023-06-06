module.exports = [
	{
		policyId: 1,
		maxLoginAttempts: 3,
		loginTimeoutValue: 60,
		sessionTimeoutValue: 600,
		passwordCrit: "^(?=.*[A-Za-z])(?=.*d)[A-Za-zd]{8,}$", // minimum 8 character, 1 letter and 1 number
		passwordTimeoutValue: 604800, // 1 week expiry
	},
];
