import { auditApi } from "./apiClient";

/**
 * Safely logs a client-side audit event (e.g., download, print, copy) to the backend.
 * Fails silently to prevent interrupting user actions or generating intrusive UI errors.
 * 
 * @param action - The name of the client-side event (e.g. PRINT_REPORT, COPY_REPORT_TEXT).
 * @param recordId - Optional associated record/report ID.
 */
export async function logAuditEvent(action: string, recordId?: string): Promise<void> {
  try {
    await auditApi.logEvent(action, recordId);
  } catch (err) {
    // Fail silently on the client side so the user's workflow is never interrupted
    console.warn(`[Audit] Failed to log client action: ${action}`, err);
  }
}
