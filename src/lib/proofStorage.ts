import { supabase } from "@/lib/supabaseClient";
import { MEDIA_BUCKET, LEGACY_UPLOAD_FOLDER, resolveProof } from "./paymentProof";

/**
 * STORAGE CLEANUP for payment proofs.
 *
 * Deleting a proof must remove the actual object, not just clear a DB
 * column — otherwise storage fills with orphans. Deletion is best-effort:
 * if the bucket's DELETE policy denies the request (anon-key projects often
 * allow writes but not deletes), the caller keeps the DB reference intact
 * so the owner sees the proof still exists instead of a silent lie.
 */

/**
 * Attempts to delete a proof's storage object. Returns false when the
 * object is still there (policy denial, network failure) so the caller can
 * avoid clearing the DB reference.
 */
export async function deleteProofObject(rawPath: string): Promise<boolean> {
  const ref = resolveProof(rawPath);
  if (!ref || !ref.objectPath) return true; // nothing stored to delete

  // Only touch folders this system manages — never arbitrary paths.
  if (!ref.objectPath.startsWith("payment-proofs/") && !ref.objectPath.startsWith(`${LEGACY_UPLOAD_FOLDER}/`)) {
    return true;
  }

  try {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([ref.objectPath]);
    if (error) {
      console.error("[deleteProofObject] storage refused:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[deleteProofObject] unexpected:", error);
    return false;
  }
}
