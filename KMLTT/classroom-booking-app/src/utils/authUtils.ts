export interface UserContext {
  uid: string | null;
  role: string | null;
  studentId: string | null;
  isImpersonating: boolean;
}

/**
 * Gets the active user context, prioritizing impersonation data if present.
 */
export function getActiveUserContext(): UserContext {
  const impersonation = sessionStorage.getItem('impersonation');
  
  if (impersonation) {
    try {
      const data = JSON.parse(impersonation);
      return {
        uid: data.uid,
        role: data.role,
        studentId: data.studentId,
        isImpersonating: true
      };
    } catch (e) {
      console.error("Failed to parse impersonation data", e);
    }
  }

  return {
    uid: localStorage.getItem('userUid'),
    role: localStorage.getItem('userRole'),
    studentId: localStorage.getItem('studentId'),
    isImpersonating: false
  };
}
