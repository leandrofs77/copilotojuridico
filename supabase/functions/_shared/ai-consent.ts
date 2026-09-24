export class ExternalAIConsentRequiredError extends Error {
  constructor() {
    super("External AI processing consent is required");
    this.name = "ExternalAIConsentRequiredError";
  }
}

export async function requireExternalAiConsent(supabase: any, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("user_privacy_settings")
    .select("external_ai_processing_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.external_ai_processing_enabled) {
    throw new ExternalAIConsentRequiredError();
  }
}

export async function hasExternalAiConsent(supabase: any, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_privacy_settings")
    .select("external_ai_processing_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.external_ai_processing_enabled === true;
}
