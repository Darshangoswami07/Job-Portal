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
export const RESUME_API_END_POINT = `${BACKEND_URL}/api/v1/resumes`;
export const COVER_LETTER_API_END_POINT = `${BACKEND_URL}/api/v1/cover-letters`;
export const INTERVIEW_API_END_POINT = `${BACKEND_URL}/api/v1/interviews`;
export const SALARY_API_END_POINT = `${BACKEND_URL}/api/v1/salaries`;
export const ROADMAP_API_END_POINT = `${BACKEND_URL}/api/v1/roadmaps`;
export const RESUME_CHECK_API_END_POINT = `${BACKEND_URL}/api/v1/resume-check`;
export const BLOG_API_END_POINT = `${BACKEND_URL}/api/v1/blogs`;
export const QUESTION_API_END_POINT = `${BACKEND_URL}/api/v1/questions`;
export const CAREER_GUIDE_API_END_POINT = `${BACKEND_URL}/api/v1/career-guides`;
export const RESUME_TEMPLATE_API_END_POINT = `${BACKEND_URL}/api/v1/resume-templates`;
export const CONTACT_API_END_POINT = `${BACKEND_URL}/api/v1/contact`;
export const SUPPORT_TICKET_API_END_POINT = `${BACKEND_URL}/api/v1/support-tickets`;
export const SUBSCRIPTION_API_END_POINT = `${BACKEND_URL}/api/v1/subscriptions`;
export const NOTIFICATION_API_END_POINT = `${BACKEND_URL}/api/v1/notifications`;
