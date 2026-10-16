export const isStatic = import.meta.env.VITE_DATA_MODE !== 'server';
// GitHub project sites share an origin. Separate their records by deployment base.
export const staticPrefix = `positioning-static:${import.meta.env.BASE_URL}:v1`;
export const studentKey = isStatic ? `${staticPrefix}:student` : 'positioning-student-v1';
export const draftPrefix = isStatic ? `${staticPrefix}:draft` : 'positioning-test-v2';
