const LOCAL_BACKEND_URL = "http://localhost:8000";
const PRODUCTION_BACKEND_URL = "https://job-portal-backend-o9lb.onrender.com";

const normalizeUrl = (value) => value?.replace(/\/$/, "");

const resolveBackendUrl = () => {
	const explicitUrl =
		import.meta.env.VITE_API_URL ||
		import.meta.env.VITE_BACKEND_URL ||
		import.meta.env.VITE_SERVER_URL ||
		import.meta.env.VITE_BACKEND_BASE_URL;

	if (explicitUrl) {
		return normalizeUrl(explicitUrl);
	}

	return import.meta.env.PROD
		? PRODUCTION_BACKEND_URL
		: LOCAL_BACKEND_URL;
};

export const BACKEND_URL = resolveBackendUrl();

export const USER_API_END_POINT = `${BACKEND_URL}/api/v1/user`;
export const JOB_API_END_POINT = `${BACKEND_URL}/api/v1/job`;
export const APPLICATION_API_END_POINT = `${BACKEND_URL}/api/v1/application`;
export const COMPANY_API_END_POINT = `${BACKEND_URL}/api/v1/company`;
export const SAVED_JOB_API_END_POINT = `${BACKEND_URL}/api/v1/saved-jobs`;
