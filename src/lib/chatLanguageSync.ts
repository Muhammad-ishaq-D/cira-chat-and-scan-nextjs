import i18n, { changeLanguage } from "@/i18n";

// Map global i18n language ('en'|'es'|'de'|'fr') -> chat dropdown id
export const globalToChatLang = (lng: string | undefined | null): string => {
  const base = (lng || "en").split("-")[0].toLowerCase();
  switch (base) {
    case "es":
      return "es-es";
    case "de":
      return "de";
    case "fr":
      return "fr";
    case "en":
      return "en";
    default:
      return base;
  }
};

// Map chat dropdown id -> global i18n language. Returns null if not supported globally.
export const chatToGlobalLang = (chatId: string): string | null => {
  const id = (chatId || "").toLowerCase();
  if (id.startsWith("es")) return "es";
  if (id === "de" || id === "fr" || id === "en") return id;
  return null;
};

export const getInitialChatLang = (): string =>
  globalToChatLang(i18n.language);

// Subscribes a setter to i18n language changes. Returns unsubscribe.
export const subscribeChatLang = (
  setLang: (id: string) => void,
): (() => void) => {
  const handler = (lng: string) => setLang(globalToChatLang(lng));
  i18n.on("languageChanged", handler);
  return () => i18n.off("languageChanged", handler);
};

// Called when the user picks a language in the chat dropdown.
// Updates global i18n if the chat language maps to a supported one.
export const syncGlobalFromChat = (chatId: string) => {
  const g = chatToGlobalLang(chatId);
  if (g && g !== (i18n.language || "").split("-")[0]) {
    changeLanguage(g);
  }
};
